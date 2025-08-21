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
    
    if (!session || session.user.role !== 'project_manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rideId } = await request.json();

    if (!rideId) {
      return NextResponse.json({ error: 'Ride ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Get the current user (project manager)
    const projectManager = await User.findOne({ email: session.user.email });
    if (!projectManager) {
      return NextResponse.json({ error: 'Project manager not found' }, { status: 404 });
    }

    // Find the ride
    const ride = await Ride.findById(rideId).populate('user departmentHead');
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Check if ride was already approved by department head
    if (!ride.departmentHead) {
      return NextResponse.json({ error: 'Ride must be approved by department head first' }, { status: 400 });
    }

    if (ride.projectManager) {
      return NextResponse.json({ error: 'Ride has already been processed by project manager' }, { status: 400 });
    }

    // Update ride status - final approval by project manager
    await Ride.findByIdAndUpdate(rideId, {
      projectManager: projectManager._id,
      status: 'approved'
    });

    // Create notification for the user
    await Notification.create({
      recipient: ride.user._id,
      recipientType: 'User',
      title: 'Final Ride Approval',
      message: `Your ride request has received final approval from ${projectManager.fullName}`,
      type: 'ride_approved',
      data: { rideId: ride._id }
    });

    // Create notification for department head
    if (ride.departmentHead) {
      await Notification.create({
        recipient: ride.departmentHead._id,
        recipientType: 'User',
        title: 'Project Manager Approval',
        message: `${projectManager.fullName} approved the ride request you recommended`,
        type: 'ride_approved',
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
