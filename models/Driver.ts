import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  contact: { type: String, required: true },
  email: String,
  nic: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: String,
  rating: { type: Number, default: 0 },
  totalDistance: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  isActive: { type: Boolean, default: true },
  currentLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  }
}, {
  timestamps: true
});

driverSchema.index({ status: 1 });

export default mongoose.models.Driver || mongoose.model('Driver', driverSchema);