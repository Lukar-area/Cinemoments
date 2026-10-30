import mongoose from 'mongoose';
import Theatre from '../models/Theatre.js';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import IntervalBooking from '../models/IntervalBooking.js';
import TheatreStaff from '../models/TheatreStaff.js';
import User from '../models/User.js';
import { isDBConnected } from '../db/database.js';
import { fallbackStore } from '../db/fallbackStore.js';
import { getAuthorizedTheatresForUser } from '../services/theatreAuthService.js';

function deriveTheatreFacilities(theatre, screens = []) {
    const facilities = new Set();
    facilities.add('4K Laser Digital Projection');
    facilities.add('Intermission Playout System');

    for (const s of screens) {
        if (s.screen_type === 'DOLBY') {
            facilities.add('Dolby Atmos 12-Channel Surround');
        } else if (s.screen_type === 'IMAX') {
            facilities.add('IMAX Dual Laser Giant Screen');
        } else if (s.screen_type === '4DX') {
            facilities.add('4DX Synchronized Motion Seats');
        } else if (s.screen_type === 'VIP') {
            facilities.add('VIP Motorized Leather Recliners');
        }
    }

    facilities.add('Air-Conditioned Acoustic Auditoriums');
    facilities.add('Dedicated Interval Projection Staff');
    return Array.from(facilities);
}

export async function getAllTheatres(req, res, next) {
    try {
        const activeOnly = req.query.activeSchedulesOnly === 'true' || req.query.hasActiveShows === 'true';

        if (!isDBConnected()) {
            const theatres = fallbackStore.getTheatres({ activeSchedulesOnly: activeOnly });
            res.json({ success: true, theatres });
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const theatres = await Theatre.find({ status: 'ACTIVE' }).sort({ name: 1 });

        // Get screens per theatre
        const allScreens = await Screen.find();
        const screenMap = {};
        for (const sc of allScreens) {
            const tId = sc.theatre_id.toString();
            if (!screenMap[tId]) screenMap[tId] = [];
            screenMap[tId].push(sc);
        }

        // Get active distinct movie and show counts per theatre
        const upcomingShows = await Show.find({ show_date: { $gte: todayStr }, status: 'SCHEDULED' })
            .populate('screen_id', 'theatre_id');

        const theatreMoviesMap = {};
        const theatreShowsMap = {};
        for (const show of upcomingShows) {
            if (show.screen_id && show.screen_id.theatre_id) {
                const tId = show.screen_id.theatre_id.toString();
                if (!theatreMoviesMap[tId]) {
                    theatreMoviesMap[tId] = new Set();
                    theatreShowsMap[tId] = 0;
                }
                theatreMoviesMap[tId].add(show.movie_id.toString());
                theatreShowsMap[tId]++;
            }
        }

        let formattedTheatres = theatres.map(t => {
            const json = t.toJSON();
            const idStr = t._id.toString();
            const tScreens = screenMap[idStr] || [];
            const activeMovies = theatreMoviesMap[idStr] ? theatreMoviesMap[idStr].size : 0;
            const activeShows = theatreShowsMap[idStr] || 0;

            json.screen_count = tScreens.length;
            json.active_movies_count = activeMovies;
            json.active_shows_count = activeShows;
            json.has_active_schedules = activeShows > 0;
            json.facilities = t.facilities && t.facilities.length > 0
                ? t.facilities
                : deriveTheatreFacilities(t, tScreens);
            return json;
        });

        if (activeOnly) {
            formattedTheatres = formattedTheatres.filter(t => t.has_active_schedules);
        }

        if (formattedTheatres.length === 0) {
            const fallbackTheatres = fallbackStore.getTheatres({ activeSchedulesOnly: activeOnly });
            if (fallbackTheatres.length > 0) {
                res.json({ success: true, theatres: fallbackTheatres });
                return;
            }
        }

        res.json({ success: true, theatres: formattedTheatres });
    } catch (error) {
        next(error);
    }
}

export async function getTheatreById(req, res, next) {
    try {
        const theatreId = req.params.id;

        if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(theatreId)) {
            const result = fallbackStore.getTheatreById(theatreId);
            if (result) {
                res.json({
                    success: true,
                    theatre: result.theatre,
                    screens: result.screens,
                    shows: result.shows,
                    movies: result.movies,
                });
                return;
            }
            if (!isDBConnected()) {
                res.status(404).json({ success: false, message: 'Theatre not found.' });
                return;
            }
        }

        const theatre = await Theatre.findById(theatreId);
        if (!theatre) {
            res.status(404).json({ success: false, message: 'Theatre not found.' });
            return;
        }

        const screens = await Screen.find({ theatre_id: theatreId }).sort({ name: 1 });
        const screenIds = screens.map(s => s._id);

        const todayStr = new Date().toISOString().split('T')[0];

        const shows = await Show.find({
            screen_id: { $in: screenIds },
            show_date: { $gte: todayStr },
            status: 'SCHEDULED'
        })
        .populate('movie_id')
        .populate('screen_id')
        .sort({ show_date: 1, start_time: 1 });

        const showIds = shows.map(s => s._id);

        // Booking status counts
        const acceptedBookings = await IntervalBooking.find({
            show_id: { $in: showIds },
            status: 'ACCEPTED'
        });
        const acceptedSet = new Set(acceptedBookings.map(b => b.show_id.toString()));

        const pendingBookings = await IntervalBooking.find({
            show_id: { $in: showIds },
            status: 'PENDING'
        });
        const pendingCountMap = {};
        for (const b of pendingBookings) {
            const sid = b.show_id.toString();
            pendingCountMap[sid] = (pendingCountMap[sid] || 0) + 1;
        }

        const formattedShows = shows.map(s => {
            const movie = s.movie_id;
            const screen = s.screen_id;
            const sid = s._id.toString();
            return {
                id: sid,
                show_date: s.show_date,
                start_time: s.start_time,
                end_time: s.end_time,
                interval_start: s.interval_start,
                interval_end: s.interval_end,
                price_estimate: s.price_estimate,
                show_status: s.status,
                movie_id: movie ? movie._id.toString() : null,
                movie_title: movie ? movie.title : '',
                movie_poster: movie ? movie.poster : '',
                duration: movie ? movie.duration : 0,
                language: movie ? movie.language : '',
                rating: movie ? movie.rating : '',
                genre: movie ? movie.genre : '',
                screen_id: screen ? screen._id.toString() : null,
                screen_name: screen ? screen.name : '',
                screen_type: screen ? screen.screen_type : 'STANDARD',
                is_interval_booked: acceptedSet.has(sid) ? 1 : 0,
                pending_requests_count: pendingCountMap[sid] || 0,
            };
        });

        // Collect distinct scheduled movies at this theatre
        const movieMap = new Map();
        for (const s of shows) {
            if (s.movie_id && !movieMap.has(s.movie_id._id.toString())) {
                const mJson = s.movie_id.toJSON();
                const count = formattedShows.filter(fs => fs.movie_id === mJson.id).length;
                movieMap.set(mJson.id, {
                    ...mJson,
                    upcoming_shows_count: count,
                });
            }
        }

        const theatreJson = theatre.toJSON();
        theatreJson.screen_count = screens.length;
        theatreJson.active_movies_count = movieMap.size;
        theatreJson.active_shows_count = formattedShows.length;
        theatreJson.has_active_schedules = formattedShows.length > 0;
        theatreJson.facilities = theatre.facilities && theatre.facilities.length > 0
            ? theatre.facilities
            : deriveTheatreFacilities(theatre, screens);

        res.json({
            success: true,
            theatre: theatreJson,
            screens: screens.map(s => s.toJSON()),
            shows: formattedShows,
            movies: Array.from(movieMap.values()),
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Retrieves the currently active theatre associated with the logged-in staff member.
 * Supports multi-theatre management and returns all authorized theatres for the staff user.
 */
export async function getStaffCurrentTheatre(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }

        const authorizedTheatres = await getAuthorizedTheatresForUser(user);

        if (authorizedTheatres.length === 0) {
            res.json({
                success: true,
                theatre: null,
                theatres: [],
                screens: [],
                message: 'No theatre is currently associated with your staff account.',
            });
            return;
        }

        let selectedTheatre = null;
        const requestedId = req.query.theatreId;

        if (requestedId) {
            selectedTheatre = authorizedTheatres.find(
                t => (t._id ? t._id.toString() : t.id) === requestedId.toString()
            );
            if (!selectedTheatre) {
                res.status(403).json({
                    success: false,
                    message: 'Unauthorized: You are not authorized to view this theatre.',
                });
                return;
            }
        } else {
            selectedTheatre = authorizedTheatres[0];
        }

        const screens = (isDBConnected() && selectedTheatre._id && mongoose.Types.ObjectId.isValid(selectedTheatre._id))
            ? await Screen.find({ theatre_id: selectedTheatre._id }).sort({ name: 1 })
            : [];

        const formatTheatre = (t) => ({
            id: t._id ? t._id.toString() : t.id,
            name: t.name,
            location: t.location,
            address: t.address,
            city: t.city,
            contact_phone: t.contact_phone || t.phone || null,
            contact_email: t.contact_email || t.email || null,
            description: t.description || null,
            image: t.image || null,
            status: t.status || 'ACTIVE',
        });

        res.json({
            success: true,
            theatre: formatTheatre(selectedTheatre),
            theatres: authorizedTheatres.map(formatTheatre),
            screens: screens.map(s => s.toJSON()),
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Safely associates an existing staff account with a theatre.
 * Joins an existing matching theatre by name & address or creates a new theatre record.
 */
export async function associateStaffTheatre(req, res, next) {
    try {
        const user = req.user;
        const {
            theatreName,
            theatreLocation,
            theatreAddress,
            city,
            theatrePhone,
            theatreEmail,
        } = req.body;

        const tName = (theatreName || req.body.theatre_name || '').trim();
        const tLoc = (theatreLocation || req.body.theatre_location || '').trim();
        const tAddr = (theatreAddress || req.body.theatre_address || '').trim();
        const tCity = (city || req.body.theatre_city || '').trim();
        const tPhone = (theatrePhone || req.body.theatre_phone || req.body.theatreContactNumber || '').trim();
        const tEmail = (theatreEmail || req.body.theatre_email || req.body.theatreEmailAddress || '').trim().toLowerCase();

        if (!tName || !tLoc || !tAddr || !tCity || !tPhone || !tEmail) {
            res.status(400).json({
                success: false,
                message: 'All theatre details (Name, Location, Address, City, Contact Number, and Email Address) are required.',
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(tEmail)) {
            res.status(400).json({ success: false, message: 'Please provide a valid theatre email address.' });
            return;
        }

        if (isDBConnected()) {
            const escapedName = tName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const escapedAddr = tAddr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            let targetTheatre = await Theatre.findOne({
                name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
                address: { $regex: new RegExp(`^${escapedAddr}$`, 'i') },
            });

            if (!targetTheatre) {
                targetTheatre = await Theatre.create({
                    name: tName,
                    location: tLoc,
                    address: tAddr,
                    city: tCity,
                    contact_phone: tPhone,
                    contact_email: tEmail,
                    phone: tPhone,
                    email: tEmail,
                    owner_id: user.id,
                    status: 'ACTIVE',
                });
            } else {
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
            }

            await User.findByIdAndUpdate(user.id, { theatre_id: targetTheatre._id });
            await TheatreStaff.findOneAndUpdate(
                { theatre_id: targetTheatre._id, user_id: user.id },
                { theatre_id: targetTheatre._id, user_id: user.id },
                { upsert: true, new: true }
            );

            res.json({
                success: true,
                message: `Staff account successfully associated with ${targetTheatre.name}.`,
                theatre: {
                    id: targetTheatre._id.toString(),
                    name: targetTheatre.name,
                    location: targetTheatre.location,
                    address: targetTheatre.address,
                    city: targetTheatre.city,
                    contact_phone: targetTheatre.contact_phone || targetTheatre.phone,
                    contact_email: targetTheatre.contact_email || targetTheatre.email,
                },
            });
            return;
        }

        // Fallback for offline mode
        res.json({
            success: true,
            message: `Staff account successfully linked to ${tName}.`,
            theatre: {
                id: `mem_theatre_${Date.now()}`,
                name: tName,
                location: tLoc,
                address: tAddr,
                city: tCity,
                contact_phone: tPhone,
                contact_email: tEmail,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function createTheatre(req, res, next) {
    try {
        const { name, location, address, city, description, image, contact_phone, contact_email, phone, email } = req.body;
        if (!name || !location || !address || !city) {
            res.status(400).json({ success: false, message: 'Name, location, address, and city are required.' });
            return;
        }

        const phoneVal = contact_phone || phone || null;
        const emailVal = contact_email || email || null;

        const theatre = await Theatre.create({
            name: name.trim(),
            location: location.trim(),
            address: address.trim(),
            city: city.trim(),
            description: description || null,
            image: image || null,
            contact_phone: phoneVal,
            contact_email: emailVal,
            phone: phoneVal,
            email: emailVal,
            owner_id: req.user.id,
            status: 'ACTIVE',
        });

        await TheatreStaff.create({ theatre_id: theatre._id, user_id: req.user.id });

        res.status(201).json({
            success: true,
            message: 'Theatre created successfully.',
            theatreId: theatre._id.toString(),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTheatre(req, res, next) {
    try {
        const theatreId = req.params.id;
        const { name, location, address, city, description, image, contact_phone, contact_email, phone, email } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (location) updateData.location = location.trim();
        if (address) updateData.address = address.trim();
        if (city) updateData.city = city.trim();
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (contact_phone !== undefined || phone !== undefined) {
            updateData.contact_phone = contact_phone || phone;
            updateData.phone = contact_phone || phone;
        }
        if (contact_email !== undefined || email !== undefined) {
            updateData.contact_email = contact_email || email;
            updateData.email = contact_email || email;
        }

        const updated = await Theatre.findByIdAndUpdate(theatreId, updateData, { new: true });
        if (!updated) {
            res.status(404).json({ success: false, message: 'Theatre not found.' });
            return;
        }

        res.json({
            success: true,
            message: 'Theatre updated successfully.',
            theatre: updated.toJSON(),
        });
    } catch (error) {
        next(error);
    }
}
