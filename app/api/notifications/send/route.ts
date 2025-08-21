import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkUserRole } from '@/middleware/roleAuth';
import mongoose from 'mongoose';

// Notification schema
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error'], 
    default: 'info' 
  },
  category: {
    type: String,
    enum: [
      'ride_assigned',
      'ride_approved',
      'ride_rejected',
      'ride_completed',
      'ride_cancelled',
      'driver_arrived',
      'driver_en_route',
      'approval_request',
      'payment_received',
      'system_maintenance'
    ],
    required: true,
  },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  dailyRouteId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyRoute' },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.models.Notification || 
  mongoose.model('Notification', NotificationSchema);

// POST: Send notification
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head']);
    const body = await req.json();

    const {
      recipientIds, // Array of user IDs
      title,
      message,
      type = 'info',
      category,
      rideId,
      dailyRouteId,
      metadata,
    } = body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipient IDs are required' },
        { status: 400 }
      );
    }

    if (!title || !message || !category) {
      return NextResponse.json(
        { success: false, error: 'Title, message, and category are required' },
        { status: 400 }
      );
    }

    // Create notifications for all recipients
    const notifications = recipientIds.map(recipientId => ({
      userId: recipientId,
      title,
      message,
      type,
      category,
      rideId: rideId || null,
      dailyRouteId: dailyRouteId || null,
      senderId: user.id,
      metadata: metadata || {},
    }));

    const savedNotifications = await Notification.insertMany(notifications);

    // TODO: Integrate with push notification service here
    // TODO: Send real-time socket notifications here

    return NextResponse.json({
      success: true,
      data: savedNotifications,
      message: `${savedNotifications.length} notification(s) sent successfully`,
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
