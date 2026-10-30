import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

test('Theatre Staff Default First Person Allotment and Occupied Message Flow', async (suite) => {
    let server;
    let baseUrl;
    let customerAToken;
    let customerBToken;
    let customerCToken;
    let staffToken;
    let otherStaffToken;
    let adminToken;

    suite.before(async () => {
        await new Promise((resolve) => {
            server = http.createServer(app).listen(0, '127.0.0.1', () => {
                const addr = server.address();
                baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve();
            });
        });

        // 1. Login or create Customer A (First person)
        const custALogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'rahul@example.com', password: 'Password123!' }),
        });
        const custAData = await custALogin.json();
        customerAToken = custAData.token;

        // 2. Register/Login Customer B (Second person)
        const custBEmail = `customer_b_${Date.now()}@example.com`;
        const custBReg = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Priya Sharma',
                email: custBEmail,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                role: 'CUSTOMER',
                phone: '+91 98765 22222',
            }),
        });
        const custBData = await custBReg.json();
        customerBToken = custBData.token;

        // 3. Register/Login Customer C (Third person)
        const custCEmail = `customer_c_${Date.now()}@example.com`;
        const custCReg = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Vikram Singh',
                email: custCEmail,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                role: 'CUSTOMER',
                phone: '+91 98765 33333',
            }),
        });
        const custCData = await custCReg.json();
        customerCToken = custCData.token;

        // 4. Login Staff for Grand Palace Cinemas (theatre_grand_palace_1)
        const staffLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'staff@grandcinema.com', password: 'Password123!' }),
        });
        const staffData = await staffLogin.json();
        staffToken = staffData.token;

        // 5. Register Staff for another theatre
        const otherStaffEmail = `other_staff_${Date.now()}@example.com`;
        const otherStaffReg = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Starlight Staff',
                email: otherStaffEmail,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                role: 'STAFF',
                phone: '+91 98765 44444',
                theatreName: 'Starlight Multiplex',
                theatreLocation: 'Anna Nagar West',
                theatreAddress: '88 Roundtana Main Rd',
                city: 'Chennai',
                theatrePhone: '+91 44 2626 1234',
                theatreEmail: 'desk@starlight.test',
            }),
        });
        const otherStaffData = await otherStaffReg.json();
        otherStaffToken = otherStaffData.token;

        // 6. Login Admin
        const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@cinemoments.com', password: 'Password123!' }),
        });
        const adminData = await adminLogin.json();
        adminToken = adminData.token;
    });

    suite.after(async () => {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });

    let bookingAId;
    let bookingBId;
    let bookingCId;
    const targetShowId = 'show_gp_101'; // Grand Palace Cinemas open show

    await suite.test('1. Three patrons submit competing booking requests for the same show interval', async () => {
        // Customer A books first (T1)
        const reqA = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${customerAToken}`,
            },
            body: JSON.stringify({
                showId: targetShowId,
                bookingType: 'MARRIAGE_PROPOSAL',
                message: 'First applicant: Will you marry me Ananya?',
                contactPhone: '+91 98765 01000',
                paymentMethod: 'WALLET',
            }),
        });
        assert.equal(reqA.status, 201);
        const dataA = await reqA.json();
        assert.equal(dataA.success, true);
        bookingAId = dataA.bookingId;

        // Brief delay to ensure distinct created_at timestamp
        await new Promise((r) => setTimeout(r, 60));

        // Customer B books second (T2)
        const reqB = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${customerBToken}`,
            },
            body: JSON.stringify({
                showId: targetShowId,
                bookingType: 'BIRTHDAY',
                message: 'Second applicant: Happy 25th Birthday Priya!',
                contactPhone: '+91 98765 22222',
                paymentMethod: 'WALLET',
            }),
        });
        assert.equal(reqB.status, 201);
        const dataB = await reqB.json();
        assert.equal(dataB.success, true);
        bookingBId = dataB.bookingId;

        await new Promise((r) => setTimeout(r, 60));

        // Customer C books third (T3)
        const reqC = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${customerCToken}`,
            },
            body: JSON.stringify({
                showId: targetShowId,
                bookingType: 'ANNIVERSARY',
                message: 'Third applicant: Happy Anniversary Mom & Dad!',
                contactPhone: '+91 98765 33333',
                paymentMethod: 'WALLET',
            }),
        });
        assert.equal(reqC.status, 201);
        const dataC = await reqC.json();
        assert.equal(dataC.success, true);
        bookingCId = dataC.bookingId;
    });

    await suite.test('2. Staff review queue shows all 3 requests, with earliest applicant as first', async () => {
        const queueRes = await fetch(`${baseUrl}/api/bookings/staff/queue`, {
            headers: { Authorization: `Bearer ${staffToken}` },
        });
        assert.equal(queueRes.status, 200);
        const queueData = await queueRes.json();
        assert.equal(queueData.success, true);

        const showBookings = queueData.bookings.filter(b => b.show_id === targetShowId && b.status === 'PENDING');
        assert.ok(showBookings.length >= 3, 'Must have at least 3 pending bookings');

        // Verify sorted by created_at ascending: earliest applicant is Customer A
        showBookings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        assert.equal(showBookings[0].id, bookingAId, 'Earliest applicant must be Customer A');
    });

    await suite.test('3. Staff from another theatre cannot allot bookings for Grand Palace Cinemas (403 Forbidden)', async () => {
        const allotRes = await fetch(`${baseUrl}/api/bookings/staff/allot-first`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${otherStaffToken}`,
            },
            body: JSON.stringify({
                showId: targetShowId,
                theatreId: 'theatre_grand_palace_1',
            }),
        });
        assert.equal(allotRes.status, 403, 'Unauthorized staff must receive 403 Forbidden');
        const errData = await allotRes.json();
        assert.match(errData.message, /not authorized/i);
    });

    await suite.test('4. Staff clicks Allot First Person: selects Customer A and marks competitors as Occupied', async () => {
        const allotRes = await fetch(`${baseUrl}/api/bookings/staff/allot-first`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${staffToken}`,
            },
            body: JSON.stringify({
                showId: targetShowId,
            }),
        });
        assert.equal(allotRes.status, 200);
        const allotData = await allotRes.json();
        assert.equal(allotData.success, true);
        assert.equal(allotData.acceptedBookingId, bookingAId, 'Must accept Customer A (first person)');
        assert.ok(allotData.expiredCount >= 2, 'Must expire at least 2 competing requests');
        assert.match(allotData.message, /Occupied/i);
    });

    await suite.test('5. Verify Customer A is ACCEPTED and interval slot is locked', async () => {
        const bookingARes = await fetch(`${baseUrl}/api/bookings/${bookingAId}`, {
            headers: { Authorization: `Bearer ${customerAToken}` },
        });
        assert.equal(bookingARes.status, 200);
        const dataA = await bookingARes.json();
        assert.equal(dataA.booking.status, 'ACCEPTED');
    });

    await suite.test('6. Verify competing Customers B & C are EXPIRED with specific "Slot Occupied" message', async () => {
        // Check Customer B
        const bookingBRes = await fetch(`${baseUrl}/api/bookings/${bookingBId}`, {
            headers: { Authorization: `Bearer ${customerBToken}` },
        });
        assert.equal(bookingBRes.status, 200);
        const dataB = await bookingBRes.json();
        assert.equal(dataB.booking.status, 'EXPIRED');
        assert.ok(dataB.booking.rejection_reason, 'Must have rejection_reason');
        assert.match(
            dataB.booking.rejection_reason,
            /Slot Occupied: This interval slot for .* has already been occupied/i,
            'Must contain specific slot occupied message'
        );

        // Check Customer C
        const bookingCRes = await fetch(`${baseUrl}/api/bookings/${bookingCId}`, {
            headers: { Authorization: `Bearer ${customerCToken}` },
        });
        assert.equal(bookingCRes.status, 200);
        const dataC = await bookingCRes.json();
        assert.equal(dataC.booking.status, 'EXPIRED');
        assert.ok(dataC.booking.rejection_reason, 'Must have rejection_reason');
        assert.match(
            dataC.booking.rejection_reason,
            /Slot Occupied: This interval slot for .* has already been occupied/i,
            'Must contain specific slot occupied message'
        );
    });

    await suite.test('7. New booking requests for the occupied show are prevented (400 Bad Request)', async () => {
        const fourthReq = await fetch(`${baseUrl}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${customerBToken}`,
            },
            body: JSON.stringify({
                showId: targetShowId,
                bookingType: 'CUSTOM',
                message: 'Fourth attempt should be blocked',
                contactPhone: '+91 98765 22222',
                paymentMethod: 'WALLET',
            }),
        });
        assert.equal(fourthReq.status, 400);
        const errData = await fourthReq.json();
        assert.match(errData.message, /already been booked/i);
    });
});
