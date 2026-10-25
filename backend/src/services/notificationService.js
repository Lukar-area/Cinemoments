import Notification from '../models/Notification.js';

/**
 * Creates an in-app notification for a user.
 */
export async function createNotification(userId, bookingId, title, message, type = 'GENERAL') {
    try {
        await Notification.create({
            user_id: userId,
            booking_id: bookingId || null,
            title,
            message,
            type,
            is_read: 0,
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
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
