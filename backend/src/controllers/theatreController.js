import Theatre from '../models/Theatre.js';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import IntervalBooking from '../models/IntervalBooking.js';
import TheatreStaff from '../models/TheatreStaff.js';

export async function getAllTheatres(req, res, next) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const theatres = await Theatre.find({ status: 'ACTIVE' }).sort({ name: 1 });

        // Get screen counts per theatre
        const screenCounts = await Screen.aggregate([
            { $group: { _id: '$theatre_id', count: { $sum: 1 } } }
        ]);
        const screenCountMap = {};
        for (const sc of screenCounts) {
            screenCountMap[sc._id.toString()] = sc.count;
        }

        // Get active distinct movie counts per theatre
        // Find upcoming shows
        const upcomingShows = await Show.find({ show_date: { $gte: todayStr } })
            .populate('screen_id', 'theatre_id');

        const theatreMoviesMap = {};
        for (const show of upcomingShows) {
            if (show.screen_id && show.screen_id.theatre_id) {
                const tId = show.screen_id.theatre_id.toString();
                if (!theatreMoviesMap[tId]) {
                    theatreMoviesMap[tId] = new Set();
                }
                theatreMoviesMap[tId].add(show.movie_id.toString());
            }
        }

        const formattedTheatres = theatres.map(t => {
            const json = t.toJSON();
            const idStr = t._id.toString();
            json.screen_count = screenCountMap[idStr] || 0;
            json.active_movies_count = theatreMoviesMap[idStr] ? theatreMoviesMap[idStr].size : 0;
            return json;
        });

        res.json({ success: true, theatres: formattedTheatres });
    }
    catch (error) {
        next(error);
    }
}

export async function getTheatreById(req, res, next) {
    try {
        const theatreId = req.params.id;
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
            show_date: { $gte: todayStr }
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
                screen_id: screen ? screen._id.toString() : null,
                screen_name: screen ? screen.name : '',
                screen_type: screen ? screen.screen_type : 'STANDARD',
                is_interval_booked: acceptedSet.has(sid) ? 1 : 0,
                pending_requests_count: pendingCountMap[sid] || 0,
            };
        });

        res.json({
            success: true,
            theatre: theatre.toJSON(),
            screens: screens.map(s => s.toJSON()),
            shows: formattedShows,
        });
    }
    catch (error) {
        next(error);
    }
}

export async function createTheatre(req, res, next) {
    try {
        const { name, location, address, city, description, image } = req.body;
        if (!name || !location || !address || !city) {
            res.status(400).json({ success: false, message: 'Name, location, address, and city are required.' });
            return;
        }

        const theatre = await Theatre.create({
            name: name.trim(),
            location: location.trim(),
            address: address.trim(),
            city: city.trim(),
            description: description || null,
            image: image || null,
            owner_id: req.user?.id || null,
            status: 'ACTIVE',
        });

        res.status(201).json({
            success: true,
            message: 'Theatre created successfully.',
            theatreId: theatre._id.toString(),
        });
    }
    catch (error) {
        next(error);
    }
}

export async function updateTheatre(req, res, next) {
    try {
        const theatreId = req.params.id;
        const { name, location, address, city, description, image, status } = req.body;

        // Check staff permissions
        if (req.user?.role === 'STAFF') {
            const isAssigned = await TheatreStaff.findOne({ theatre_id: theatreId, user_id: req.user.id });
            const isOwner = await Theatre.findOne({ _id: theatreId, owner_id: req.user.id });
            if (!isAssigned && !isOwner) {
                res.status(403).json({ success: false, message: 'Unauthorized to manage this theatre.' });
                return;
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (location !== undefined) updateData.location = location;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (status !== undefined) updateData.status = status;

        await Theatre.findByIdAndUpdate(theatreId, updateData);

        res.json({ success: true, message: 'Theatre updated successfully.' });
    }
    catch (error) {
        next(error);
    }
}
