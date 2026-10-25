import mongoose from 'mongoose';

const screenSchema = new mongoose.Schema(
  {
    theatre_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
    },
    name: { type: String, required: true },
    capacity: { type: Number, required: true, default: 100 },
    screen_type: {
      type: String,
      required: true,
      default: 'STANDARD',
      enum: ['STANDARD', 'IMAX', '4DX', 'DOLBY', 'VIP'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

screenSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

screenSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Screen = mongoose.model('Screen', screenSchema);
export default Screen;
