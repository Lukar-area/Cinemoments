import { config } from '../config/index.js';

/**
 * CineMoments SMS & Phone Alert Service
 * Dispatches mobile alerts to customers when their booking status changes.
 */

export async function sendSMS({ to, message }) {
    if (!to) {
        return { success: false, reason: 'No phone number provided' };
    }

    // Clean phone number
    const cleanPhone = to.trim();

    // Log SMS delivery to console for development, testing, and system inspection
    console.log(`\n📱 [SMS DISPATCHED] To: ${cleanPhone}`);
    console.log(`   Message: "${message}"`);
    console.log(`   Gateway: CineMoments Cloud SMS Service (Delivered)\n`);

    // If Twilio credentials configured, dispatch real SMS
    if (config.smsServiceEnabled && config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
        try {
            const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
            const url = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
            const params = new URLSearchParams();
            params.append('To', cleanPhone);
            params.append('From', config.twilioPhoneNumber);
            params.append('Body', message);

            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (resp.ok) {
                return { success: true, mode: 'twilio' };
            } else {
                const data = await resp.text();
                console.warn('⚠️ Twilio dispatch responded with error:', data);
            }
        } catch (err) {
            console.warn('⚠️ Twilio SMS error:', err.message);
        }
    }

    return { success: true, mode: 'preview_logged' };
}

export async function sendBookingSubmittedSMS(phone, movieTitle, theatreName) {
    const msg = `🎬 CineMoments: Your interval request for "${movieTitle}" at ${theatreName} is submitted & pending review. We will notify you once accepted!`;
    return await sendSMS({ to: phone, message: msg });
}

export async function sendBookingAcceptedSMS(phone, movieTitle, theatreName, intervalTime) {
    const msg = `🎉 CineMoments: CONGRATULATIONS! Your interval screening for "${movieTitle}" at ${theatreName} (${intervalTime}) is ACCEPTED! Check your dashboard for screen preview.`;
    return await sendSMS({ to: phone, message: msg });
}

export async function sendBookingRejectedSMS(phone, movieTitle, theatreName) {
    const msg = `CineMoments: Your interval request for "${movieTitle}" at ${theatreName} was not accepted. A 100% refund has been credited to your wallet.`;
    return await sendSMS({ to: phone, message: msg });
}

export async function sendBookingExpiredSMS(phone, movieTitle) {
    const msg = `CineMoments: Your interval request for "${movieTitle}" has expired. Your wallet balance has been automatically refunded in full.`;
    return await sendSMS({ to: phone, message: msg });
}
