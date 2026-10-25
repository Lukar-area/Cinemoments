import { Router } from 'express';
import { submitBooking, getMyBookings, getBookingDetails, getStaffBookingsController, handleAcceptBooking, handleRejectBooking, handleCancelBooking, getMyTransactionsController, getTheatreEarningsController, getAllTransactionsController, } from '../controllers/bookingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';
const router = Router();
// Customer actions
router.post('/', authenticate, uploadMedia.single('media'), submitBooking);
router.get('/my-bookings', authenticate, getMyBookings);
router.get('/transactions/my', authenticate, getMyTransactionsController);
// Theatre Staff actions
router.get('/staff/queue', authenticate, requireRole('STAFF', 'ADMIN'), getStaffBookingsController);
router.get('/earnings/:theatreId?', authenticate, requireRole('STAFF', 'ADMIN'), getTheatreEarningsController);
router.post('/:id/accept', authenticate, requireRole('STAFF', 'ADMIN'), handleAcceptBooking);
router.post('/:id/reject', authenticate, requireRole('STAFF', 'ADMIN'), handleRejectBooking);

// Admin actions
router.get('/transactions/all', authenticate, requireRole('ADMIN'), getAllTransactionsController);

// Single booking lookup and cancel (must come after specific literal paths)
router.get('/:id', authenticate, getBookingDetails);
router.post('/:id/cancel', authenticate, handleCancelBooking);

export default router;
