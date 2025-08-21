import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientType: { 
    type: String, 
    enum: ['User', 'Driver'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ride_request', 'ride_approved', 'ride_rejected', 'ride_assigned', 'ride_started', 'ride_completed'],
    required: true 
  },
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
