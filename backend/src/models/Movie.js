import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    poster: { type: String, default: null },
    duration: { type: Number, required: true },
    language: { type: String, required: true, default: 'English' },
    rating: { type: String, required: true, default: 'PG-13' },
    genre: { type: String, required: true },
    description: { type: String, default: null },
    release_date: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

movieSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

movieSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
