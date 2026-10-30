import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

test('Available Theatres, Movies, Showtimes, and Interval Booking Flow', async (suite) => {
    let server;
    let baseUrl;
    let customerToken;

    suite.before(async () => {
        await new Promise((resolve) => {
            server = http.createServer(app).listen(0, '127.0.0.1', () => {
                const addr = server.address();
                baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve();
            });
        });

        // Obtain valid customer token
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'rahul@example.com',
                password: 'Password123!',
            }),
        });
        const loginData = await loginRes.json();
        customerToken = loginData.token;
    });

    suite.after(async () => {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });

    await suite.test('1. GET /api/theatres returns dynamic theatres with facilities and schedule metadata', async () => {
        const res = await fetch(`${baseUrl}/api/theatres`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(Array.isArray(data.theatres), 'Must return theatres array');
        assert.ok(data.theatres.length > 0, 'Must have theatres available');

        const firstTheatre = data.theatres[0];
        assert.ok(firstTheatre.name, 'Theatre must have name');
        assert.ok(firstTheatre.location, 'Theatre must have location');
        assert.ok(firstTheatre.image, 'Theatre must have image');
        assert.ok(Array.isArray(firstTheatre.facilities), 'Theatre must provide available facilities array');
        assert.ok(firstTheatre.facilities.length > 0, 'Facilities array must not be empty');
        assert.ok(firstTheatre.facilities.includes('4K Laser Digital Projection') || firstTheatre.facilities.includes('4K Laser Projection'));
    });

    await suite.test('2. GET /api/theatres?activeSchedulesOnly=true filters out theatres without active schedules', async () => {
        const allRes = await fetch(`${baseUrl}/api/theatres`);
        const allData = await allRes.json();

        const activeRes = await fetch(`${baseUrl}/api/theatres?activeSchedulesOnly=true`);
        assert.equal(activeRes.status, 200);
        const activeData = await activeRes.json();
        assert.equal(activeData.success, true);

        // Every theatre returned with activeSchedulesOnly must have active schedules
        for (const t of activeData.theatres) {
            assert.equal(t.has_active_schedules, true, `Theatre ${t.name} must have active schedules`);
            assert.ok(t.active_shows_count > 0, `Theatre ${t.name} must have active shows count > 0`);
        }
    });

    await suite.test('3. GET /api/movies?theatreId=... returns only movies currently scheduled at that theatre', async () => {
        // Query movies for Grand Palace Cinema
        const res = await fetch(`${baseUrl}/api/movies?theatreId=theatre_grand_palace_1`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(Array.isArray(data.movies));
        assert.ok(data.movies.length > 0, 'Grand Palace must have scheduled movies');

        for (const m of data.movies) {
            assert.ok(m.title, 'Movie must have title');
            assert.ok(m.poster, 'Movie must have poster');
            assert.ok(m.duration, 'Movie must have duration');
            assert.ok(m.language, 'Movie must have language');
            assert.ok(m.genre, 'Movie must have genre');
            assert.ok(m.rating, 'Movie must have rating');
            assert.ok(m.upcoming_shows_count > 0, 'Movie must have upcoming shows count at this theatre');
        }
    });

    await suite.test('4. Empty state: Theatre with no scheduled movies returns empty list', async () => {
        const res = await fetch(`${baseUrl}/api/movies?theatreId=theatre_empty_schedule_6`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.movies.length, 0, 'Should return empty array for theatre without shows');
    });

    await suite.test('5. GET /api/theatres/:id returns theatre details, facilities, screens, shows, and movies', async () => {
        const res = await fetch(`${baseUrl}/api/theatres/theatre_grand_palace_1`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.theatre.name, 'Grand Palace Cinema');
        assert.ok(Array.isArray(data.theatre.facilities), 'Must include facilities');
        assert.ok(Array.isArray(data.movies), 'Must include movies list scheduled at theatre');
        assert.ok(Array.isArray(data.shows), 'Must include shows list');
    });

    await suite.test('6. GET /api/shows with theatreId and movieId returns showtimes with interval windows', async () => {
        const res = await fetch(
            `${baseUrl}/api/shows?theatreId=theatre_grand_palace_1&movieId=movie_interstellar_1`
        );
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(Array.isArray(data.shows));
        assert.ok(data.shows.length > 0, 'Must have shows for Interstellar at Grand Palace');

        const show = data.shows[0];
        assert.ok(show.show_date, 'Show must have show_date');
        assert.ok(show.start_time, 'Show must have start_time');
        assert.ok(show.end_time, 'Show must have end_time');
        assert.ok(show.interval_start, 'Show must have interval_start');
        assert.ok(show.interval_end, 'Show must have interval_end');
        assert.ok(show.screen_name, 'Show must have screen_name');
        assert.ok(show.price_estimate, 'Show must have price_estimate');
        assert.equal(typeof show.is_interval_booked, 'number');
    });

    await suite.test('7. Interval Booking: Submitting booking for an open interval slot succeeds', async () => {
        // Find an open show
        const showsRes = await fetch(
            `${baseUrl}/api/shows?theatreId=theatre_grand_palace_1&movieId=movie_interstellar_1`
        );
        const showsData = await showsRes.json();
        const openShow = showsData.shows.find(s => s.is_interval_booked === 0);
        assert.ok(openShow, 'Must find an open show for testing');

        const bookingPayload = {
            showId: openShow.id,
            bookingType: 'MARRIAGE_PROPOSAL',
            message: 'Pooja, will you marry me under the big screen stars? ❤️',
            contactPhone: '+91 98765 02001',
            paymentMethod: 'WALLET',
        };

        const res = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${customerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingPayload),
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.bookingId, 'Must return generated bookingId');
        assert.equal(data.status, 'PENDING');
    });

    await suite.test('8. Duplicate Prevention: Cannot submit duplicate booking for the same show by same user', async () => {
        // Attempt to submit identical booking for the same show
        const showsRes = await fetch(
            `${baseUrl}/api/shows?theatreId=theatre_grand_palace_1&movieId=movie_interstellar_1`
        );
        const showsData = await showsRes.json();
        const targetShow = showsData.shows[0];

        const duplicatePayload = {
            showId: targetShow.id,
            bookingType: 'BIRTHDAY',
            message: 'Duplicate request attempt that must be rejected.',
            contactPhone: '+91 98765 02001',
            paymentMethod: 'WALLET',
        };

        const res = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${customerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(duplicatePayload),
        });

        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.message.toLowerCase().includes('already have an active'));
    });

    await suite.test('9. Unavailable Slots: Booking an already reserved interval slot is rejected', async () => {
        // show_gp_103 is marked is_interval_booked: 1 in fallback store
        const payload = {
            showId: 'show_gp_103',
            bookingType: 'MARRIAGE_PROPOSAL',
            message: 'Attempting to book a reserved slot.',
            paymentMethod: 'WALLET',
        };

        const res = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${customerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.message.toLowerCase().includes('already been booked'));
    });
});
