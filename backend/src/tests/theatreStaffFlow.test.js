import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

test('Theatre Staff Registration, Association, and Dashboard Access Flow', async (suite) => {
    let server;
    let baseUrl;

    suite.before(async () => {
        await new Promise((resolve) => {
            server = http.createServer(app).listen(0, '127.0.0.1', () => {
                const addr = server.address();
                baseUrl = `http://127.0.0.1:${addr.port}`;
                resolve();
            });
        });
    });

    suite.after(async () => {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });

    await suite.test('1. Registration rejects STAFF when required theatre details or staff phone are missing', async () => {
        const payloadMissingTheatre = {
            name: 'Staff Candidate',
            email: 'candidate1@theatre.test',
            phone: '+91 98765 11111',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            role: 'STAFF',
            // theatreName missing
            theatreLocation: 'Central Mall',
            theatreAddress: '100 Main Road',
            city: 'Chennai',
            theatrePhone: '+91 44 2811 0000',
            theatreEmail: 'desk@centralmallcinema.com',
        };

        const res1 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadMissingTheatre),
        });

        assert.equal(res1.status, 400);
        const data1 = await res1.json();
        assert.equal(data1.success, false);
        assert.ok(data1.message.includes('theatre details'));

        const payloadMissingPhone = {
            name: 'Staff Candidate',
            email: 'candidate2@theatre.test',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            role: 'STAFF',
            theatreName: 'Central Mall Cinemas',
            theatreLocation: 'Central Mall',
            theatreAddress: '100 Main Road',
            city: 'Chennai',
            theatrePhone: '+91 44 2811 0000',
            theatreEmail: 'desk@centralmallcinema.com',
        };

        const res2 = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadMissingPhone),
        });

        assert.equal(res2.status, 400);
        const data2 = await res2.json();
        assert.equal(data2.success, false);
        assert.ok(data2.message.includes('phone number is required'));
    });

    await suite.test('2. Registration successfully creates STAFF account and associates theatre', async () => {
        const staffPayload = {
            name: 'Karthik Raja',
            email: 'karthik@chennairoyl.test',
            phone: '+91 98401 22334',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            role: 'STAFF',
            theatreName: 'Chennai Royal Cinemas',
            theatreLocation: 'T. Nagar',
            theatreAddress: '12 Usman Road',
            city: 'Chennai',
            theatrePhone: '+91 44 2434 5566',
            theatreEmail: 'contact@chennairoyl.test',
        };

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(staffPayload),
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.token, 'Must return JWT token');
        assert.equal(data.user.role, 'STAFF');
        assert.equal(data.user.name, 'Karthik Raja');
        assert.ok(data.user.theatre, 'Must return populated theatre details');
        assert.equal(data.user.theatre.name, 'Chennai Royal Cinemas');
        assert.equal(data.user.theatre.location, 'T. Nagar');
        assert.equal(data.user.theatre.city, 'Chennai');
        assert.equal(data.user.theatre.address, '12 Usman Road');
        assert.equal(data.user.theatre.contact_phone, '+91 44 2434 5566');
        assert.equal(data.user.theatre.contact_email, 'contact@chennairoyl.test');
        assert.ok(data.user.assignedTheatreId);
    });

    await suite.test('3. Deduplication: Second staff colleague joins existing theatre without duplication', async () => {
        const secondStaffPayload = {
            name: 'Meena Sundaram',
            email: 'meena@chennairoyl.test',
            phone: '+91 98401 99887',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            role: 'STAFF',
            theatreName: 'Chennai Royal Cinemas', // Same name
            theatreLocation: 'T. Nagar',
            theatreAddress: '12 Usman Road',       // Same address
            city: 'Chennai',
            theatrePhone: '+91 44 2434 5566',
            theatreEmail: 'contact@chennairoyl.test',
        };

        const res = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(secondStaffPayload),
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.user.name, 'Meena Sundaram');
        assert.equal(data.user.theatre.name, 'Chennai Royal Cinemas');
        assert.equal(data.user.theatre.address, '12 Usman Road');
    });

    await suite.test('4. Staff login returns associated theatre information and assignedTheatreId', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@grandcinema.com',
                password: 'Password123!',
            }),
        });

        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.user.role, 'STAFF');
        assert.equal(data.user.assignedTheatreId, 'theatre_grand_palace_1');
        assert.ok(data.user.theatre, 'Must return theatre object on login');
        assert.equal(data.user.theatre.name, 'Grand Palace Cinema');
        assert.equal(data.user.theatre.city, 'Mumbai');
        assert.equal(data.user.theatre.address, '450 Heritage Blvd');
        assert.equal(data.user.theatre.contact_phone, '+91 22 2845 1100');
    });

    await suite.test('5. GET /api/theatres/staff/current retrieves staff authorized theatre details', async () => {
        // Log in as demo staff
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@grandcinema.com',
                password: 'Password123!',
            }),
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        const res = await fetch(`${baseUrl}/api/theatres/staff/current`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.theatre);
        assert.equal(data.theatre.name, 'Grand Palace Cinema');
        assert.equal(data.theatre.city, 'Mumbai');
        assert.equal(data.theatre.address, '450 Heritage Blvd');
        assert.equal(data.theatre.contact_phone, '+91 22 2845 1100');
        assert.ok(Array.isArray(data.theatres));
    });

    await suite.test('6. GET /api/theatres/staff/current?theatreId=... rejects unauthorized theatre with 403', async () => {
        // staff@grandcinema.com is assigned to theatre_grand_palace_1
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@grandcinema.com',
                password: 'Password123!',
            }),
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Try to access theatre_starlight_2
        const res = await fetch(`${baseUrl}/api/theatres/staff/current?theatreId=theatre_starlight_2`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.message.includes('Unauthorized'));
    });

    await suite.test('7. Staff bookings queue enforces authorization: 403 on unauthorized theatre parameter', async () => {
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'staff@grandcinema.com',
                password: 'Password123!',
            }),
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Attempt to access another theatre's booking queue
        const res = await fetch(`${baseUrl}/api/bookings/staff/queue?theatreId=theatre_apexcine_3`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.message.toLowerCase().includes('permission') || data.message.toLowerCase().includes('unauthorized'));
    });

    await suite.test('8. Staff without theatre receives clear message and does not access unauthorized data', async () => {
        // Create a token for a staff account without an assigned theatre
        const unassignedToken = jwt.sign(
            { id: 'mem_unassigned_staff_001', role: 'STAFF' },
            config.jwtSecret,
            { expiresIn: '1d' }
        );

        const currentRes = await fetch(`${baseUrl}/api/theatres/staff/current`, {
            headers: { 'Authorization': `Bearer ${unassignedToken}` },
        });

        assert.equal(currentRes.status, 200);
        const currentData = await currentRes.json();
        assert.equal(currentData.theatre, null);
        assert.ok(currentData.message.includes('No theatre is currently associated'));

        const queueRes = await fetch(`${baseUrl}/api/bookings/staff/queue`, {
            headers: { 'Authorization': `Bearer ${unassignedToken}` },
        });

        assert.equal(queueRes.status, 200);
        const queueData = await queueRes.json();
        assert.equal(queueData.theatreId, null);
        assert.equal(queueData.bookings.length, 0);
        assert.ok(queueData.message.includes('No theatre associated'));
    });

    await suite.test('9. Admin can access any theatre bookings queue', async () => {
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@cinemoments.com',
                password: 'Password123!',
            }),
        });
        const loginData = await loginRes.json();
        const adminToken = loginData.token;

        const res = await fetch(`${baseUrl}/api/bookings/staff/queue?theatreId=theatre_grand_palace_1`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
        });

        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.cards);
    });

    await suite.test('10. Customer registration and login remains completely functional', async () => {
        const customerPayload = {
            name: 'New Moviegoer',
            email: `moviegoer_${Date.now()}@test.com`,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            role: 'CUSTOMER',
        };

        const regRes = await fetch(`${baseUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerPayload),
        });

        assert.equal(regRes.status, 201);
        const regData = await regRes.json();
        assert.equal(regData.success, true);
        assert.equal(regData.user.role, 'CUSTOMER');
        assert.equal(regData.user.theatre_id, null);

        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${regData.token}` },
        });

        assert.equal(meRes.status, 200);
        const meData = await meRes.json();
        assert.equal(meData.user.email, customerPayload.email);
        assert.equal(meData.user.role, 'CUSTOMER');
    });
});
