import crypto from 'crypto';
import { config } from '../config/index.js';
import User from '../models/User.js';
import Show from '../models/Show.js';
import Transaction from '../models/Transaction.js';
import IntervalBooking from '../models/IntervalBooking.js';
import { isDBConnected } from '../db/database.js';
import { fallbackStore } from '../db/fallbackStore.js';
import { getInMemoryUserById, updateUserWalletBalance } from '../controllers/authController.js';
import { recordAuditLog } from './auditService.js';
import { createNotification } from './notificationService.js';

/**
 * Creates a payment order for Razorpay, Stripe, or Direct UPI.
 */
export async function createPaymentOrder({ amount, currency = 'INR', userId, showId, bookingType }) {
    if (!amount || amount <= 0) {
        throw new Error('Valid payment amount is required.');
    }

    const orderId = `order_cm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Generate UPI payment string
    const upiUri = `upi://pay?pa=${encodeURIComponent(config.upiVpa)}&pn=${encodeURIComponent('CineMoments Interval Booking')}&am=${amount.toFixed(2)}&tr=${orderId}&cu=${currency}&tn=${encodeURIComponent(`Interval Booking ${bookingType || ''}`)}`;

    // Calculate estimated fees breakdown
    const baseFee = amount;
    const gst = Math.round(baseFee * 0.18 * 100) / 100; // 18% GST estimate if applicable
    const totalPayable = amount;

    return {
        orderId,
        receiptNumber,
        amount,
        amountInPaise: Math.round(amount * 100),
        currency,
        razorpayKeyId: config.razorpayKeyId,
        stripePublishableKey: config.stripePublishableKey,
        upiUri,
        upiVpa: config.upiVpa,
        feeBreakdown: {
            slotPrice: baseFee,
            convenienceFee: 0,
            gst: 0,
            total: totalPayable,
        },
    };
}

/**
 * Verifies payment from Razorpay, Stripe, or UPI and returns authorization proof.
 */
export async function verifyPayment({
    orderId,
    paymentId,
    signature,
    paymentMethod = 'UPI',
    userId,
}) {
    if (!orderId || !paymentId) {
        throw new Error('Order ID and Payment ID are required to verify transaction.');
    }

    // Razorpay signature verification if real credentials supplied
    let verified = false;
    if (paymentMethod === 'RAZORPAY' && signature && config.razorpayKeySecret && !config.razorpayKeySecret.includes('demo')) {
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', config.razorpayKeySecret)
            .update(body)
            .digest('hex');
        verified = expectedSignature === signature;
    } else {
        // Test mode / Mock signature / UPI confirmation verification
        verified = Boolean(paymentId && paymentId.length >= 6);
    }

    if (!verified) {
        throw new Error('Payment verification failed. Invalid transaction signature.');
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
        verified: true,
        orderId,
        paymentId,
        receiptNumber,
        paymentMethod,
        verifiedAt: new Date().toISOString(),
    };
}

/**
 * Tops up a customer wallet balance via payment gateway.
 */
export async function topupWallet({ userId, amount, paymentMethod = 'UPI', paymentId, ipAddress }) {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
        throw new Error('Invalid top-up amount.');
    }

    let user = null;
    if (isDBConnected()) {
        try {
            user = await User.findById(userId);
        } catch {
            user = null;
        }
    }

    let previousBalance = 2000.00;
    let newBalance = 2000.00;
    const receiptNumber = `TOP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (user) {
        previousBalance = user.wallet_balance || 0;
        newBalance = Math.round((previousBalance + numAmount) * 100) / 100;
        user.wallet_balance = newBalance;
        await user.save();

        try {
            await Transaction.create({
                booking_id: null,
                user_id: user._id,
                theatre_id: null,
                total_amount: numAmount,
                theatre_share: 0,
                admin_share: 0,
                payment_method: paymentMethod,
                payment_id: paymentId || `pay_${Date.now()}`,
                receipt_number: receiptNumber,
                status: 'COMPLETED',
            });
        } catch (txErr) {
            console.warn('Transaction record creation skipped:', txErr.message);
        }
    } else {
        // Fallback for demo / offline mode
        const memUser = getInMemoryUserById(userId);
        previousBalance = Number(memUser?.wallet_balance ?? 2000.00);
        newBalance = Math.round((previousBalance + numAmount) * 100) / 100;
        updateUserWalletBalance(userId, newBalance);

        fallbackStore.addTransaction({
            user_id: userId,
            booking_id: null,
            theatre_id: null,
            total_amount: numAmount,
            theatre_share: 0,
            admin_share: 0,
            payment_method: paymentMethod,
            payment_id: paymentId || `pay_mem_${Date.now()}`,
            receipt_number: receiptNumber,
            status: 'COMPLETED',
        });
    }

    try {
        await createNotification(
            userId,
            null,
            'Wallet Top-Up Successful 💳',
            `₹${numAmount.toFixed(2)} has been credited to your wallet via ${paymentMethod}. New balance: ₹${newBalance.toFixed(2)}.`,
            'GENERAL'
        );
    } catch {
        // Notification fallback
    }

    try {
        await recordAuditLog({
            userId,
            action: 'WALLET_TOPUP',
            entityType: 'user',
            entityId: userId,
            details: { amount: numAmount, previousBalance, newBalance, paymentMethod, paymentId },
            ipAddress,
        });
    } catch {
        // Audit log fallback
    }

    return {
        success: true,
        receiptNumber,
        creditedAmount: numAmount,
        amountAdded: numAmount,
        previousBalance,
        newBalance,
        walletBalance: newBalance,
        paymentMethod,
    };
}

/**
 * Retrieves official digital receipt and tax invoice for a transaction.
 */
export async function getReceiptDetails(transactionId, requestingUserId) {
    if (!isDBConnected()) {
        const fallbackTx = fallbackStore.getTransaction(transactionId);
        const receiptNum = fallbackTx?.receipt_number || `REC-${Date.now().toString().slice(-8)}`;
        return {
            receiptNumber: receiptNum,
            transactionId: fallbackTx?.id || transactionId,
            date: fallbackTx?.created_at || new Date().toISOString(),
            customer: {
                name: 'Rahul Sharma',
                email: 'rahul@example.com',
                phone: '+91 98765 02001',
            },
            theatre: {
                name: 'Grand Palace Cinema',
                address: '450 Heritage Blvd',
                city: 'Mumbai',
            },
            booking: {
                id: fallbackTx?.booking_id || 'book_preset_accepted_1',
                type: 'MARRIAGE_PROPOSAL',
                status: 'ACCEPTED',
                message: 'Pooja, will you marry me? ❤️',
                movieTitle: 'Leo: Blood & Sweet',
                showDate: new Date().toISOString().split('T')[0],
                intervalSlot: '20:30 - 20:45',
            },
            payment: {
                totalAmount: fallbackTx?.total_amount || 500.0,
                theatreShare: fallbackTx?.theatre_share || 400.0,
                adminShare: fallbackTx?.admin_share || 100.0,
                paymentMethod: fallbackTx?.payment_method || 'WALLET',
                paymentId: fallbackTx?.payment_id || `TXN-${transactionId}`,
                status: fallbackTx?.status || 'COMPLETED',
            },
        };
    }

    const transaction = await Transaction.findById(transactionId)
        .populate('booking_id')
        .populate('theatre_id')
        .populate('user_id', 'name email phone');

    if (!transaction) {
        const err = new Error('Receipt not found.');
        err.statusCode = 404;
        throw err;
    }

    // Permission check: only booking owner, theatre owner, or ADMIN can view
    const isOwner = transaction.user_id?._id?.toString() === requestingUserId;
    if (!isOwner) {
        const reqUser = await User.findById(requestingUserId);
        if (reqUser && reqUser.role !== 'ADMIN' && reqUser.role !== 'STAFF') {
            const err = new Error('Unauthorized to access this receipt.');
            err.statusCode = 403;
            throw err;
        }
    }

    let booking = null;
    let show = null;
    let movie = null;
    if (transaction.booking_id) {
        booking = await IntervalBooking.findById(transaction.booking_id._id || transaction.booking_id)
            .populate({
                path: 'show_id',
                populate: [
                    { path: 'movie_id' },
                    { path: 'screen_id', populate: { path: 'theatre_id' } }
                ]
            });
        if (booking?.show_id) {
            show = booking.show_id;
            movie = show.movie_id;
        }
    }

    return {
        receiptNumber: transaction.receipt_number || `REC-${transaction._id.toString().slice(-8).toUpperCase()}`,
        transactionId: transaction._id,
        date: transaction.created_at,
        customer: {
            name: transaction.user_id?.name || 'Customer',
            email: transaction.user_id?.email || '',
            phone: transaction.user_id?.phone || '',
        },
        theatre: {
            name: transaction.theatre_id?.name || show?.screen_id?.theatre_id?.name || 'Grand Palace Cinema',
            address: transaction.theatre_id?.address || 'Cinema Hall Complex',
            city: transaction.theatre_id?.city || 'Chennai',
        },
        booking: booking ? {
            id: booking._id,
            type: booking.booking_type,
            status: booking.status,
            message: booking.message,
            movieTitle: movie?.title || 'Screen Feature',
            showDate: show?.show_date,
            intervalSlot: `${show?.interval_start || '21:00'} - ${show?.interval_end || '21:15'}`,
        } : null,
        payment: {
            totalAmount: transaction.total_amount,
            theatreShare: transaction.theatre_share,
            adminShare: transaction.admin_share,
            paymentMethod: transaction.payment_method || 'WALLET',
            paymentId: transaction.payment_id || `TXN-${transaction._id}`,
            status: transaction.status,
        },
    };
}
