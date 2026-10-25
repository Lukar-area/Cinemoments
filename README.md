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

## 🛡️ Production & Database Migration
- Out of the box, CineMoments runs on **Node 24 native SQLite with WAL mode**.
- To migrate to **PostgreSQL** or **MySQL 8.0**, execute the DDL scripts in `database/postgres_schema.sql` or `database/mysql_schema.sql`.
