import Show from '../models/Show.js';
import Screen from '../models/Screen.js';
import Movie from '../models/Movie.js';
import Theatre from '../models/Theatre.js';
import IntervalBooking from '../models/IntervalBooking.js';

export async function getShows(req, res, next) {
    try {
        const { theatreId, movieId, date } = req.query;
        const todayStr = new Date().toISOString().split('T')[0];

        const query = {};

        if (movieId) {
            query.movie_id = movieId;
        }

        if (date) {
            query.show_date = date;
        } else {
            query.show_date = { $gte: todayStr };
        }

        // If theatreId filter is passed, find screen IDs belonging to that theatre
        if (theatreId) {
            const screens = await Screen.find({ theatre_id: theatreId }).select('_id');
            const screenIds = screens.map(s => s._id);
            query.screen_id = { $in: screenIds };
        }

        const shows = await Show.find(query)
            .populate('movie_id')
            .populate({
                path: 'screen_id',
                populate: { path: 'theatre_id' }
            })
            .sort({ show_date: 1, start_time: 1 });

        const showIds = shows.map(s => s._id);

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
            const theatre = screen ? screen.theatre_id : null;
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
                theatre_id: theatre ? theatre._id.toString() : null,
                theatre_name: theatre ? theatre.name : '',
                theatre_city: theatre ? theatre.city : '',
                theatre_location: theatre ? theatre.location : '',
                is_interval_booked: acceptedSet.has(sid) ? 1 : 0,
                pending_requests_count: pendingCountMap[sid] || 0,
            };
        });

        res.json({ success: true, shows: formattedShows });
    }
    catch (error) {
        next(error);
    }
}

export async function createShow(req, res, next) {
    try {
        const {
            movieId,
            screenId,
            showDate,
            startTime,
            endTime,
            intervalStart,
            intervalEnd,
            priceEstimate = 150.0,
        } = req.body;

        if (!movieId || !screenId || !showDate || !startTime || !endTime || !intervalStart || !intervalEnd) {
            res.status(400).json({ success: false, message: 'All show and interval timing fields are required.' });
            return;
        }

        const show = await Show.create({
            movie_id: movieId,
            screen_id: screenId,
            show_date: showDate,
            start_time: startTime,
            end_time: endTime,
            interval_start: intervalStart,
            interval_end: intervalEnd,
            price_estimate: Number(priceEstimate),
            status: 'SCHEDULED',
        });

        res.status(201).json({
            success: true,
            message: 'Show created successfully with configured interval.',
            showId: show._id.toString(),
        });
    }
    catch (error) {
        next(error);
    }
}
