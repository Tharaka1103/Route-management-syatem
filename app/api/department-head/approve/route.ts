import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Ride from '@/models/Ride';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rideId } = await request.json();

    if (!rideId) {
      return NextResponse.json({ error: 'Ride ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Get the current user (department head)
    const departmentHead = await User.findOne({ email: session.user.email });
    if (!departmentHead) {
      return NextResponse.json({ error: 'Department head not found' }, { status: 404 });
    }

    // Find the ride and verify it belongs to the same department
    const ride = await Ride.findById(rideId).populate('user');
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    if (ride.user.department !== departmentHead.department) {
      return NextResponse.json({ error: 'Unauthorized - different department' }, { status: 403 });
    }

    if (ride.approvalStatus !== 'pending') {
      return NextResponse.json({ error: 'Ride is not pending approval' }, { status: 400 });
    }

    // Update ride status
    await Ride.findByIdAndUpdate(rideId, {
      approvalStatus: 'approved',
      departmentHead: departmentHead._id,
      status: 'approved'
    });

    // Create notification for the user
    await Notification.create({
      recipient: ride.user._id,
      recipientType: 'User',
      title: 'Ride Request Approved',
      message: `Your ride request has been approved by ${departmentHead.fullName}`,
      type: 'ride_approved',
      data: { rideId: ride._id }
    });

    // Find project manager for final approval if needed
    const projectManager = await User.findOne({ role: 'project_manager' });
    if (projectManager) {
      // Create notification for project manager
      await Notification.create({
        recipient: projectManager._id,
        recipientType: 'User',
        title: 'Department Head Approval',
        message: `${departmentHead.fullName} approved a ride request - awaiting final approval`,
        type: 'ride_request',
        data: { rideId: ride._id }
      });
    }

    return NextResponse.json({ 
      message: 'Ride approved successfully',
      ride: await Ride.findById(rideId).populate('user departmentHead projectManager')
    });
  } catch (error) {
    console.error('Error approving ride:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
