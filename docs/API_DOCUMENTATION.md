# CineMoments REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new customer or staff account.
- **Rate Limit**: 30 requests / 15 min.
- **Request Body**:
```json
{
  "name": "Rahul Verma",
  "email": "rahul@example.com",
  "phone": "+1-555-0100",
  "password": "Password123!",
  "role": "CUSTOMER"
}
```
- **Response (201)**:
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": 1, "name": "Rahul Verma", "email": "rahul@example.com", "role": "CUSTOMER" }
}
```

### `POST /auth/login`
Authenticates a user and issues JWT.
- **Request Body**:
```json
{
  "email": "rahul@example.com",
  "password": "Password123!"
}
```
- **Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": 1, "name": "Rahul Verma", "email": "rahul@example.com", "role": "CUSTOMER" }
}
```

### `GET /auth/me` [Protected]
Returns currently authenticated user profile and assigned theatre details.

---

## 2. Theatres & Catalog Endpoints

### `GET /theatres`
List all active theatres with screen count and available movies.

### `GET /theatres/:id`
Fetch theatre details, auditorium screens, and upcoming shows with interval statuses.

### `GET /movies`
List all movies in catalog with upcoming show counts.

### `GET /shows?theatreId=&movieId=&date=`
Query scheduled shows with interval times (`interval_start`, `interval_end`) and `is_interval_booked` flag.

---

## 3. Booking Endpoints

### `POST /bookings` [Protected: CUSTOMER, STAFF, ADMIN]
Submit a new interval booking request with optional encrypted media.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `showId`: number
  - `bookingType`: `'MARRIAGE_PROPOSAL' | 'LOVE_PROPOSAL' | 'ADVERTISEMENT' | 'BIRTHDAY' | ...`
  - `message`: string (max 250 characters)
  - `contactPhone`: string (optional)
  - `media`: File (JPG, PNG, MP4, WebM; max 25MB)
- **Response (201)**:
```json
{
  "success": true,
  "message": "Your interval booking request has been submitted and is pending theatre review.",
  "bookingId": 12,
  "status": "PENDING"
}
```

### `GET /bookings/my-bookings` [Protected: CUSTOMER]
Returns user's interval requests and overview statistics (`total`, `pending`, `accepted`, `expired`, `completed`).

### `GET /bookings/staff/queue?theatreId=&status=` [Protected: STAFF, ADMIN]
Returns incoming request queue for staff review, including summary metrics for overview cards.

### `POST /bookings/:id/accept` [Protected: STAFF, ADMIN]
Atomically accepts a booking request.
- **Behavior**:
  - Locks the interval slot
  - Marks target booking as `ACCEPTED`
  - Automatically marks competing requests as `EXPIRED`
  - Dispatches notifications
  - Writes audit log
- **Response (200)**:
```json
{
  "success": true,
  "message": "Booking request accepted successfully.",
  "result": {
    "bookingId": 12,
    "status": "ACCEPTED",
    "expiredCount": 2
  }
}
```

### `POST /bookings/:id/reject` [Protected: STAFF, ADMIN]
Rejects a request with an optional reason shown to the customer.

### `POST /bookings/:id/cancel` [Protected: CUSTOMER]
Cancels user's own pending booking.

---

## 4. Encrypted Media Endpoints

### `GET /media/:id/stream` [Protected]
Streams decrypted media on-the-fly.
- **Authorization**: Only the booking creator, assigned theatre staff, or admin.
- **Headers Returned**:
  - `Content-Type`: `image/jpeg`, `image/png`, `video/mp4`, `video/webm`
  - `Cache-Control`: `private, no-cache, no-store, must-revalidate`

---

## 5. Notifications & Administration

### `GET /notifications` [Protected]
Returns list of user notifications and unread count.

### `PUT /notifications/:id/read` [Protected]
Marks a notification as read.

### `GET /admin/stats` [Protected: ADMIN]
Returns system statistics (total users, theatres, shows, bookings breakdown).

### `GET /admin/audit-logs` [Protected: ADMIN]
Returns security audit trail entries with actor, action, timestamp, and IP address.
