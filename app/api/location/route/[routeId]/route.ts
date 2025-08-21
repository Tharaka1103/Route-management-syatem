import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { checkUserRole } from '@/middleware/roleAuth';
import mongoose from 'mongoose';

// GET: Get location tracking for a specific route
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    await dbConnect();
    
    const { user } = await checkUserRole(['admin', 'driver', 'project_manager', 'department_head', 'employee']);
    const { routeId } = await params;
    const { searchParams } = new URL(req.url);
    
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const driverId = searchParams.get('driverId');

    let query: any = { dailyRouteId: routeId };

    // Add date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Add driver filter
    if (driverId) {
      query.driverId = driverId;
    }

    // If user is a driver, only show their own locations
    if (user.role === 'driver') {
      query.driverId = user._id;
    }

    const LocationTracking = mongoose.models.LocationTracking;
    if (!LocationTracking) {
      return NextResponse.json(
        { success: false, error: 'Location tracking not initialized' },
        { status: 500 }
      );
    }

    const locations = await LocationTracking
      .find(query)
      .populate('driverId', 'name email')
      .populate('dailyRouteId', 'routeName date')
      .sort({ timestamp: 1 });

    // Group locations by driver and time intervals
    const groupedLocations = locations.reduce((acc: any, location: any) => {
      const driverKey = location.driverId._id.toString();
      
      if (!acc[driverKey]) {
        acc[driverKey] = {
          driver: location.driverId,
          route: location.dailyRouteId,
          locations: [],
        };
      }
      
      acc[driverKey].locations.push({
        coordinates: location.coordinates,
        timestamp: location.timestamp,
        status: location.status,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
      });
      
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: Object.values(groupedLocations),
      routeId,
    });

  } catch (error) {
    console.error('Error fetching route location data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch route location data' },
      { status: 500 }
    );
  }
}
