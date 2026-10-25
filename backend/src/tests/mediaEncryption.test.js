import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptBuffer, decryptBuffer, validateMediaBuffer } from '../services/cryptoService.js';
test('AES-256-GCM Media Encryption and File Signature Validation', async (t) => {
    await t.test('encryptBuffer produces ciphertext different from plaintext and decrypts accurately', () => {
        const originalText = 'Private Marriage Proposal Video: Will you marry me, Pooja? ❤️';
        const originalBuffer = Buffer.from(originalText, 'utf8');
        const encrypted = encryptBuffer(originalBuffer);
        // Ciphertext must not contain raw plaintext
        assert.notEqual(encrypted.encryptedBuffer.toString('utf8'), originalText);
        assert.ok(encrypted.ivHex.length === 24, '12-byte IV should be 24 hex characters');
        assert.ok(encrypted.authTagHex.length === 32, '16-byte Auth Tag should be 32 hex characters');
        // Decrypt and verify exact bitwise match
        const decryptedBuffer = decryptBuffer(encrypted.encryptedBuffer, encrypted.ivHex, encrypted.authTagHex);
        assert.equal(decryptedBuffer.toString('utf8'), originalText);
    });
    await t.test('tampered ciphertext or auth tag throws authentication error', () => {
        const originalBuffer = Buffer.from('Confidential commercial promo content', 'utf8');
        const encrypted = encryptBuffer(originalBuffer);
        // Tamper with ciphertext by flipping one byte
        const tamperedCiphertext = Buffer.from(encrypted.encryptedBuffer);
        tamperedCiphertext[0] = tamperedCiphertext[0] ^ 0xff;
        assert.throws(() => {
            decryptBuffer(tamperedCiphertext, encrypted.ivHex, encrypted.authTagHex);
        });
        // Tamper with auth tag
        const tamperedTagHex = '00' + encrypted.authTagHex.slice(2);
        assert.throws(() => {
            decryptBuffer(encrypted.encryptedBuffer, encrypted.ivHex, tamperedTagHex);
        });
    });
    await t.test('file signature validation correctly detects JPEG, PNG, MP4, and WebM', () => {
        // JPEG signature: FF D8 FF
        const jpegBuffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
        const jpegResult = validateMediaBuffer(jpegBuffer, 'photo.jpg');
        assert.equal(jpegResult.fileType, 'IMAGE');
        assert.equal(jpegResult.mimeType, 'image/jpeg');
        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        const pngBuffer = Buffer.concat([
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
            Buffer.alloc(20),
        ]);
        const pngResult = validateMediaBuffer(pngBuffer, 'banner.png');
        assert.equal(pngResult.fileType, 'IMAGE');
        assert.equal(pngResult.mimeType, 'image/png');
        // MP4 signature: bytes 4..7 is 'ftyp'
        const mp4Buffer = Buffer.concat([
            Buffer.from([0x00, 0x00, 0x00, 0x20]),
            Buffer.from('ftyp', 'utf8'),
            Buffer.alloc(20),
        ]);
        const mp4Result = validateMediaBuffer(mp4Buffer, 'proposal.mp4');
        assert.equal(mp4Result.fileType, 'VIDEO');
        assert.equal(mp4Result.mimeType, 'video/mp4');
        // WebM signature: 1A 45 DF A3
        const webmBuffer = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(20)]);
        const webmResult = validateMediaBuffer(webmBuffer, 'video.webm');
        assert.equal(webmResult.fileType, 'VIDEO');
        assert.equal(webmResult.mimeType, 'video/webm');
        // Invalid executable / script rejected
        const exeBuffer = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(20)]);
        assert.throws(() => {
            validateMediaBuffer(exeBuffer, 'malicious.exe');
        });
    });
});
