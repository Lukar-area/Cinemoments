import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';
import { generateCaptcha } from '../services/captchaService.js';

test('HTTP Live Endpoint Integration Testing (REST API)', async (suite) => {
    let server;
    let baseUrl;

    suite.before(async () => {
        await new Promise((resolve) => {
            // Bind to ephemeral port
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

    await suite.test('GET /api/health returns 200 OK and health status', async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, 'healthy');
        assert.equal(data.service, 'CineMoments API');
        assert.ok(data.timestamp);
    });

    await suite.test('GET /api/auth/captcha returns 200 OK, valid SVG and signed token', async () => {
        const res = await fetch(`${baseUrl}/api/auth/captcha`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.captchaToken, 'Must return signed HMAC token');
        assert.ok(data.captchaSvg.startsWith('data:image/svg+xml;base64,'), 'Must return SVG base64');
    });

    await suite.test('POST /api/auth/login enforces validation for missing fields', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.message.includes('required'));
    });

    await suite.test('POST /api/auth/login rejects when CAPTCHA is invalid for custom user', async () => {
        const c = generateCaptcha();
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'newcustomuser@example.com',
                password: 'Password123!',
                captchaToken: c.token,
                captchaSolution: 'WRONG',
            }),
        });
        assert.equal(res.status, 400);
        const data = await res.json();
        assert.equal(data.success, false);
        assert.ok(data.message.toLowerCase().includes('captcha'));
    });

    await suite.test('POST /api/auth/login successfully logs in demo customer rahul@example.com', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'rahul@example.com',
                password: 'Password123!',
            }),
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.token, 'Should return JWT token');
        assert.equal(data.user.email, 'rahul@example.com');
        assert.equal(data.user.role, 'CUSTOMER');
        assert.equal(data.user.wallet_balance, 2000);
    });

    await suite.test('POST /api/auth/login successfully logs in demo staff staff@grandcinema.com', async () => {
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
        assert.ok(data.user.assignedTheatreId);
    });

    await suite.test('POST /api/auth/login successfully logs in demo admin admin@cinemoments.com', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@cinemoments.com',
                password: 'Password123!',
            }),
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.equal(data.user.role, 'ADMIN');
    });

    await suite.test('POST /api/auth/login rejects invalid password with 401', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'rahul@example.com',
                password: 'IncorrectPassword!',
            }),
        });
        assert.equal(res.status, 401);
        const data = await res.json();
        assert.equal(data.success, false);
    });

    await suite.test('POST /api/auth/guest initializes guest user session with wallet balance', async () => {
        const res = await fetch(`${baseUrl}/api/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(data.token);
        assert.equal(data.user.role, 'CUSTOMER');
        assert.equal(data.user.wallet_balance, 2000);
    });

    await suite.test('GET /api/auth/me returns authenticated user details with token', async () => {
        // First log in
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'rahul@example.com',
                password: 'Password123!',
            }),
        });
        const loginData = await loginRes.json();

        // Call /api/auth/me
        const meRes = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${loginData.token}` },
        });
        assert.equal(meRes.status, 200);
        const meData = await meRes.json();
        assert.equal(meData.success, true);
        assert.equal(meData.user.email, 'rahul@example.com');
        assert.equal(meData.user.role, 'CUSTOMER');
    });

    await suite.test('Protected endpoints reject unauthenticated requests with 401', async () => {
        const res = await fetch(`${baseUrl}/api/auth/me`);
        assert.equal(res.status, 401);
        const data = await res.json();
        assert.equal(data.success, false);
    });

    await suite.test('Protected chat endpoints reject unauthenticated requests with 401', async () => {
        const res = await fetch(`${baseUrl}/api/chat/messages?theatreId=123`);
        assert.equal(res.status, 401);
    });

    await suite.test('Protected bookings endpoints reject unauthenticated requests with 401', async () => {
        const res = await fetch(`${baseUrl}/api/bookings/my-bookings`);
        assert.equal(res.status, 401);
    });
});
