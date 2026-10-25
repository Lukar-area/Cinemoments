import mongoose from 'mongoose';

const theatreStaffSchema = new mongoose.Schema(
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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Compound unique index on (theatre_id, user_id)
theatreStaffSchema.index({ theatre_id: 1, user_id: 1 }, { unique: true });

theatreStaffSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

theatreStaffSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const TheatreStaff = mongoose.model('TheatreStaff', theatreStaffSchema);
export default TheatreStaff;
