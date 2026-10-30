import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import User from '../models/User.js';
import { isDBConnected } from '../db/database.js';
import { getInMemoryUserById } from '../controllers/authController.js';

const DEMO_USERS = [
    { id: '67123456789abcdef0000001', email: 'admin@cinemoments.com', role: 'ADMIN', name: 'Super Admin', wallet_balance: 10000.00, assignedTheatreId: null },
    { id: '67123456789abcdef0000002', email: 'staff@grandcinema.com', role: 'STAFF', name: 'John (Grand Palace)', wallet_balance: 5000.00, assignedTheatreId: 'theatre_grand_palace_1' },
    { id: '67123456789abcdef0000003', email: 'staff@starlight.com', role: 'STAFF', name: 'Sarah (Starlight)', wallet_balance: 5000.00, assignedTheatreId: 'theatre_starlight_2' },
    { id: '67123456789abcdef0000004', email: 'staff@apexcine.com', role: 'STAFF', name: 'Vikram (Apex IMAX)', wallet_balance: 5000.00, assignedTheatreId: 'theatre_apexcine_3' },
    { id: '67123456789abcdef0000005', email: 'staff@regalcrown.com', role: 'STAFF', name: 'Ananya (Regal Crown)', wallet_balance: 5000.00, assignedTheatreId: 'theatre_regalcrown_4' },
    { id: '67123456789abcdef0000006', email: 'rahul@example.com', role: 'CUSTOMER', name: 'Rahul Sharma', wallet_balance: 2000.00, assignedTheatreId: null },
    { id: '67123456789abcdef0000007', email: 'priya@example.com', role: 'CUSTOMER', name: 'Priya Patel', wallet_balance: 2000.00, assignedTheatreId: null },
    { id: '67123456789abcdef0000008', email: 'alex@example.com', role: 'CUSTOMER', name: 'Alex Vance', wallet_balance: 2000.00, assignedTheatreId: null },
];

/**
 * Authentication middleware that verifies JWT and attaches user to request.
 * Supports token extraction from Authorization header or 'token' query param.
 */
export async function authenticate(req, res, next) {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
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
                theatre_id: user.theatre_id ? user.theatre_id.toString() : null,
                assignedTheatreId: user.theatre_id ? user.theatre_id.toString() : null,
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
                theatre_id: demo.assignedTheatreId || null,
                assignedTheatreId: demo.assignedTheatreId || null,
            };
            return next();
        }

        // Resilient fallback for guest / in-memory tokens
        if (decoded.id && (String(decoded.id).startsWith('guest_') || String(decoded.id).startsWith('mem_') || decoded.role)) {
            const inMemUser = getInMemoryUserById(decoded.id);
            req.user = {
                id: decoded.id,
                _id: decoded.id,
                name: inMemUser?.name || decoded.name || `User (${decoded.role})`,
                email: inMemUser?.email || decoded.email || `${decoded.id}@cinemoments.internal`,
                role: inMemUser?.role || decoded.role || 'CUSTOMER',
                status: 'ACTIVE',
                wallet_balance: inMemUser?.wallet_balance || 2000.00,
                theatre_id: inMemUser?.theatre_id || null,
                assignedTheatreId: inMemUser?.assignedTheatreId || null,
                theatre: inMemUser?.theatre || null,
                assignedTheatres: inMemUser?.assignedTheatres || [],
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
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. Please log in.',
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Access forbidden: ${req.user.role} role does not have permission to perform this action.`,
            });
            return;
        }

        next();
    };
}
