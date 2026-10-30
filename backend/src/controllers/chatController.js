import { isDBConnected } from '../db/database.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ChatMessage from '../models/ChatMessage.js';
import Theatre from '../models/Theatre.js';
import User from '../models/User.js';
import TheatreStaff from '../models/TheatreStaff.js';
import IntervalBooking from '../models/IntervalBooking.js';
import Show from '../models/Show.js';
import Screen from '../models/Screen.js';
import { createNotification } from '../services/notificationService.js';
import { config } from '../config/index.js';
import { validateMediaBuffer, encryptBuffer, decryptBuffer } from '../services/cryptoService.js';
import { getAuthorizedTheatreIdsForUser, isUserAuthorizedForTheatre } from '../services/theatreAuthService.js';

export async function getConversations(req, res, next) {
    if (!isDBConnected()) {
        res.json({ success: true, conversations: [] });
        return;
    }
    try {
        const currentUser = req.user;

        if (currentUser.role === 'CUSTOMER') {
            // Find all theatre IDs that customer chatted with
            const chattedTheatreIds = await ChatMessage.distinct('theatre_id', { user_id: currentUser.id });

            // Find all theatres where customer has bookings
            const customerBookings = await IntervalBooking.find({ user_id: currentUser.id })
                .populate({
                    path: 'show_id',
                    populate: { path: 'screen_id', select: 'theatre_id' }
                });

            const bookedTheatreIds = [];
            for (const b of customerBookings) {
                const tId = b.show_id?.screen_id?.theatre_id;
                if (tId) bookedTheatreIds.push(tId.toString());
            }

            const allTheatreIdSet = new Set([
                ...chattedTheatreIds.map(id => id.toString()),
                ...bookedTheatreIds
            ]);

            let theatres = [];
            if (allTheatreIdSet.size > 0) {
                theatres = await Theatre.find({ _id: { $in: Array.from(allTheatreIdSet) } });
            } else {
                theatres = await Theatre.find({ status: 'ACTIVE' }).limit(10);
            }

            const conversations = await Promise.all(theatres.map(async (t) => {
                const lastMsg = await ChatMessage.findOne({ theatre_id: t._id, user_id: currentUser.id })
                    .sort({ created_at: -1 });

                const unreadCount = await ChatMessage.countDocuments({
                    theatre_id: t._id,
                    user_id: currentUser.id,
                    sender_role: { $ne: 'CUSTOMER' },
                    is_read: 0,
                });

                return {
                    theatre_id: t._id.toString(),
                    theatre_name: t.name,
                    theatre_image: t.image,
                    theatre_city: t.city,
                    theatre_location: t.location,
                    last_message: lastMsg ? lastMsg.message : null,
                    last_message_at: lastMsg ? lastMsg.created_at : null,
                    unread_count: unreadCount,
                };
            }));

            conversations.sort((a, b) => {
                if (!a.last_message_at) return 1;
                if (!b.last_message_at) return -1;
                return new Date(b.last_message_at) - new Date(a.last_message_at);
            });

            res.json({ success: true, conversations });
            return;
        }

        // If STAFF or ADMIN
        let theatreId = null;
        if (currentUser.role === 'STAFF') {
            const authorizedIds = await getAuthorizedTheatreIdsForUser(currentUser);
            if (authorizedIds.length === 0) {
                res.json({ success: true, theatreId: null, conversations: [] });
                return;
            }
            if (req.query.theatreId) {
                if (!authorizedIds.includes(req.query.theatreId.toString())) {
                    res.status(403).json({ success: false, message: 'Unauthorized: You do not have permission to view chats for this theatre.' });
                    return;
                }
                theatreId = req.query.theatreId.toString();
            } else {
                theatreId = authorizedIds[0];
            }
        } else if (currentUser.role === 'ADMIN') {
            theatreId = req.query.theatreId || null;
            if (!theatreId) {
                const firstTheatre = await Theatre.findOne({ status: 'ACTIVE' });
                theatreId = firstTheatre ? firstTheatre._id.toString() : null;
            }
        }

        if (!theatreId) {
            res.json({ success: true, theatreId: null, conversations: [] });
            return;
        }

        // Find users who chatted with this theatre
        const chattedUserIds = await ChatMessage.distinct('user_id', { theatre_id: theatreId });

        // Find users who booked at this theatre
        const screens = await Screen.find({ theatre_id: theatreId }).select('_id');
        const screenIds = screens.map(s => s._id);
        const shows = await Show.find({ screen_id: { $in: screenIds } }).select('_id');
        const showIds = shows.map(s => s._id);
        const bookedUserIds = await IntervalBooking.distinct('user_id', { show_id: { $in: showIds } });

        const allUserIdSet = new Set([
            ...chattedUserIds.map(id => id.toString()),
            ...bookedUserIds.map(id => id.toString())
        ]);

        const users = await User.find({ _id: { $in: Array.from(allUserIdSet) } });

        const conversations = await Promise.all(users.map(async (u) => {
            const lastMsg = await ChatMessage.findOne({ theatre_id: theatreId, user_id: u._id })
                .sort({ created_at: -1 });

            const unreadCount = await ChatMessage.countDocuments({
                theatre_id: theatreId,
                user_id: u._id,
                sender_role: 'CUSTOMER',
                is_read: 0,
            });

            return {
                user_id: u._id.toString(),
                user_name: u.name,
                user_email: u.email,
                user_phone: u.phone,
                theatre_id: theatreId,
                last_message: lastMsg ? lastMsg.message : null,
                last_message_at: lastMsg ? lastMsg.created_at : null,
                unread_count: unreadCount,
            };
        }));

        conversations.sort((a, b) => {
            if (!a.last_message_at) return 1;
            if (!b.last_message_at) return -1;
            return new Date(b.last_message_at) - new Date(a.last_message_at);
        });

        res.json({ success: true, theatreId, conversations });
    }
    catch (error) {
        next(error);
    }
}

export async function getMessages(req, res, next) {
    if (!isDBConnected()) {
        res.json({ success: true, messages: [] });
        return;
    }
    try {
        const currentUser = req.user;
        const theatreId = req.query.theatreId;
        if (!theatreId) {
            res.status(400).json({ success: false, message: 'theatreId query parameter is required.' });
            return;
        }

        if (currentUser.role === 'STAFF') {
            const isAuth = await isUserAuthorizedForTheatre(currentUser, theatreId);
            if (!isAuth) {
                res.status(403).json({ success: false, message: 'Unauthorized: You are not authorized to access messages for this theatre.' });
                return;
            }
        }

        let customerUserId;
        if (currentUser.role === 'CUSTOMER') {
            customerUserId = currentUser.id;
        } else {
            customerUserId = req.query.userId;
            if (!customerUserId) {
                res.status(400).json({ success: false, message: 'userId query parameter is required for staff/admin.' });
                return;
            }
        }

        const messages = await ChatMessage.find({ theatre_id: theatreId, user_id: customerUserId })
            .populate('sender_id', 'name')
            .populate('theatre_id', 'name')
            .sort({ created_at: 1 });

        // Mark messages as read based on viewer role
        if (currentUser.role === 'CUSTOMER') {
            await ChatMessage.updateMany(
                { theatre_id: theatreId, user_id: customerUserId, sender_role: { $ne: 'CUSTOMER' }, is_read: 0 },
                { is_read: 1 }
            );
        } else {
            await ChatMessage.updateMany(
                { theatre_id: theatreId, user_id: customerUserId, sender_role: 'CUSTOMER', is_read: 0 },
                { is_read: 1 }
            );
        }

        const formattedMessages = messages.map(m => ({
            id: m._id.toString(),
            theatre_id: m.theatre_id?._id?.toString() || theatreId,
            user_id: m.user_id?.toString() || customerUserId,
            sender_id: m.sender_id?._id?.toString() || m.sender_id?.toString(),
            sender_name: m.sender_id?.name || 'User',
            theatre_name: m.theatre_id?.name || 'Theatre',
            sender_role: m.sender_role,
            message: m.message || '',
            has_media: Boolean(m.has_media),
            media_type: m.media_type || null,
            original_filename: m.original_filename || null,
            mime_type: m.mime_type || null,
            file_size: m.file_size || 0,
            booking_id: m.booking_id ? m.booking_id.toString() : null,
            is_read: m.is_read,
            created_at: m.created_at,
        }));

        res.json({ success: true, theatreId, userId: customerUserId, messages: formattedMessages });
    }
    catch (error) {
        next(error);
    }
}

export async function sendMessage(req, res, next) {
    if (!isDBConnected()) {
        res.json({
            success: true,
            message: {
                id: 'msg_mem_' + Date.now(),
                message: req.body.message || '',
                sender_role: req.user.role,
                sender_id: req.user.id,
                sender_name: req.user.name,
                created_at: new Date().toISOString(),
            }
        });
        return;
    }
    try {
        const currentUser = req.user;
        const { theatreId, userId, message = '', bookingId } = req.body;
        const rawMessage = (message || '').trim();

        if (!theatreId) {
            res.status(400).json({ success: false, message: 'theatreId is required.' });
            return;
        }

        if (currentUser.role === 'STAFF') {
            const isAuth = await isUserAuthorizedForTheatre(currentUser, theatreId);
            if (!isAuth) {
                res.status(403).json({ success: false, message: 'Unauthorized: You cannot send messages on behalf of another theatre.' });
                return;
            }
        }

        if (!rawMessage && !req.file) {
            res.status(400).json({ success: false, message: 'Either a text message or a media attachment is required.' });
            return;
        }

        let targetCustomerUserId;
        if (currentUser.role === 'CUSTOMER') {
            targetCustomerUserId = currentUser.id;
        } else {
            targetCustomerUserId = userId;
            if (!targetCustomerUserId) {
                res.status(400).json({ success: false, message: 'userId is required for staff/admin replies.' });
                return;
            }
        }

        let mediaData = {
            has_media: false,
            media_type: null,
            encrypted_file_path: null,
            original_filename: null,
            mime_type: null,
            file_size: 0,
            iv: null,
            auth_tag: null,
        };

        if (req.file) {
            // Validate magic bytes (JPEG, PNG, MP4, WebM)
            const validated = validateMediaBuffer(req.file.buffer, req.file.originalname);
            // Encrypt binary buffer using AES-256-GCM
            const encrypted = encryptBuffer(req.file.buffer);

            const encryptedFilename = `chat_${Date.now()}_${crypto.randomBytes(8).toString('hex')}.enc`;
            const storagePath = path.join(config.uploadDir, encryptedFilename);

            if (!fs.existsSync(config.uploadDir)) {
                fs.mkdirSync(config.uploadDir, { recursive: true });
            }

            fs.writeFileSync(storagePath, encrypted.encryptedBuffer);

            mediaData = {
                has_media: true,
                media_type: validated.fileType,
                encrypted_file_path: encryptedFilename,
                original_filename: req.file.originalname,
                mime_type: validated.mimeType,
                file_size: req.file.size,
                iv: encrypted.ivHex,
                auth_tag: encrypted.authTagHex,
            };
        }

        const chatMessage = await ChatMessage.create({
            theatre_id: theatreId,
            user_id: targetCustomerUserId,
            sender_id: currentUser.id,
            sender_role: currentUser.role,
            message: rawMessage,
            booking_id: bookingId || null,
            is_read: 0,
            ...mediaData,
        });

        // Send in-app notification to the counterparty
        const notificationSnippet = rawMessage || (mediaData.media_type === 'VIDEO' ? 'Sent an encrypted video 🎥' : 'Sent an encrypted media attachment 📎');
        if (currentUser.role === 'CUSTOMER') {
            const theatre = await Theatre.findById(theatreId);
            let recipientId = theatre?.owner_id;
            if (!recipientId) {
                const staff = await TheatreStaff.findOne({ theatre_id: theatreId });
                if (staff) recipientId = staff.user_id;
            }
            if (recipientId) {
                await createNotification(
                    recipientId,
                    bookingId || undefined,
                    `New Message from ${currentUser.name}`,
                    `${notificationSnippet.substring(0, 100)}...`,
                    'GENERAL'
                );
            }
        } else {
            const theatre = await Theatre.findById(theatreId);
            await createNotification(
                targetCustomerUserId,
                bookingId || undefined,
                `Message from ${theatre?.name || 'Theatre Admin'}`,
                `${notificationSnippet.substring(0, 100)}...`,
                'GENERAL'
            );
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully.',
            chatMessage: {
                id: chatMessage._id.toString(),
                theatre_id: theatreId,
                user_id: targetCustomerUserId,
                sender_id: currentUser.id,
                sender_name: currentUser.name,
                sender_role: currentUser.role,
                message: rawMessage,
                has_media: chatMessage.has_media,
                media_type: chatMessage.media_type,
                original_filename: chatMessage.original_filename,
                mime_type: chatMessage.mime_type,
                file_size: chatMessage.file_size,
                booking_id: bookingId || null,
                is_read: 0,
                created_at: chatMessage.created_at || new Date().toISOString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
}

export async function streamChatMessageMedia(req, res, next) {
    if (!isDBConnected()) {
        res.status(404).send('Media not available in offline mode.');
        return;
    }
    try {
        const messageId = req.params.id;
        const chatMessage = await ChatMessage.findById(messageId);

        if (!chatMessage || !chatMessage.has_media || !chatMessage.encrypted_file_path) {
            res.status(404).json({ success: false, message: 'Encrypted media message not found.' });
            return;
        }

        const user = req.user;
        const customerId = chatMessage.user_id?.toString();
        const theatreId = chatMessage.theatre_id?.toString();

        // Access Control
        if (user.role === 'CUSTOMER' && customerId !== user.id) {
            res.status(403).json({ success: false, message: 'Unauthorized to view this encrypted media.' });
            return;
        }

        if (user.role === 'STAFF') {
            const isAuth = await isUserAuthorizedForTheatre(user, theatreId);
            if (!isAuth) {
                res.status(403).json({ success: false, message: 'Unauthorized to view media for this theatre.' });
                return;
            }
        }

        const filePath = path.join(config.uploadDir, chatMessage.encrypted_file_path);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'Encrypted media file not found on disk.' });
            return;
        }

        const encryptedBuffer = fs.readFileSync(filePath);
        // Decrypt on-the-fly using AES-256-GCM authenticated tag
        const decryptedBuffer = decryptBuffer(encryptedBuffer, chatMessage.iv, chatMessage.auth_tag);

        const totalSize = decryptedBuffer.length;
        const range = req.headers.range;

        // Support HTTP 206 Partial Content byte ranges for smooth video seeking & streaming
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            const chunkSize = (end - start) + 1;
            const slice = decryptedBuffer.subarray(start, end + 1);

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': chatMessage.mime_type || 'video/mp4',
                'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            });
            res.end(slice);
        } else {
            res.setHeader('Content-Type', chatMessage.mime_type || 'video/mp4');
            res.setHeader('Content-Length', totalSize);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(chatMessage.original_filename || 'media')}"`);
            res.send(decryptedBuffer);
        }
    }
    catch (error) {
        next(error);
    }
}
