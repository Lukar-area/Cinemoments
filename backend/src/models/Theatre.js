import mongoose from 'mongoose';

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    contact_phone: { type: String, default: null },
    contact_email: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    description: { type: String, default: null },
    image: { type: String, default: null },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      required: true,
      default: 'ACTIVE',
      enum: ['ACTIVE', 'INACTIVE'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

theatreSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

theatreSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Theatre = mongoose.model('Theatre', theatreSchema);
export default Theatre;
