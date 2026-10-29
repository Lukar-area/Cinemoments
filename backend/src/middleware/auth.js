import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';
import { isDBConnected } from '../db/database.js';

const DEMO_USERS = [
    { id: '67123456789abcdef0000001', name: 'Super Admin', email: 'admin@cinemoments.com', role: 'ADMIN', wallet_balance: 10000.00 },
    { id: '67123456789abcdef0000002', name: 'John (Grand Palace)', email: 'staff@grandcinema.com', role: 'STAFF', wallet_balance: 5000.00, assignedTheatreId: 'theatre_grand_palace_1' },
    { id: '67123456789abcdef0000003', name: 'Sarah (Starlight)', email: 'staff@starlight.com', role: 'STAFF', wallet_balance: 5000.00, assignedTheatreId: 'theatre_starlight_2' },
    { id: '67123456789abcdef0000004', name: 'Vikram (Apex IMAX)', email: 'staff@apexcine.com', role: 'STAFF', wallet_balance: 5000.00, assignedTheatreId: 'theatre_apexcine_3' },
    { id: '67123456789abcdef0000005', name: 'Ananya (Regal Crown)', email: 'staff@regalcrown.com', role: 'STAFF', wallet_balance: 5000.00, assignedTheatreId: 'theatre_regalcrown_4' },
    { id: '67123456789abcdef0000006', name: 'Rahul Sharma', email: 'rahul@example.com', role: 'CUSTOMER', wallet_balance: 2000.00 },
    { id: '67123456789abcdef0000007', name: 'Priya Patel', email: 'priya@example.com', role: 'CUSTOMER', wallet_balance: 2000.00 },
    { id: '67123456789abcdef0000008', name: 'Alex Vance', email: 'alex@example.com', role: 'CUSTOMER', wallet_balance: 2000.00 },
];

/**
 * Middleware that validates the JWT authentication token.
 * Extracts from Authorization: Bearer <token> or query parameter.
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
        let user = null;

        if (isDBConnected()) {
            try {
                user = await User.findById(decoded.id);
            } catch {
                user = null;
            }
        }

        // If user document found in database
        if (user) {
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
            return next();
        }

        // Resilient fallback for demo accounts
        const demo = DEMO_USERS.find(d => d.id === decoded.id || d.email === decoded.email);
        if (demo) {
            req.user = {
                id: demo.id,
                _id: demo.id,
                name: demo.name,
                email: demo.email,
                role: demo.role,
                status: 'ACTIVE',
                wallet_balance: demo.wallet_balance,
                assignedTheatreId: demo.assignedTheatreId || null,
            };
            return next();
        }

        // Resilient fallback for guest / in-memory tokens
        if (decoded.id && (String(decoded.id).startsWith('guest_') || String(decoded.id).startsWith('mem_') || decoded.role)) {
            req.user = {
                id: decoded.id,
                _id: decoded.id,
                name: decoded.name || `User (${decoded.role})`,
                email: decoded.email || `${decoded.id}@cinemoments.internal`,
                role: decoded.role || 'CUSTOMER',
                status: 'ACTIVE',
                wallet_balance: 2000.00,
            };
            return next();
        }

        res.status(401).json({ success: false, message: 'User account no longer exists.' });
    } catch (error) {
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
