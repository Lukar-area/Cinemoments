import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IntervalBooking',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    theatre_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
    },
    total_amount: { type: Number, required: true },
    theatre_share: { type: Number, required: true },
    admin_share: { type: Number, required: true },
    payment_method: {
      type: String,
      default: 'WALLET',
      enum: ['WALLET', 'RAZORPAY', 'STRIPE', 'UPI'],
    },
    payment_id: { type: String, default: null },
    order_id: { type: String, default: null },
    receipt_number: { type: String, default: null },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      required: true,
      default: 'COMPLETED',
      enum: ['COMPLETED', 'REFUNDED'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

transactionSchema.index({ user_id: 1 }, { name: 'idx_transactions_user' });
transactionSchema.index({ theatre_id: 1 }, { name: 'idx_transactions_theatre' });
transactionSchema.index({ booking_id: 1 }, { name: 'idx_transactions_booking' });

transactionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

transactionSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
