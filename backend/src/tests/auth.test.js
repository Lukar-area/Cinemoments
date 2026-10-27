import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { generateCaptcha, verifyCaptcha } from '../services/captchaService.js';

test('Authentication, Password Hashing, JWT Tokens, and CAPTCHA', async (t) => {
    await t.test('bcrypt securely hashes passwords and verifies accurately', async () => {
        const rawPassword = 'SecretPassword2026!';
        const hash = await bcrypt.hash(rawPassword, 10);
        // Hash should not match plaintext
        assert.notEqual(hash, rawPassword);
        assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));
        // Correct password matches
        const isValid = await bcrypt.compare(rawPassword, hash);
        assert.equal(isValid, true);
        // Incorrect password fails
        const isInvalid = await bcrypt.compare('WrongPassword', hash);
        assert.equal(isInvalid, false);
    });

    await t.test('JWT token signing and verification with roles', () => {
        const payload = { id: 42, role: 'STAFF' };
        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
        const decoded = jwt.verify(token, config.jwtSecret);
        assert.equal(decoded.id, 42);
        assert.equal(decoded.role, 'STAFF');
        // Invalid secret fails verification
        assert.throws(() => {
            jwt.verify(token, 'wrong_secret_key');
        });
    });

    await t.test('generateCaptcha creates valid SVG and signed cryptographic HMAC token', () => {
        const captcha = generateCaptcha();
        assert.ok(captcha.token, 'Token must exist');
        assert.ok(captcha.svg.startsWith('data:image/svg+xml;base64,'), 'SVG must be base64 data URI');
        assert.equal(captcha.code.length, 5, 'CAPTCHA code must be 5 characters');

        // Valid solution passes case-insensitively
        const isValidUpper = verifyCaptcha(captcha.token, captcha.code.toUpperCase());
        assert.equal(isValidUpper, true);
        const isValidLower = verifyCaptcha(captcha.token, captcha.code.toLowerCase());
        assert.equal(isValidLower, true);

        // Incorrect solution fails
        const isWrong = verifyCaptcha(captcha.token, 'XXXXX');
        assert.equal(isWrong, false);

        // Tampered token fails
        const tamperedToken = captcha.token.slice(0, -4) + 'abcd';
        const isTampered = verifyCaptcha(tamperedToken, captcha.code);
        assert.equal(isTampered, false);
    });
});
