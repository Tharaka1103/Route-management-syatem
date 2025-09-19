import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/mongodb';
import { RideModel } from '@/lib/models';
import { verifyToken } from '@/lib/auth';
import { calculateRoute } from '@/lib/maps';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = verifyToken(token!) as any;
    
    await connectDB();
    
    let query = {};
    
    if (decoded.role === 'user') {
      query = { userId: decoded.userId };
    } else if (decoded.role === 'driver') {
      query = { driverId: decoded.userId };
    } else if (decoded.role === 'project_manager') {
      query = { status: 'awaiting_pm' };
    }
    // Admin can see all rides
    
    const rides = await RideModel.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json(rides);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = verifyToken(token!) as any;
    
    if (decoded.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    await connectDB();
    
    const { startLocation, endLocation } = await request.json();
    
    // Calculate route distance
    const { distanceKm } = await calculateRoute(
      { lat: startLocation.lat, lng: startLocation.lng },
      { lat: endLocation.lat, lng: endLocation.lng }
    );
    
    const ride = new RideModel({
      userId: decoded.userId,
      distanceKm,
      startLocation,
      endLocation,
      status: distanceKm > 25 ? 'awaiting_pm' : 'awaiting_admin',
      approval: {}
    });
    
    await ride.save();
    
    return NextResponse.json(ride);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}