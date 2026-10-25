import { Router } from 'express';
import { getShows, createShow } from '../controllers/showController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
router.get('/', getShows);
router.post('/', authenticate, requireRole('STAFF', 'ADMIN'), createShow);
export default router;
