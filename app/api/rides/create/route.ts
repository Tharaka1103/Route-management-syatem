import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startLocation, endLocation, distance: providedDistance, requestedTime } = await req.json();

    if (!startLocation || !endLocation) {
      return NextResponse.json({ error: 'Start and end locations are required' }, { status: 400 });
    }

    await dbConnect();

    // Get user details for department head assignment
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find department head if user has department
    let departmentHead = null;
    if (user.department) {
      departmentHead = await User.findOne({ 
        role: 'department_head', 
        department: user.department 
      });
    }

    // Use provided distance or calculate as fallback
    const distance = providedDistance || Math.sqrt(
      Math.pow(endLocation.latitude - startLocation.latitude, 2) + 
      Math.pow(endLocation.longitude - startLocation.longitude, 2)
    ) * 111; // Approximate km conversion

    const rideData = {
      user: session.user.id,
      startLocation,
      endLocation,
      distance,
      status: 'pending',
      approvalStatus: 'pending',
      departmentHead: departmentHead?._id,
      requestedTime: requestedTime ? new Date(requestedTime) : new Date()
    };

    const ride = new Ride(rideData);
    await ride.save();

    return NextResponse.json({ 
      message: 'Ride request created successfully',
      ride: ride
    });

  } catch (error) {
    console.error('Error creating ride:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
