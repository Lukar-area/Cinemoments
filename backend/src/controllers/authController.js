import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Theatre from '../models/Theatre.js';
import TheatreStaff from '../models/TheatreStaff.js';
import { config } from '../config/index.js';
import { recordAuditLog } from '../services/auditService.js';
import { generateCaptcha, verifyCaptcha } from '../services/captchaService.js';
import { isDBConnected } from '../db/database.js';
import { getAuthorizedTheatresForUser } from '../services/theatreAuthService.js';

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
        theatre: {
            id: 'theatre_grand_palace_1',
            name: 'Grand Palace Cinema',
            location: 'Downtown Arts District',
            address: '450 Heritage Blvd',
            city: 'Mumbai',
            contact_phone: '+91 22 2845 1100',
            contact_email: 'info@grandpalacecinema.com',
        },
    }],
    ['staff@starlight.com', {
        id: '67123456789abcdef0000003',
        name: 'Sarah (Starlight)',
        email: 'staff@starlight.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_starlight_2',
        theatre: {
            id: 'theatre_starlight_2',
            name: 'Starlight Multiplex',
            location: 'Westside Promenade',
            address: '780 Boulevard Walk',
            city: 'Delhi',
            contact_phone: '+91 11 4150 9922',
            contact_email: 'contact@starlightmultiplex.com',
        },
    }],
    ['staff@apexcine.com', {
        id: '67123456789abcdef0000004',
        name: 'Vikram (Apex IMAX)',
        email: 'staff@apexcine.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_apexcine_3',
        theatre: {
            id: 'theatre_apexcine_3',
            name: 'Apex Cineplex & IMAX',
            location: 'Tech Corridor',
            address: '1200 Innovation Way',
            city: 'Bengaluru',
            contact_phone: '+91 80 6720 4455',
            contact_email: 'desk@apexcine.com',
        },
    }],
    ['staff@regalcrown.com', {
        id: '67123456789abcdef0000005',
        name: 'Ananya (Regal Crown)',
        email: 'staff@regalcrown.com',
        role: 'STAFF',
        wallet_balance: 5000.00,
        assignedTheatreId: 'theatre_regalcrown_4',
        theatre: {
            id: 'theatre_regalcrown_4',
            name: 'Regal Crown Cinema',
            location: 'Marine Plaza Waterfront',
            address: '102 Royal Palm Drive',
            city: 'Mumbai',
            contact_phone: '+91 22 6677 8899',
            contact_email: 'support@regalcrown.com',
        },
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

// Dynamic in-memory user & theatre registries for offline/testing registration
const inMemoryUsers = new Map();
const inMemoryTheatres = new Map();

export function getInMemoryUserById(id) {
    if (!id) return null;
    for (const u of inMemoryUsers.values()) {
        if (u.id === id) return u;
    }
    for (const d of DEMO_USERS_MAP.values()) {
        if (d.id === id) return d;
    }
    return null;
}

export function updateUserWalletBalance(id, newBalance) {
    if (!id) return false;
    for (const u of inMemoryUsers.values()) {
        if (u.id === id) {
            u.wallet_balance = newBalance;
            return true;
        }
    }
    for (const d of DEMO_USERS_MAP.values()) {
        if (d.id === id) {
            d.wallet_balance = newBalance;
            return true;
        }
    }
    return false;
}

export function getAllInMemoryAndDemoUsers() {
    const list = [];
    const seenIds = new Set();

    for (const d of DEMO_USERS_MAP.values()) {
        if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            list.push({
                id: d.id,
                name: d.name,
                email: d.email,
                phone: d.phone || null,
                role: d.role,
                status: d.status || 'ACTIVE',
                wallet_balance: Number(d.wallet_balance || 0),
                created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
    }

    for (const u of inMemoryUsers.values()) {
        if (!seenIds.has(u.id)) {
            seenIds.add(u.id);
            list.push({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone || null,
                role: u.role,
                status: u.status || 'ACTIVE',
                wallet_balance: Number(u.wallet_balance || 0),
                created_at: u.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
    }

    return list;
}

export function updateInMemoryUserStatusOrRole(id, { role, status }) {
    if (!id) return false;
    for (const u of inMemoryUsers.values()) {
        if (u.id === id) {
            if (role) u.role = role;
            if (status) u.status = status;
            return true;
        }
    }
    for (const d of DEMO_USERS_MAP.values()) {
        if (d.id === id) {
            if (role) d.role = role;
            if (status) d.status = status;
            return true;
        }
    }
    return false;
}

export function getInMemoryTheatreById(id) {
    for (const t of inMemoryTheatres.values()) {
        if (t.id === id) return t;
    }
    return null;
}

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
        const {
            name,
            email,
            phone,
            password,
            confirmPassword,
            role = 'CUSTOMER',
            theatreName,
            theatreLocation,
            theatreAddress,
            city,
            theatrePhone,
            theatreEmail,
        } = req.body;

        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.toLowerCase().trim();
        if (!emailRegex.test(normalizedEmail)) {
            res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
            return;
        }

        if (confirmPassword && confirmPassword !== password) {
            res.status(400).json({ success: false, message: 'Passwords do not match.' });
            return;
        }

        const userRole = role === 'STAFF' ? 'STAFF' : 'CUSTOMER';

        // Additional validations for THEATRE STAFF registration
        let tName = '';
        let tLoc = '';
        let tAddr = '';
        let tCity = '';
        let tPhone = '';
        let tEmail = '';

        if (userRole === 'STAFF') {
            tName = (theatreName || req.body.theatre_name || '').trim();
            tLoc = (theatreLocation || req.body.theatre_location || '').trim();
            tAddr = (theatreAddress || req.body.theatre_address || '').trim();
            tCity = (city || req.body.theatre_city || '').trim();
            tPhone = (theatrePhone || req.body.theatre_phone || req.body.theatreContactNumber || req.body.contact_phone || '').trim();
            tEmail = (theatreEmail || req.body.theatre_email || req.body.theatreEmailAddress || req.body.contact_email || '').trim().toLowerCase();

            if (!phone || !phone.trim()) {
                res.status(400).json({ success: false, message: 'Staff phone number is required.' });
                return;
            }

            if (!tName || !tLoc || !tAddr || !tCity || !tPhone || !tEmail) {
                res.status(400).json({
                    success: false,
                    message: 'All theatre details (Theatre Name, Location, Address, City, Contact Number, and Email Address) are required.',
                });
                return;
            }

            if (!emailRegex.test(tEmail)) {
                res.status(400).json({ success: false, message: 'Please provide a valid theatre email address.' });
                return;
            }
        }

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
                phone: phone ? phone.trim() : null,
                password_hash: passwordHash,
                role: userRole,
                status: 'ACTIVE',
                wallet_balance: 2000.00,
            });

            const newUserId = newUser._id.toString();
            let targetTheatre = null;

            if (userRole === 'STAFF') {
                // Check if a theatre with the same name and address already exists (case-insensitive)
                const escapedName = tName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const escapedAddr = tAddr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const existingTheatre = await Theatre.findOne({
                    name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
                    address: { $regex: new RegExp(`^${escapedAddr}$`, 'i') },
                });

                if (existingTheatre) {
                    // Staff joins the existing theatre!
                    targetTheatre = existingTheatre;

                    // Update contact information if not set
                    let updated = false;
                    if (!targetTheatre.contact_phone && tPhone) {
                        targetTheatre.contact_phone = tPhone;
                        targetTheatre.phone = tPhone;
                        updated = true;
                    }
                    if (!targetTheatre.contact_email && tEmail) {
                        targetTheatre.contact_email = tEmail;
                        targetTheatre.email = tEmail;
                        updated = true;
                    }
                    if (updated) await targetTheatre.save();
                } else {
                    // Create new theatre record with registering staff as initial owner
                    targetTheatre = await Theatre.create({
                        name: tName,
                        location: tLoc,
                        address: tAddr,
                        city: tCity,
                        contact_phone: tPhone,
                        contact_email: tEmail,
                        phone: tPhone,
                        email: tEmail,
                        owner_id: newUser._id,
                        status: 'ACTIVE',
                    });
                }

                // Associate user with theatre in User model
                newUser.theatre_id = targetTheatre._id;
                await newUser.save();

                // Create or update TheatreStaff mapping record
                await TheatreStaff.findOneAndUpdate(
                    { theatre_id: targetTheatre._id, user_id: newUser._id },
                    { theatre_id: targetTheatre._id, user_id: newUser._id },
                    { upsert: true, new: true }
                );
            }

            const token = jwt.sign({ id: newUserId, role: userRole }, config.jwtSecret, { expiresIn: '7d' });

            await recordAuditLog({
                userId: newUserId,
                action: 'USER_REGISTER',
                entityType: 'user',
                entityId: newUserId,
                ipAddress: req.ip,
                details: { role: userRole, theatreId: targetTheatre ? targetTheatre._id.toString() : null },
            });

            const formattedTheatre = targetTheatre ? {
                id: targetTheatre._id.toString(),
                name: targetTheatre.name,
                location: targetTheatre.location,
                address: targetTheatre.address,
                city: targetTheatre.city,
                contact_phone: targetTheatre.contact_phone || targetTheatre.phone || null,
                contact_email: targetTheatre.contact_email || targetTheatre.email || null,
            } : null;

            res.status(201).json({
                success: true,
                message: userRole === 'STAFF'
                    ? `Theatre Staff account registered successfully and linked to ${targetTheatre.name}.`
                    : 'Account registered successfully. Received ₹2,000 demo wallet balance!',
                token,
                user: {
                    id: newUserId,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: userRole,
                    wallet_balance: 2000.00,
                    theatre_id: targetTheatre ? targetTheatre._id.toString() : null,
                    assignedTheatreId: targetTheatre ? targetTheatre._id.toString() : null,
                    theatre: formattedTheatre,
                    assignedTheatres: formattedTheatre ? [formattedTheatre] : [],
                },
            });
        } else {
            // Offline / fallback registration
            if (DEMO_USERS_MAP.has(normalizedEmail) || inMemoryUsers.has(normalizedEmail)) {
                res.status(409).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }

            const inMemId = `mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            let memTheatre = null;

            if (userRole === 'STAFF') {
                const theatreKey = `${tName.toLowerCase()}_${tAddr.toLowerCase()}`;
                if (inMemoryTheatres.has(theatreKey)) {
                    memTheatre = inMemoryTheatres.get(theatreKey);
                } else {
                    memTheatre = {
                        id: `theatre_mem_${Date.now()}`,
                        name: tName,
                        location: tLoc,
                        address: tAddr,
                        city: tCity,
                        contact_phone: tPhone,
                        contact_email: tEmail,
                    };
                    inMemoryTheatres.set(theatreKey, memTheatre);
                }
            }

            const userObj = {
                id: inMemId,
                name: name.trim(),
                email: normalizedEmail,
                phone: phone ? phone.trim() : null,
                password_hash: passwordHash,
                role: userRole,
                status: 'ACTIVE',
                wallet_balance: 2000.00,
                theatre_id: memTheatre ? memTheatre.id : null,
                assignedTheatreId: memTheatre ? memTheatre.id : null,
                theatre: memTheatre,
                assignedTheatres: memTheatre ? [memTheatre] : [],
            };
            inMemoryUsers.set(normalizedEmail, userObj);

            const token = jwt.sign({ id: inMemId, role: userRole }, config.jwtSecret, { expiresIn: '7d' });

            res.status(201).json({
                success: true,
                message: userRole === 'STAFF'
                    ? `Theatre Staff account registered successfully and linked to ${memTheatre.name}.`
                    : 'Account registered successfully. Received ₹2,000 demo wallet balance!',
                token,
                user: {
                    id: inMemId,
                    name: userObj.name,
                    email: userObj.email,
                    phone: userObj.phone,
                    role: userRole,
                    wallet_balance: 2000.00,
                    theatre_id: memTheatre ? memTheatre.id : null,
                    assignedTheatreId: memTheatre ? memTheatre.id : null,
                    theatre: memTheatre,
                    assignedTheatres: memTheatre ? [memTheatre] : [],
                },
            });
        }
    } catch (error) {
        next(error);
    }
}

export async function guestLogin(req, res, next) {
    try {
        const guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const guestUser = {
            id: guestId,
            name: 'Guest Director',
            email: `${guestId}@cinemoments.guest`,
            role: 'CUSTOMER',
            wallet_balance: 2000.00,
        };

        const token = jwt.sign(
            { id: guestId, role: 'CUSTOMER', isGuest: true },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Guest session initialized with ₹2,000 demo balance.',
            token,
            user: guestUser,
        });
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

            // Retrieve authorized theatres for this user
            const authorizedTheatres = await getAuthorizedTheatresForUser(user);
            const formattedTheatres = authorizedTheatres.map(t => ({
                id: t._id ? t._id.toString() : t.id,
                name: t.name,
                location: t.location,
                address: t.address,
                city: t.city,
                contact_phone: t.contact_phone || t.phone || null,
                contact_email: t.contact_email || t.email || null,
            }));

            const primaryTheatre = formattedTheatres[0] || null;
            const assignedTheatreId = primaryTheatre ? primaryTheatre.id : null;

            res.json({
                success: true,
                message: 'Logged in successfully.',
                token,
                user: {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    wallet_balance: Number(user.wallet_balance || 0),
                    theatre_id: assignedTheatreId,
                    assignedTheatreId,
                    theatre: primaryTheatre,
                    assignedTheatres: formattedTheatres,
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
                phone: resolvedUser.phone || null,
                role: resolvedUser.role,
                wallet_balance: Number(resolvedUser.wallet_balance || 0),
                theatre_id: resolvedUser.assignedTheatreId || null,
                assignedTheatreId: resolvedUser.assignedTheatreId || null,
                theatre: resolvedUser.theatre || null,
                assignedTheatres: resolvedUser.assignedTheatres || (resolvedUser.theatre ? [resolvedUser.theatre] : []),
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
            if (!freshUser) {
                res.status(404).json({ success: false, message: 'User not found.' });
                return;
            }

            const authorizedTheatres = await getAuthorizedTheatresForUser(freshUser);
            const formattedTheatres = authorizedTheatres.map(t => ({
                id: t._id ? t._id.toString() : t.id,
                name: t.name,
                location: t.location,
                address: t.address,
                city: t.city,
                contact_phone: t.contact_phone || t.phone || null,
                contact_email: t.contact_email || t.email || null,
            }));

            const primaryTheatre = formattedTheatres[0] || null;
            const assignedTheatreId = primaryTheatre ? primaryTheatre.id : null;

            res.json({
                success: true,
                user: {
                    id: freshUser._id.toString(),
                    name: freshUser.name,
                    email: freshUser.email,
                    phone: freshUser.phone,
                    role: freshUser.role,
                    wallet_balance: Number(freshUser.wallet_balance || 0),
                    theatre_id: assignedTheatreId,
                    assignedTheatreId,
                    theatre: primaryTheatre,
                    assignedTheatres: formattedTheatres,
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
