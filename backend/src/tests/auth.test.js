import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
test('Authentication, Password Hashing, and JWT Tokens', async (t) => {
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
});
