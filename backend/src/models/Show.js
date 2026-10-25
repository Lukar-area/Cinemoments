import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
  {
    movie_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    screen_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screen',
      required: true,
    },
    show_date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    interval_start: { type: String, required: true },
    interval_end: { type: String, required: true },
    price_estimate: { type: Number, required: true, default: 500.0 },
    status: {
      type: String,
      required: true,
      default: 'SCHEDULED',
      enum: ['SCHEDULED', 'CANCELLED', 'COMPLETED'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

showSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

showSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Show = mongoose.model('Show', showSchema);
export default Show;
