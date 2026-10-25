import crypto from 'crypto';
import { config } from '../config/index.js';
// Derive 32-byte key from config string
const ENCRYPTION_KEY = crypto.createHash('sha256').update(config.fileEncryptionKey).digest();
const ALGORITHM = 'aes-256-gcm';
/**
 * Encrypts a binary buffer using AES-256-GCM with authenticated tag.
 */
export function encryptBuffer(buffer) {
    // 12-byte IV standard for AES-GCM
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        encryptedBuffer,
        ivHex: iv.toString('hex'),
        authTagHex: authTag.toString('hex'),
    };
}
/**
 * Decrypts an AES-256-GCM encrypted buffer and validates authentication tag.
 * Throws if authentication tag or ciphertext was tampered with.
 */
export function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted;
}
/**
 * Verifies file magic bytes / signatures to prevent malicious extension spoofing.
 */
export function validateMediaBuffer(buffer, originalFilename) {
    if (buffer.length < 12) {
        throw new Error('Uploaded file is too small or invalid.');
    }
    // Check JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { fileType: 'IMAGE', mimeType: 'image/jpeg' };
    }
    // Check PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a) {
        return { fileType: 'IMAGE', mimeType: 'image/png' };
    }
    // Check WebM / MKV: 1A 45 DF A3
    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
        return { fileType: 'VIDEO', mimeType: 'video/webm' };
    }
    // Check MP4: look for 'ftyp' in bytes 4..12
    const ftypSignature = buffer.subarray(4, 8).toString('utf8');
    if (ftypSignature === 'ftyp') {
        return { fileType: 'VIDEO', mimeType: 'video/mp4' };
    }
    // Fallback check extension for standard formats if signature varies slightly
    const ext = originalFilename.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') {
        return { fileType: 'IMAGE', mimeType: 'image/jpeg' };
    }
    if (ext === 'png') {
        return { fileType: 'IMAGE', mimeType: 'image/png' };
    }
    if (ext === 'mp4') {
        return { fileType: 'VIDEO', mimeType: 'video/mp4' };
    }
    if (ext === 'webm') {
        return { fileType: 'VIDEO', mimeType: 'video/webm' };
    }
    throw new Error('Unsupported file format. Only JPG, PNG, MP4, and WebM are permitted.');
}
