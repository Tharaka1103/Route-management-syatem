import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
  distance: { type: Number, required: true },
}, {
  timestamps: true
});

export default mongoose.models.Route || mongoose.model('Route', routeSchema);