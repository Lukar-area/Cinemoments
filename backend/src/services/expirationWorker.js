import IntervalBooking from '../models/IntervalBooking.js';
import Show from '../models/Show.js';
import Movie from '../models/Movie.js';
import Screen from '../models/Screen.js';
import Theatre from '../models/Theatre.js';
import { createNotification } from './notificationService.js';
import { recordAuditLog } from './auditService.js';

let intervalTimer = null;

/**
 * Scans for pending or under-review booking requests whose show time
 * or explicit expiration deadline has passed, and transitions them to EXPIRED.
 */
export async function checkAndExpireRequests() {
    try {
        const now = new Date();
        const currentDateStr = now.toISOString().split('T')[0];
        const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"

        const pendingBookings = await IntervalBooking.find({
            status: { $in: ['PENDING', 'UNDER_REVIEW'] }
        }).populate({
            path: 'show_id',
            populate: [
                { path: 'movie_id', select: 'title' },
                {
                    path: 'screen_id',
                    populate: { path: 'theatre_id', select: 'name' }
                }
            ]
        });

        let expiredCount = 0;

        for (const booking of pendingBookings) {
            let isExpired = false;

            if (booking.expires_at && booking.expires_at <= now) {
                isExpired = true;
            } else if (booking.show_id) {
                const show = booking.show_id;
                if (show.show_date < currentDateStr) {
                    isExpired = true;
                } else if (show.show_date === currentDateStr && show.start_time <= currentTimeStr) {
                    isExpired = true;
                }
            }

            if (isExpired) {
                booking.status = 'EXPIRED';
                await booking.save();
                expiredCount++;

                const movieTitle = booking.show_id?.movie_id?.title || 'Movie';
                const theatreName = booking.show_id?.screen_id?.theatre_id?.name || 'Theatre';

                await createNotification(
                    booking.user_id,
                    booking._id,
                    'Booking Request Expired',
                    `Your request for "${movieTitle}" at ${theatreName} expired as the show start time has passed.`,
                    'EXPIRED'
                );

                await recordAuditLog({
                    userId: booking.user_id,
                    action: 'BOOKING_AUTO_EXPIRE',
                    entityType: 'booking',
                    entityId: booking._id,
                    details: { reason: 'Show time passed' },
                });
            }
        }

        return expiredCount;
    } catch (err) {
        console.error('[ExpirationWorker] Error during checkAndExpireRequests:', err);
        return 0;
    }
}

/**
 * Starts the automatic expiration background worker.
 */
export function startExpirationWorker(intervalMs = 60000) {
    // Run once immediately on server startup
    checkAndExpireRequests()
        .then(count => {
            if (count > 0) {
                console.log(`[ExpirationWorker] Initialized and expired ${count} past booking request(s).`);
            }
        })
        .catch(err => {
            console.error('[ExpirationWorker] Error during initial check:', err);
        });

    // Periodic timer
    intervalTimer = setInterval(async () => {
        try {
            const count = await checkAndExpireRequests();
            if (count > 0) {
                console.log(`[ExpirationWorker] Automatically expired ${count} overdue request(s).`);
            }
        } catch (err) {
            console.error('[ExpirationWorker] Background expiration cycle error:', err);
        }
    }, intervalMs);

    console.log(`[ExpirationWorker] Scheduled to run every ${intervalMs / 1000}s.`);
}

/**
 * Stops the expiration worker (useful during testing or graceful shutdown).
 */
export function stopExpirationWorker() {
    if (intervalTimer) {
        clearInterval(intervalTimer);
        intervalTimer = null;
    }
}
