import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  startLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
  },
  endLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'assigned', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  approvalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  departmentHead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  distance: Number,
  rating: Number,
  startTime: Date,
  endTime: Date,
}, {
  timestamps: true
});

export default mongoose.models.Ride || mongoose.model('Ride', rideSchema);