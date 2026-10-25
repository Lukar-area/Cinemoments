import { Router } from 'express';
import { getSystemStats, getAllUsers, updateUserStatusOrRole, getAuditLogsController, getAllBookingsAdmin, } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
// All routes strictly restricted to Super Admins
router.use(authenticate, requireRole('ADMIN'));
router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserStatusOrRole);
router.get('/audit-logs', getAuditLogsController);
router.get('/bookings', getAllBookingsAdmin);
export default router;
