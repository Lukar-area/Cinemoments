import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    handleCreateOrder,
    handleVerifyPayment,
    handleWalletTopup,
    handleGetReceipt,
} from '../controllers/paymentController.js';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

router.post('/create-order', handleCreateOrder);
router.post('/verify', handleVerifyPayment);
router.post('/wallet/topup', handleWalletTopup);
router.get('/receipt/:transactionId', handleGetReceipt);

export default router;
