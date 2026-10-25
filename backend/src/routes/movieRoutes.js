import { Router } from 'express';
import { getAllMovies, getMovieById, createMovie } from '../controllers/movieController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
router.get('/', getAllMovies);
router.get('/:id', getMovieById);
router.post('/', authenticate, requireRole('STAFF', 'ADMIN'), createMovie);
export default router;
