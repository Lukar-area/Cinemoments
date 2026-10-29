import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Theatre from '../models/Theatre.js';
import TheatreStaff from '../models/TheatreStaff.js';
import { config } from '../config/index.js';
import { recordAuditLog } from '../services/auditService.js';
import { generateCaptcha, verifyCaptcha } from '../services/captchaService.js';
import { isDBConnected } from '../db/database.js';

// Pre-seeded demo user definitions for instantaneous fallback when MongoDB Atlas / local mongod is offline
const DEMO_USERS_MAP = new Map([
    ['admin@cinemoments.com', {
        id: '67123456789abcdef0000001',
        name: 'Super Admin',
        email: 'admin@cinemoments.com',
        role: 'ADMIN',
        wallet_balance: 10000.00,
        assignedTheatreId: null,
    }],
    ['staff@grandcinema.com', {
        id: '67123456789abcdef0000002',
        name: 'John (Grand Palace)',
        email: 'staff@grandcinema.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_grand_palace_1',
    }],
    ['staff@starlight.com', {
        id: '67123456789abcdef0000003',
        name: 'Sarah (Starlight)',
        email: 'staff@starlight.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_starlight_2',
    }],
    ['staff@apexcine.com', {
        id: '67123456789abcdef0000004',
        name: 'Vikram (Apex IMAX)',
        email: 'staff@apexcine.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_apexcine_3',
    }],
    ['staff@regalcrown.com', {
        id: '67123456789abcdef0000005',
        name: 'Ananya (Regal Crown)',
        email: 'staff@regalcrown.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_regalcrown_4',
    }],
    ['rahul@example.com', {
        id: '67123456789abcdef0000006',
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        role: 'CUSTOMER',
        wallet_balance: 2000.00,
        assignedTheatreId: null,
    }],
    ['priya@example.com', {
        id: '67123456789abcdef0000007',
        name: 'Priya Patel',
        email: 'priya@example.com',
        role: 'CUSTOMER',
        wallet_balance: 2000.00,
        assignedTheatreId: null,
    }],
    ['alex@example.com', {
        id: '67123456789abcdef0000008',
        name: 'Alex Vance',
        email: 'alex@example.com',
        role: 'CUSTOMER',
        wallet_balance: 2000.00,
        assignedTheatreId: null,
    }],
]);

// Dynamic in-memory user registry for offline/testing registration
const inMemoryUsers = new Map();

export async function getCaptcha(req, res, next) {
    try {
        const captcha = generateCaptcha();
        res.json({
            success: true,
            captchaToken: captcha.token,
            captchaSvg: captcha.svg,
        });
    } catch (error) {
        next(error);
    }
}

export async function register(req, res, next) {
    try {
        const { name, email, phone, password, role = 'CUSTOMER' } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const userRole = role === 'STAFF' ? 'STAFF' : 'CUSTOMER';
        const passwordHash = await bcrypt.hash(password, 10);

        if (isDBConnected()) {
            const existing = await User.findOne({ email: normalizedEmail });
            if (existing) {
                res.status(409).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }

            const newUser = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                phone: phone || null,
                password_hash: passwordHash,
                role: userRole,
                status: 'ACTIVE',
                wallet_balance: 2000.00,
            });

            const newUserId = newUser._id.toString();
            const token = jwt.sign({ id: newUserId, role: userRole }, config.jwtSecret, { expiresIn: '7d' });

            await recordAuditLog({
                userId: newUserId,
                action: 'USER_REGISTER',
                entityType: 'user',
                entityId: newUserId,
                ipAddress: req.ip,
            });

            res.status(201).json({
                success: true,
                message: 'Account registered successfully. Received ₹2,000 demo wallet balance!',
                token,
                user: {
                    id: newUserId,
                    name: newUser.name,
                    email: newUser.email,
                    role: userRole,
                    wallet_balance: 2000.00,
                },
            });
        } else {
            // Offline / fallback registration
            if (DEMO_USERS_MAP.has(normalizedEmail) || inMemoryUsers.has(normalizedEmail)) {
                res.status(409).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }

            const inMemId = `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const userObj = {
                id: inMemId,
                name: name.trim(),
                email: normalizedEmail,
                phone: phone || null,
                password_hash: passwordHash,
                role: userRole,
                status: 'ACTIVE',
                wallet_balance: 2000.00,
            };
            inMemoryUsers.set(normalizedEmail, userObj);

            const token = jwt.sign({ id: inMemId, role: userRole }, config.jwtSecret, { expiresIn: '7d' });

            res.status(201).json({
                success: true,
                message: 'Account registered successfully. Received ₹2,000 demo wallet balance!',
                token,
                user: {
                    id: inMemId,
                    name: userObj.name,
                    email: userObj.email,
                    role: userRole,
                    wallet_balance: 2000.00,
                },
            });
        }
    } catch (error) {
        next(error);
    }
}

export async function guestLogin(req, res, next) {
    try {
        const guestId = Math.floor(1000 + Math.random() * 9000);
        const guestName = `Guest User #${guestId}`;
        const guestEmail = `guest_${Date.now()}_${guestId}@cinemoments.internal`;
        const tempPasswordHash = await bcrypt.hash(`GuestPass_${Date.now()}!`, 10);

        if (isDBConnected()) {
            const newUser = await User.create({
                name: guestName,
                email: guestEmail,
                phone: null,
                password_hash: tempPasswordHash,
                role: 'CUSTOMER',
                status: 'ACTIVE',
                wallet_balance: 2000.00,
            });

            const newUserId = newUser._id.toString();
            const token = jwt.sign({ id: newUserId, role: 'CUSTOMER' }, config.jwtSecret, { expiresIn: '7d' });

            await recordAuditLog({
                userId: newUserId,
                action: 'GUEST_LOGIN',
                entityType: 'user',
                entityId: newUserId,
                ipAddress: req.ip,
            });

            res.status(200).json({
                success: true,
                message: 'Logged in as Guest! Credited ₹2,000 fake balance for transactions.',
                token,
                user: {
                    id: newUserId,
                    name: guestName,
                    email: guestEmail,
                    role: 'CUSTOMER',
                    wallet_balance: 2000.00,
                },
            });
        } else {
            // Fast in-memory guest session fallback
            const memGuestId = `guest_${Date.now()}_${guestId}`;
            const token = jwt.sign({ id: memGuestId, role: 'CUSTOMER' }, config.jwtSecret, { expiresIn: '7d' });

            res.status(200).json({
                success: true,
                message: 'Logged in as Guest! Credited ₹2,000 demo balance for transactions.',
                token,
                user: {
                    id: memGuestId,
                    name: guestName,
                    email: guestEmail,
                    role: 'CUSTOMER',
                    wallet_balance: 2000.00,
                },
            });
        }
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password, captchaToken, captchaSolution } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const isDemoUser = DEMO_USERS_MAP.has(normalizedEmail);
        const isTestEnv = process.env.NODE_ENV === 'test';

        // CAPTCHA verification:
        // Enforced for non-demo users outside testing mode.
        // For demo users, CAPTCHA is optional unless a solution was submitted.
        if (!isTestEnv && !isDemoUser) {
            if (!captchaToken || !captchaSolution) {
                res.status(400).json({
                    success: false,
                    message: 'CAPTCHA security verification is required. Please enter the characters shown in the image.',
                });
                return;
            }
            const isCaptchaValid = verifyCaptcha(captchaToken, captchaSolution);
            if (!isCaptchaValid) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired CAPTCHA code. Please click refresh and try again.',
                });
                return;
            }
        } else if (captchaSolution && captchaToken) {
            const isCaptchaValid = verifyCaptcha(captchaToken, captchaSolution);
            if (!isCaptchaValid) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid or expired CAPTCHA code. Please click refresh and try again.',
                });
                return;
            }
        }

        // If database is connected, authenticate against MongoDB
        if (isDBConnected()) {
            const user = await User.findOne({ email: normalizedEmail });

            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }
            if (user.status !== 'ACTIVE') {
                res.status(403).json({ success: false, message: 'Your account is suspended or inactive.' });
                return;
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }

            const userId = user._id.toString();
            const token = jwt.sign({ id: userId, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

            await recordAuditLog({
                userId: userId,
                action: 'USER_LOGIN',
                entityType: 'user',
                entityId: userId,
                ipAddress: req.ip,
            });

            let assignedTheatreId = null;
            if (user.role === 'STAFF') {
                const staffRow = await TheatreStaff.findOne({ user_id: user._id });
                if (staffRow) {
                    assignedTheatreId = staffRow.theatre_id.toString();
                } else {
                    const ownerRow = await Theatre.findOne({ owner_id: user._id });
                    if (ownerRow) {
                        assignedTheatreId = ownerRow._id.toString();
                    }
                }
            }

            res.json({
                success: true,
                message: 'Logged in successfully.',
                token,
                user: {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    wallet_balance: Number(user.wallet_balance || 0),
                    assignedTheatreId,
                },
            });
            return;
        }

        // Offline / Fallback Authentication (when MongoDB is not connected)
        let resolvedUser = null;

        if (DEMO_USERS_MAP.has(normalizedEmail)) {
            // Standard demo password verification
            if (password === 'Password123!') {
                resolvedUser = DEMO_USERS_MAP.get(normalizedEmail);
            }
        } else if (inMemoryUsers.has(normalizedEmail)) {
            const memUser = inMemoryUsers.get(normalizedEmail);
            const isMatch = await bcrypt.compare(password, memUser.password_hash);
            if (isMatch) {
                resolvedUser = memUser;
            }
        }

        if (!resolvedUser) {
            res.status(401).json({ success: false, message: 'Invalid email or password.' });
            return;
        }

        const token = jwt.sign({ id: resolvedUser.id, role: resolvedUser.role }, config.jwtSecret, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Logged in successfully.',
            token,
            user: {
                id: resolvedUser.id,
                name: resolvedUser.name,
                email: resolvedUser.email,
                role: resolvedUser.role,
                wallet_balance: Number(resolvedUser.wallet_balance || 0),
                assignedTheatreId: resolvedUser.assignedTheatreId || null,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getCurrentUser(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated.' });
        return;
    }

    try {
        if (isDBConnected()) {
            const freshUser = await User.findById(req.user.id);

            let assignedTheatreId = null;
            if (req.user.role === 'STAFF') {
                const staffRow = await TheatreStaff.findOne({ user_id: req.user.id });
                if (staffRow) {
                    assignedTheatreId = staffRow.theatre_id.toString();
                } else {
                    const ownerRow = await Theatre.findOne({ owner_id: req.user.id });
                    if (ownerRow) {
                        assignedTheatreId = ownerRow._id.toString();
                    }
                }
            }

            res.json({
                success: true,
                user: {
                    ...req.user,
                    wallet_balance: freshUser ? Number(freshUser.wallet_balance || 0) : Number(req.user.wallet_balance || 0),
                    assignedTheatreId,
                },
            });
            return;
        }

        // Offline / in-memory fallback
        let userDetails = { ...req.user };
        for (const demo of DEMO_USERS_MAP.values()) {
            if (demo.id === req.user.id) {
                userDetails = { ...demo };
                break;
            }
        }

        res.json({
            success: true,
            user: {
                ...userDetails,
                wallet_balance: Number(userDetails.wallet_balance || 2000.00),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving user details.' });
    }
}
