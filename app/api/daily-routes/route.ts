import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import DailyRoute from '@/models/DailyRoute';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { driverId, routeId, startTime, startLocation } = body;

    const dailyRoute = new DailyRoute({
      driver: driverId,
      route: routeId,
      startTime: new Date(startTime),
      status: 'ongoing',
      actualStartLocation: startLocation
    });

    await dailyRoute.save();

    const populatedRoute = await DailyRoute.findById(dailyRoute._id)
      .populate(['driver', 'route', 'vehicle']);

    return NextResponse.json(populatedRoute);
  } catch (error) {
    console.error('Daily route creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    let filter: any = {};
    if (driverId) filter.driver = driverId;

    const dailyRoutes = await DailyRoute.find(filter)
      .populate(['driver', 'route', 'vehicle'])
      .sort({ createdAt: -1 });

    return NextResponse.json(dailyRoutes);
  } catch (error) {
    console.error('Get daily routes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}