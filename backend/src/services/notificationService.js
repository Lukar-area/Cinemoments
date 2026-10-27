import Notification from '../models/Notification.js';
import User from '../models/User.js';
import IntervalBooking from '../models/IntervalBooking.js';
import {
    sendBookingSubmittedEmail,
    sendBookingAcceptedEmail,
    sendBookingRejectedEmail,
    sendBookingExpiredEmail,
} from './emailService.js';
import {
    sendBookingSubmittedSMS,
    sendBookingAcceptedSMS,
    sendBookingRejectedSMS,
    sendBookingExpiredSMS,
} from './smsService.js';

/**
 * Creates an in-app notification for a user and dispatches email/SMS alerts based on notification type.
 */
export async function createNotification(userId, bookingId, title, message, type = 'GENERAL', metadata = {}) {
    try {
        const notif = await Notification.create({
            user_id: userId,
            booking_id: bookingId || null,
            title,
            message,
            type,
            is_read: 0,
        });

        // Trigger multi-channel alerts asynchronously without blocking response
        dispatchExternalAlerts(userId, bookingId, title, message, type, metadata).catch(err => {
            console.warn('⚠️ External alert dispatch error:', err.message);
        });

        return notif;
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

/**
 * Internal async dispatcher for Email and SMS
 */
async function dispatchExternalAlerts(userId, bookingId, title, message, type, metadata = {}) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        let booking = null;
        let show = null;
        let theatre = null;
        let movieTitle = metadata.movieTitle || 'Movie';
        let theatreName = metadata.theatreName || 'Cinema Theatre';
        let intervalTime = metadata.intervalTime || '21:00 - 21:15';

        if (bookingId) {
            booking = await IntervalBooking.findById(bookingId).populate({
                path: 'show_id',
                populate: [
                    { path: 'movie_id' },
                    { path: 'screen_id', populate: { path: 'theatre_id' } }
                ]
            });

            if (booking?.show_id) {
                show = booking.show_id;
                movieTitle = show.movie_id?.title || movieTitle;
                theatre = show.screen_id?.theatre_id;
                theatreName = theatre?.name || theatreName;
                intervalTime = `${show.interval_start || '21:00'} - ${show.interval_end || '21:15'}`;
            }
        }

        const phone = booking?.contact_phone || user.phone;

        if (type === 'BOOKING_SUBMITTED' && booking) {
            await sendBookingSubmittedEmail(user, booking, show, theatre);
            if (phone) await sendBookingSubmittedSMS(phone, movieTitle, theatreName);
        } else if (type === 'ACCEPTED' && booking) {
            await sendBookingAcceptedEmail(user, booking, show, theatre);
            if (phone) await sendBookingAcceptedSMS(phone, movieTitle, theatreName, intervalTime);
        } else if (type === 'REJECTED' && booking) {
            await sendBookingRejectedEmail(user, booking, show, theatre, metadata.reason);
            if (phone) await sendBookingRejectedSMS(phone, movieTitle, theatreName);
        } else if (type === 'EXPIRED') {
            if (booking) await sendBookingExpiredEmail(user, booking, show, theatre);
            if (phone) await sendBookingExpiredSMS(phone, movieTitle);
        }
    } catch (err) {
        console.warn('dispatchExternalAlerts error:', err.message);
    }
}

/**
 * Retrieves latest notifications for a specific user.
 */
export async function getUserNotifications(userId, limit = 20) {
    const notifications = await Notification.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(limit);
    return notifications.map(n => n.toJSON());
}

/**
 * Gets count of unread notifications for a user.
 */
export async function getUnreadNotificationCount(userId) {
    return await Notification.countDocuments({ user_id: userId, is_read: 0 });
}

/**
 * Marks a notification as read.
 */
export async function markNotificationAsRead(notificationId, userId) {
    const result = await Notification.updateOne(
        { _id: notificationId, user_id: userId },
        { is_read: 1 }
    );
    return result.modifiedCount > 0;
}

/**
 * Marks all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId) {
    await Notification.updateMany(
        { user_id: userId },
        { is_read: 1 }
    );
}
