import {
    createBooking,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    getBookingById,
    getCustomerBookings,
    getStaffBookings,
    getUserTransactions,
    getTheatreEarnings,
    getAllTransactions,
} from '../services/bookingService.js';
import Theatre from '../models/Theatre.js';
import TheatreStaff from '../models/TheatreStaff.js';

export async function submitBooking(req, res, next) {
    try {
        const userId = req.user.id;
        const { showId, bookingType, message, contactPhone } = req.body;
        if (!showId || !bookingType || !message) {
            res.status(400).json({ success: false, message: 'Show, booking purpose, and message are required.' });
            return;
        }
        const result = await createBooking({
            userId,
            showId,
            bookingType,
            message,
            contactPhone,
            mediaFile: req.file,
            ipAddress: req.ip,
        });
        res.status(201).json({
            success: true,
            message: 'Your interval booking request has been submitted and is pending theatre review.',
            bookingId: result.bookingId,
            status: 'PENDING',
        });
    }
    catch (error) {
        next(error);
    }
}

export async function getMyBookings(req, res, next) {
    try {
        const userId = req.user.id;
        const bookings = await getCustomerBookings(userId);

        const stats = {
            total: bookings.length,
            pending: bookings.filter((b) => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length,
            accepted: bookings.filter((b) => b.status === 'ACCEPTED').length,
            expired: bookings.filter((b) => b.status === 'EXPIRED').length,
            completed: bookings.filter((b) => b.status === 'COMPLETED').length,
            rejected: bookings.filter((b) => b.status === 'REJECTED').length,
            cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
        };
        res.json({ success: true, stats, bookings });
    }
    catch (error) {
        next(error);
    }
}

export async function getBookingDetails(req, res, next) {
    try {
        const bookingId = req.params.id;
        const booking = await getBookingById(bookingId);
        if (!booking) {
            res.status(404).json({ success: false, message: 'Booking not found.' });
            return;
        }
        if (req.user?.role === 'CUSTOMER' && booking.user_id !== req.user.id) {
            res.status(403).json({ success: false, message: 'Unauthorized to view this booking.' });
            return;
        }
        res.json({ success: true, booking });
    }
    catch (error) {
        next(error);
    }
}

export async function getStaffBookingsController(req, res, next) {
    try {
        let theatreId = req.query.theatreId;

        if (req.user?.role === 'STAFF') {
            const staffRow = await TheatreStaff.findOne({ user_id: req.user.id });
            if (staffRow) {
                theatreId = staffRow.theatre_id.toString();
            } else {
                const ownerRow = await Theatre.findOne({ owner_id: req.user.id });
                if (ownerRow) {
                    theatreId = ownerRow._id.toString();
                }
            }
        }

        if (!theatreId) {
            const firstTheatre = await Theatre.findOne();
            theatreId = firstTheatre ? firstTheatre._id.toString() : null;
        }

        if (!theatreId) {
            res.json({
                success: true,
                theatreId: null,
                cards: {
                    pendingRequests: 0,
                    todayAcceptedBookings: 0,
                    upcomingIntervalBookings: 0,
                    completedBookings: 0,
                    totalRequests: 0,
                },
                bookings: [],
            });
            return;
        }

        const filterStatus = req.query.status || 'ALL';
        const bookings = await getStaffBookings(theatreId, filterStatus);
        const allTheatreBookings = await getStaffBookings(theatreId, 'ALL');
        const today = new Date().toISOString().split('T')[0];

        const cards = {
            pendingRequests: allTheatreBookings.filter((b) => b.status === 'PENDING' || b.status === 'UNDER_REVIEW').length,
            todayAcceptedBookings: allTheatreBookings.filter((b) => b.status === 'ACCEPTED' && b.show_date === today).length,
            upcomingIntervalBookings: allTheatreBookings.filter((b) => b.status === 'ACCEPTED' && b.show_date >= today).length,
            completedBookings: allTheatreBookings.filter((b) => b.status === 'COMPLETED').length,
            totalRequests: allTheatreBookings.length,
        };

        res.json({
            success: true,
            theatreId,
            cards,
            bookings,
        });
    }
    catch (error) {
        next(error);
    }
}

export async function handleAcceptBooking(req, res, next) {
    try {
        const bookingId = req.params.id;
        const staffUserId = req.user.id;
        const result = await acceptBooking(bookingId, staffUserId, req.ip);
        res.json({
            success: true,
            message: 'Booking request accepted successfully. Competing requests have been automatically expired.',
            result,
        });
    }
    catch (error) {
        next(error);
    }
}

export async function handleRejectBooking(req, res, next) {
    try {
        const bookingId = req.params.id;
        const { reason } = req.body;
        const staffUserId = req.user.id;
        const result = await rejectBooking(bookingId, staffUserId, reason, req.ip);
        res.json({
            success: true,
            message: 'Booking request rejected.',
            result,
        });
    }
    catch (error) {
        next(error);
    }
}

export async function handleCancelBooking(req, res, next) {
    try {
        const bookingId = req.params.id;
        const customerUserId = req.user.id;
        const result = await cancelBooking(bookingId, customerUserId, req.ip);
        res.json({
            success: true,
            message: 'Booking request cancelled.',
            result,
        });
    }
    catch (error) {
        next(error);
    }
}

export async function getMyTransactionsController(req, res, next) {
    try {
        const userId = req.user.id;
        const transactions = await getUserTransactions(userId);
        res.json({ success: true, transactions });
    }
    catch (error) {
        next(error);
    }
}

export async function getTheatreEarningsController(req, res, next) {
    try {
        let theatreId = req.params.theatreId;
        if (!theatreId && req.user?.role === 'STAFF') {
            const staffRow = await TheatreStaff.findOne({ user_id: req.user.id });
            if (staffRow) {
                theatreId = staffRow.theatre_id.toString();
            } else {
                const ownerRow = await Theatre.findOne({ owner_id: req.user.id });
                if (ownerRow) theatreId = ownerRow._id.toString();
            }
        }
        if (!theatreId) {
            const firstTheatre = await Theatre.findOne();
            theatreId = firstTheatre ? firstTheatre._id.toString() : null;
        }

        if (!theatreId) {
            res.json({
                success: true,
                theatreId: null,
                summary: {
                    total_earnings: 0,
                    total_booking_volume: 0,
                    completed_transactions: 0,
                    refunded_transactions: 0,
                },
                transactions: [],
            });
            return;
        }

        const earnings = await getTheatreEarnings(theatreId);
        res.json({ success: true, theatreId, ...earnings });
    }
    catch (error) {
        next(error);
    }
}

export async function getAllTransactionsController(req, res, next) {
    try {
        const data = await getAllTransactions();
        res.json({ success: true, ...data });
    }
    catch (error) {
        next(error);
    }
}
