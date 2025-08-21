import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Ride from '@/models/Ride';
import Driver from '@/models/Driver';
import Vehicle from '@/models/Vehicle';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const { driverId, vehicleId } = await request.json();

    const url = new URL(request.url);
    const rideId = url.pathname.split('/')[3]; // /api/rides/[id]/assign

    // Update ride with driver and vehicle
    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        driver: driverId,
        vehicle: vehicleId,
        status: 'assigned'
      },
      { new: true }
    ).populate(['user', 'driver', 'vehicle']);

    // Update driver and vehicle status
    await Driver.findByIdAndUpdate(driverId, { status: 'busy' });
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'busy' });

    return NextResponse.json(ride);
  } catch (error) {
    console.error('Error assigning ride:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}