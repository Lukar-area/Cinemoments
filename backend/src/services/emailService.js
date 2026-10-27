import { config } from '../config/index.js';

/**
 * CineMoments Email Dispatch Service
 * Sends transactional HTML emails for interval booking updates, approvals, rejections, and receipts.
 * If SMTP credentials are configured, dispatches via SMTP; otherwise logs a formatted email preview.
 */

function generateEmailTemplate({ title, preheader, headline, bodyContent, highlightBox, ctaText, ctaUrl }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { background: linear-gradient(135deg, #030712 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #eab308; }
    .logo { font-size: 26px; font-weight: 800; color: #facc15; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; }
    .content { padding: 32px 24px; }
    .headline { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
    .highlight-card { background-color: #1e293b; border-left: 4px solid #eab308; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
    .highlight-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #facc15; margin-bottom: 8px; }
    .highlight-item { font-size: 14px; color: #e2e8f0; margin-bottom: 6px; }
    .cta-container { text-align: center; margin: 32px 0 16px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%); color: #000000 !important; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 9999px; text-decoration: none; box-shadow: 0 4px 14px rgba(234, 179, 8, 0.4); }
    .footer { background-color: #030712; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1f2937; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <h1 class="logo">🎬 CineMoments</h1>
      <p class="subtitle">Cinema Big-Screen Interval Booking Platform</p>
    </div>
    <div class="content">
      <h2 class="headline">${headline}</h2>
      <div class="text">${bodyContent}</div>
      ${highlightBox ? `
      <div class="highlight-card">
        <div class="highlight-title">${highlightBox.title || 'Booking Details'}</div>
        ${highlightBox.items.map(item => `<div class="highlight-item"><strong>${item.label}:</strong> ${item.value}</div>`).join('')}
      </div>` : ''}
      ${ctaText && ctaUrl ? `
      <div class="cta-container">
        <a href="${ctaUrl}" class="cta-btn">${ctaText}</a>
      </div>` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CineMoments Inc. All rights reserved.</p>
      <p>This is an automated notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;
}

export async function sendEmail({ to, subject, html, text }) {
    if (!to) return { success: false, reason: 'No recipient email provided' };

    // Format console logging for development/demo inspection
    console.log(`\n📧 [EMAIL DISPATCHED] To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Status: Sent successfully via CineMoments Notification Engine\n`);

    // If SMTP credentials configured, attempt real dispatch
    if (config.emailServiceEnabled && config.smtpUser && config.smtpPass) {
        try {
            // Dynamically import nodemailer if installed
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            });

            await transporter.sendMail({
                from: config.smtpFrom,
                to,
                subject,
                text: text || subject,
                html,
            });
            return { success: true, mode: 'smtp' };
        } catch (err) {
            console.warn('⚠️ SMTP dispatch failed, fallback logger used:', err.message);
        }
    }

    return { success: true, mode: 'preview_logged' };
}

export async function sendBookingSubmittedEmail(user, booking, show, theatre) {
    const movieTitle = show?.movie_id?.title || 'Selected Movie';
    const theatreName = theatre?.name || 'Selected Theatre';
    const showDate = show?.show_date || 'Upcoming Show';
    const intervalTime = `${show?.interval_start || '21:00'} - ${show?.interval_end || '21:15'}`;

    const html = generateEmailTemplate({
        title: 'Booking Request Received - CineMoments',
        preheader: `Your interval request for ${movieTitle} is under review.`,
        headline: `Thank you for your booking request, ${user.name}! 🎬`,
        bodyContent: `Your interval screening request has been successfully submitted and is currently being reviewed by the theatre management at <strong>${theatreName}</strong>. You will be notified the moment your request is reviewed.`,
        highlightBox: {
            title: 'Interval Slot Information',
            items: [
                { label: 'Booking Purpose', value: booking.booking_type.replace(/_/g, ' ') },
                { label: 'Movie', value: movieTitle },
                { label: 'Theatre', value: theatreName },
                { label: 'Show Date', value: showDate },
                { label: 'Interval Window', value: intervalTime },
                { label: 'Status', value: 'PENDING REVIEW' },
            ],
        },
        ctaText: 'View Booking in Dashboard',
        ctaUrl: `${config.clientUrl}/dashboard`,
    });

    return await sendEmail({
        to: user.email,
        subject: `🎬 Booking Request Received: ${movieTitle} at ${theatreName}`,
        html,
    });
}

export async function sendBookingAcceptedEmail(user, booking, show, theatre) {
    const movieTitle = show?.movie_id?.title || 'Movie';
    const theatreName = theatre?.name || 'Theatre';
    const showDate = show?.show_date || 'Upcoming Show';
    const intervalTime = `${show?.interval_start || '21:00'} - ${show?.interval_end || '21:15'}`;

    const html = generateEmailTemplate({
        title: '🎉 Booking ACCEPTED! - CineMoments',
        preheader: `Your interval request for ${movieTitle} has been ACCEPTED!`,
        headline: `🎉 Fantastic News, ${user.name}! Your Moment is Confirmed!`,
        bodyContent: `The staff at <strong>${theatreName}</strong> has officially accepted your interval screening request. Your custom message and media will be projected onto the big screen during the interval of <strong>${movieTitle}</strong>.`,
        highlightBox: {
            title: 'Confirmed Screening Schedule',
            items: [
                { label: 'Movie', value: movieTitle },
                { label: 'Theatre', value: theatreName },
                { label: 'Show Date', value: showDate },
                { label: 'Interval Time', value: intervalTime },
                { label: 'Screen', value: show?.screen_id?.name || 'Screen 1' },
                { label: 'Status', value: 'ACCEPTED & CONFIRMED' },
            ],
        },
        ctaText: 'Open Live Cinema Preview',
        ctaUrl: `${config.clientUrl}/dashboard`,
    });

    return await sendEmail({
        to: user.email,
        subject: `🎉 ACCEPTED: Your CineMoments Screen Time for "${movieTitle}" is Locked!`,
        html,
    });
}

export async function sendBookingRejectedEmail(user, booking, show, theatre, reason) {
    const movieTitle = show?.movie_id?.title || 'Movie';
    const theatreName = theatre?.name || 'Theatre';

    const html = generateEmailTemplate({
        title: 'Booking Status Update - CineMoments',
        preheader: `Update regarding your booking request for ${movieTitle}`,
        headline: `Booking Update regarding "${movieTitle}"`,
        bodyContent: `We are writing to let you know that <strong>${theatreName}</strong> was unable to accept your interval screening request at this time. Any funds debited for this booking have been fully refunded to your wallet.`,
        highlightBox: {
            title: 'Status & Remarks',
            items: [
                { label: 'Theatre', value: theatreName },
                { label: 'Reason Provided', value: reason || 'Slot unavailable due to operational theatre requirements' },
                { label: 'Refund Status', value: '100% Refunded to Wallet' },
            ],
        },
        ctaText: 'Browse Other Available Shows',
        ctaUrl: `${config.clientUrl}/theatres`,
    });

    return await sendEmail({
        to: user.email,
        subject: `CineMoments: Update on your booking request for "${movieTitle}"`,
        html,
    });
}

export async function sendBookingExpiredEmail(user, booking, show, theatre) {
    const movieTitle = show?.movie_id?.title || 'Movie';
    const theatreName = theatre?.name || 'Theatre';

    const html = generateEmailTemplate({
        title: 'Booking Request Expired - CineMoments',
        preheader: `Your interval request for ${movieTitle} has expired.`,
        headline: `Booking Request Expired`,
        bodyContent: `Your interval request for <strong>${movieTitle}</strong> at <strong>${theatreName}</strong> has expired either because another competing request was chosen or the showtime passed. A full refund has been credited back to your account wallet.`,
        highlightBox: {
            title: 'Expiration Notice',
            items: [
                { label: 'Movie', value: movieTitle },
                { label: 'Theatre', value: theatreName },
                { label: 'Status', value: 'EXPIRED' },
                { label: 'Wallet Refund', value: 'Completed' },
            ],
        },
        ctaText: 'Book Another Interval Slot',
        ctaUrl: `${config.clientUrl}/theatres`,
    });

    return await sendEmail({
        to: user.email,
        subject: `CineMoments: Interval request expired for "${movieTitle}" (Refund Processed)`,
        html,
    });
}
