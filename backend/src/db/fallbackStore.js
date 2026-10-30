/**
 * In-Memory Database Store for CineMoments.
 * Provides resilient dynamic data retrieval for Theatres, Screens, Movies, Shows,
 * and Interval Bookings when MongoDB Atlas or local mongod is offline.
 * Dates are generated dynamically relative to the current local date to guarantee
 * active booking schedules at all times.
 */

// Helper to format ISO date string (YYYY-MM-DD)
function getDateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const FALLBACK_THEATRES = [
    {
        id: 'theatre_grand_palace_1',
        name: 'Grand Palace Cinema',
        location: 'Downtown Arts District',
        address: '450 Heritage Blvd',
        city: 'Mumbai',
        description: 'State-of-the-art multi-screen cinema with laser 4K projection and premium Dolby sound.',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
        contact_phone: '+91 22 2845 1100',
        contact_email: 'info@grandpalacecinema.com',
        phone: '+91 22 2845 1100',
        email: 'info@grandpalacecinema.com',
        status: 'ACTIVE',
        facilities: [
            '4K Laser Projection',
            'Dolby Atmos 12-Channel Audio',
            'Laser Screen Playout System',
            'Plush Recliner Seating',
            'Intermission Coordinator Desk',
        ],
    },
    {
        id: 'theatre_starlight_2',
        name: 'Starlight Multiplex',
        location: 'Westside Promenade',
        address: '780 Boulevard Walk',
        city: 'Delhi',
        description: 'Luxury recliner seating, immersive 4DX motion screens, and gourmet cinema concessions.',
        image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
        contact_phone: '+91 11 4150 9922',
        contact_email: 'contact@starlightmultiplex.com',
        phone: '+91 11 4150 9922',
        email: 'contact@starlightmultiplex.com',
        status: 'ACTIVE',
        facilities: [
            '4DX Motion Seating',
            'Dolby Atmos 360',
            'Dedicated Intermission Cue Display',
            'Gourmet Lounge Service',
            'Laser Digital Playout',
        ],
    },
    {
        id: 'theatre_apexcine_3',
        name: 'Apex Cineplex & IMAX',
        location: 'Tech Corridor',
        address: '1200 Innovation Way',
        city: 'Bengaluru',
        description: 'The largest IMAX laser screen in the state featuring crystal-clear 12-channel digital sound.',
        image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&q=80',
        contact_phone: '+91 80 6720 4455',
        contact_email: 'desk@apexcine.com',
        phone: '+91 80 6720 4455',
        email: 'desk@apexcine.com',
        status: 'ACTIVE',
        facilities: [
            'IMAX Laser Giant Screen',
            '12-Channel High Dynamic Audio',
            'Dedicated Intermission Controller',
            'Stadium Tiered Seating',
            '4K DCI Calibration',
        ],
    },
    {
        id: 'theatre_regalcrown_4',
        name: 'Regal Crown Cinema',
        location: 'Marine Plaza Waterfront',
        address: '102 Royal Palm Drive',
        city: 'Mumbai',
        description: 'Heritage cinema restored into modern splendour with plush velvet seating and private boxes.',
        image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=80',
        contact_phone: '+91 22 6677 8899',
        contact_email: 'support@regalcrown.com',
        phone: '+91 22 6677 8899',
        email: 'support@regalcrown.com',
        status: 'ACTIVE',
        facilities: [
            'Heritage Velvet Seating',
            'Bespoke Proposal Audio Lighting',
            'Dolby Atmos Sound',
            'Private Balcony Boxes',
            'Intermission Broadcast Console',
        ],
    },
    {
        id: 'theatre_cinepolis_5',
        name: 'Cinepolis Diamond Plaza',
        location: 'Indiranagar Hub',
        address: '88 Diamond Mall Level 4',
        city: 'Bengaluru',
        description: 'Exclusive VIP cinema experience with in-theatre dine-in service and private interval celebrations.',
        image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&q=80',
        contact_phone: '+91 80 2525 7788',
        contact_email: 'concierge@cinepolisdiamond.com',
        phone: '+91 80 2525 7788',
        email: 'concierge@cinepolisdiamond.com',
        status: 'ACTIVE',
        facilities: [
            'VIP Butler Service',
            'Motorized Leather Recliners',
            '4K Laser Christie Projection',
            'Custom Chime Synthesizer',
            'Laser Screen Intermission Playout',
        ],
    },
    {
        id: 'theatre_empty_schedule_6',
        name: 'Metro Heritage Hall (Renovating)',
        location: 'Old Town Square',
        address: '55 Old Fort Road',
        city: 'Pune',
        description: 'Historic cinema currently undergoing audio upgrade. No active shows scheduled at this moment.',
        image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
        contact_phone: '+91 20 2612 0099',
        contact_email: 'desk@metroheritage.com',
        status: 'ACTIVE',
        facilities: ['Standard Digital Sound', 'Classic Seating'],
    },
];

const FALLBACK_SCREENS = [
    { id: 'screen_gp_1', theatre_id: 'theatre_grand_palace_1', name: 'Audi 1 - Laser Atmos', capacity: 240, screen_type: 'DOLBY' },
    { id: 'screen_gp_2', theatre_id: 'theatre_grand_palace_1', name: 'Audi 2 - Grand Hall', capacity: 160, screen_type: 'STANDARD' },
    { id: 'screen_st_1', theatre_id: 'theatre_starlight_2', name: 'Audi 1 - 4DX Laser', capacity: 180, screen_type: '4DX' },
    { id: 'screen_st_2', theatre_id: 'theatre_starlight_2', name: 'Audi 2 - Premier Lounge', capacity: 120, screen_type: 'VIP' },
    { id: 'screen_ap_1', theatre_id: 'theatre_apexcine_3', name: 'Screen 1 - IMAX Grand', capacity: 380, screen_type: 'IMAX' },
    { id: 'screen_ap_2', theatre_id: 'theatre_apexcine_3', name: 'Screen 2 - Atmos Deluxe', capacity: 200, screen_type: 'DOLBY' },
    { id: 'screen_rc_1', theatre_id: 'theatre_regalcrown_4', name: 'Royal Stage 1', capacity: 190, screen_type: 'DOLBY' },
    { id: 'screen_cd_1', theatre_id: 'theatre_cinepolis_5', name: 'VIP Auditorium 1', capacity: 90, screen_type: 'VIP' },
];

const FALLBACK_MOVIES = [
    {
        id: 'movie_interstellar_1',
        title: 'Interstellar Echoes',
        poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
        duration: 165,
        language: 'English',
        rating: 'PG-13',
        genre: 'Sci-Fi / Adventure',
        description: 'A team of explorers travels beyond the charted galaxy to discover a beacon that holds humanity’s final hope.',
        release_date: '2026-06-15',
    },
    {
        id: 'movie_eternal_vows_2',
        title: 'Eternal Vows: A Love Story',
        poster: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80',
        duration: 130,
        language: 'English',
        rating: 'PG-13',
        genre: 'Romance / Drama',
        description: 'Two soulmates separated by fate cross continents and time to keep an impossible promise.',
        release_date: '2026-07-20',
    },
    {
        id: 'movie_midnight_heist_3',
        title: 'The Midnight Heist',
        poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
        duration: 140,
        language: 'English',
        rating: 'R',
        genre: 'Action / Thriller',
        description: 'An elite crew attempts the most daring museum theft in history during a blackout in Paris.',
        release_date: '2026-08-01',
    },
    {
        id: 'movie_starlight_symp_4',
        title: 'Starlight Symphony',
        poster: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80',
        duration: 125,
        language: 'English',
        rating: 'PG',
        genre: 'Drama / Music',
        description: 'A prodigy conductor struggles to compose an ode that unites an estranged orchestra and saves an ancient auditorium.',
        release_date: '2026-08-18',
    },
    {
        id: 'movie_cyber_odyssey_5',
        title: 'Cyber Odyssey 2099',
        poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
        duration: 155,
        language: 'English',
        rating: 'PG-13',
        genre: 'Sci-Fi / Cyberpunk',
        description: 'In a neon metropolis ruled by synthetic minds, a rogue detective discovers a human soul uploaded into the central grid.',
        release_date: '2026-09-05',
    },
];

// Shows are generated dynamically for today, tomorrow, and subsequent days
function generateFallbackShows() {
    const d0 = getDateOffset(0);
    const d1 = getDateOffset(1);
    const d2 = getDateOffset(2);

    return [
        // Grand Palace Cinema shows
        {
            id: 'show_gp_101',
            movie_id: 'movie_interstellar_1',
            screen_id: 'screen_gp_1',
            show_date: d0,
            start_time: '18:30',
            end_time: '21:15',
            interval_start: '19:45',
            interval_end: '20:00',
            price_estimate: 500.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },
        {
            id: 'show_gp_102',
            movie_id: 'movie_eternal_vows_2',
            screen_id: 'screen_gp_1',
            show_date: d0,
            start_time: '21:30',
            end_time: '23:45',
            interval_start: '22:30',
            interval_end: '22:45',
            price_estimate: 500.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },
        {
            id: 'show_gp_103',
            movie_id: 'movie_midnight_heist_3',
            screen_id: 'screen_gp_2',
            show_date: d1,
            start_time: '19:00',
            end_time: '21:20',
            interval_start: '20:10',
            interval_end: '20:25',
            price_estimate: 450.0,
            status: 'SCHEDULED',
            is_interval_booked: 1, // Pre-booked slot
        },

        // Starlight Multiplex shows
        {
            id: 'show_st_201',
            movie_id: 'movie_cyber_odyssey_5',
            screen_id: 'screen_st_1',
            show_date: d0,
            start_time: '18:00',
            end_time: '20:35',
            interval_start: '19:15',
            interval_end: '19:30',
            price_estimate: 600.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },
        {
            id: 'show_st_202',
            movie_id: 'movie_eternal_vows_2',
            screen_id: 'screen_st_2',
            show_date: d0,
            start_time: '20:00',
            end_time: '22:15',
            interval_start: '21:05',
            interval_end: '21:20',
            price_estimate: 550.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },

        // Apex Cineplex & IMAX shows
        {
            id: 'show_ap_301',
            movie_id: 'movie_interstellar_1',
            screen_id: 'screen_ap_1',
            show_date: d0,
            start_time: '17:45',
            end_time: '20:30',
            interval_start: '19:00',
            interval_end: '19:15',
            price_estimate: 750.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },
        {
            id: 'show_ap_302',
            movie_id: 'movie_starlight_symp_4',
            screen_id: 'screen_ap_2',
            show_date: d1,
            start_time: '20:15',
            end_time: '22:20',
            interval_start: '21:15',
            interval_end: '21:30',
            price_estimate: 500.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },

        // Regal Crown Cinema shows
        {
            id: 'show_rc_401',
            movie_id: 'movie_eternal_vows_2',
            screen_id: 'screen_rc_1',
            show_date: d0,
            start_time: '19:30',
            end_time: '21:45',
            interval_start: '20:35',
            interval_end: '20:50',
            price_estimate: 650.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },

        // Cinepolis Diamond Plaza shows
        {
            id: 'show_cd_501',
            movie_id: 'movie_midnight_heist_3',
            screen_id: 'screen_cd_1',
            show_date: d0,
            start_time: '19:15',
            end_time: '21:35',
            interval_start: '20:25',
            interval_end: '20:40',
            price_estimate: 800.0,
            status: 'SCHEDULED',
            is_interval_booked: 0,
        },
    ];
}

let inMemoryShows = generateFallbackShows();
let inMemoryBookings = [
    {
        id: 'book_preset_accepted_1',
        show_id: 'show_gp_103',
        user_id: '67123456789abcdef0000006',
        booking_type: 'MARRIAGE_PROPOSAL',
        message: 'Pooja, will you marry me? ❤️',
        contact_phone: '+91-98765-02001',
        status: 'ACCEPTED',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

let inMemoryTransactions = [
    {
        id: 'tx_preset_1',
        user_id: '67123456789abcdef0000006',
        booking_id: 'book_preset_accepted_1',
        theatre_id: 'theatre_grand_palace_1',
        total_amount: 500.0,
        theatre_share: 400.0,
        admin_share: 100.0,
        payment_method: 'WALLET',
        payment_id: 'pay_preset_001',
        receipt_number: 'REC-2026-100234',
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

export const fallbackStore = {
    /**
     * Retrieves all theatres, optionally filtered to only those with valid, active booking schedules.
     */
    getTheatres: ({ activeSchedulesOnly = false } = {}) => {
        const todayStr = getDateOffset(0);
        const shows = inMemoryShows.filter(s => s.show_date >= todayStr && s.status === 'SCHEDULED');
        
        // Count active screens and shows per theatre
        const theatreStats = {};
        for (const show of shows) {
            const screen = FALLBACK_SCREENS.find(sc => sc.id === show.screen_id);
            if (screen) {
                const tId = screen.theatre_id;
                if (!theatreStats[tId]) {
                    theatreStats[tId] = { showsCount: 0, movieIds: new Set() };
                }
                theatreStats[tId].showsCount++;
                theatreStats[tId].movieIds.add(show.movie_id);
            }
        }

        const formatted = FALLBACK_THEATRES.map(t => {
            const screens = FALLBACK_SCREENS.filter(s => s.theatre_id === t.id);
            const stats = theatreStats[t.id] || { showsCount: 0, movieIds: new Set() };
            return {
                ...t,
                screen_count: screens.length,
                active_movies_count: stats.movieIds.size,
                active_shows_count: stats.showsCount,
                has_active_schedules: stats.showsCount > 0,
            };
        });

        if (activeSchedulesOnly) {
            return formatted.filter(t => t.has_active_schedules);
        }
        return formatted;
    },

    getTheatreById: (theatreId) => {
        const tIdStr = theatreId ? theatreId.toString() : '';
        const theatre = FALLBACK_THEATRES.find(t => t.id === tIdStr);
        if (!theatre) return null;

        const screens = FALLBACK_SCREENS.filter(s => s.theatre_id === tIdStr);
        const screenIdSet = new Set(screens.map(s => s.id));
        const shows = inMemoryShows.filter(s => screenIdSet.has(s.screen_id));

        const formattedShows = shows.map(s => {
            const movie = FALLBACK_MOVIES.find(m => m.id === s.movie_id);
            const screen = FALLBACK_SCREENS.find(sc => sc.id === s.screen_id);
            return {
                ...s,
                movie_title: movie ? movie.title : '',
                movie_poster: movie ? movie.poster : '',
                duration: movie ? movie.duration : 0,
                language: movie ? movie.language : '',
                rating: movie ? movie.rating : '',
                genre: movie ? movie.genre : '',
                screen_name: screen ? screen.name : '',
                screen_type: screen ? screen.screen_type : 'STANDARD',
                theatre_id: theatre.id,
                theatre_name: theatre.name,
                theatre_city: theatre.city,
                theatre_location: theatre.location,
            };
        });

        // Movies scheduled at this theatre
        const movieIds = Array.from(new Set(formattedShows.map(s => s.movie_id)));
        const movies = FALLBACK_MOVIES.filter(m => movieIds.includes(m.id)).map(m => ({
            ...m,
            upcoming_shows_count: formattedShows.filter(s => s.movie_id === m.id).length,
        }));

        return {
            theatre: {
                ...theatre,
                screen_count: screens.length,
                active_movies_count: movies.length,
                active_shows_count: formattedShows.length,
                has_active_schedules: formattedShows.length > 0,
            },
            screens,
            shows: formattedShows,
            movies,
        };
    },

    /**
     * Retrieves movies, optionally filtered strictly to those scheduled at a given theatre.
     */
    getMovies: ({ theatreId } = {}) => {
        const todayStr = getDateOffset(0);

        if (theatreId) {
            const tIdStr = theatreId.toString();
            const screens = FALLBACK_SCREENS.filter(sc => sc.theatre_id === tIdStr);
            const screenIds = new Set(screens.map(sc => sc.id));

            const showsAtTheatre = inMemoryShows.filter(s => 
                screenIds.has(s.screen_id) && s.show_date >= todayStr && s.status === 'SCHEDULED'
            );

            const movieShowCountMap = {};
            for (const s of showsAtTheatre) {
                movieShowCountMap[s.movie_id] = (movieShowCountMap[s.movie_id] || 0) + 1;
            }

            const activeMovieIds = Object.keys(movieShowCountMap);
            return FALLBACK_MOVIES.filter(m => activeMovieIds.includes(m.id)).map(m => ({
                ...m,
                upcoming_shows_count: movieShowCountMap[m.id] || 0,
            }));
        }

        // Return all movies with aggregate upcoming show counts across all theatres
        const countMap = {};
        for (const s of inMemoryShows) {
            if (s.show_date >= todayStr && s.status === 'SCHEDULED') {
                countMap[s.movie_id] = (countMap[s.movie_id] || 0) + 1;
            }
        }

        return FALLBACK_MOVIES.map(m => ({
            ...m,
            upcoming_shows_count: countMap[m.id] || 0,
        }));
    },

    getMovieById: (movieId) => {
        const mIdStr = movieId ? movieId.toString() : '';
        const movie = FALLBACK_MOVIES.find(m => m.id === mIdStr);
        if (!movie) return null;

        const todayStr = getDateOffset(0);
        const shows = inMemoryShows.filter(s => s.movie_id === mIdStr && s.show_date >= todayStr);

        const formattedShows = shows.map(s => {
            const screen = FALLBACK_SCREENS.find(sc => sc.id === s.screen_id);
            const theatre = screen ? FALLBACK_THEATRES.find(t => t.id === screen.theatre_id) : null;
            return {
                ...s,
                movie_title: movie.title,
                movie_poster: movie.poster,
                screen_name: screen ? screen.name : '',
                screen_type: screen ? screen.screen_type : 'STANDARD',
                theatre_id: theatre ? theatre.id : null,
                theatre_name: theatre ? theatre.name : '',
                theatre_city: theatre ? theatre.city : '',
                theatre_location: theatre ? theatre.location : '',
            };
        });

        return {
            movie: {
                ...movie,
                upcoming_shows_count: formattedShows.length,
            },
            shows: formattedShows,
        };
    },

    getShows: ({ theatreId, movieId, date } = {}) => {
        const todayStr = getDateOffset(0);
        let shows = inMemoryShows.filter(s => s.status === 'SCHEDULED');

        if (date) {
            shows = shows.filter(s => s.show_date === date);
        } else {
            shows = shows.filter(s => s.show_date >= todayStr);
        }

        if (movieId) {
            const mIdStr = movieId.toString();
            shows = shows.filter(s => s.movie_id === mIdStr);
        }

        if (theatreId) {
            const tIdStr = theatreId.toString();
            const screens = FALLBACK_SCREENS.filter(sc => sc.theatre_id === tIdStr);
            const screenIds = new Set(screens.map(sc => sc.id));
            shows = shows.filter(s => screenIds.has(s.screen_id));
        }

        return shows.map(s => {
            const movie = FALLBACK_MOVIES.find(m => m.id === s.movie_id);
            const screen = FALLBACK_SCREENS.find(sc => sc.id === s.screen_id);
            const theatre = screen ? FALLBACK_THEATRES.find(t => t.id === screen.theatre_id) : null;
            return {
                ...s,
                movie_title: movie ? movie.title : '',
                movie_poster: movie ? movie.poster : '',
                duration: movie ? movie.duration : 0,
                language: movie ? movie.language : '',
                rating: movie ? movie.rating : '',
                genre: movie ? movie.genre : '',
                screen_name: screen ? screen.name : '',
                screen_type: screen ? screen.screen_type : 'STANDARD',
                theatre_id: theatre ? theatre.id : null,
                theatre_name: theatre ? theatre.name : '',
                theatre_city: theatre ? theatre.city : '',
                theatre_location: theatre ? theatre.location : '',
            };
        });
    },

    createBooking: (input) => {
        const targetShow = inMemoryShows.find(s => s.id === input.showId);
        if (!targetShow) {
            throw new Error('Selected movie show was not found.');
        }

        // Check if interval is already accepted
        if (targetShow.is_interval_booked === 1) {
            throw new Error('This interval slot has already been booked and accepted.');
        }

        // Check if this user already has an active booking for this show
        const existingUserBooking = inMemoryBookings.find(
            b => b.show_id === input.showId && b.user_id === input.userId && (b.status === 'PENDING' || b.status === 'ACCEPTED')
        );
        if (existingUserBooking) {
            throw new Error('You already have an active interval booking request for this show.');
        }

        const newId = `book_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const booking = {
            id: newId,
            show_id: input.showId,
            user_id: input.userId,
            booking_type: input.bookingType,
            message: input.message,
            contact_phone: input.contactPhone || null,
            status: 'PENDING',
            created_at: new Date().toISOString(),
        };

        inMemoryBookings.push(booking);
        return { bookingId: newId, status: 'PENDING' };
    },

    getBookings: (params = {}) => {
        let theatreId = null;
        let status = null;
        let userId = null;

        if (typeof params === 'string') {
            theatreId = params;
        } else if (params && typeof params === 'object') {
            theatreId = params.theatreId || null;
            status = params.status || null;
            userId = params.userId || null;
        }

        let bookings = [...inMemoryBookings];

        if (userId) {
            bookings = bookings.filter(b => b.user_id === userId);
        }

        if (theatreId && theatreId !== 'ALL') {
            const tIdStr = theatreId.toString();
            const screens = FALLBACK_SCREENS.filter(sc => sc.theatre_id === tIdStr);
            const screenIds = new Set(screens.map(sc => sc.id));
            const shows = inMemoryShows.filter(s => screenIds.has(s.screen_id));
            const showIds = new Set(shows.map(s => s.id));
            bookings = bookings.filter(b => showIds.has(b.show_id));
        }

        if (status && status !== 'ALL') {
            bookings = bookings.filter(b => b.status === status);
        }

        return bookings.map(b => {
            const show = inMemoryShows.find(s => s.id === b.show_id);
            const movie = show ? FALLBACK_MOVIES.find(m => m.id === show.movie_id) : null;
            const screen = show ? FALLBACK_SCREENS.find(sc => sc.id === show.screen_id) : null;
            const theatre = screen ? FALLBACK_THEATRES.find(t => t.id === screen.theatre_id) : null;

            return {
                id: b.id,
                _id: b.id,
                user_id: b.user_id,
                customer_name: b.customer_name || 'Rahul Sharma',
                customer_email: b.customer_email || 'rahul@example.com',
                show_id: b.show_id,
                movie_title: movie ? movie.title : 'Movie Feature',
                movie_poster: movie ? movie.poster : '',
                theatre_id: theatre ? theatre.id : null,
                theatre_name: theatre ? theatre.name : 'Cinema Theatre',
                theatre_location: theatre ? theatre.location : '',
                theatre_city: theatre ? theatre.city : '',
                screen_name: screen ? screen.name : 'Main Screen',
                show_date: show ? show.show_date : '',
                start_time: show ? show.start_time : '',
                interval_start: show ? show.interval_start : '20:30',
                interval_end: show ? show.interval_end : '20:45',
                booking_type: b.booking_type,
                message: b.message,
                contact_phone: b.contact_phone || '+91 98765 43210',
                status: b.status,
                rejection_reason: b.rejection_reason || null,
                created_at: b.created_at,
                accepted_at: b.accepted_at || null,
                has_media: false,
                media_id: null,
                media_type: null,
            };
        });
    },

    getBookingById: (bookingId) => {
        const bookings = fallbackStore.getBookings();
        return bookings.find(b => b.id === bookingId) || null;
    },

    acceptBooking: (bookingId) => {
        const booking = inMemoryBookings.find(b => b.id === bookingId);
        if (!booking) {
            const err = new Error('Booking request was not found.');
            err.statusCode = 404;
            throw err;
        }

        const show = inMemoryShows.find(s => s.id === booking.show_id);
        if (show && show.is_interval_booked === 1 && booking.status !== 'ACCEPTED') {
            const err = new Error('This interval slot has already been booked and accepted for another request.');
            err.statusCode = 409;
            throw err;
        }

        booking.status = 'ACCEPTED';
        booking.accepted_at = new Date().toISOString();
        if (show) {
            show.is_interval_booked = 1;
        }

        // Expire competing
        const competing = inMemoryBookings.filter(b => b.show_id === booking.show_id && b.id !== booking.id && (b.status === 'PENDING' || b.status === 'UNDER_REVIEW'));
        for (const c of competing) {
            c.status = 'EXPIRED';
        }

        return {
            success: true,
            bookingId,
            status: 'ACCEPTED',
            expiredCount: competing.length,
        };
    },

    rejectBooking: (bookingId, reason) => {
        const booking = inMemoryBookings.find(b => b.id === bookingId);
        if (!booking) {
            const err = new Error('Booking request was not found.');
            err.statusCode = 404;
            throw err;
        }

        booking.status = 'REJECTED';
        booking.rejection_reason = reason || 'Request could not be accommodated at this time.';
        return { success: true, bookingId, status: 'REJECTED' };
    },

    cancelBooking: (bookingId, customerUserId) => {
        const booking = inMemoryBookings.find(b => b.id === bookingId);
        if (!booking) {
            const err = new Error('Booking was not found.');
            err.statusCode = 404;
            throw err;
        }

        if (customerUserId && booking.user_id !== customerUserId) {
            const err = new Error('Unauthorized to cancel this booking.');
            err.statusCode = 403;
            throw err;
        }

        booking.status = 'CANCELLED';
        return { success: true, bookingId, status: 'CANCELLED' };
    },

    addTransaction: (tx) => {
        const newTx = {
            id: tx.id || `tx_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            ...tx,
            created_at: new Date().toISOString(),
        };
        inMemoryTransactions.unshift(newTx);
        return newTx;
    },

    getTransaction: (txId) => {
        return inMemoryTransactions.find(t => t.id === txId || t.payment_id === txId) || null;
    },

    getUserTransactions: (userId) => {
        const userTxs = inMemoryTransactions.filter(t => !userId || t.user_id === userId);
        return userTxs.map(tx => {
            const theatre = FALLBACK_THEATRES.find(t => t.id === tx.theatre_id);
            return {
                id: tx.id,
                booking_id: tx.booking_id,
                user_id: tx.user_id,
                theatre_id: tx.theatre_id,
                theatre_name: theatre ? theatre.name : 'Cinema Theatre',
                movie_title: 'Cinema Intermission',
                show_date: getDateOffset(0),
                total_amount: tx.total_amount,
                theatre_share: tx.theatre_share,
                admin_share: tx.admin_share,
                payment_method: tx.payment_method,
                payment_id: tx.payment_id,
                receipt_number: tx.receipt_number,
                status: tx.status,
                created_at: tx.created_at,
            };
        });
    },

    getStats: () => {
        const totalBookings = inMemoryBookings.length;
        const acceptedBookings = inMemoryBookings.filter(b => b.status === 'ACCEPTED').length;
        const pendingBookings = inMemoryBookings.filter(b => b.status === 'PENDING').length;
        const expiredBookings = inMemoryBookings.filter(b => b.status === 'EXPIRED').length;
        const rejectedBookings = inMemoryBookings.filter(b => b.status === 'REJECTED').length;

        let totalVolume = 0;
        let totalTheatrePayout = 0;
        let totalAdminCommission = 0;

        for (const tx of inMemoryTransactions) {
            if (tx.status === 'COMPLETED') {
                totalVolume += Number(tx.total_amount || 0);
                totalTheatrePayout += Number(tx.theatre_share || 0);
                totalAdminCommission += Number(tx.admin_share || 0);
            }
        }

        return {
            usersCount: 8,
            theatresCount: FALLBACK_THEATRES.length,
            moviesCount: FALLBACK_MOVIES.length,
            screensCount: FALLBACK_SCREENS.length,
            showsCount: inMemoryShows.length,
            totalBookings,
            acceptedBookings,
            pendingBookings,
            expiredBookings,
            rejectedBookings,
            totalVolume: Math.round(totalVolume * 100) / 100,
            totalTheatrePayout: Math.round(totalTheatrePayout * 100) / 100,
            totalAdminCommission: Math.round(totalAdminCommission * 100) / 100,
        };
    },
};
