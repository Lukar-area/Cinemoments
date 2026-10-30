import { Router } from 'express';
import {
    getAllTheatres,
    getTheatreById,
    createTheatre,
    updateTheatre,
    getStaffCurrentTheatre,
    associateStaffTheatre,
} from '../controllers/theatreController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllTheatres);
router.get('/staff/current', authenticate, requireRole('STAFF', 'ADMIN'), getStaffCurrentTheatre);
router.post('/staff/associate', authenticate, requireRole('STAFF'), associateStaffTheatre);
router.get('/:id', getTheatreById);
router.post('/', authenticate, requireRole('ADMIN'), createTheatre);
router.put('/:id', authenticate, requireRole('STAFF', 'ADMIN'), updateTheatre);

export default router;
