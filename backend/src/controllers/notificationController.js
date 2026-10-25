import {
    getUserNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../services/notificationService.js';

export async function getMyNotifications(req, res, next) {
    try {
        const userId = req.user.id;
        const notifications = await getUserNotifications(userId);
        const unreadCount = await getUnreadNotificationCount(userId);
        res.json({
            success: true,
            unreadCount,
            notifications,
        });
    }
    catch (error) {
        next(error);
    }
}

export async function markAsReadController(req, res, next) {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;
        await markNotificationAsRead(notificationId, userId);
        res.json({ success: true, message: 'Notification marked as read.' });
    }
    catch (error) {
        next(error);
    }
}

export async function markAllAsReadController(req, res, next) {
    try {
        const userId = req.user.id;
        await markAllNotificationsAsRead(userId);
        res.json({ success: true, message: 'All notifications marked as read.' });
    }
    catch (error) {
        next(error);
    }
}
