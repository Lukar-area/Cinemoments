import User from '../models/User.js';
import Theatre from '../models/Theatre.js';
import Movie from '../models/Movie.js';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';
import IntervalBooking from '../models/IntervalBooking.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';
import BookingMedia from '../models/BookingMedia.js';
import { recordAuditLog } from '../services/auditService.js';
import { isDBConnected } from '../db/database.js';
import { fallbackStore } from '../db/fallbackStore.js';
import { getAllInMemoryAndDemoUsers, updateInMemoryUserStatusOrRole } from './authController.js';

export async function getSystemStats(req, res, next) {
    try {
        if (!isDBConnected()) {
            res.json({
                success: true,
                stats: fallbackStore.getStats(),
            });
            return;
        }
        const [
            usersCount,
            theatresCount,
            moviesCount,
            screensCount,
            showsCount,
            totalBookings,
            acceptedBookings,
            pendingBookings,
            expiredBookings,
            rejectedBookings,
        ] = await Promise.all([
            User.countDocuments(),
            Theatre.countDocuments(),
            Movie.countDocuments(),
            Screen.countDocuments(),
            Show.countDocuments(),
            IntervalBooking.countDocuments(),
            IntervalBooking.countDocuments({ status: 'ACCEPTED' }),
            IntervalBooking.countDocuments({ status: 'PENDING' }),
            IntervalBooking.countDocuments({ status: 'EXPIRED' }),
            IntervalBooking.countDocuments({ status: 'REJECTED' }),
        ]);

        const txAgg = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalVolume: {
                        $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$total_amount', 0] }
                    },
                    totalTheatrePayout: {
                        $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$theatre_share', 0] }
                    },
                    totalAdminCommission: {
                        $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$admin_share', 0] }
                    },
                }
            }
        ]);

        const txSummary = txAgg[0] || { totalVolume: 0, totalTheatrePayout: 0, totalAdminCommission: 0 };

        res.json({
            success: true,
            stats: {
                usersCount,
                theatresCount,
                moviesCount,
                screensCount,
                showsCount,
                totalBookings,
                acceptedBookings,
                pendingBookings,
                expiredBookings,
                rejectedBookings,
                totalVolume: Math.round(Number(txSummary.totalVolume || 0) * 100) / 100,
                totalTheatrePayout: Math.round(Number(txSummary.totalTheatrePayout || 0) * 100) / 100,
                totalAdminCommission: Math.round(Number(txSummary.totalAdminCommission || 0) * 100) / 100,
            },
        });
    }
    catch (error) {
        next(error);
    }
}

export async function getAllUsers(req, res, next) {
    try {
        if (!isDBConnected()) {
            res.json({
                success: true,
                users: getAllInMemoryAndDemoUsers(),
            });
            return;
        }
        const users = await User.find()
            .select('name email phone role status wallet_balance created_at updated_at')
            .sort({ created_at: -1 });

        res.json({ success: true, users: users.map(u => u.toJSON()) });
    }
    catch (error) {
        next(error);
    }
}

export async function updateUserStatusOrRole(req, res, next) {
    try {
        if (!isDBConnected()) {
            updateInMemoryUserStatusOrRole(req.params.id, req.body);
            res.json({ success: true, message: 'User updated successfully.' });
            return;
        }
        const targetUserId = req.params.id;
        const { role, status } = req.body;

        const updateData = {};
        if (role) updateData.role = role;
        if (status) updateData.status = status;

        await User.findByIdAndUpdate(targetUserId, updateData);

        await recordAuditLog({
            userId: req.user.id,
            action: 'ADMIN_USER_UPDATE',
            entityType: 'user',
            entityId: targetUserId,
            details: { role, status },
            ipAddress: req.ip,
        });

        res.json({ success: true, message: 'User updated successfully.' });
    }
    catch (error) {
        next(error);
    }
}

export async function getAuditLogsController(req, res, next) {
    try {
        if (!isDBConnected()) {
            res.json({
                success: true,
                logs: [],
            });
            return;
        }
        const limit = parseInt(req.query.limit, 10) || 50;

        const logs = await AuditLog.find()
            .populate('user_id', 'name email')
            .sort({ created_at: -1 })
            .limit(limit);

        const formattedLogs = logs.map(l => {
            const user = l.user_id;
            return {
                id: l._id.toString(),
                user_id: user ? user._id.toString() : null,
                user_name: user ? user.name : null,
                user_email: user ? user.email : null,
                action: l.action,
                entity_type: l.entity_type,
                entity_id: l.entity_id,
                details: l.details,
                ip_address: l.ip_address,
                created_at: l.created_at,
            };
        });

        res.json({ success: true, logs: formattedLogs });
    }
    catch (error) {
        next(error);
    }
}

export async function getAllBookingsAdmin(req, res, next) {
    try {
        if (!isDBConnected()) {
            res.json({
                success: true,
                bookings: fallbackStore.getBookings(),
            });
            return;
        }
        const bookings = await IntervalBooking.find()
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

        const formattedBookings = bookings.map(b => {
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
            };
        });

        res.json({ success: true, bookings: formattedBookings });
    }
    catch (error) {
        next(error);
    }
}
