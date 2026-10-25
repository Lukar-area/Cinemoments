import test from 'node:test';
import assert from 'node:assert/strict';
import { getDb } from '../db/database.js';
import { acceptBooking } from '../services/bookingService.js';
import { getUserNotifications } from '../services/notificationService.js';
test('Atomic Conflict Resolution and Double Acceptance Prevention', async (t) => {
    const db = getDb();
    await t.test('accepting one booking expires all competing requests and notifies users', () => {
        // 1. Create temporary test show
        const movie = db.prepare(`SELECT id FROM movies LIMIT 1`).get();
        const screen = db.prepare(`SELECT id FROM screens LIMIT 1`).get();
        const user1 = db.prepare(`SELECT id FROM users WHERE role = 'CUSTOMER' LIMIT 1`).get();
        const staff = db.prepare(`SELECT id FROM users WHERE role = 'STAFF' LIMIT 1`).get();
        const showRes = db.prepare(`
      INSERT INTO shows (movie_id, screen_id, show_date, start_time, end_time, interval_start, interval_end, price_estimate, status)
      VALUES (?, ?, '2026-12-31', '20:00', '22:30', '21:15', '21:30', 200, 'SCHEDULED')
    `).run(movie.id, screen.id);
        const testShowId = Number(showRes.lastInsertRowid);
        // 2. Create 3 competing requests for the same show
        const insertBooking = db.prepare(`
      INSERT INTO interval_bookings (user_id, show_id, booking_type, message, status)
      VALUES (?, ?, ?, ?, 'PENDING')
    `);
        const b1 = Number(insertBooking.run(user1.id, testShowId, 'MARRIAGE_PROPOSAL', 'Request 1').lastInsertRowid);
        const b2 = Number(insertBooking.run(user1.id, testShowId, 'BIRTHDAY', 'Request 2').lastInsertRowid);
        const b3 = Number(insertBooking.run(user1.id, testShowId, 'ADVERTISEMENT', 'Request 3').lastInsertRowid);
        // 3. Staff accepts b2
        const result = acceptBooking(b2, staff.id, '127.0.0.1');
        assert.equal(result.success, true);
        assert.equal(result.bookingId, b2);
        assert.equal(result.status, 'ACCEPTED');
        assert.equal(result.expiredCount, 2);
        // 4. Verify b2 is ACCEPTED
        const acceptedRow = db.prepare(`SELECT status, accepted_at FROM interval_bookings WHERE id = ?`).get(b2);
        assert.equal(acceptedRow.status, 'ACCEPTED');
        assert.ok(acceptedRow.accepted_at);
        // 5. Verify b1 and b3 automatically transitioned to EXPIRED
        const b1Row = db.prepare(`SELECT status FROM interval_bookings WHERE id = ?`).get(b1);
        const b3Row = db.prepare(`SELECT status FROM interval_bookings WHERE id = ?`).get(b3);
        assert.equal(b1Row.status, 'EXPIRED');
        assert.equal(b3Row.status, 'EXPIRED');
        // 6. Verify competing booking cannot be accepted now
        assert.throws(() => {
            acceptBooking(b1, staff.id, '127.0.0.1');
        }, (err) => {
            return err.statusCode === 400 || err.message.includes('Cannot accept booking');
        });
        // 7. Verify notifications generated
        const notifications = getUserNotifications(user1.id, 5);
        const acceptedNotif = notifications.find((n) => n.booking_id === b2);
        const expiredNotif = notifications.find((n) => n.booking_id === b1);
        assert.ok(acceptedNotif, 'Notification for accepted booking should exist');
        assert.ok(expiredNotif, 'Notification for expired booking should exist');
    });
    await t.test('database storage engine strictly rejects two ACCEPTED rows via unique index', () => {
        const movie = db.prepare(`SELECT id FROM movies LIMIT 1`).get();
        const screen = db.prepare(`SELECT id FROM screens LIMIT 1`).get();
        const user = db.prepare(`SELECT id FROM users LIMIT 1`).get();
        const showRes = db.prepare(`
      INSERT INTO shows (movie_id, screen_id, show_date, start_time, end_time, interval_start, interval_end, status)
      VALUES (?, ?, '2026-12-31', '14:00', '16:30', '15:15', '15:30', 'SCHEDULED')
    `).run(movie.id, screen.id);
        const uniqueTestShowId = Number(showRes.lastInsertRowid);
        // First accepted row succeeds
        db.prepare(`
      INSERT INTO interval_bookings (user_id, show_id, booking_type, message, status)
      VALUES (?, ?, 'CUSTOM', 'First accepted', 'ACCEPTED')
    `).run(user.id, uniqueTestShowId);
        // Second direct INSERT with ACCEPTED status must be rejected by the database unique index
        assert.throws(() => {
            db.prepare(`
        INSERT INTO interval_bookings (user_id, show_id, booking_type, message, status)
        VALUES (?, ?, 'CUSTOM', 'Second accepted - illegal collision', 'ACCEPTED')
      `).run(user.id, uniqueTestShowId);
        }, /UNIQUE constraint failed/);
    });
});
