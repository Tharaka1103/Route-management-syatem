import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Ride from '@/models/Ride';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { startTime, startLocation } = await request.json();

    const ride = await Ride.findByIdAndUpdate(
      params.id,
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