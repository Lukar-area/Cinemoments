import { Router } from 'express';
import { streamMedia } from '../controllers/mediaController.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// Stream or preview authenticated decrypted media
router.get('/:id/stream', authenticate, streamMedia);
export default router;
