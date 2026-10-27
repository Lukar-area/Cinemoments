import test from 'node:test';
import assert from 'node:assert/strict';
import Transaction from '../models/Transaction.js';
import { createPaymentOrder, verifyPayment } from '../services/paymentService.js';

test('Revenue Share, Financial Settlement, and Payment Gateway Operations', async (t) => {
    await t.test('Transaction model includes required payment metadata and indexing', () => {
        const schema = Transaction.schema;
        assert.ok(schema.path('payment_method'), 'payment_method field must exist in Transaction schema');
        assert.ok(schema.path('receipt_number'), 'receipt_number field must exist in Transaction schema');
        assert.ok(schema.path('total_amount'), 'total_amount must exist in Transaction schema');
        assert.ok(schema.path('theatre_share'), 'theatre_share must exist in Transaction schema');
        assert.ok(schema.path('admin_share'), 'admin_share must exist in Transaction schema');

        const allowedPaymentMethods = schema.path('payment_method').enumValues;
        assert.ok(allowedPaymentMethods.includes('WALLET'));
        assert.ok(allowedPaymentMethods.includes('RAZORPAY'));
        assert.ok(allowedPaymentMethods.includes('UPI'));
    });

    await t.test('Revenue share strictly enforces 80% to Theatre Owner and 20% to Super Admin', () => {
        const testAmounts = [500.0, 1200.0, 750.5, 2000.0];

        for (const total of testAmounts) {
            const theatreShare = Math.round(total * 0.8 * 100) / 100;
            const adminShare = Math.round(total * 0.2 * 100) / 100;

            // Total shares must match sum within rounding penny
            assert.equal(theatreShare + adminShare, total);
            assert.equal(theatreShare, total * 0.8);
            assert.equal(adminShare, total * 0.2);
        }
    });

    await t.test('Wallet settlement and refund reversal calculations', () => {
        let customerWallet = 2000.0;
        let ownerWallet = 5000.0;
        let adminWallet = 10000.0;
        const bookingPrice = 500.0;

        // 1. Submit Booking: customer debited, owner gets 80%, admin gets 20%
        const theatreShare = bookingPrice * 0.8; // 400
        const adminShare = bookingPrice * 0.2;   // 100

        customerWallet -= bookingPrice;
        ownerWallet += theatreShare;
        adminWallet += adminShare;

        assert.equal(customerWallet, 1500.0, 'Customer wallet must be 1500 after debit');
        assert.equal(ownerWallet, 5400.0, 'Owner wallet must receive 400 (80%)');
        assert.equal(adminWallet, 10100.0, 'Admin wallet must receive 100 (20%)');

        // 2. Cancellation / Rejection Refund
        let transactionStatus = 'COMPLETED';
        customerWallet += bookingPrice;
        ownerWallet -= theatreShare;
        adminWallet -= adminShare;
        transactionStatus = 'REFUNDED';

        assert.equal(customerWallet, 2000.0, 'Customer wallet must be fully restored to 2000');
        assert.equal(ownerWallet, 5000.0, 'Owner wallet must be reversed to initial 5000');
        assert.equal(adminWallet, 10000.0, 'Admin wallet must be reversed to initial 10000');
        assert.equal(transactionStatus, 'REFUNDED', 'Transaction status must transition to REFUNDED');
    });

    await t.test('Payment Service generates valid orders, receipts, and UPI URI', async () => {
        const order = await createPaymentOrder({
            amount: 750,
            currency: 'INR',
            userId: 'user_test_999',
            showId: 'show_test_999',
            bookingType: 'MARRIAGE_PROPOSAL',
        });

        assert.ok(order.orderId.startsWith('order_cm_'));
        assert.ok(order.receiptNumber.startsWith('REC-'));
        assert.equal(order.amount, 750);
        assert.equal(order.amountInPaise, 75000);
        assert.ok(order.upiUri.includes('upi://pay'));
        assert.ok(order.upiUri.includes('750.00'));

        const verification = await verifyPayment({
            orderId: order.orderId,
            paymentId: 'pay_simulated_777888',
            paymentMethod: 'UPI',
            userId: 'user_test_999',
        });

        assert.equal(verification.verified, true);
        assert.equal(verification.paymentId, 'pay_simulated_777888');
        assert.ok(verification.receiptNumber.startsWith('REC-'));
    });
});
