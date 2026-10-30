import Theatre from '../models/Theatre.js';
import TheatreStaff from '../models/TheatreStaff.js';
import User from '../models/User.js';
import { isDBConnected } from '../db/database.js';
import { getInMemoryUserById, getInMemoryTheatreById } from '../controllers/authController.js';

const FALLBACK_DEMO_THEATRES = new Map([
    ['theatre_grand_palace_1', {
        id: 'theatre_grand_palace_1',
        name: 'Grand Palace Cinema',
        location: 'Downtown Arts District',
        address: '450 Heritage Blvd',
        city: 'Mumbai',
        contact_phone: '+91 22 2845 1100',
        contact_email: 'info@grandpalacecinema.com',
        status: 'ACTIVE',
    }],
    ['theatre_starlight_2', {
        id: 'theatre_starlight_2',
        name: 'Starlight Multiplex',
        location: 'Westside Promenade',
        address: '780 Boulevard Walk',
        city: 'Delhi',
        contact_phone: '+91 11 4150 9922',
        contact_email: 'contact@starlightmultiplex.com',
        status: 'ACTIVE',
    }],
    ['theatre_apexcine_3', {
        id: 'theatre_apexcine_3',
        name: 'Apex Cineplex & IMAX',
        location: 'Tech Corridor',
        address: '1200 Innovation Way',
        city: 'Bengaluru',
        contact_phone: '+91 80 6720 4455',
        contact_email: 'desk@apexcine.com',
        status: 'ACTIVE',
    }],
    ['theatre_regalcrown_4', {
        id: 'theatre_regalcrown_4',
        name: 'Regal Crown Cinema',
        location: 'Marine Plaza Waterfront',
        address: '102 Royal Palm Drive',
        city: 'Mumbai',
        contact_phone: '+91 22 6677 8899',
        contact_email: 'support@regalcrown.com',
        status: 'ACTIVE',
    }],
]);

/**
 * Retrieves all theatres a user is authorized to manage.
 * ADMIN has access to all active theatres.
 * STAFF has access to theatres where they are an owner, assigned in TheatreStaff, or have direct user.theatre_id.
 */
export async function getAuthorizedTheatresForUser(user) {
    if (!user) return [];

    if (user.role === 'ADMIN') {
        if (isDBConnected()) {
            return await Theatre.find({ status: 'ACTIVE' }).sort({ name: 1 });
        }
        return Array.from(FALLBACK_DEMO_THEATRES.values());
    }

    if (user.role !== 'STAFF') {
        return [];
    }

    const userIdStr = user.id || user._id?.toString();
    const theatreMap = new Map();

    if (isDBConnected()) {
        try {
            // 1. Check TheatreStaff mapping table
            const staffRows = await TheatreStaff.find({ user_id: userIdStr }).populate('theatre_id');
            for (const row of staffRows) {
                if (row.theatre_id && row.theatre_id.status === 'ACTIVE') {
                    theatreMap.set(row.theatre_id._id.toString(), row.theatre_id);
                }
            }

            // 2. Check Theatre owner_id
            const ownedRows = await Theatre.find({ owner_id: userIdStr, status: 'ACTIVE' });
            for (const t of ownedRows) {
                theatreMap.set(t._id.toString(), t);
            }

            // 3. Check direct user.theatre_id
            const userDoc = await User.findById(userIdStr);
            if (userDoc?.theatre_id) {
                const directTheatre = await Theatre.findOne({ _id: userDoc.theatre_id, status: 'ACTIVE' });
                if (directTheatre) {
                    theatreMap.set(directTheatre._id.toString(), directTheatre);
                }
            }
        } catch (err) {
            console.error('Error fetching authorized theatres:', err.message);
        }
    }

    // Offline / in-memory / fallback resilience
    if (theatreMap.size === 0) {
        const inMemUser = getInMemoryUserById(userIdStr);
        const resolvedTheatres = user.assignedTheatres || inMemUser?.assignedTheatres;
        const resolvedTheatre = user.theatre || inMemUser?.theatre;
        const resolvedTheatreId = user.assignedTheatreId || user.theatre_id || inMemUser?.assignedTheatreId || inMemUser?.theatre_id;

        if (resolvedTheatres && Array.isArray(resolvedTheatres) && resolvedTheatres.length > 0) {
            for (const t of resolvedTheatres) {
                const id = t._id ? t._id.toString() : t.id;
                theatreMap.set(id, t);
            }
        } else if (resolvedTheatre) {
            const id = resolvedTheatre._id ? resolvedTheatre._id.toString() : resolvedTheatre.id;
            theatreMap.set(id, resolvedTheatre);
        } else if (resolvedTheatreId) {
            if (FALLBACK_DEMO_THEATRES.has(resolvedTheatreId)) {
                theatreMap.set(resolvedTheatreId, FALLBACK_DEMO_THEATRES.get(resolvedTheatreId));
            } else {
                const memT = getInMemoryTheatreById(resolvedTheatreId);
                if (memT) {
                    theatreMap.set(memT.id, memT);
                }
            }
        }
    }

    return Array.from(theatreMap.values());
}

/**
 * Returns array of theatre ID strings for an authenticated user.
 */
export async function getAuthorizedTheatreIdsForUser(user) {
    if (!user) return [];
    if (user.role === 'ADMIN') {
        if (isDBConnected()) {
            const all = await Theatre.find({ status: 'ACTIVE' }).select('_id');
            return all.map(t => t._id.toString());
        }
        return Array.from(FALLBACK_DEMO_THEATRES.keys());
    }
    const theatres = await getAuthorizedTheatresForUser(user);
    return theatres.map(t => t._id ? t._id.toString() : t.id);
}

/**
 * Validates whether the authenticated user is authorized to manage the specified theatre.
 */
export async function isUserAuthorizedForTheatre(user, theatreId) {
    if (!user || !theatreId) return false;
    if (user.role === 'ADMIN') return true;
    if (user.role !== 'STAFF') return false;

    const targetIdStr = theatreId.toString();
    const authorizedIds = await getAuthorizedTheatreIdsForUser(user);
    return authorizedIds.includes(targetIdStr);
}
