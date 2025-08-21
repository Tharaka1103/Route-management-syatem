import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import { checkUserRole } from '@/middleware/roleAuth';
import mongoose from 'mongoose';

// GET: Get notifications for a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head', 'employee']);
    const { userId } = await params;
    const { searchParams } = new URL(req.url);

    // Users can only access their own notifications unless they're admin
    if (user.role !== 'admin' && user._id.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category');

    let query: any = { userId };

    if (unreadOnly) {
      query.read = false;
    }

    if (category) {
      query.category = category;
    }

    const Notification = mongoose.models.Notification;
    if (!Notification) {
      return NextResponse.json(
        { success: false, error: 'Notification model not found' },
        { status: 500 }
      );
    }

    const notifications = await Notification
      .find(query)
      .populate('senderId', 'name email')
      .populate('rideId', 'pickupLocation dropoffLocation status')
      .populate('dailyRouteId', 'routeName date')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH: Mark notifications as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head', 'employee']);
    const { userId } = await params;
    const body = await req.json();

    // Users can only update their own notifications unless they're admin
    if (user.role !== 'admin' && user._id.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { notificationIds, markAllAsRead } = body;

    const Notification = mongoose.models.Notification;
    if (!Notification) {
      return NextResponse.json(
        { success: false, error: 'Notification model not found' },
        { status: 500 }
      );
    }

    let updateQuery: any = { userId };
    let updateData = { 
      read: true, 
      readAt: new Date() 
    };

    if (markAllAsRead) {
      updateQuery.read = false; // Only update unread notifications
    } else if (notificationIds && Array.isArray(notificationIds)) {
      updateQuery._id = { $in: notificationIds };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either notificationIds or markAllAsRead is required' },
        { status: 400 }
      );
    }

    const result = await Notification.updateMany(updateQuery, updateData);

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
      modifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// DELETE: Delete notifications
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head', 'employee']);
    const { userId } = await params;
    const { searchParams } = new URL(req.url);

    // Users can only delete their own notifications unless they're admin
    if (user.role !== 'admin' && user._id.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const notificationIds = searchParams.get('ids')?.split(',') || [];
    const deleteAll = searchParams.get('deleteAll') === 'true';

    const Notification = mongoose.models.Notification;
    if (!Notification) {
      return NextResponse.json(
        { success: false, error: 'Notification model not found' },
        { status: 500 }
      );
    }

    let deleteQuery: any = { userId };

    if (deleteAll) {
      // Delete all notifications for the user
    } else if (notificationIds.length > 0) {
      deleteQuery._id = { $in: notificationIds };
    } else {
      return NextResponse.json(
        { success: false, error: 'Either notification IDs or deleteAll parameter is required' },
        { status: 400 }
      );
    }

    const result = await Notification.deleteMany(deleteQuery);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });

  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
