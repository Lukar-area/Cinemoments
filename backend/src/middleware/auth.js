import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';

/**
 * Middleware that validates the JWT authentication token.
 * Extracts from Authorization: Bearer <token>
 */
export async function authenticate(req, res, next) {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.query?.token) {
        token = req.query.token;
    }

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in to proceed.',
        });
        return;
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ success: false, message: 'User account no longer exists.' });
            return;
        }
        if (user.status !== 'ACTIVE') {
            res.status(403).json({ success: false, message: 'Your account has been suspended or deactivated.' });
            return;
        }
        req.user = {
            id: user._id.toString(),
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            wallet_balance: user.wallet_balance,
        };
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please log in again.',
        });
    }
}

/**
 * Role-based authorization middleware.
 */
export function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Access denied. You do not have sufficient permissions for this action.',
            });
            return;
        }
        next();
    };
}
