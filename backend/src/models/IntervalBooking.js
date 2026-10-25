import mongoose from 'mongoose';

const intervalBookingSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    show_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    booking_type: {
      type: String,
      required: true,
      enum: [
        'MARRIAGE_PROPOSAL',
        'LOVE_PROPOSAL',
        'ADVERTISEMENT',
        'BIRTHDAY',
        'ANNIVERSARY',
        'PROMOTION',
        'EVENT',
        'CUSTOM',
      ],
    },
    message: { type: String, required: true },
    contact_phone: { type: String, default: null },
    status: {
      type: String,
      required: true,
      default: 'PENDING',
      enum: [
        'PENDING',
        'UNDER_REVIEW',
        'ACCEPTED',
        'REJECTED',
        'EXPIRED',
        'CANCELLED',
        'COMPLETED',
      ],
    },
    rejection_reason: { type: String, default: null },
    accepted_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Prevents two accepted bookings for the same show at the database storage engine level
// Partial unique index: only ONE booking can be ACCEPTED per show
intervalBookingSchema.index(
  { show_id: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACCEPTED' },
    name: 'idx_unique_accepted_interval',
  }
);

intervalBookingSchema.index({ user_id: 1 }, { name: 'idx_bookings_user' });
intervalBookingSchema.index({ show_id: 1 }, { name: 'idx_bookings_show' });
intervalBookingSchema.index({ status: 1 }, { name: 'idx_bookings_status' });

intervalBookingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

intervalBookingSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const IntervalBooking = mongoose.model('IntervalBooking', intervalBookingSchema);
export default IntervalBooking;
