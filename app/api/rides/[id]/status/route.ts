import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { checkUserRole } from '@/middleware/roleAuth';
import mongoose from 'mongoose';

// PATCH: Update ride status with real-time notifications
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head']);
    const { id: rideId } = await params;
    const body = await req.json();

    const { status, location, estimatedArrival, notes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'pending',
      'approved',
      'rejected',
      'assigned',
      'driver_en_route',
      'driver_arrived',
      'passenger_picked_up',
      'in_transit',
      'completed',
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const Ride = mongoose.models.Ride;
    
    if (!Ride) {
      return NextResponse.json(
        { success: false, error: 'Ride model not found' },
        { status: 500 }
      );
    }

    // Find the ride
    const ride = await Ride.findById(rideId).populate('userId', 'name email');
    if (!ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'driver' && ride.driverId?.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only update rides assigned to you' },
        { status: 403 }
      );
    }

    // Update ride
    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };

    if (location) {
      updateData.currentLocation = location;
    }

    if (estimatedArrival) {
      updateData.estimatedArrival = new Date(estimatedArrival);
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Add status history
    if (!ride.statusHistory) {
      ride.statusHistory = [];
    }
    ride.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: user.id,
      notes,
    });

    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      { ...updateData, statusHistory: ride.statusHistory },
      { new: true }
    ).populate('userId driverId', 'name email');

    return NextResponse.json({
      success: true,
      data: updatedRide,
      message: `Ride status updated to ${status}`,
    });

  } catch (error) {
    console.error('Error updating ride status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ride status' },
      { status: 500 }
    );
  }
}

// GET: Get ride status history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head', 'employee']);
    const { id: rideId } = await params;

    const Ride = mongoose.models.Ride;
    if (!Ride) {
      return NextResponse.json(
        { success: false, error: 'Ride model not found' },
        { status: 500 }
      );
    }

    const ride = await Ride.findById(rideId)
      .select('status statusHistory currentLocation estimatedArrival')
      .populate('statusHistory.updatedBy', 'name email');

    if (!ride) {
      return NextResponse.json(
        { success: false, error: 'Ride not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'user' && ride.userId?.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: ride.status,
        currentLocation: ride.currentLocation,
        estimatedArrival: ride.estimatedArrival,
        statusHistory: ride.statusHistory || [],
      },
    });

  } catch (error) {
    console.error('Error fetching ride status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ride status' },
      { status: 500 }
    );
  }
}
