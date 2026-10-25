import bcrypt from 'bcryptjs';
import { getDb } from '../src/db/database.js';

export async function addMoviesAndTheatres() {
  const db = getDb();
  console.log('🎬 Adding Virudhunagar theatres and new Tamil movies...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Check or create Theatre Staff accounts for Virudhunagar / Aruppukkottai
  const staffAccounts = [
    { name: 'Murugan (Rajalakshmi Theatre)', email: 'staff@rajalakshmi.com', phone: '+91-98421-11001' },
    { name: 'Karthik (Apsara Theatre)', email: 'staff@apsara.com', phone: '+91-98421-11002' },
    { name: 'Ramkumar (Ritzy Sri Ram)', email: 'staff@ritzy.com', phone: '+91-98421-11003' },
    { name: 'Amirtharaj Staff', email: 'staff@amirtharaj.com', phone: '+91-98421-11004' },
    { name: 'Lakshmanan (KLAS Max)', email: 'staff@klasmax.com', phone: '+91-98421-11005' },
  ];

  const staffUserMap = {};
  for (const s of staffAccounts) {
    let existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(s.email);
    if (!existingUser) {
      const info = db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, status, wallet_balance)
        VALUES (?, ?, ?, ?, 'STAFF', 'ACTIVE', 5000.00)
      `).run(s.name, s.email, s.phone, passwordHash);
      staffUserMap[s.email] = Number(info.lastInsertRowid);
      console.log(`  ➕ Created staff user: ${s.email}`);
    } else {
      staffUserMap[s.email] = existingUser.id;
    }
  }

  // 2. Theatres in Virudhunagar & Aruppukkottai
  const theatres = [
    {
      name: 'Rajalakshmi Theatre',
      location: 'Ramamoorthy Road / Sivagami Puram',
      address: 'Ramamoorthy Road, Sivagami Puram, Virudhunagar, Tamil Nadu 626001',
      city: 'Virudhunagar',
      description: 'Air-conditioned cinema with Dolby Atmos sound advertised. A top option for a modern cinema experience in Virudhunagar.',
      image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
      ownerEmail: 'staff@rajalakshmi.com',
      screens: [
        { name: 'Audi 1 - Dolby Atmos', capacity: 280, type: 'DOLBY' },
        { name: 'Audi 2 - RGB Laser', capacity: 160, type: 'STANDARD' }
      ]
    },
    {
      name: 'Apsara Theatre',
      location: 'Railway Feeder Road, Sivagami Puram',
      address: 'Railway Feeder Road, Sivagami Puram, Virudhunagar, Tamil Nadu 626001',
      city: 'Virudhunagar',
      description: 'Traditional single-screen cinema in town. Highly convenient and popular for checking local Tamil movie screenings.',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
      ownerEmail: 'staff@apsara.com',
      screens: [
        { name: 'Main Hall', capacity: 250, type: 'STANDARD' }
      ]
    },
    {
      name: 'Ritzy Sri Ram Cinemas',
      location: 'Shivanandham Road, Hanumaan Nagar',
      address: 'Shivanandham Road, Hanumaan Nagar, Virudhunagar, Tamil Nadu 626001',
      city: 'Virudhunagar',
      description: 'Advertised as an A/C cinema with 4K projection and 7.1 surround sound. Ideal for a premium audiovisual experience.',
      image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800&q=80',
      ownerEmail: 'staff@ritzy.com',
      screens: [
        { name: 'Screen 1 - 4K 7.1 Atmos', capacity: 220, type: 'VIP' },
        { name: 'Screen 2 - Premier', capacity: 140, type: 'STANDARD' }
      ]
    },
    {
      name: 'Amirtharaj Cinema Theatre',
      location: 'RR Nagar, near Old Bus Stand',
      address: 'RR Nagar, near Old Bus Stand, Virudhunagar, Tamil Nadu 626001',
      city: 'Virudhunagar',
      description: 'Local single-screen cinema offering a beloved, authentic traditional movie-going experience.',
      image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=80',
      ownerEmail: 'staff@amirtharaj.com',
      screens: [
        { name: 'Screen 1 - Main Auditorium', capacity: 210, type: 'STANDARD' }
      ]
    },
    {
      name: 'KLAS Max Screens',
      location: 'Railway Feeder Road, Aruppukkottai',
      address: 'Railway Feeder Road, Aruppukkottai, Tamil Nadu 626101',
      city: 'Aruppukkottai',
      description: 'A beautifully renovated cinema with modern screen and sound facilities outside Virudhunagar town.',
      image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=800&q=80',
      ownerEmail: 'staff@klasmax.com',
      screens: [
        { name: 'Max Screen 1 - Dolby', capacity: 260, type: 'DOLBY' },
        { name: 'Max Screen 2 - Gold', capacity: 150, type: 'VIP' }
      ]
    }
  ];

  const screenIdList = [];

  for (const t of theatres) {
    let existingTheatre = db.prepare('SELECT id FROM theatres WHERE name = ? AND city = ?').get(t.name, t.city);
    let theatreId;
    const ownerId = staffUserMap[t.ownerEmail];

    if (!existingTheatre) {
      const res = db.prepare(`
        INSERT INTO theatres (name, location, address, city, description, image, owner_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `).run(t.name, t.location, t.address, t.city, t.description, t.image, ownerId);
      theatreId = Number(res.lastInsertRowid);
      console.log(`  🏛️ Added Theatre: ${t.name} (${t.city})`);

      // Add to theatre_staff
      db.prepare(`
        INSERT OR IGNORE INTO theatre_staff (theatre_id, user_id) VALUES (?, ?)
      `).run(theatreId, ownerId);
    } else {
      theatreId = existingTheatre.id;
      console.log(`  ℹ️ Theatre already exists: ${t.name} (ID: ${theatreId})`);
    }

    // Screens
    for (const sc of t.screens) {
      let existingScreen = db.prepare('SELECT id FROM screens WHERE theatre_id = ? AND name = ?').get(theatreId, sc.name);
      let screenId;
      if (!existingScreen) {
        const scRes = db.prepare(`
          INSERT INTO screens (theatre_id, name, capacity, screen_type)
          VALUES (?, ?, ?, ?)
        `).run(theatreId, sc.name, sc.capacity, sc.type);
        screenId = Number(scRes.lastInsertRowid);
      } else {
        screenId = existingScreen.id;
      }
      screenIdList.push({ screenId, theatreId, name: sc.name });
    }
  }

  // 3. 20 Movies list
  const movies = [
    {
      title: 'Demonte Colony 3',
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
      duration: 145,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Horror / Mystery / Thriller',
      description: 'The terrifying paranormal curse of Demonte Colony resurfaces with deadlier supernatural forces haunting a new group of investigators.',
      release_date: '2026-10-09'
    },
    {
      title: 'Nova',
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
      duration: 138,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Sci-Fi / Action / Thriller',
      description: 'A revolutionary interstellar energy discovery plunges an undercover intelligence officer into a high-octane battle across technology hubs.',
      release_date: '2026-10-09'
    },
    {
      title: 'Flash Back',
      poster: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80',
      duration: 132,
      language: 'Tamil',
      rating: 'U',
      genre: 'Romantic Drama / Nostalgia',
      description: 'A touching emotional journey chronicling school sweethearts whose unsaid feelings find unexpected expression decades later.',
      release_date: '2026-10-14'
    },
    {
      title: 'Vettri Payanam',
      poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
      duration: 150,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Action / Inspirational Sports',
      description: 'A spirited rural track-and-field champion overcomes deep socio-economic barriers to represent the nation on the world athletics stage.',
      release_date: '2026-10-14'
    },
    {
      title: 'Anbil Avan',
      poster: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80',
      duration: 128,
      language: 'Tamil',
      rating: 'U',
      genre: 'Romance / Family Drama',
      description: 'An endearing tale of selflessness, unconditional affection, and familial bonds tested during trying times in southern Tamil Nadu.',
      release_date: '2026-10-02'
    },
    {
      title: 'Sigma',
      poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&q=80',
      duration: 140,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Action / Crime Thriller',
      description: 'A solitary vigilante mastermind takes down an untouchable financial syndicate through meticulous psychological warfare and sharp combat.',
      release_date: '2026-10-02'
    },
    {
      title: 'Kitti',
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
      duration: 125,
      language: 'Tamil',
      rating: 'U',
      genre: 'Comedy / Drama',
      description: 'Hilarious village rivalries and quirky town escapades unfold when childhood traditional games ignite a high-stakes local championship.',
      release_date: '2026-10-02'
    },
    {
      title: 'Baththa',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
      duration: 142,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Action / Crime',
      description: 'A gritty, raw saga of brotherhood, power struggles, and redemption set amidst the coastal freight harbors of Tamil Nadu.',
      release_date: '2026-10-01'
    },
    {
      title: 'Yezhu Kadal Yezhu Malai',
      poster: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
      duration: 155,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Epic Drama / Romance',
      description: 'An immortal traveller traverses eight millennia in search of enduring human love and spiritual understanding in this acclaimed masterpiece.',
      release_date: '2026-10-01'
    },
    {
      title: 'Meesaya Murukku 2',
      poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
      duration: 135,
      language: 'Tamil',
      rating: 'U',
      genre: 'Musical / Youth Comedy',
      description: 'Independent musicians and energetic campus dreamers unite to launch a viral independent record label against all traditional odds.',
      release_date: '2026-09-25'
    },
    {
      title: 'Dorothy',
      poster: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&q=80',
      duration: 124,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Psychological Mystery / Thriller',
      description: 'A renowned criminologist unravels cryptic journals left behind in an abandoned colonial estate in the misty Nilgiri hills.',
      release_date: '2026-09-25'
    },
    {
      title: 'Lenin Pandiyan',
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
      duration: 148,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Political Action / Drama',
      description: 'A fearless grassroots advocate rises through local civic politics to challenge corruption and champion agricultural workers.',
      release_date: '2026-09-25'
    },
    {
      title: 'Nallapadam',
      poster: 'https://images.unsplash.com/photo-1460881680858-30d870d7b511?w=600&q=80',
      duration: 130,
      language: 'Tamil',
      rating: 'U',
      genre: 'Social Drama / Family',
      description: 'A heart-warming narrative about an unconventional schoolteacher who revolutionizes rural education with compassion and creativity.',
      release_date: '2026-09-18'
    },
    {
      title: 'BeeP',
      poster: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&q=80',
      duration: 122,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Techno-Thriller / Suspense',
      description: 'When an enigmatic audio signal triggers bizarre cyber events across metropolitan centers, a sound engineer races against the clock.',
      release_date: '2026-09-18'
    },
    {
      title: 'Sandakari',
      poster: 'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=600&q=80',
      duration: 136,
      language: 'Tamil',
      rating: 'U',
      genre: 'Action Comedy / Romance',
      description: 'A fiery, independent corporate leader and an easy-going software architect clash in London and Madurai in this laugh riot.',
      release_date: '2026-09-18'
    },
    {
      title: 'Paris Cafe',
      poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80',
      duration: 120,
      language: 'Tamil',
      rating: 'U',
      genre: 'Romantic Drama',
      description: 'A Chennai barista takes up an apprenticeship in Paris and finds love, culinary art, and life-changing lessons along the Seine.',
      release_date: '2026-09-18'
    },
    {
      title: 'The Dark Heaven',
      poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80',
      duration: 140,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Supernatural Horror',
      description: 'Astronomers at an isolated observatory high on a mountain plateau witness celestial phenomena that unleash ancient cosmic dread.',
      release_date: '2026-09-18'
    },
    {
      title: 'Cold Call',
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
      duration: 118,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Suspense / Crime Thriller',
      description: 'A late-night crisis hotline operator receives a frantic call from an unknown location that exposes an unfolding conspiracy.',
      release_date: '2026-09-18'
    },
    {
      title: 'Enna Vilai',
      poster: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&q=80',
      duration: 134,
      language: 'Tamil',
      rating: 'U',
      genre: 'Romance / Melodrama',
      description: 'What price would you pay for true love? An emotional saga exploring the value of loyalty, commitment, and heartfelt promises.',
      release_date: '2026-09-17'
    },
    {
      title: 'Sardar 2',
      poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
      duration: 160,
      language: 'Tamil',
      rating: 'U/A',
      genre: 'Spy Action / Thriller',
      description: 'The legendary espionage agent returns from the shadows on an international undercover mission to dismantle a global biological threat.',
      release_date: '2026-09-10'
    }
  ];

  const movieIdList = [];
  for (const m of movies) {
    let existingMovie = db.prepare('SELECT id FROM movies WHERE title = ?').get(m.title);
    let mId;
    if (!existingMovie) {
      const res = db.prepare(`
        INSERT INTO movies (title, poster, duration, language, rating, genre, description, release_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(m.title, m.poster, m.duration, m.language, m.rating, m.genre, m.description, m.release_date);
      mId = Number(res.lastInsertRowid);
      console.log(`  🎬 Added Movie: ${m.title} (${m.release_date})`);
    } else {
      mId = existingMovie.id;
      // Update language and release date if needed
      db.prepare(`
        UPDATE movies SET language = ?, release_date = ?, genre = ?, description = ? WHERE id = ?
      `).run(m.language, m.release_date, m.genre, m.description, mId);
      console.log(`  ℹ️ Updated Movie: ${m.title} (ID: ${mId})`);
    }
    movieIdList.push(mId);
  }

  // 4. Create Shows for the newly added theatres and movies for upcoming dates!
  // Current local date is around 2026-10-15
  const today = new Date();
  const dateStrs = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  });

  const showTimes = [
    { start: '10:30', end: '13:00', intStart: '11:45', intEnd: '12:00', price: 400.0 },
    { start: '14:30', end: '17:00', intStart: '15:45', intEnd: '16:00', price: 450.0 },
    { start: '18:30', end: '21:00', intStart: '19:45', intEnd: '20:00', price: 500.0 },
    { start: '21:45', end: '00:15', intStart: '23:00', intEnd: '23:15', price: 500.0 },
  ];

  const insertShow = db.prepare(`
    INSERT INTO shows (
      movie_id, screen_id, show_date, start_time, end_time,
      interval_start, interval_end, price_estimate, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
  `);

  let addedShowsCount = 0;
  // Schedule shows on the new screens for the new movies
  for (let sIdx = 0; sIdx < screenIdList.length; sIdx++) {
    const screen = screenIdList[sIdx];
    // Assign 2 movies per screen across upcoming dates
    for (let dIdx = 0; dIdx < dateStrs.length; dIdx++) {
      const showDate = dateStrs[dIdx];
      const movie1 = movieIdList[(sIdx * 2 + dIdx) % movieIdList.length];
      const movie2 = movieIdList[(sIdx * 2 + dIdx + 1) % movieIdList.length];

      const t1 = showTimes[0];
      const t2 = showTimes[2];

      // Check if show already exists on this screen and date and start_time
      const check1 = db.prepare('SELECT id FROM shows WHERE screen_id = ? AND show_date = ? AND start_time = ?').get(screen.screenId, showDate, t1.start);
      if (!check1) {
        insertShow.run(movie1, screen.screenId, showDate, t1.start, t1.end, t1.intStart, t1.intEnd, t1.price);
        addedShowsCount++;
      }

      const check2 = db.prepare('SELECT id FROM shows WHERE screen_id = ? AND show_date = ? AND start_time = ?').get(screen.screenId, showDate, t2.start);
      if (!check2) {
        insertShow.run(movie2, screen.screenId, showDate, t2.start, t2.end, t2.intStart, t2.intEnd, t2.price);
        addedShowsCount++;
      }
    }
  }

  console.log(`🎟️ Scheduled ${addedShowsCount} shows for Virudhunagar theatres with new movies.`);
  console.log('✅ Successfully added all requested theatres and movies!');
}

addMoviesAndTheatres().catch((err) => {
  console.error('Error adding data:', err);
  process.exit(1);
});
