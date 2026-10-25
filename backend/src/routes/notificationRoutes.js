import { Router } from 'express';
import { getMyNotifications, markAsReadController, markAllAsReadController, } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.get('/', authenticate, getMyNotifications);
router.put('/:id/read', authenticate, markAsReadController);
router.put('/read-all', authenticate, markAllAsReadController);
export default router;
