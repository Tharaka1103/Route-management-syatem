import mongoose from 'mongoose';
import { User, Ride, Device } from './types';

const UserSchema = new mongoose.Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'driver', 'project_manager', 'admin'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

const RideSchema = new mongoose.Schema<Ride>({
  userId: { type: String, required: true },
  driverId: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'awaiting_pm', 'awaiting_admin', 'approved', 'in_progress', 'completed'], 
    default: 'pending' 
  },
  distanceKm: { type: Number, required: true },
  startLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  endLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  approval: {
    projectManager: {
      approved: { type: Boolean },
      approvedAt: { type: Date }
    },
    admin: {
      approved: { type: Boolean },
      approvedAt: { type: Date }
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const DeviceSchema = new mongoose.Schema<Device>({
  terminalId: { type: String, required: true, unique: true },
  vehicle: { type: String, required: true },
  vehicleType: { type: String, required: true },
  status: { type: String, required: true },
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  speed: { type: Number, required: true },
  lastMessage: { type: String, required: true },
  expire: { type: String, required: true }
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const RideModel = mongoose.models.Ride || mongoose.model('Ride', RideSchema);
export const DeviceModel = mongoose.models.Device || mongoose.model('Device', DeviceSchema);