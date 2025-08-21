import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { checkUserRole } from '@/middleware/roleAuth';
import mongoose from 'mongoose';

// Location tracking schema
const LocationTrackingSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
  dailyRouteId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyRoute' },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  accuracy: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  timestamp: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'break'], 
    default: 'active' 
  },
});

LocationTrackingSchema.index({ driverId: 1, timestamp: -1 });
LocationTrackingSchema.index({ rideId: 1, timestamp: -1 });
LocationTrackingSchema.index({ dailyRouteId: 1, timestamp: -1 });

const LocationTracking = mongoose.models.LocationTracking || 
  mongoose.model('LocationTracking', LocationTrackingSchema);

// GET: Get location tracking data
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head']);
    const { searchParams } = new URL(req.url);
    
    const driverId = searchParams.get('driverId');
    const rideId = searchParams.get('rideId');
    const dailyRouteId = searchParams.get('dailyRouteId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = {};

    // Build query based on user role and parameters
    if (user.role === 'driver') {
      query.driverId = user.id;
    } else if (driverId) {
      query.driverId = driverId;
    }

    if (rideId) query.rideId = rideId;
    if (dailyRouteId) query.dailyRouteId = dailyRouteId;

    const locations = await LocationTracking
      .find(query)
      .populate('driverId', 'name email')
      .populate('rideId', 'pickupLocation dropoffLocation status')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await LocationTracking.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: locations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching location data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location data' },
      { status: 500 }
    );
  }
}

// POST: Save location data
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const { user } = await checkUserRole(['driver']);
    const body = await req.json();

    const {
      rideId,
      dailyRouteId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      status,
    } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const locationData = new LocationTracking({
      driverId: user.id,
      rideId: rideId || null,
      dailyRouteId: dailyRouteId || null,
      coordinates: { latitude, longitude },
      accuracy,
      speed,
      heading,
      status: status || 'active',
    });

    await locationData.save();

    return NextResponse.json({
      success: true,
      data: locationData,
      message: 'Location saved successfully',
    });

  } catch (error) {
    console.error('Error saving location data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save location data' },
      { status: 500 }
    );
  }
}
