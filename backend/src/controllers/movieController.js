import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import Screen from '../models/Screen.js';
import IntervalBooking from '../models/IntervalBooking.js';
import { isDBConnected } from '../db/database.js';
import { fallbackStore } from '../db/fallbackStore.js';

export async function getAllMovies(req, res, next) {
    try {
        const { theatreId } = req.query;

        if (!isDBConnected()) {
            const movies = fallbackStore.getMovies({ theatreId });
            res.json({ success: true, movies });
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // If filtering by theatreId: return only movies currently scheduled at that theatre
        if (theatreId) {
            if (!mongoose.Types.ObjectId.isValid(theatreId)) {
                // Check if found in fallback store
                const fallbackMovies = fallbackStore.getMovies({ theatreId });
                res.json({ success: true, movies: fallbackMovies });
                return;
            }

            const screens = await Screen.find({ theatre_id: theatreId }).select('_id');
            const screenIds = screens.map(s => s._id);

            const showsAtTheatre = await Show.find({
                screen_id: { $in: screenIds },
                show_date: { $gte: todayStr },
                status: 'SCHEDULED'
            });

            if (showsAtTheatre.length === 0) {
                res.json({ success: true, movies: [] });
                return;
            }

            const movieShowCountMap = {};
            for (const s of showsAtTheatre) {
                const mid = s.movie_id.toString();
                movieShowCountMap[mid] = (movieShowCountMap[mid] || 0) + 1;
            }

            const distinctMovieIds = Object.keys(movieShowCountMap);
            const movies = await Movie.find({ _id: { $in: distinctMovieIds } }).sort({ title: 1 });

            const formattedMovies = movies.map(m => {
                const json = m.toJSON();
                json.upcoming_shows_count = movieShowCountMap[m._id.toString()] || 0;
                return json;
            });

            res.json({ success: true, movies: formattedMovies });
            return;
        }

        // Default: All movies with aggregate upcoming show counts
        let movies = await Movie.find().sort({ title: 1 });
        if (movies.length === 0) {
            const fallbackMovies = fallbackStore.getMovies();
            res.json({ success: true, movies: fallbackMovies });
            return;
        }

        const showCounts = await Show.aggregate([
            { $match: { show_date: { $gte: todayStr }, status: 'SCHEDULED' } },
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
    } catch (error) {
        next(error);
    }
}

export async function getMovieById(req, res, next) {
    try {
        const movieId = req.params.id;

        if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(movieId)) {
            const result = fallbackStore.getMovieById(movieId);
            if (result) {
                res.json({ success: true, movie: result.movie, shows: result.shows });
                return;
            }
            if (!isDBConnected()) {
                res.status(404).json({ success: false, message: 'Movie not found.' });
                return;
            }
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            res.status(404).json({ success: false, message: 'Movie not found.' });
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Upcoming shows for this movie across all theatres
        const shows = await Show.find({
            movie_id: movieId,
            show_date: { $gte: todayStr },
            status: 'SCHEDULED'
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

        const movieJson = movie.toJSON();
        movieJson.upcoming_shows_count = formattedShows.length;

        res.json({ success: true, movie: movieJson, shows: formattedShows });
    } catch (error) {
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
    } catch (error) {
        next(error);
    }
}
