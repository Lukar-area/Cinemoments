import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.js';
const NotificationContext = createContext(undefined);
export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const fetchNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        try {
            const data = await api.notifications.getAll();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        }
        catch {
            // Background poll silently fails if offline
        }
    }, [user]);
    useEffect(() => {
        fetchNotifications();
        // Poll every 15 seconds for reactive updates
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);
    const markAsRead = async (id) => {
        try {
            await api.notifications.markRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };
    const markAllAsRead = async () => {
        try {
            await api.notifications.markAllRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        }
        catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };
    return (<NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>);
};
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
