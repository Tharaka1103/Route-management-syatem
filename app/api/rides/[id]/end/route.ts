import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Ride from '@/models/Ride';
import Driver from '@/models/Driver';
import Vehicle from '@/models/Vehicle';
import { calculateDistance } from '@/lib/maps';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { endTime, endLocation } = await request.json();

    const ride = await Ride.findById(params.id).populate(['driver', 'vehicle']);
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Calculate distance
    const distance = await calculateDistance(
      ride.startLocation,
      ride.endLocation
    );

    // Update ride
    const updatedRide = await Ride.findByIdAndUpdate(
      params.id,
      {
        status: 'completed',
        endTime: new Date(endTime),
        actualEndLocation: endLocation,
        distance
      },
      { new: true }
    ).populate(['user', 'driver', 'vehicle']);

    // Update driver total distance and status
    if (ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver._id, {
        $inc: { totalDistance: distance },
        status: 'available'
      });
    }

    // Update vehicle status
    if (ride.vehicle) {
      await Vehicle.findByIdAndUpdate(ride.vehicle._id, {
        status: 'available'
      });
    }

    return NextResponse.json(updatedRide);
  } catch (error) {
    console.error('Error ending ride:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}