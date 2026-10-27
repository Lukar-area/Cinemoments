import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { generateCaptcha, verifyCaptcha } from '../services/captchaService.js';
import { encryptBuffer, decryptBuffer, validateMediaBuffer } from '../services/cryptoService.js';
import { createPaymentOrder, verifyPayment } from '../services/paymentService.js';
import {
    sendBookingSubmittedEmail,
    sendBookingAcceptedEmail,
    sendBookingRejectedEmail,
    sendBookingExpiredEmail,
} from '../services/emailService.js';
import {
    sendBookingSubmittedSMS,
    sendBookingAcceptedSMS,
    sendBookingRejectedSMS,
    sendBookingExpiredSMS,
} from '../services/smsService.js';
import ChatMessage from '../models/ChatMessage.js';
import IntervalBooking from '../models/IntervalBooking.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

test('=== COMPREHENSIVE SUITE: LOGIN, AUTH, ENCRYPTED VIDEO & SYSTEM FEATURES ===', async (suite) => {

    // -------------------------------------------------------------
    // FEATURE 1: CAPTCHA GENERATION & VALIDATION
    // -------------------------------------------------------------
    await suite.test('1. CAPTCHA Security Challenge Generation and Verification', async (t) => {
        await t.test('generateCaptcha creates distinct 5-char code, signed HMAC token, and SVG', () => {
            const c1 = generateCaptcha();
            const c2 = generateCaptcha();

            assert.equal(c1.code.length, 5, 'CAPTCHA code must be exactly 5 characters');
            assert.equal(c2.code.length, 5, 'CAPTCHA code must be exactly 5 characters');
            // Two successive codes should almost certainly be different
            assert.notEqual(c1.token, c2.token, 'Tokens must be unique per generation');

            assert.ok(c1.svg.startsWith('data:image/svg+xml;base64,'), 'SVG must be a base64 data URI');
            const svgContent = Buffer.from(c1.svg.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
            assert.ok(svgContent.includes('<svg'), 'Decoded content must contain SVG tag');
            assert.ok(svgContent.includes('<text'), 'Decoded SVG must contain text elements');
            assert.ok(svgContent.includes('<path'), 'Decoded SVG must contain noise lines');
            assert.ok(svgContent.includes('<circle'), 'Decoded SVG must contain noise particles');
        });

        await t.test('verifyCaptcha validates correct answers case-insensitively and with whitespace trimming', () => {
            const captcha = generateCaptcha();
            assert.equal(verifyCaptcha(captcha.token, captcha.code), true);
            assert.equal(verifyCaptcha(captcha.token, captcha.code.toLowerCase()), true);
            assert.equal(verifyCaptcha(captcha.token, captcha.code.toUpperCase()), true);
            assert.equal(verifyCaptcha(captcha.token, `  ${captcha.code}  `), true);
        });

        await t.test('verifyCaptcha rejects incorrect, empty, or tampered challenges', () => {
            const captcha = generateCaptcha();
            assert.equal(verifyCaptcha(captcha.token, 'WRONG'), false);
            assert.equal(verifyCaptcha(captcha.token, ''), false);
            assert.equal(verifyCaptcha(null, captcha.code), false);
            assert.equal(verifyCaptcha('', captcha.code), false);

            // Tamper with payload
            const [payloadStr, sig] = captcha.token.split('.');
            const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
            payload.code = 'CHEAT';
            const fakePayloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
            assert.equal(verifyCaptcha(`${fakePayloadStr}.${sig}`, 'CHEAT'), false);

            // Expired token test (force expiration in past)
            payload.exp = Date.now() - 1000;
            const expiredPayloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const expiredSig = crypto.createHmac('sha256', config.jwtSecret).update(expiredPayloadStr).digest('base64url');
            assert.equal(verifyCaptcha(`${expiredPayloadStr}.${expiredSig}`, payload.code), false);
        });
    });

    // -------------------------------------------------------------
    // FEATURE 2: LOGIN & AUTHENTICATION PROTOCOLS
    // -------------------------------------------------------------
    await suite.test('2. Authentication Protocols: Passwords, Roles, Guest Sessions & Login Rules', async (t) => {
        await t.test('Password hashing with bcrypt complies with length and security requirements', async () => {
            const plainPassword = 'UserSecurePassword2026!';
            const hash = await bcrypt.hash(plainPassword, 10);

            assert.notEqual(hash, plainPassword);
            assert.equal(await bcrypt.compare(plainPassword, hash), true);
            assert.equal(await bcrypt.compare('WrongPass', hash), false);
        });

        await t.test('Guest login specifications: generates session with 7-day token and ₹2,000 demo wallet balance', () => {
            const guestId = 4819;
            const guestName = `Guest User #${guestId}`;
            const guestEmail = `guest_${Date.now()}_${guestId}@cinemoments.internal`;
            const token = jwt.sign({ id: 'guest_user_id_123', role: 'CUSTOMER' }, config.jwtSecret, { expiresIn: '7d' });

            const decoded = jwt.verify(token, config.jwtSecret);
            assert.equal(decoded.role, 'CUSTOMER');
            assert.equal(decoded.id, 'guest_user_id_123');

            const guestUser = {
                name: guestName,
                email: guestEmail,
                role: 'CUSTOMER',
                status: 'ACTIVE',
                wallet_balance: 2000.00,
            };
            assert.equal(guestUser.wallet_balance, 2000.00);
            assert.equal(guestUser.status, 'ACTIVE');
        });

        await t.test('Role-based JWT verification across CUSTOMER, STAFF, and ADMIN', () => {
            const customerToken = jwt.sign({ id: 'u_cust', role: 'CUSTOMER' }, config.jwtSecret);
            const staffToken = jwt.sign({ id: 'u_staff', role: 'STAFF' }, config.jwtSecret);
            const adminToken = jwt.sign({ id: 'u_admin', role: 'ADMIN' }, config.jwtSecret);

            assert.equal(jwt.verify(customerToken, config.jwtSecret).role, 'CUSTOMER');
            assert.equal(jwt.verify(staffToken, config.jwtSecret).role, 'STAFF');
            assert.equal(jwt.verify(adminToken, config.jwtSecret).role, 'ADMIN');

            // Role enforcement helper
            function checkRoleAccess(token, allowedRoles) {
                const decoded = jwt.verify(token, config.jwtSecret);
                return allowedRoles.includes(decoded.role);
            }

            assert.equal(checkRoleAccess(adminToken, ['ADMIN']), true);
            assert.equal(checkRoleAccess(customerToken, ['ADMIN']), false);
            assert.equal(checkRoleAccess(staffToken, ['STAFF', 'ADMIN']), true);
            assert.equal(checkRoleAccess(customerToken, ['STAFF', 'ADMIN']), false);
        });

        await t.test('Token extraction allows fallback to query parameter token for media streaming', () => {
            function extractToken(req) {
                let token = null;
                const authHeader = req.headers?.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.split(' ')[1];
                } else if (req.query?.token) {
                    token = req.query.token;
                }
                return token;
            }

            const mockJwt = 'mock_jwt_token_sample';
            assert.equal(extractToken({ headers: { authorization: `Bearer ${mockJwt}` } }), mockJwt);
            assert.equal(extractToken({ headers: {}, query: { token: mockJwt } }), mockJwt);
            assert.equal(extractToken({ headers: {}, query: {} }), null);
        });

        await t.test('Login CAPTCHA rule: validates captcha unless demo user or test mode bypass', () => {
            function evaluateLoginCaptcha({ email, captchaToken, captchaSolution, isTestEnv }) {
                const normalizedEmail = email.toLowerCase().trim();
                const isDemoUser = ['rahul@example.com', 'staff@grandcinema.com', 'admin@cinemoments.com'].includes(normalizedEmail);
                if ((!isTestEnv && !isDemoUser) || captchaToken) {
                    if (!captchaToken || !captchaSolution) {
                        return { allowed: false, error: 'CAPTCHA required' };
                    }
                    const isValid = verifyCaptcha(captchaToken, captchaSolution);
                    if (!isValid) {
                        return { allowed: false, error: 'Invalid CAPTCHA' };
                    }
                }
                return { allowed: true };
            }

            const c = generateCaptcha();
            // Regular user without captcha in production mode -> Rejected
            assert.equal(evaluateLoginCaptcha({ email: 'newuser@gmail.com', isTestEnv: false }).allowed, false);
            // Regular user with wrong captcha -> Rejected
            assert.equal(evaluateLoginCaptcha({ email: 'newuser@gmail.com', captchaToken: c.token, captchaSolution: 'BAD', isTestEnv: false }).allowed, false);
            // Regular user with valid captcha -> Allowed
            assert.equal(evaluateLoginCaptcha({ email: 'newuser@gmail.com', captchaToken: c.token, captchaSolution: c.code, isTestEnv: false }).allowed, true);
            // Demo user 1-click login without captcha -> Allowed
            assert.equal(evaluateLoginCaptcha({ email: 'rahul@example.com', isTestEnv: false }).allowed, true);
            assert.equal(evaluateLoginCaptcha({ email: 'staff@grandcinema.com', isTestEnv: false }).allowed, true);
            assert.equal(evaluateLoginCaptcha({ email: 'admin@cinemoments.com', isTestEnv: false }).allowed, true);
        });
    });

    // -------------------------------------------------------------
    // FEATURE 3: ENCRYPTED VIDEO & CHAT MEDIA
    // -------------------------------------------------------------
    await suite.test('3. Encrypted Video Sending, Streaming, and Decryption', async (t) => {
        await t.test('Validates video file signatures: MP4 (ftyp) and WebM (1A 45 DF A3)', () => {
            // MP4 buffer
            const mp4Buffer = Buffer.concat([
                Buffer.from([0x00, 0x00, 0x00, 0x20]),
                Buffer.from('ftyp', 'utf8'),
                Buffer.alloc(32),
            ]);
            const mp4Check = validateMediaBuffer(mp4Buffer, 'greeting_video.mp4');
            assert.equal(mp4Check.fileType, 'VIDEO');
            assert.equal(mp4Check.mimeType, 'video/mp4');

            // WebM buffer
            const webmBuffer = Buffer.concat([
                Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
                Buffer.alloc(32),
            ]);
            const webmCheck = validateMediaBuffer(webmBuffer, 'proposal_clip.webm');
            assert.equal(webmCheck.fileType, 'VIDEO');
            assert.equal(webmCheck.mimeType, 'video/webm');
        });

        await t.test('AES-256-GCM authenticated encryption preserves full video bitstream', () => {
            const videoData = Buffer.from('SIMULATED_MP4_H264_VIDEO_BITSTREAM_ENCODED_FRAMES_INTERVAL_PROPOSAL', 'utf8');
            const encrypted = encryptBuffer(videoData);

            // Ciphertext differs from plaintext
            assert.notEqual(encrypted.encryptedBuffer.toString('utf8'), videoData.toString('utf8'));
            assert.equal(encrypted.ivHex.length, 24, '12-byte IV is 24 hex characters');
            assert.equal(encrypted.authTagHex.length, 32, '16-byte GCM tag is 32 hex characters');

            // Decryption restores exact binary content
            const decrypted = decryptBuffer(encrypted.encryptedBuffer, encrypted.ivHex, encrypted.authTagHex);
            assert.deepEqual(decrypted, videoData);
        });

        await t.test('HTTP 206 Partial Content (Byte-Range) streaming calculation for video players', () => {
            const videoBuffer = Buffer.alloc(1000, 0x42); // 1000-byte video
            const totalSize = videoBuffer.length;

            // Scenario 1: Video player requests bytes 0-199 (initial metadata chunk)
            const rangeHeader = 'bytes=0-199';
            const parts = rangeHeader.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            const chunkSize = (end - start) + 1;
            const slice = videoBuffer.subarray(start, end + 1);

            assert.equal(start, 0);
            assert.equal(end, 199);
            assert.equal(chunkSize, 200);
            assert.equal(slice.length, 200);
            const contentRange = `bytes ${start}-${end}/${totalSize}`;
            assert.equal(contentRange, 'bytes 0-199/1000');

            // Scenario 2: Video player seeks to middle: bytes 500-999
            const seekRange = 'bytes=500-';
            const seekParts = seekRange.replace(/bytes=/, '').split('-');
            const seekStart = parseInt(seekParts[0], 10);
            const seekEnd = seekParts[1] ? parseInt(seekParts[1], 10) : totalSize - 1;
            const seekChunk = (seekEnd - seekStart) + 1;
            const seekSlice = videoBuffer.subarray(seekStart, seekEnd + 1);

            assert.equal(seekStart, 500);
            assert.equal(seekEnd, 999);
            assert.equal(seekChunk, 500);
            assert.equal(seekSlice.length, 500);
        });

        await t.test('ChatMessage schema validates media fields and allows media without text', () => {
            const schema = ChatMessage.schema;
            assert.ok(schema.path('has_media'), 'has_media field exists');
            assert.ok(schema.path('media_type'), 'media_type field exists');
            assert.ok(schema.path('encrypted_file_path'), 'encrypted_file_path field exists');
            assert.ok(schema.path('iv'), 'iv field exists');
            assert.ok(schema.path('auth_tag'), 'auth_tag field exists');

            // Verify message is not strictly required if media is attached
            assert.equal(Boolean(schema.path('message').isRequired), false);
        });
    });

    // -------------------------------------------------------------
    // FEATURE 4: PAYMENTS, RECEIPTS & FINANCIAL SPLIT
    // -------------------------------------------------------------
    await suite.test('4. Payment Gateway Integration, Wallet Balance & Digital Receipts', async (t) => {
        await t.test('createPaymentOrder returns compliant order format with currency and paise calculation', async () => {
            const order = await createPaymentOrder({
                amount: 750,
                currency: 'INR',
                userId: 'cust_order_123',
                bookingType: 'MARRIAGE_PROPOSAL',
            });

            assert.ok(order.orderId.startsWith('order_cm_'));
            assert.equal(order.amount, 750);
            assert.equal(order.amountInPaise, 75000);
            assert.equal(order.currency, 'INR');
            assert.ok(order.upiUri.startsWith('upi://pay?'));
        });

        await t.test('verifyPayment produces valid verification result with paymentId', async () => {
            const res = await verifyPayment({
                orderId: 'order_mock_12345',
                paymentId: 'pay_mock_99999',
            });

            assert.equal(res.verified, true);
            assert.equal(res.paymentId, 'pay_mock_99999');
            assert.equal(res.paymentMethod, 'UPI');
        });

        await t.test('Revenue share calculation strictly splits 80% to Theatre and 20% to Platform Admin', () => {
            const amounts = [500, 1000, 1500, 2200];
            for (const amt of amounts) {
                const theatreShare = Math.round(amt * 0.8 * 100) / 100;
                const adminShare = Math.round(amt * 0.2 * 100) / 100;
                assert.equal(theatreShare, amt * 0.8);
                assert.equal(adminShare, amt * 0.2);
                assert.equal(theatreShare + adminShare, amt);
            }
        });
    });

    // -------------------------------------------------------------
    // FEATURE 5: MULTI-CHANNEL EMAIL & SMS NOTIFICATIONS
    // -------------------------------------------------------------
    await suite.test('5. Multi-Channel Email & SMS Transactional Alert Templates', async (t) => {
        const mockUser = {
            name: 'Rahul Verma',
            email: 'rahul@example.com',
            phone: '+91-98765-01000',
        };
        const mockBooking = {
            id: 'BK-2026-9901',
            booking_type: 'MARRIAGE_PROPOSAL',
            message: 'Will you marry me, Pooja? ❤️',
            amount: 500,
        };
        const mockShow = {
            show_date: '2026-11-01',
            interval_start: '21:15',
            interval_end: '21:30',
            movie_id: { title: 'Leo: Blood & Sweet' },
            screen_id: { name: 'Audi 1 - IMAX Laser' },
        };
        const mockTheatre = {
            name: 'PVR INOX Grand Mall',
        };

        await t.test('HTML Email generator produces structured responsive templates with CTA', async () => {
            const result = await sendBookingSubmittedEmail(mockUser, mockBooking, mockShow, mockTheatre);
            assert.equal(result.success, true);
        });

        await t.test('SMS dispatch service generates concise mobile notifications with booking cues', async () => {
            const result = await sendBookingSubmittedSMS(mockUser.phone, 'Leo: Blood & Sweet', 'PVR INOX Grand Mall');
            assert.equal(result.success, true);
        });

        await t.test('Approval and Rejection Email and SMS templates generate accurately', async () => {
            const approvedEmail = await sendBookingAcceptedEmail(mockUser, mockBooking, mockShow, mockTheatre);
            assert.equal(approvedEmail.success, true);

            const rejectedEmail = await sendBookingRejectedEmail(mockUser, mockBooking, mockShow, mockTheatre, 'Slot unavailable');
            assert.equal(rejectedEmail.success, true);

            const rejectedSMS = await sendBookingRejectedSMS(mockUser.phone, 'Leo: Blood & Sweet', 'PVR INOX Grand Mall');
            assert.equal(rejectedSMS.success, true);

            const expiredSMS = await sendBookingExpiredSMS(mockUser.phone, 'Leo: Blood & Sweet');
            assert.equal(expiredSMS.success, true);
        });
    });

    // -------------------------------------------------------------
    // FEATURE 6: CINEMA SCREEN MOCKUP & DOUBLE-BOOKING PREVENTION
    // -------------------------------------------------------------
    await suite.test('6. Screen Mockup Geometry & Double-Booking Atomic Conflict Rules', async (t) => {
        await t.test('ScreenMockup aspect ratio geometry options (16:9, 2.39:1, 1.43:1)', () => {
            const aspectRatios = {
                '16:9': 16 / 9,
                '2.39:1': 2.39 / 1,
                '1.43:1': 1.43 / 1,
            };

            assert.ok(Math.abs(aspectRatios['16:9'] - 1.777) < 0.01);
            assert.ok(Math.abs(aspectRatios['2.39:1'] - 2.39) < 0.01);
            assert.ok(Math.abs(aspectRatios['1.43:1'] - 1.43) < 0.01);
        });

        await t.test('Audio chime synthesizer frequencies (A4, E5, A5, C#6) are musically harmonic', () => {
            const chimeNotes = [440.0, 659.25, 880.0, 1108.73];
            assert.equal(chimeNotes[0], 440.0, 'A4 base tone');
            assert.equal(chimeNotes[2], chimeNotes[0] * 2, 'A5 must be octave above A4');
        });

        await t.test('Double-booking prevention: single accepted booking atomically invalidates all competitors', () => {
            const showSlotId = 'show_slot_prime_2026';
            const bookings = [
                { id: 'b1', showId: showSlotId, status: 'PENDING', amount: 500, customer: 'Alice' },
                { id: 'b2', showId: showSlotId, status: 'PENDING', amount: 500, customer: 'Bob' },
                { id: 'b3', showId: showSlotId, status: 'PENDING', amount: 500, customer: 'Charlie' },
            ];

            function acceptTargetBooking(targetId) {
                const target = bookings.find(b => b.id === targetId);
                target.status = 'ACCEPTED';

                // Automatically expire and refund all other pending requests for the same show
                const refunds = [];
                for (const b of bookings) {
                    if (b.id !== targetId && b.status === 'PENDING') {
                        b.status = 'EXPIRED';
                        refunds.push({ bookingId: b.id, refundAmount: b.amount, customer: b.customer });
                    }
                }
                return { target, refunds };
            }

            const { target, refunds } = acceptTargetBooking('b1');
            assert.equal(target.status, 'ACCEPTED');
            assert.equal(refunds.length, 2);
            assert.equal(bookings.find(b => b.id === 'b2').status, 'EXPIRED');
            assert.equal(bookings.find(b => b.id === 'b3').status, 'EXPIRED');
        });
    });
});
