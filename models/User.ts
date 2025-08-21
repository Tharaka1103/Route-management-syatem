import mongoose from 'mongoose';
import { Department, UserRole } from '@/types';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  department: { 
    type: String, 
    enum: ['mechanical', 'civil', 'electrical', 'HSEQ', 'HR'],
    required: false
  },
  role: { 
    type: String, 
    required: true,
    enum: ['user', 'driver', 'department_head', 'project_manager', 'admin'],
    default: 'user'
  },
  contact: String,
  address: String,
  image: String,
  password: String,
  googleId: String,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

userSchema.index({ role: 1, department: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);