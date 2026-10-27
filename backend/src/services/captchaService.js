import crypto from 'crypto';
import { config } from '../config/index.js';

const CHARACTERS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an SVG CAPTCHA with distorted text, noise lines, and background particles,
 * accompanied by a cryptographically signed HMAC token.
 */
export function generateCaptcha() {
    let code = '';
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
        code += CHARACTERS[randomIndex];
    }

    const width = 180;
    const height = 54;
    const colors = ['#facc15', '#fb923c', '#38bdf8', '#4ade80', '#f43f5e', '#e879f9'];

    // Generate random noise lines
    let noiseLines = '';
    for (let i = 0; i < 4; i++) {
        const strokeColor = colors[Math.floor(Math.random() * colors.length)];
        const startX = Math.floor(Math.random() * 20);
        const startY = Math.floor(Math.random() * height);
        const endX = width - Math.floor(Math.random() * 20);
        const endY = Math.floor(Math.random() * height);
        const cpX = Math.floor(width / 2 + (Math.random() * 40 - 20));
        const cpY = Math.floor(height / 2 + (Math.random() * 40 - 20));
        noiseLines += `<path d="M${startX},${startY} Q${cpX},${cpY} ${endX},${endY}" stroke="${strokeColor}" stroke-width="1.8" fill="none" opacity="0.45" />`;
    }

    // Generate random background dots
    let noiseDots = '';
    for (let i = 0; i < 24; i++) {
        const dotX = Math.floor(Math.random() * width);
        const dotY = Math.floor(Math.random() * height);
        const r = (Math.random() * 1.5 + 0.5).toFixed(1);
        const color = colors[Math.floor(Math.random() * colors.length)];
        noiseDots += `<circle cx="${dotX}" cy="${dotY}" r="${r}" fill="${color}" opacity="0.35" />`;
    }

    // Render characters with rotation and displacement
    let textElements = '';
    const charSpacing = width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const x = Math.floor(charSpacing * (i + 0.8));
        const y = Math.floor(height / 2 + (Math.random() * 8 - 4) + 6);
        const rotate = Math.floor(Math.random() * 32 - 16);
        const color = colors[i % colors.length];
        const fontSize = Math.floor(Math.random() * 4 + 24);

        textElements += `
      <text
        x="${x}"
        y="${y}"
        font-family="monospace, monospace"
        font-weight="900"
        font-size="${fontSize}px"
        fill="${color}"
        transform="rotate(${rotate}, ${x}, ${y})"
        text-anchor="middle"
        letter-spacing="2"
      >${char}</text>
    `;
    }

    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" rx="12" fill="#090d16" stroke="#1e293b" stroke-width="1.5"/>
      ${noiseDots}
      ${noiseLines}
      ${textElements}
    </svg>
  `.trim();

    const svgBase64 = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

    // Create cryptographically signed token (5 minutes validity)
    const payload = {
        code: code.toUpperCase(),
        exp: Date.now() + 5 * 60 * 1000,
    };

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', config.jwtSecret)
        .update(payloadStr)
        .digest('base64url');

    const token = `${payloadStr}.${signature}`;

    return {
        token,
        svg: svgBase64,
        code,
    };
}

/**
 * Validates user CAPTCHA response against the signed token.
 */
export function verifyCaptcha(token, userSolution) {
    if (!token || !userSolution) {
        return false;
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        return false;
    }

    const [payloadStr, signature] = parts;

    // Verify HMAC signature
    const expectedSig = crypto
        .createHmac('sha256', config.jwtSecret)
        .update(payloadStr)
        .digest('base64url');

    if (expectedSig !== signature) {
        return false;
    }

    try {
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));

        // Check expiration
        if (Date.now() > payload.exp) {
            return false;
        }

        // Compare answer case-insensitively
        const cleanUserSolution = userSolution.trim().toUpperCase();
        return cleanUserSolution === payload.code;
    } catch {
        return false;
    }
}
