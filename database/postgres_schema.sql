-- CineMoments - Cinema Interval Booking Platform
-- PostgreSQL Schema

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE screen_type_enum AS ENUM ('STANDARD', 'IMAX', '4DX', 'DOLBY', 'VIP');
CREATE TYPE show_status AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
CREATE TYPE booking_type_enum AS ENUM (
    'MARRIAGE_PROPOSAL', 'LOVE_PROPOSAL', 'ADVERTISEMENT', 
    'BIRTHDAY', 'ANNIVERSARY', 'PROMOTION', 'EVENT', 'CUSTOM'
);
CREATE TYPE booking_status_enum AS ENUM (
    'PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'COMPLETED'
);
CREATE TYPE media_type_enum AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE notification_type_enum AS ENUM ('ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'GENERAL');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CUSTOMER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theatres table
CREATE TABLE theatres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    image TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status entity_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theatre staff assignments
CREATE TABLE theatre_staff (
    id SERIAL PRIMARY KEY,
    theatre_id INTEGER NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(theatre_id, user_id)
);

-- Screens table
CREATE TABLE screens (
    id SERIAL PRIMARY KEY,
    theatre_id INTEGER NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    screen_type screen_type_enum NOT NULL DEFAULT 'STANDARD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Movies table
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    poster TEXT,
    duration INTEGER NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'English',
    rating VARCHAR(20) NOT NULL DEFAULT 'PG-13',
    genre VARCHAR(100) NOT NULL,
    description TEXT,
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Shows table
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    screen_id INTEGER NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    interval_start TIME NOT NULL,
    interval_end TIME NOT NULL,
    price_estimate NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
    status show_status NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Interval Bookings table
CREATE TABLE interval_bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    booking_type booking_type_enum NOT NULL,
    message TEXT NOT NULL,
    contact_phone VARCHAR(50),
    status booking_status_enum NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- CRITICAL: Prevent Double Acceptance in PostgreSQL
-- Partial unique index enforces only ONE ACCEPTED booking per show
CREATE UNIQUE INDEX idx_unique_accepted_interval 
ON interval_bookings(show_id) 
WHERE status = 'ACCEPTED';

CREATE INDEX idx_bookings_user ON interval_bookings(user_id);
CREATE INDEX idx_bookings_show ON interval_bookings(show_id);
CREATE INDEX idx_bookings_status ON interval_bookings(status);

-- Media Encrypted at Rest
CREATE TABLE booking_media (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES interval_bookings(id) ON DELETE CASCADE,
    file_type media_type_enum NOT NULL,
    encrypted_file_path TEXT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES interval_bookings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum NOT NULL DEFAULT 'GENERAL',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
