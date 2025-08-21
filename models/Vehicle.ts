import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  make: { type: String, required: true },
  year: { type: Number, required: true },
  capacity: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['available', 'busy', 'maintenance'],
    default: 'available'
  },
  currentDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  totalDistance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ status: 1 });

export default mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema);