# CineMoments — Architecture & Security Blueprint

CineMoments is a full-stack platform built for booking cinema movie intervals for personal marriage proposals, surprise birthday shout-outs, commercial promotions, and campus event announcements.

---

## 1. System Architecture

```
                                 ┌─────────────────────────────────┐
                                 │       React 18 + Tailwind       │
                                 │     (Dark Cinema UI Design)     │
                                 └────────────────┬────────────────┘
                                                  │ HTTPS / REST (JSON & Multipart)
                                                  ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           Node.js + Express.js Backend                            │
│                                                                                   │
│  [Helmet Security Headers]  [Rate Limiter]  [CORS Protection]  [Error Sanitizer]  │
│                                                                                   │
│  ┌───────────────────────┬────────────────────────────┬─────────────────────────┐  │
│  │   Auth Middleware     │     Upload Middleware      │   Expiration Worker     │  │
│  │  (JWT + Role Checks)  │ (Magic Bytes & AES Encrypt)│   (Background Cron)     │  │
│  └───────────────────────┴────────────────────────────┴─────────────────────────┘  │
│                                                                                   │
│  ┌───────────────────┐    ┌────────────────────┐    ┌───────────────────────────┐ │
│  │  Booking Service  │    │   Crypto Service   │    │    Notification Service   │ │
│  │ (Atomic Lock/Txn) │    │   (AES-256-GCM)    │    │      (In-App Alerts)      │ │
│  └─────────┬─────────┘    └─────────┬──────────┘    └─────────────┬─────────────┘ │
└────────────┼────────────────────────┼─────────────────────────────┼───────────────┘
             │                        │                             │
             ▼                        ▼                             ▼
┌───────────────────────────┐ ┌───────────────────┐   ┌───────────────────────────┐
│     Relational DB         │ │  Private Storage  │   │      Audit Trail          │
│   (SQLite / Postgres)     │ │ /uploads/*.enc    │   │  (Immutable Audit Logs)   │
│ ───────────────────────── │ └───────────────────┘   └───────────────────────────┘
│ UNIQUE(show_id)           │
│ WHERE status = 'ACCEPTED' │
└───────────────────────────┘
```

---

## 2. Preventing Double Acceptance (Atomic Concurrency)

The most critical requirement of this platform is ensuring that **two staff members cannot accept two different requests for the same interval slot concurrently**.

### The Two-Layer Protection System:

#### Layer 1: Application-Level Atomic Transaction with Exclusive Lock
When a staff member accepts a booking:
1. `runTransaction` initiates `BEGIN IMMEDIATE;` on the SQLite database (or `SELECT ... FOR UPDATE` in PostgreSQL/MySQL).
2. The transaction checks if any row for `show_id` already has `status = 'ACCEPTED'`.
3. If an accepted row exists, it immediately rolls back and throws an HTTP 409 Conflict error.
4. If clear, the target booking is marked `ACCEPTED`.
5. All competing pending requests for that exact same `show_id` are atomically updated to `EXPIRED`.
6. Notifications are created for both the accepted customer and all expired customers.
7. The transaction commits.

#### Layer 2: Database Storage Engine Partial Unique Index
Even if an application thread bug occurred, the database storage engine itself will physically reject any collision:
```sql
CREATE UNIQUE INDEX idx_unique_accepted_interval 
ON interval_bookings(show_id) 
WHERE status = 'ACCEPTED';
```
Any secondary attempt to insert or update a row to `status = 'ACCEPTED'` for the same `show_id` will trigger a raw `SQLITE_CONSTRAINT_UNIQUE` violation and fail immediately.

---

## 3. Sensitive Media Security & Encryption at Rest

Users upload sensitive personal proposal videos and private photographs. Protecting them requires end-to-end security:

1. **Magic Bytes Inspection**: Files are buffered into RAM; the backend inspects binary headers to verify real file signatures (JPEG `FF D8 FF`, PNG `89 50 4E 47`, MP4 `ftyp`, WebM `1A 45 DF A3`). Executable extensions or disguised scripts are rejected.
2. **AES-256-GCM Authenticated Encryption**:
   - Each file is encrypted with a unique 12-byte random Initialization Vector (IV).
   - The cipher produces a 16-byte authentication tag verifying data integrity.
   - The file is saved as random UUID `.enc` outside the public web root in `backend/uploads/`.
   - The 256-bit encryption key lives solely in environment variable `FILE_ENCRYPTION_KEY`, strictly separated from the database.
3. **Authorized Decrypted Streaming**:
   - Endpoint: `/api/media/:mediaId/stream`
   - Access is restricted exclusively to the booking owner, the authorized theatre staff, or super admins.
   - The stream is decrypted on-the-fly, validated with the authentication tag, and streamed with `Cache-Control: private, no-store`.

---

## 4. Automatic Expiration Background Scheduler

- A dedicated worker (`expirationWorker.ts`) runs every 60 seconds.
- It queries for any booking with `status IN ('PENDING', 'UNDER_REVIEW')` whose show time has already commenced or deadline passed.
- It marks them `EXPIRED` and dispatches in-app notifications so customers are never left waiting.
