import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: null },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
    },
    status: {
      type: String,
      required: true,
      default: 'ACTIVE',
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    },
    wallet_balance: { type: Number, required: true, default: 2000.0 },
    theatre_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Convert _id to id and remove __v in JSON responses
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

userSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
