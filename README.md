# 🎬 CineMoments — Cinema Interval Booking Platform

> **"Make your moment unforgettable on the big screen."**

CineMoments is a modern, secure, full-stack web application designed for booking cinema movie intervals for personal marriage proposals, romantic confessions, surprise birthday celebrations, commercial advertisements, and campus event promotions.

---

## 🌟 Key Features

1. **Strict Single-Acceptance & Double-Acceptance Prevention**:
   - Competing guests can submit requests for the same interval slot.
   - When theatre staff accepts **one** request, the system **atomically marks competing requests as EXPIRED**.
   - Backed by an exclusive atomic database transaction and a database-level partial unique index (`idx_unique_accepted_interval ON interval_bookings(show_id) WHERE status = 'ACCEPTED'`), guaranteeing physical impossibility of double bookings.

2. **AES-256-GCM Media Encryption at Rest**:
   - Uploaded proposal photos and videos are never stored in plaintext on disk.
   - Server validates file magic bytes (JPEG, PNG, MP4, WebM) to block disguised executables.
   - Files are encrypted on ingestion using authenticated **AES-256-GCM** with random 12-byte IVs.
   - Decrypted only on-the-fly when authorized owners or theatre staff stream the media.

3. **8-Step Guided Booking Wizard**:
   - Select Theatre ➡️ Select Movie & Show ➡️ Inspect Interval Slot ➡️ Choose Purpose ➡️ Enter Message ➡️ Upload Media ➡️ **Live Cinema Big-Screen Mockup Preview** ➡️ Final Confirmation.

4. **Dedicated Role Dashboards**:
   - **Customer Dashboard**: Real-time status cards (Pending, Accepted, Expired, Completed), booking cancellation, media preview, in-app notification alerts.
   - **Theatre Staff Dashboard**: Live request review queue with filters, media inspection, one-click atomic acceptance, rejection with remarks.
   - **Super Admin Hub**: Platform-wide metrics, user permission management, global bookings monitor, immutable security audit trails.

5. **Automatic Request Expiration**:
   - Background worker running every 60 seconds automatically transitions pending requests whose showtime has passed to `EXPIRED` and dispatches alerts to customers.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+ (Node.js v24.17+ built-in support used)
- npm v10+

### 1. Backend Setup
```bash
# Move to backend directory
cd backend

# Install dependencies (already installed)
npm install

# Seed the database with demo theatres, movies, shows, and users
npm run seed

# Run automated test suite
npm test

# Start backend dev server (Runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup
```bash
# Move to frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Build or start frontend dev server (Runs on http://localhost:5173)
npm run dev
```

---

## 👥 Demo User Credentials

The database comes pre-seeded with ready-to-test accounts (you can also use the **1-Click Quick Login** buttons on the login page):

| Role | Email | Password | Assigned Entity |
| :--- | :--- | :--- | :--- |
| **Customer 1** | `rahul@example.com` | `Password123!` | Active Proposals & Birthday Requests |
| **Customer 2** | `priya@example.com` | `Password123!` | Competing Request on same show |
| **Customer 3** | `alex@example.com` | `Password123!` | Competing Promotion Request |
| **Theatre Staff** | `staff@grandcinema.com` | `Password123!` | Grand Palace Cinema |
| **Super Admin** | `admin@cinemoments.com` | `Password123!` | Full System Access |

---

## 🧪 Testing Concurrency & Conflict Prevention

Run the automated test suite in `backend/`:
```bash
npm --prefix backend test
```

### What the tests verify:
1. **Atomic Conflict Resolution**: Spawns 3 competing booking requests for the same show interval. Accepting Request 2 verifies Request 2 becomes `ACCEPTED`, while Requests 1 & 3 atomically transition to `EXPIRED`.
2. **Double Acceptance Engine Rejection**: Attempts a second `INSERT` with `status = 'ACCEPTED'` for the same `show_id`. The database engine itself throws a `UNIQUE constraint failed: interval_bookings.show_id` error.
3. **AES-256-GCM Encryption**: Verifies encrypted ciphertext on disk matches neither plaintext nor has missing tags; verifies tampering detection and magic-byte header validation.
4. **Password Hashing & JWT**: Verifies bcrypt hashing with salt rounds and role-based token validation.

---

## 📂 Project Structure

```
cinemoments/
├── backend/
│   ├── src/
│   │   ├── config/              # Centralized environment variables
│   │   ├── db/                  # SQLite connection with WAL mode & seed script
│   │   ├── middleware/          # JWT auth, role guard, secure upload, rate limiter, errors
│   │   ├── services/            # Atomic booking service, AES crypto, notifications, worker
│   │   ├── controllers/         # REST API handlers for auth, bookings, theatres, admin
│   │   ├── routes/              # Express route definitions
│   │   └── tests/               # Concurrency, encryption, and auth tests
│   └── uploads/                 # Private encrypted storage outside public web root
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client with token interceptor
│   │   ├── context/             # AuthContext & NotificationContext
│   │   ├── components/          # Navbar, Footer, StatusBadge, ScreenMockupPreview, Modals
│   │   └── pages/               # Home, Theatres, Movies, 8-Step Wizard, Dashboards, Auth
├── database/                    # SQL DDL schemas for SQLite, PostgreSQL, and MySQL
└── docs/                        # Architecture & API documentation
```

---

## 🍿 TMDB Movie Data Importer & Local Showcase Website

CineMoments includes an automated, rate-compliant **TMDB Movie Data Importer** (`scripts/importMovies.js`) and a standalone **Movie Showcase Website** (`server.js`) that reads records directly from MongoDB and serves downloaded posters locally with **zero external TMDB API calls during user browsing**.

### 🌟 Importer Features
- **Configurable Pagination**: Defaults to 5 pages (100 popular movies), customizable via `TMDB_PAGES` in `.env` or `--pages=N`.
- **Complete Schema Mapping**: Saves `tmdbId`, `title`, `originalTitle`, `overview`, `releaseDate`, `language`, `genreIds`, `rating`, `posterPath`, and `posterLocalPath`.
- **Local Poster Caching**: Downloads TMDB poster images into `public/images/movies/<tmdbId>.jpg`. Re-running does not re-download existing valid files.
- **Idempotent Upsert**: Creates a unique index on `{ tmdbId: 1 }` and upserts documents so repeated executions never create duplicates.
- **Resilience & Rate Limiting**: Built-in HTTP 429 backoff handling, download retries, and real-time console progress.
- **Strict Privacy & Attribution**: Zero client-side TMDB API calls when users browse the catalog. Includes official TMDB attribution banner and legal compliance notice.

---

### 📦 Installation & Setup

#### 1. Install Dependencies
```bash
# In the project root
npm install
```

#### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and provide your credentials:
```env
# MongoDB Connection URI (Local or Atlas)
MONGODB_URI=mongodb://localhost:27017/cinemoments
MONGODB_DB_NAME=cinemoments

# The Movie Database (TMDB) API Read Access Token (v4 Bearer Token)
TMDB_ACCESS_TOKEN=your_tmdb_api_read_access_token_here

# Number of popular movie pages to import (optional, default: 5)
TMDB_PAGES=5

# Port for local showcase website (default: 3000)
PORT=3000
```

> **How to get a TMDB Token:**
> 1. Sign up for free at [themoviedb.org](https://www.themoviedb.org/signup).
> 2. Go to **Settings** ➡️ **API** (https://www.themoviedb.org/settings/api).
> 3. Under **API Read Access Token**, copy your Bearer Token and paste it into `.env` as `TMDB_ACCESS_TOKEN`.

---

### 🚀 Running the Importer

Run the importer once to populate your MongoDB database and download posters:
```bash
# Using npm script (uses TMDB_PAGES from .env, default 5 pages)
npm run import:movies

# Or run directly with custom page count:
node scripts/importMovies.js --pages=10
```

#### Expected Output:
```text
=================================================================
🎬 CineMoments - TMDB Movie Data Importer
=================================================================
ℹ️  TMDB Access Token:    eyJhb...****
ℹ️  MongoDB Target URI:   mongodb://localhost:27017/cinemoments
ℹ️  Pages to Fetch:       5 (~100 movies)
ℹ️  Local Poster Storage: E:\cinemoments\public\images\movies

🔌 Connecting to MongoDB...
✅ Connected successfully to MongoDB (database: "cinemoments")
✅ Verified unique index on { tmdbId: 1 } in "movies" collection.

🚀 Starting TMDB movie extraction...

📥 Fetching TMDB Popular Movies Page 1/5... Done (20 movies retrieved)
📥 Fetching TMDB Popular Movies Page 2/5... Done (20 movies retrieved)
...
=================================================================
🎉 TMDB IMPORT COMPLETED SUCCESSFULLY!
=================================================================
⏱️  Duration:             6.2s
📄 Pages Processed:      5
🎬 Total Movies Fetched: 100
✨ New Records Inserted: 100
🔄 Records Updated:      0
🖼️  Posters Stored:       100 saved to /public/images/movies/
⚠️  Posters Missing:      0
=================================================================
```

---

### 🌐 Starting the Movie Showcase Website

Start the local movie showcase website:
```bash
npm run start:website
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
- Displays all movies stored in MongoDB.
- All movie posters load strictly from `/images/movies/<tmdbId>.jpg` on your local server.
- Interactive filtering by title search, genre dropdown, and minimum rating slider.
- Zero requests are sent to TMDB when users browse the website.

---

### 🔍 Verifying Imported Records in MongoDB

You can verify the imported records using either `mongosh` or Node.js:

#### Option A: Using `mongosh`
```bash
mongosh "mongodb://localhost:27017/cinemoments"
```
```javascript
// Count total imported movies
db.movies.countDocuments();

// Inspect a sample movie record
db.movies.findOne({}, { title: 1, tmdbId: 1, rating: 1, posterLocalPath: 1 });

// Verify the unique index on tmdbId
db.movies.getIndexes();
```

#### Option B: Inspecting the API Endpoint
Navigate to `http://localhost:3000/api/movies` to view the JSON output directly from MongoDB.

---

### ⚖️ TMDB API Attribution & Terms of Use

> **Notice:** This product uses the TMDB API but is not endorsed or certified by TMDB.
> 
> When using TMDB data and images, you must comply with the [TMDB API Terms of Use](https://www.themoviedb.org/documentation/api/terms-of-use). Remember to display the TMDB logo and attribution notice as shown on the website and in documentation.

