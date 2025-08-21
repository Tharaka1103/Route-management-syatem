import mongoose from 'mongoose';

const dailyRouteSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  distance: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: Date,
  status: { 
    type: String, 
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  actualStartLocation: {
    latitude: Number,
    longitude: Number
  },
  actualEndLocation: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

export default mongoose.models.DailyRoute || mongoose.model('DailyRoute', dailyRouteSchema);