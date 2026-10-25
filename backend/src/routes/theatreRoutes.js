import { Router } from 'express';
import { getAllTheatres, getTheatreById, createTheatre, updateTheatre, } from '../controllers/theatreController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);
router.post('/', authenticate, requireRole('ADMIN'), createTheatre);
router.put('/:id', authenticate, requireRole('STAFF', 'ADMIN'), updateTheatre);
export default router;
