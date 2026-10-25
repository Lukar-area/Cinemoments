-- CineMoments - Cinema Interval Booking Platform
-- SQLite Database Schema (Production & Development)

PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Theatres table
CREATE TABLE IF NOT EXISTS theatres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    description TEXT,
    image TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Theatre staff assignments
CREATE TABLE IF NOT EXISTS theatre_staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theatre_id INTEGER NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theatre_id, user_id)
);

-- Screens table
CREATE TABLE IF NOT EXISTS screens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theatre_id INTEGER NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    screen_type TEXT NOT NULL DEFAULT 'STANDARD' CHECK (screen_type IN ('STANDARD', 'IMAX', '4DX', 'DOLBY', 'VIP')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    poster TEXT,
    duration INTEGER NOT NULL, -- minutes
    language TEXT NOT NULL DEFAULT 'English',
    rating TEXT NOT NULL DEFAULT 'PG-13',
    genre TEXT NOT NULL,
    description TEXT,
    release_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Movie Shows table
CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    screen_id INTEGER NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    start_time TEXT NOT NULL, -- HH:MM
    end_time TEXT NOT NULL,   -- HH:MM
    interval_start TEXT NOT NULL, -- HH:MM
    interval_end TEXT NOT NULL,   -- HH:MM
    price_estimate NUMERIC NOT NULL DEFAULT 150.00,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Interval Bookings table
CREATE TABLE IF NOT EXISTS interval_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    booking_type TEXT NOT NULL CHECK (booking_type IN (
        'MARRIAGE_PROPOSAL', 'LOVE_PROPOSAL', 'ADVERTISEMENT', 
        'BIRTHDAY', 'ANNIVERSARY', 'PROMOTION', 'EVENT', 'CUSTOM'
    )),
    message TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'COMPLETED'
    )),
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    expires_at DATETIME
);

-- CRITICAL: Prevent Double Acceptance at Database Engine Level
-- SQLite Partial Unique Index: Strictly allows only 1 booking with status 'ACCEPTED' per show_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_accepted_interval 
ON interval_bookings(show_id) 
WHERE status = 'ACCEPTED';

-- Fast lookups for customer dashboard and staff lists
CREATE INDEX IF NOT EXISTS idx_bookings_user ON interval_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_show ON interval_bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON interval_bookings(status);

-- Booking Media (Encrypted at Rest)
CREATE TABLE IF NOT EXISTS booking_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL REFERENCES interval_bookings(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('IMAGE', 'VIDEO')),
    encrypted_file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    iv TEXT NOT NULL,        -- Hex encoded 12-byte IV for AES-256-GCM
    auth_tag TEXT NOT NULL,  -- Hex encoded 16-byte Auth Tag for AES-256-GCM
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES interval_bookings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'GENERAL' CHECK (type IN ('ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'GENERAL')),
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
