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
