import mongoose from 'mongoose';

const bookingMediaSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IntervalBooking',
      required: true,
    },
    file_type: {
      type: String,
      required: true,
      enum: ['IMAGE', 'VIDEO'],
    },
    encrypted_file_path: { type: String, required: true },
    original_filename: { type: String, required: true },
    mime_type: { type: String, required: true },
    file_size: { type: Number, required: true },
    iv: { type: String, required: true },
    auth_tag: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

bookingMediaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

bookingMediaSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const BookingMedia = mongoose.model('BookingMedia', bookingMediaSchema);
export default BookingMedia;
