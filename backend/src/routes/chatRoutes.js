import { Router } from 'express';
import { getConversations, getMessages, sendMessage, streamChatMessageMedia } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const router = Router();
router.use(authenticate);
router.get('/conversations', getConversations);
router.get('/messages', getMessages);
router.post('/messages', uploadMedia.single('media'), sendMessage);
router.get('/messages/:id/media', streamChatMessageMedia);

export default router;
