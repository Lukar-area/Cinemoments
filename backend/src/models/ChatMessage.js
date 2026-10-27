import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    theatre_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender_role: {
      type: String,
      required: true,
      enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
    },
    message: { type: String, default: '' },
    has_media: { type: Boolean, default: false },
    media_type: { type: String, enum: ['VIDEO', 'IMAGE', null], default: null },
    encrypted_file_path: { type: String, default: null },
    original_filename: { type: String, default: null },
    mime_type: { type: String, default: null },
    file_size: { type: Number, default: 0 },
    iv: { type: String, default: null },
    auth_tag: { type: String, default: null },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IntervalBooking',
      default: null,
    },
    is_read: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

chatMessageSchema.index(
  { theatre_id: 1, user_id: 1 },
  { name: 'idx_chat_theatre_user' }
);

chatMessageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

chatMessageSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
