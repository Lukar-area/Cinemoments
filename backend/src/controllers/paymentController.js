import {
    createPaymentOrder,
    verifyPayment,
    topupWallet,
    getReceiptDetails,
} from '../services/paymentService.js';

export async function handleCreateOrder(req, res, next) {
    try {
        const { amount, currency, showId, bookingType } = req.body;
        const userId = req.user.id;

        const order = await createPaymentOrder({
            amount: Number(amount),
            currency,
            userId,
            showId,
            bookingType,
        });

        res.json({ success: true, order });
    } catch (error) {
        next(error);
    }
}

export async function handleVerifyPayment(req, res, next) {
    try {
        const { orderId, paymentId, signature, paymentMethod } = req.body;
        const userId = req.user.id;

        const result = await verifyPayment({
            orderId,
            paymentId,
            signature,
            paymentMethod,
            userId,
        });

        res.json({ success: true, result });
    } catch (error) {
        next(error);
    }
}

export async function handleWalletTopup(req, res, next) {
    try {
        const { amount, paymentMethod, paymentId } = req.body;
        const userId = req.user.id;

        const result = await topupWallet({
            userId,
            amount,
            paymentMethod,
            paymentId,
            ipAddress: req.ip,
        });

        res.json({ success: true, message: 'Wallet top-up successful!', result });
    } catch (error) {
        next(error);
    }
}

export async function handleGetReceipt(req, res, next) {
    try {
        const { transactionId } = req.params;
        const userId = req.user.id;

        const receipt = await getReceiptDetails(transactionId, userId);
        res.json({ success: true, receipt });
    } catch (error) {
        next(error);
    }
}
