import fs from 'fs';
import path from 'path';
import BookingMedia from '../models/BookingMedia.js';
import TheatreStaff from '../models/TheatreStaff.js';
import Theatre from '../models/Theatre.js';
import { decryptBuffer } from '../services/cryptoService.js';
import { config } from '../config/index.js';

export async function streamMedia(req, res, next) {
    try {
        const mediaId = req.params.id;

        const media = await BookingMedia.findById(mediaId).populate({
            path: 'booking_id',
            populate: {
                path: 'show_id',
                populate: { path: 'screen_id' }
            }
        });

        if (!media) {
            res.status(404).json({ success: false, message: 'Media not found.' });
            return;
        }

        const booking = media.booking_id;
        const customerId = booking ? booking.user_id.toString() : null;
        const screen = booking?.show_id?.screen_id;
        const theatreId = screen ? screen.theatre_id.toString() : null;

        // Role-based Access Control
        const user = req.user;
        if (user.role === 'CUSTOMER' && customerId !== user.id) {
            res.status(403).json({ success: false, message: 'Unauthorized to view this private media.' });
            return;
        }

        if (user.role === 'STAFF') {
            const isAssigned = await TheatreStaff.findOne({ theatre_id: theatreId, user_id: user.id });
            const isOwner = await Theatre.findOne({ _id: theatreId, owner_id: user.id });
            if (!isAssigned && !isOwner) {
                res.status(403).json({ success: false, message: 'Unauthorized to view media for this theatre.' });
                return;
            }
        }

        // Read encrypted file from disk
        const filePath = path.join(config.uploadDir, media.encrypted_file_path);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'Encrypted media file not found on disk.' });
            return;
        }

        const encryptedBuffer = fs.readFileSync(filePath);
        // Decrypt on-the-fly using AES-256-GCM
        const decryptedBuffer = decryptBuffer(encryptedBuffer, media.iv, media.auth_tag);

        // Serve decrypted stream with strict privacy headers
        res.setHeader('Content-Type', media.mime_type);
        res.setHeader('Content-Length', decryptedBuffer.length);
        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(media.original_filename)}"`);
        res.send(decryptedBuffer);
    }
    catch (error) {
        next(error);
    }
}
