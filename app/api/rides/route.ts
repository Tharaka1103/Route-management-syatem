import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { userId, startLocation, endLocation } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find department head
    const departmentHead = await User.findOne({ 
      department: user.department, 
      role: 'department_head' 
    });

    const ride = new Ride({
      user: userId,
      startLocation,
      endLocation,
      departmentHead: departmentHead?._id,
      status: 'pending',
      approvalStatus: 'pending'
    });

    await ride.save();

    return NextResponse.json({ 
      message: 'Ride created successfully',
      ride
    });
  } catch (error) {
    console.error('Ride creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

    let filter: any = {};
    if (userId) filter.user = userId;
    if (driverId) filter.driver = driverId;
    if (status) filter.status = status;

    const rides = await Ride.find(filter)
      .populate('user', 'fullName email department')
      .populate('driver', 'fullName contact')
      .populate('vehicle', 'vehicleNumber model')
      .sort({ createdAt: -1 });

    return NextResponse.json(rides);
  } catch (error) {
    console.error('Get rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}