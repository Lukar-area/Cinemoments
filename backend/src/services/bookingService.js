import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import User from '../models/User.js';
import Theatre from '../models/Theatre.js';
import TheatreStaff from '../models/TheatreStaff.js';
import Screen from '../models/Screen.js';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import IntervalBooking from '../models/IntervalBooking.js';
import Transaction from '../models/Transaction.js';
import BookingMedia from '../models/BookingMedia.js';
import { encryptBuffer, validateMediaBuffer } from './cryptoService.js';
import { createNotification } from './notificationService.js';
import { recordAuditLog } from './auditService.js';
import { config } from '../config/index.js';

/**
 * Submits a new interval booking request with optional encrypted media.
 */
export async function createBooking(input) {
    // Validate show exists
    const show = await Show.findById(input.showId)
        .populate('movie_id')
        .populate({
            path: 'screen_id',
            populate: { path: 'theatre_id' }
        });

    if (!show) {
        throw new Error('Selected movie show was not found.');
    }

    // Verify show hasn't already passed
    const showDateTime = new Date(`${show.show_date}T${show.start_time}`);
    if (showDateTime < new Date()) {
        throw new Error('Cannot book an interval for a show that has already started.');
    }

    // Check if an accepted booking already exists for this slot
    const alreadyBooked = await IntervalBooking.findOne({
        show_id: input.showId,
        status: 'ACCEPTED'
    });
    if (alreadyBooked) {
        throw new Error('This interval slot has already been booked and accepted.');
    }

    // Financial calculation
    const amount = Number(show.price_estimate || 500.0);
    const paymentMethod = input.paymentMethod || 'WALLET';
    const user = await User.findById(input.userId);

    // If paying via wallet, verify sufficient balance
    if (paymentMethod === 'WALLET') {
        if (!user || Number(user.wallet_balance || 0) < amount) {
            throw new Error(`Insufficient wallet balance. Booking requires ₹${amount}, but your current wallet balance is ₹${user ? user.wallet_balance : 0}.`);
        }
        // Deduct full amount from user wallet
        await User.findByIdAndUpdate(input.userId, { $inc: { wallet_balance: -amount } });
    }

    // Insert booking request
    const booking = await IntervalBooking.create({
        user_id: input.userId,
        show_id: input.showId,
        booking_type: input.bookingType,
        message: input.message,
        contact_phone: input.contactPhone || null,
        status: 'PENDING',
    });

    const bookingId = booking._id.toString();
    const theatre = show.screen_id ? show.screen_id.theatre_id : null;
    const theatreId = theatre ? theatre._id : null;

    // Financial Transaction Execution: 80% to Theatre Owner, 20% to Super Admin
    const theatreShare = Math.round(amount * 0.8 * 100) / 100;
    const adminShare = Math.round(amount * 0.2 * 100) / 100;

    // Credit 80% to Theatre Owner (owner_id or first assigned staff)
    let ownerId = theatre ? theatre.owner_id : null;
    if (!ownerId && theatreId) {
        const staffRow = await TheatreStaff.findOne({ theatre_id: theatreId });
        if (staffRow) {
            ownerId = staffRow.user_id;
        }
    }
    if (ownerId) {
        await User.findByIdAndUpdate(ownerId, { $inc: { wallet_balance: theatreShare } });
    }

    // Credit 20% to Super Admin
    await User.findOneAndUpdate({ role: 'ADMIN' }, { $inc: { wallet_balance: adminShare } });

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Record completed transaction
    const transaction = await Transaction.create({
        booking_id: booking._id,
        user_id: input.userId,
        theatre_id: theatreId,
        total_amount: amount,
        theatre_share: theatreShare,
        admin_share: adminShare,
        payment_method: paymentMethod,
        payment_id: input.paymentId || (paymentMethod === 'WALLET' ? `wal_${Date.now()}` : `pay_${Date.now()}`),
        order_id: input.orderId || null,
        receipt_number: receiptNumber,
        status: 'COMPLETED',
    });

    // Dispatch booking submission notifications (in-app, email, SMS)
    await createNotification(
        input.userId,
        booking._id,
        'Booking Request Submitted 🎬',
        `Your interval booking request for "${show.movie_id?.title || 'the movie'}" has been submitted and is pending theatre review.`,
        'BOOKING_SUBMITTED',
        {
            movieTitle: show.movie_id?.title,
            theatreName: theatre?.name,
            intervalTime: `${show.interval_start} - ${show.interval_end}`,
        }
    );

    // If media was attached, validate magic bytes, encrypt with AES-256-GCM, and save to disk
    if (input.mediaFile) {
        const validated = validateMediaBuffer(input.mediaFile.buffer, input.mediaFile.originalname);
        const encrypted = encryptBuffer(input.mediaFile.buffer);

        const encryptedFilename = `${crypto.randomUUID()}.enc`;
        const storagePath = path.join(config.uploadDir, encryptedFilename);

        if (!fs.existsSync(config.uploadDir)) {
            fs.mkdirSync(config.uploadDir, { recursive: true });
        }

        fs.writeFileSync(storagePath, encrypted.encryptedBuffer);

        await BookingMedia.create({
            booking_id: booking._id,
            file_type: validated.fileType,
            encrypted_file_path: encryptedFilename,
            original_filename: input.mediaFile.originalname,
            mime_type: validated.mimeType,
            file_size: input.mediaFile.size,
            iv: encrypted.ivHex,
            auth_tag: encrypted.authTagHex,
        });
    }

    await recordAuditLog({
        userId: input.userId,
        action: 'BOOKING_CREATE',
        entityType: 'booking',
        entityId: bookingId,
        details: { showId: input.showId, bookingType: input.bookingType, amount, theatreShare, adminShare },
        ipAddress: input.ipAddress,
    });

    return { bookingId };
}

/**
 * Accepts a booking request atomically.
 */
export async function acceptBooking(bookingId, staffUserId, ipAddress) {
    const booking = await IntervalBooking.findById(bookingId).populate({
        path: 'show_id',
        populate: [
            { path: 'movie_id', select: 'title' },
            {
                path: 'screen_id',
                populate: { path: 'theatre_id', select: 'name' }
            }
        ]
    });

    if (!booking) {
        const err = new Error('Booking request was not found.');
        err.statusCode = 404;
        throw err;
    }

    if (booking.status !== 'PENDING' && booking.status !== 'UNDER_REVIEW') {
        const err = new Error(`Cannot accept booking with current status: ${booking.status}`);
        err.statusCode = 400;
        throw err;
    }

    // Check if another request has ALREADY been accepted for this show interval
    const existingAccepted = await IntervalBooking.findOne({
        show_id: booking.show_id._id,
        status: 'ACCEPTED'
    });
    if (existingAccepted) {
        const err = new Error('This interval slot has already been booked and accepted for another request.');
        err.statusCode = 409;
        throw err;
    }

    // Update target booking to ACCEPTED
    booking.status = 'ACCEPTED';
    booking.accepted_at = new Date();
    await booking.save();

    // Find all competing pending bookings for the same show interval
    const competing = await IntervalBooking.find({
        show_id: booking.show_id._id,
        _id: { $ne: booking._id },
        status: { $in: ['PENDING', 'UNDER_REVIEW'] }
    });

    // Automatically expire competing requests and refund their transactions
    if (competing.length > 0) {
        await IntervalBooking.updateMany(
            {
                show_id: booking.show_id._id,
                _id: { $ne: booking._id },
                status: { $in: ['PENDING', 'UNDER_REVIEW'] }
            },
            { status: 'EXPIRED' }
        );

        for (const comp of competing) {
            await refundBookingTransaction(comp._id);
        }
    }

    const movieTitle = booking.show_id?.movie_id?.title || 'Movie';
    const theatreName = booking.show_id?.screen_id?.theatre_id?.name || 'Theatre';

    // Create in-app notifications and email/SMS alerts
    await createNotification(
        booking.user_id,
        booking._id,
        'Booking Accepted! 🎉',
        `Your interval booking for "${movieTitle}" at ${theatreName} has been ACCEPTED!`,
        'ACCEPTED',
        {
            movieTitle,
            theatreName,
            intervalTime: `${booking.show_id?.interval_start || '21:00'} - ${booking.show_id?.interval_end || '21:15'}`,
        }
    );

    for (const comp of competing) {
        await createNotification(
            comp.user_id,
            comp._id,
            'Booking Expired & Wallet Refunded',
            `Your booking request for "${movieTitle}" has expired because another request was selected. Your wallet has been refunded.`,
            'EXPIRED',
            {
                movieTitle,
                theatreName,
            }
        );
    }

    // Record audit log
    await recordAuditLog({
        userId: staffUserId,
        action: 'BOOKING_ACCEPT',
        entityType: 'booking',
        entityId: bookingId,
        details: {
            showId: booking.show_id._id,
            expiredCompetingCount: competing.length,
        },
        ipAddress,
    });

    return {
        success: true,
        bookingId,
        status: 'ACCEPTED',
        expiredCount: competing.length,
    };
}

/**
 * Rejects an interval booking request and refunds wallet balance.
 */
export async function rejectBooking(bookingId, staffUserId, reason, ipAddress) {
    const booking = await IntervalBooking.findById(bookingId).populate({
        path: 'show_id',
        populate: [
            { path: 'movie_id', select: 'title' },
            {
                path: 'screen_id',
                populate: { path: 'theatre_id', select: 'name' }
            }
        ]
    });

    if (!booking) {
        const err = new Error('Booking request was not found.');
        err.statusCode = 404;
        throw err;
    }

    if (booking.status !== 'PENDING' && booking.status !== 'UNDER_REVIEW') {
        const err = new Error(`Cannot reject booking in current status: ${booking.status}`);
        err.statusCode = 400;
        throw err;
    }

    booking.status = 'REJECTED';
    booking.rejection_reason = reason || 'Request could not be accommodated at this time.';
    await booking.save();

    // Refund transaction to customer wallet
    await refundBookingTransaction(bookingId);

    const movieTitle = booking.show_id?.movie_id?.title || 'Movie';
    const theatreName = booking.show_id?.screen_id?.theatre_id?.name || 'Theatre';

    await createNotification(
        booking.user_id,
        booking._id,
        'Booking Request Rejected & Refunded',
        `Your booking request for "${movieTitle}" at ${theatreName} was rejected and refunded. ${reason ? 'Reason: ' + reason : ''}`,
        'REJECTED',
        { movieTitle, theatreName, reason }
    );

    await recordAuditLog({
        userId: staffUserId,
        action: 'BOOKING_REJECT',
        entityType: 'booking',
        entityId: bookingId,
        details: { reason },
        ipAddress,
    });

    return { success: true, bookingId, status: 'REJECTED' };
}

/**
 * Cancels a booking by the customer who submitted it and refunds wallet balance.
 */
export async function cancelBooking(bookingId, customerUserId, ipAddress) {
    const booking = await IntervalBooking.findById(bookingId);
    if (!booking) {
        const err = new Error('Booking was not found.');
        err.statusCode = 404;
        throw err;
    }

    if (booking.user_id.toString() !== customerUserId.toString()) {
        const err = new Error('Unauthorized to cancel this booking.');
        err.statusCode = 403;
        throw err;
    }

    if (booking.status !== 'PENDING' && booking.status !== 'UNDER_REVIEW') {
        const err = new Error(`Cannot cancel a booking that is ${booking.status}.`);
        err.statusCode = 400;
        throw err;
    }

    booking.status = 'CANCELLED';
    await booking.save();

    // Refund transaction to customer wallet
    await refundBookingTransaction(bookingId);

    await recordAuditLog({
        userId: customerUserId,
        action: 'BOOKING_CANCEL',
        entityType: 'booking',
        entityId: bookingId,
        ipAddress,
    });

    return { success: true, bookingId, status: 'CANCELLED' };
}

/**
 * Internal helper to refund a booking's financial transaction.
 * Restores 100% to customer wallet, reverses 80% theatre owner and 20% super admin shares.
 */
export async function refundBookingTransaction(bookingId) {
    const tx = await Transaction.findOne({ booking_id: bookingId, status: 'COMPLETED' });
    if (!tx) return;

    // 1. Credit customer wallet
    await User.findByIdAndUpdate(tx.user_id, { $inc: { wallet_balance: tx.total_amount } });

    // 2. Debit theatre owner wallet
    const theatre = await Theatre.findById(tx.theatre_id);
    let ownerId = theatre?.owner_id;
    if (!ownerId && tx.theatre_id) {
        const staffRow = await TheatreStaff.findOne({ theatre_id: tx.theatre_id });
        if (staffRow) ownerId = staffRow.user_id;
    }
    if (ownerId) {
        const owner = await User.findById(ownerId);
        if (owner) {
            const newBal = Math.max(0, Number(owner.wallet_balance || 0) - tx.theatre_share);
            await User.findByIdAndUpdate(ownerId, { wallet_balance: newBal });
        }
    }

    // 3. Debit admin wallet
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (adminUser) {
        const newBal = Math.max(0, Number(adminUser.wallet_balance || 0) - tx.admin_share);
        await User.findByIdAndUpdate(adminUser._id, { wallet_balance: newBal });
    }

    // 4. Mark transaction as REFUNDED
    tx.status = 'REFUNDED';
    await tx.save();
}

export async function getUserTransactions(userId) {
    const txs = await Transaction.find({ user_id: userId })
        .populate('theatre_id', 'name')
        .populate({
            path: 'booking_id',
            populate: {
                path: 'show_id',
                populate: { path: 'movie_id', select: 'title' }
            }
        })
        .sort({ created_at: -1 });

    return txs.map(tx => {
        const booking = tx.booking_id;
        const show = booking ? booking.show_id : null;
        const movie = show ? show.movie_id : null;
        const theatre = tx.theatre_id;

        return {
            id: tx._id.toString(),
            booking_id: booking ? booking._id.toString() : null,
            user_id: tx.user_id.toString(),
            theatre_id: theatre ? theatre._id.toString() : null,
            theatre_name: theatre ? theatre.name : '',
            movie_title: movie ? movie.title : '',
            show_date: show ? show.show_date : '',
            start_time: show ? show.start_time : '',
            total_amount: tx.total_amount,
            theatre_share: tx.theatre_share,
            admin_share: tx.admin_share,
            status: tx.status,
            created_at: tx.created_at,
        };
    });
}

export async function getTheatreEarnings(theatreId) {
    const txs = await Transaction.find({ theatre_id: theatreId })
        .populate('user_id', 'name email')
        .populate({
            path: 'booking_id',
            populate: {
                path: 'show_id',
                populate: { path: 'movie_id', select: 'title' }
            }
        })
        .sort({ created_at: -1 });

    let totalEarnings = 0;
    let totalVolume = 0;
    let completedCount = 0;
    let refundedCount = 0;

    const formattedTxs = txs.map(tx => {
        if (tx.status === 'COMPLETED') {
            totalEarnings += tx.theatre_share;
            totalVolume += tx.total_amount;
            completedCount++;
        } else if (tx.status === 'REFUNDED') {
            refundedCount++;
        }

        const user = tx.user_id;
        const booking = tx.booking_id;
        const show = booking ? booking.show_id : null;
        const movie = show ? show.movie_id : null;

        return {
            id: tx._id.toString(),
            booking_id: booking ? booking._id.toString() : null,
            user_id: user ? user._id.toString() : null,
            customer_name: user ? user.name : '',
            customer_email: user ? user.email : '',
            theatre_id: theatreId.toString(),
            movie_title: movie ? movie.title : '',
            show_date: show ? show.show_date : '',
            total_amount: tx.total_amount,
            theatre_share: tx.theatre_share,
            admin_share: tx.admin_share,
            status: tx.status,
            created_at: tx.created_at,
        };
    });

    const summary = {
        total_earnings: Math.round(totalEarnings * 100) / 100,
        total_booking_volume: Math.round(totalVolume * 100) / 100,
        completed_transactions: completedCount,
        refunded_transactions: refundedCount,
    };

    return { summary, transactions: formattedTxs };
}

export async function getAllTransactions() {
    const txs = await Transaction.find()
        .populate('user_id', 'name email')
        .populate('theatre_id', 'name')
        .populate({
            path: 'booking_id',
            populate: {
                path: 'show_id',
                populate: { path: 'movie_id', select: 'title' }
            }
        })
        .sort({ created_at: -1 });

    let totalVolume = 0;
    let totalTheatrePayout = 0;
    let totalAdminCommission = 0;
    let completedCount = 0;
    let refundedCount = 0;

    const formattedTxs = txs.map(tx => {
        if (tx.status === 'COMPLETED') {
            totalVolume += tx.total_amount;
            totalTheatrePayout += tx.theatre_share;
            totalAdminCommission += tx.admin_share;
            completedCount++;
        } else if (tx.status === 'REFUNDED') {
            refundedCount++;
        }

        const user = tx.user_id;
        const theatre = tx.theatre_id;
        const booking = tx.booking_id;
        const show = booking ? booking.show_id : null;
        const movie = show ? show.movie_id : null;

        return {
            id: tx._id.toString(),
            booking_id: booking ? booking._id.toString() : null,
            user_id: user ? user._id.toString() : null,
            customer_name: user ? user.name : '',
            customer_email: user ? user.email : '',
            theatre_id: theatre ? theatre._id.toString() : null,
            theatre_name: theatre ? theatre.name : '',
            movie_title: movie ? movie.title : '',
            show_date: show ? show.show_date : '',
            total_amount: tx.total_amount,
            theatre_share: tx.theatre_share,
            admin_share: tx.admin_share,
            status: tx.status,
            created_at: tx.created_at,
        };
    });

    const summary = {
        total_volume: Math.round(totalVolume * 100) / 100,
        total_theatre_payout: Math.round(totalTheatrePayout * 100) / 100,
        total_admin_commission: Math.round(totalAdminCommission * 100) / 100,
        completed_count: completedCount,
        refunded_count: refundedCount,
    };

    return { summary, transactions: formattedTxs };
}

/**
 * Fetches booking details by ID.
 */
export async function getBookingById(bookingId) {
    const booking = await IntervalBooking.findById(bookingId)
        .populate('user_id', 'name email')
        .populate({
            path: 'show_id',
            populate: [
                { path: 'movie_id' },
                {
                    path: 'screen_id',
                    populate: { path: 'theatre_id' }
                }
            ]
        });

    if (!booking) return null;

    const media = await BookingMedia.findOne({ booking_id: booking._id });
    const user = booking.user_id;
    const show = booking.show_id;
    const movie = show ? show.movie_id : null;
    const screen = show ? show.screen_id : null;
    const theatre = screen ? screen.theatre_id : null;

    return {
        id: booking._id.toString(),
        user_id: user ? user._id.toString() : null,
        customer_name: user ? user.name : '',
        customer_email: user ? user.email : '',
        show_id: show ? show._id.toString() : null,
        movie_title: movie ? movie.title : '',
        movie_poster: movie ? movie.poster : '',
        theatre_id: theatre ? theatre._id.toString() : null,
        theatre_name: theatre ? theatre.name : '',
        screen_name: screen ? screen.name : '',
        show_date: show ? show.show_date : '',
        start_time: show ? show.start_time : '',
        interval_start: show ? show.interval_start : '',
        interval_end: show ? show.interval_end : '',
        booking_type: booking.booking_type,
        message: booking.message,
        contact_phone: booking.contact_phone,
        status: booking.status,
        rejection_reason: booking.rejection_reason,
        created_at: booking.created_at,
        accepted_at: booking.accepted_at,
        media_id: media ? media._id.toString() : null,
        media_type: media ? media.file_type : null,
        has_media: !!media,
    };
}

/**
 * Retrieves all bookings for a customer.
 */
export async function getCustomerBookings(userId) {
    const bookings = await IntervalBooking.find({ user_id: userId })
        .populate('user_id', 'name email')
        .populate({
            path: 'show_id',
            populate: [
                { path: 'movie_id' },
                {
                    path: 'screen_id',
                    populate: { path: 'theatre_id' }
                }
            ]
        })
        .sort({ created_at: -1 });

    const bookingIds = bookings.map(b => b._id);
    const mediaList = await BookingMedia.find({ booking_id: { $in: bookingIds } });
    const mediaMap = {};
    for (const m of mediaList) {
        mediaMap[m.booking_id.toString()] = m;
    }

    return bookings.map(b => {
        const user = b.user_id;
        const show = b.show_id;
        const movie = show ? show.movie_id : null;
        const screen = show ? show.screen_id : null;
        const theatre = screen ? screen.theatre_id : null;
        const media = mediaMap[b._id.toString()];

        return {
            id: b._id.toString(),
            user_id: user ? user._id.toString() : null,
            customer_name: user ? user.name : '',
            customer_email: user ? user.email : '',
            show_id: show ? show._id.toString() : null,
            movie_title: movie ? movie.title : '',
            movie_poster: movie ? movie.poster : '',
            theatre_id: theatre ? theatre._id.toString() : null,
            theatre_name: theatre ? theatre.name : '',
            screen_name: screen ? screen.name : '',
            show_date: show ? show.show_date : '',
            start_time: show ? show.start_time : '',
            interval_start: show ? show.interval_start : '',
            interval_end: show ? show.interval_end : '',
            booking_type: b.booking_type,
            message: b.message,
            contact_phone: b.contact_phone,
            status: b.status,
            rejection_reason: b.rejection_reason,
            created_at: b.created_at,
            accepted_at: b.accepted_at,
            media_id: media ? media._id.toString() : null,
            media_type: media ? media.file_type : null,
            has_media: !!media,
        };
    });
}

/**
 * Retrieves bookings for theatre staff with optional filters.
 */
export async function getStaffBookings(theatreId, filterStatus) {
    const screens = await Screen.find({ theatre_id: theatreId }).select('_id');
    const screenIds = screens.map(s => s._id);

    const shows = await Show.find({ screen_id: { $in: screenIds } }).select('_id');
    const showIds = shows.map(s => s._id);

    const query = { show_id: { $in: showIds } };
    if (filterStatus && filterStatus !== 'ALL') {
        query.status = filterStatus;
    }

    const bookings = await IntervalBooking.find(query)
        .populate('user_id', 'name email')
        .populate({
            path: 'show_id',
            populate: [
                { path: 'movie_id' },
                {
                    path: 'screen_id',
                    populate: { path: 'theatre_id' }
                }
            ]
        })
        .sort({ created_at: -1 });

    const bookingIds = bookings.map(b => b._id);
    const mediaList = await BookingMedia.find({ booking_id: { $in: bookingIds } });
    const mediaMap = {};
    for (const m of mediaList) {
        mediaMap[m.booking_id.toString()] = m;
    }

    return bookings.map(b => {
        const user = b.user_id;
        const show = b.show_id;
        const movie = show ? show.movie_id : null;
        const screen = show ? show.screen_id : null;
        const theatre = screen ? screen.theatre_id : null;
        const media = mediaMap[b._id.toString()];

        return {
            id: b._id.toString(),
            user_id: user ? user._id.toString() : null,
            customer_name: user ? user.name : '',
            customer_email: user ? user.email : '',
            show_id: show ? show._id.toString() : null,
            movie_title: movie ? movie.title : '',
            movie_poster: movie ? movie.poster : '',
            theatre_id: theatre ? theatre._id.toString() : null,
            theatre_name: theatre ? theatre.name : '',
            screen_name: screen ? screen.name : '',
            show_date: show ? show.show_date : '',
            start_time: show ? show.start_time : '',
            interval_start: show ? show.interval_start : '',
            interval_end: show ? show.interval_end : '',
            booking_type: b.booking_type,
            message: b.message,
            contact_phone: b.contact_phone,
            status: b.status,
            rejection_reason: b.rejection_reason,
            created_at: b.created_at,
            accepted_at: b.accepted_at,
            media_id: media ? media._id.toString() : null,
            media_type: media ? media.file_type : null,
            has_media: !!media,
        };
    });
}
