import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find the user to get their ID
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get notifications for the current user
    const notifications = await Notification.find({
      recipient: user._id,
      recipientType: 'User'
    })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 notifications
      .exec();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient, recipientType, title, message, type, data } = await request.json();

    if (!recipient || !recipientType || !title || !message || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipient, recipientType, title, message, type' 
      }, { status: 400 });
    }

    await dbConnect();

    const notification = await Notification.create({
      recipient,
      recipientType,
      title,
      message,
      type,
      data: data || {}
    });

    return NextResponse.json({ 
      message: 'Notification created successfully',
      notification 
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
