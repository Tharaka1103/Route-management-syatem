import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Driver from '@/models/Driver';
import dbConnect from '@/lib/mongodb';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const driver = await Driver.findOne({ 
      $or: [
        { email: session.user.email },
        { nic: session.user.email }
      ]
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Location coordinates required' }, { status: 400 });
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      driver._id,
      {
        currentLocation: {
          latitude,
          longitude,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    return NextResponse.json({ 
      message: 'Location updated successfully',
      location: updatedDriver.currentLocation 
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const driver = await Driver.findOne({ 
      $or: [
        { email: session.user.email },
        { nic: session.user.email }
      ]
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json(driver.currentLocation || null);
  } catch (error) {
    console.error('Error fetching driver location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
