import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import IntervalBooking from '../models/IntervalBooking.js';

export async function getAllMovies(req, res, next) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const movies = await Movie.find().sort({ title: 1 });

        // Aggregate upcoming show counts per movie
        const showCounts = await Show.aggregate([
            { $match: { show_date: { $gte: todayStr } } },
            { $group: { _id: '$movie_id', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        for (const sc of showCounts) {
            countMap[sc._id.toString()] = sc.count;
        }

        const moviesWithCount = movies.map(m => {
            const json = m.toJSON();
            json.upcoming_shows_count = countMap[m._id.toString()] || 0;
            return json;
        });

        res.json({ success: true, movies: moviesWithCount });
    }
    catch (error) {
        next(error);
    }
}

export async function getMovieById(req, res, next) {
    try {
        const movieId = req.params.id;
        const movie = await Movie.findById(movieId);
        if (!movie) {
            res.status(404).json({ success: false, message: 'Movie not found.' });
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Upcoming shows for this movie across all theatres
        const shows = await Show.find({
            movie_id: movieId,
            show_date: { $gte: todayStr }
        })
        .populate({
            path: 'screen_id',
            populate: { path: 'theatre_id' }
        })
        .sort({ show_date: 1, start_time: 1 });

        // Find accepted interval bookings for these shows
        const showIds = shows.map(s => s._id);
        const acceptedBookings = await IntervalBooking.find({
            show_id: { $in: showIds },
            status: 'ACCEPTED'
        });
        const acceptedSet = new Set(acceptedBookings.map(b => b.show_id.toString()));

        const formattedShows = shows.map(s => {
            const screen = s.screen_id;
            const theatre = screen ? screen.theatre_id : null;
            return {
                id: s._id.toString(),
                show_date: s.show_date,
                start_time: s.start_time,
                end_time: s.end_time,
                interval_start: s.interval_start,
                interval_end: s.interval_end,
                price_estimate: s.price_estimate,
                screen_id: screen ? screen._id.toString() : null,
                screen_name: screen ? screen.name : '',
                screen_type: screen ? screen.screen_type : 'STANDARD',
                theatre_id: theatre ? theatre._id.toString() : null,
                theatre_name: theatre ? theatre.name : '',
                theatre_city: theatre ? theatre.city : '',
                theatre_location: theatre ? theatre.location : '',
                is_interval_booked: acceptedSet.has(s._id.toString()) ? 1 : 0,
            };
        });

        res.json({ success: true, movie: movie.toJSON(), shows: formattedShows });
    }
    catch (error) {
        next(error);
    }
}

export async function createMovie(req, res, next) {
    try {
        const { title, poster, duration, language, rating, genre, description, releaseDate } = req.body;
        if (!title || !duration || !genre) {
            res.status(400).json({ success: false, message: 'Title, duration, and genre are required.' });
            return;
        }

        const movie = await Movie.create({
            title: title.trim(),
            poster: poster || null,
            duration: Number(duration),
            language: language || 'English',
            rating: rating || 'PG-13',
            genre,
            description: description || null,
            release_date: releaseDate || null,
        });

        res.status(201).json({
            success: true,
            message: 'Movie created successfully.',
            movieId: movie._id.toString(),
        });
    }
    catch (error) {
        next(error);
    }
}
