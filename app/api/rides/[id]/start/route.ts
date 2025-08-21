import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const { startTime, startLocation } = await request.json();

    const url = new URL(request.url);
    const rideId = url.pathname.split('/')[3]; // /api/rides/[id]/start

    const ride = await Ride.findByIdAndUpdate(
      rideId,
      {
        status: 'ongoing',
        startTime: new Date(startTime),
        actualStartLocation: startLocation
      },
      { new: true }
    ).populate(['user', 'driver', 'vehicle']);

    return NextResponse.json(ride);
  } catch (error) {
    console.error('Error starting ride:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}