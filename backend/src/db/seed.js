import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './database.js';
import User from '../models/User.js';
import Theatre from '../models/Theatre.js';
import TheatreStaff from '../models/TheatreStaff.js';
import Screen from '../models/Screen.js';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import IntervalBooking from '../models/IntervalBooking.js';
import Transaction from '../models/Transaction.js';
import ChatMessage from '../models/ChatMessage.js';
import BookingMedia from '../models/BookingMedia.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { addVirudhunagarData } from './virudhunagarData.js';

async function seed() {
    console.log('🌱 Seeding CineMoments MongoDB Atlas database...');
    await connectDB();

    const existingUsers = await User.countDocuments();
    if (existingUsers > 0 && process.env.FORCE_SEED !== 'true') {
        console.log(`Database already has ${existingUsers} users. Skipping seed. (Set FORCE_SEED=true to overwrite).`);
        await mongoose.connection.close();
        process.exit(0);
    }

    // Clear existing records to ensure clean seed
    await Promise.all([
        ChatMessage.deleteMany({}),
        Transaction.deleteMany({}),
        Notification.deleteMany({}),
        AuditLog.deleteMany({}),
        BookingMedia.deleteMany({}),
        IntervalBooking.deleteMany({}),
        Show.deleteMany({}),
        Screen.deleteMany({}),
        Movie.deleteMany({}),
        TheatreStaff.deleteMany({}),
        Theatre.deleteMany({}),
        User.deleteMany({}),
    ]);
    console.log('🧹 Cleaned existing records.');

    // 1. Create Users
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@cinemoments.com',
        phone: '+91-98765-01000',
        password_hash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        wallet_balance: 10000.00,
    });

    const staff1 = await User.create({
        name: 'John (Grand Palace)',
        email: 'staff@grandcinema.com',
        phone: '+91-98765-01001',
        password_hash: passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        wallet_balance: 5000.00,
    });
    const staff2 = await User.create({
        name: 'Sarah (Starlight)',
        email: 'staff@starlight.com',
        phone: '+91-98765-01002',
        password_hash: passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        wallet_balance: 5000.00,
    });
    const staff3 = await User.create({
        name: 'Vikram (Apex IMAX)',
        email: 'staff@apexcine.com',
        phone: '+91-98765-01003',
        password_hash: passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        wallet_balance: 5000.00,
    });
    const staff4 = await User.create({
        name: 'Ananya (Regal Crown)',
        email: 'staff@regalcrown.com',
        phone: '+91-98765-01004',
        password_hash: passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        wallet_balance: 5000.00,
    });
    const staff5 = await User.create({
        name: 'David (Cinepolis Diamond)',
        email: 'staff@cinepolisdiamond.com',
        phone: '+91-98765-01005',
        password_hash: passwordHash,
        role: 'STAFF',
        status: 'ACTIVE',
        wallet_balance: 5000.00,
    });

    // Customers (each gets fake ₹2000 initial balance)
    const customer1 = await User.create({
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        phone: '+91-98765-02001',
        password_hash: passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        wallet_balance: 2000.00,
    });
    const customer2 = await User.create({
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91-98765-02002',
        password_hash: passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        wallet_balance: 2000.00,
    });
    const customer3 = await User.create({
        name: 'Alex Miller',
        email: 'alex@example.com',
        phone: '+91-98765-02003',
        password_hash: passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        wallet_balance: 2000.00,
    });
    const customer4 = await User.create({
        name: 'Sneha Patel',
        email: 'sneha@example.com',
        phone: '+91-98765-02004',
        password_hash: passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        wallet_balance: 2000.00,
    });

    console.log('👤 Created demo users with ₹2,000 wallet allocation.');

    // 2. Create 10 Theatres
    const theatresData = [
        {
            name: 'Grand Palace Cinema',
            location: 'Downtown Arts District',
            address: '450 Heritage Blvd',
            city: 'Mumbai',
            description: 'State-of-the-art multi-screen cinema with laser 4K projection and premium Dolby sound.',
            image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
            ownerId: staff1._id,
        },
        {
            name: 'Starlight Multiplex',
            location: 'Westside Promenade',
            address: '780 Boulevard Walk',
            city: 'Delhi',
            description: 'Luxury recliner seating, immersive 4DX motion screens, and gourmet cinema concessions.',
            image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
            ownerId: staff2._id,
        },
        {
            name: 'Apex Cineplex & IMAX',
            location: 'Tech Corridor',
            address: '1200 Innovation Way',
            city: 'Bengaluru',
            description: 'The largest IMAX laser screen in the state featuring crystal-clear 12-channel digital sound.',
            image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&q=80',
            ownerId: staff3._id,
        },
        {
            name: 'Regal Crown Cinema',
            location: 'Marine Plaza Waterfront',
            address: '102 Royal Palm Drive',
            city: 'Mumbai',
            description: 'Heritage cinema restored into modern splendour with plush velvet seating and private boxes.',
            image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=80',
            ownerId: staff4._id,
        },
        {
            name: 'Cinepolis Diamond Plaza',
            location: 'Indiranagar Hub',
            address: '88 Diamond Mall Level 4',
            city: 'Bengaluru',
            description: 'Exclusive VIP cinema experience with in-theatre dine-in service and private interval celebrations.',
            image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&q=80',
            ownerId: staff5._id,
        },
        {
            name: 'PVR Sapphire Cinema',
            location: 'South Extension II',
            address: '54 Sapphire Towers',
            city: 'Delhi',
            description: 'Signature cinema with Dolby Atmos soundscapes and bespoke custom celebration projections.',
            image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
            ownerId: staff1._id,
        },
        {
            name: 'Inox Insignia Luxe',
            location: 'HITEC City Cyber Towers',
            address: '320 Jubilee Hills Extension',
            city: 'Hyderabad',
            description: 'Seven-star ultra-luxurious cinema designed for unforgettable proposals and corporate launches.',
            image: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800&q=80',
            ownerId: staff2._id,
        },
        {
            name: 'Wave Platinum Multiplex',
            location: 'Central Marina Bay',
            address: '15 Harbour View Road',
            city: 'Chennai',
            description: 'Coastal cinema featuring high-lumen barco laser projectors and panoramic curved screens.',
            image: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&q=80',
            ownerId: staff3._id,
        },
        {
            name: 'Miraj Premier Cinemas',
            location: 'Koregaon Park Plaza',
            address: '90 North Main Road',
            city: 'Pune',
            description: 'Boutique theatre crafted for cinematic experiences with specialized proposal sound cues.',
            image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
            ownerId: staff4._id,
        },
        {
            name: 'CineGrand Horizon Hall',
            location: 'Salt Lake Sector V',
            address: '40 Horizon IT Park',
            city: 'Kolkata',
            description: 'Massive 500-seater stadium-style auditorium with pristine dual laser 4K projection.',
            image: 'https://images.unsplash.com/photo-1460881680858-30d870d7b511?w=800&q=80',
            ownerId: staff5._id,
        },
    ];

    const theatreIds = [];
    for (const t of theatresData) {
        const theatre = await Theatre.create({
            name: t.name,
            location: t.location,
            address: t.address,
            city: t.city,
            description: t.description,
            image: t.image,
            owner_id: t.ownerId,
            status: 'ACTIVE',
        });
        theatreIds.push(theatre._id);
        await TheatreStaff.create({ theatre_id: theatre._id, user_id: t.ownerId });
    }
    console.log(`🏛️ Created ${theatreIds.length} Cinema Theatres across major cities.`);

    // 3. Create Screens
    const screenIds = [];
    for (let i = 0; i < theatreIds.length; i++) {
        const tId = theatreIds[i];
        const s1 = await Screen.create({
            theatre_id: tId,
            name: 'Audi 1 - Laser Atmos',
            capacity: 240,
            screen_type: 'DOLBY',
        });
        const s2 = await Screen.create({
            theatre_id: tId,
            name: 'Audi 2 - Grand Hall',
            capacity: 160,
            screen_type: i === 2 ? 'IMAX' : 'STANDARD',
        });
        screenIds.push(s1._id, s2._id);
    }
    console.log(`🖥️ Created ${screenIds.length} Screens across all theatres.`);

    // 4. Create Movies
    const moviesData = [
        {
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
            title: 'Cyber Odyssey 2099',
            poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
            duration: 155,
            language: 'English',
            rating: 'PG-13',
            genre: 'Sci-Fi / Cyberpunk',
            description: 'In a neon metropolis ruled by synthetic minds, a rogue detective discovers a human soul uploaded into the central grid.',
            release_date: '2026-09-05',
        },
        {
            title: 'Hearts in Paris',
            poster: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
            duration: 118,
            language: 'French / English',
            rating: 'PG',
            genre: 'Romantic Comedy',
            description: 'A whimsical chance encounter in a Montmartre café leads two strangers on a spontaneous 24-hour adventure.',
            release_date: '2026-09-12',
        },
        {
            title: "The Dragon's Ascent",
            poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
            duration: 170,
            language: 'English',
            rating: 'PG-13',
            genre: 'Fantasy / Epic',
            description: 'An ancient kingdom faces extinction until an outcast warrior bonds with the last slumbering fire drake.',
            release_date: '2026-10-01',
        },
        {
            title: 'Neon Shadows',
            poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&q=80',
            duration: 135,
            language: 'English',
            rating: 'R',
            genre: 'Neo-Noir Thriller',
            description: 'A gritty private investigator tracks a vanished heiress through the shadowy underbelly of Tokyo.',
            release_date: '2026-10-08',
        },
        {
            title: 'Champions of the Field',
            poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
            duration: 145,
            language: 'English / Hindi',
            rating: 'PG',
            genre: 'Sports / Drama',
            description: 'The inspirational true journey of an underdog cricket team fighting against all odds to conquer the world cup.',
            release_date: '2026-10-15',
        },
        {
            title: 'Whispering Pines',
            poster: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&q=80',
            duration: 110,
            language: 'English',
            rating: 'R',
            genre: 'Mystery / Suspense',
            description: 'A quiet mountain village holds a dark secret that awakens every leap year when the cold fog descends.',
            release_date: '2026-10-22',
        },
    ];

    const movieIds = [];
    for (const m of moviesData) {
        const movie = await Movie.create(m);
        movieIds.push(movie._id);
    }
    console.log(`🎬 Created ${movieIds.length} Blockbuster Movies.`);

    // 5. Create Shows
    const today = new Date();
    const dateStrs = [0, 1, 2, 3].map((offset) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        return d.toISOString().split('T')[0];
    });

    const showIds = [];
    for (let i = 0; i < screenIds.length; i++) {
        const sId = screenIds[i];
        const mId1 = movieIds[i % movieIds.length];
        const mId2 = movieIds[(i + 1) % movieIds.length];

        const show1 = await Show.create({
            movie_id: mId1,
            screen_id: sId,
            show_date: dateStrs[0],
            start_time: '18:30',
            end_time: '21:00',
            interval_start: '19:45',
            interval_end: '20:00',
            price_estimate: 500.0,
            status: 'SCHEDULED',
        });

        const show2 = await Show.create({
            movie_id: mId2,
            screen_id: sId,
            show_date: dateStrs[1],
            start_time: '21:15',
            end_time: '23:45',
            interval_start: '22:30',
            interval_end: '22:45',
            price_estimate: 500.0,
            status: 'SCHEDULED',
        });

        showIds.push(show1._id, show2._id);
    }
    console.log(`🎟️ Created ${showIds.length} Scheduled Shows with interval intermission windows.`);

    // 6. Create Competing Interval Bookings on Show 1
    const targetShowId = showIds[0];

    const b1 = await IntervalBooking.create({
        user_id: customer1._id,
        show_id: targetShowId,
        booking_type: 'MARRIAGE_PROPOSAL',
        message: 'Pooja, from the moment we met, my world has been brighter. Will you marry me and make me the happiest man alive?',
        contact_phone: '+91-98765-02001',
        status: 'PENDING',
    });

    const b2 = await IntervalBooking.create({
        user_id: customer2._id,
        show_id: targetShowId,
        booking_type: 'BIRTHDAY',
        message: 'Happy 25th Birthday to our superhero Rohan! Here is to conquering the world together! Lots of love from the squad.',
        contact_phone: '+91-98765-02002',
        status: 'PENDING',
    });

    // An already accepted booking on Show 2
    const acceptedShowId = showIds[1];
    const b3 = await IntervalBooking.create({
        user_id: customer3._id,
        show_id: acceptedShowId,
        booking_type: 'LOVE_PROPOSAL',
        message: 'Ananya, you are my favorite person in every universe. Happy 3rd Anniversary!',
        contact_phone: '+91-98765-02003',
        status: 'ACCEPTED',
        accepted_at: new Date(),
    });

    // Record completed transaction for accepted booking: ₹500 (₹400 to Theatre Owner, ₹100 to Admin)
    await Transaction.create({
        booking_id: b3._id,
        user_id: customer3._id,
        theatre_id: theatreIds[0],
        total_amount: 500.00,
        theatre_share: 400.00,
        admin_share: 100.00,
        status: 'COMPLETED',
    });

    // 7. Seed sample chat messages between User (Rahul) and Theatre Admin (Grand Palace)
    await ChatMessage.create({
        theatre_id: theatreIds[0],
        user_id: customer1._id,
        sender_id: customer1._id,
        sender_role: 'CUSTOMER',
        message: 'Hi, I submitted a proposal video for Eternal Vows! Can you make sure the lights dim at 19:45?',
        booking_id: b1._id,
        is_read: 1,
    });

    await ChatMessage.create({
        theatre_id: theatreIds[0],
        user_id: customer1._id,
        sender_id: staff1._id,
        sender_role: 'STAFF',
        message: 'Hello Rahul! Absolutely, our projectionist will dim ambient lighting to 20% right as your video appears on the main screen.',
        booking_id: b1._id,
        is_read: 0,
    });

    console.log('💬 Seeded demo chat messages between customer and theatre staff.');
    await addVirudhunagarData();

    console.log('✅ Seeding completed successfully!');
    console.log('Summary:');
    console.log(`  Theatres: ${theatreIds.length} + Virudhunagar theatres`);
    console.log(`  Movies:   ${movieIds.length} + Virudhunagar movies`);
    console.log('  Customer Balance: ₹2,000 fake balance credited');
    console.log('  Share Split: 80% to Theatre Owner, 20% to Super Admin');

    await mongoose.connection.close();
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed error:', err.message || err);
    console.warn('Skipping initial seed error to allow service to start.');
    process.exit(0);
});
