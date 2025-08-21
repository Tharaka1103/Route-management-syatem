import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import Driver from '@/models/Driver';
import Ride from '@/models/Ride';
import DailyRoute from '@/models/DailyRoute';
import dbConnect from '@/lib/mongodb';

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

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get statistics
    const [
      totalRides,
      completedRides,
      todayRides,
      monthlyRides,
      todayRoutes,
      monthlyRoutes,
      averageRating
    ] = await Promise.all([
      Ride.countDocuments({ driver: driver._id }),
      Ride.countDocuments({ driver: driver._id, status: 'completed' }),
      Ride.countDocuments({ 
        driver: driver._id, 
        createdAt: { $gte: startOfDay, $lte: endOfDay } 
      }),
      Ride.countDocuments({ 
        driver: driver._id, 
        createdAt: { $gte: startOfMonth, $lte: endOfMonth } 
      }),
      DailyRoute.countDocuments({ 
        driver: driver._id, 
        createdAt: { $gte: startOfDay, $lte: endOfDay } 
      }),
      DailyRoute.countDocuments({ 
        driver: driver._id, 
        createdAt: { $gte: startOfMonth, $lte: endOfMonth } 
      }),
      Ride.aggregate([
        { $match: { driver: driver._id, rating: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    // Get recent activities
    const recentRides = await Ride.find({ driver: driver._id })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('user startLocation endLocation status rating createdAt');

    const recentRoutes = await DailyRoute.find({ driver: driver._id })
      .populate('route', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('route distance status createdAt');

    // Get today's earnings (mock calculation - adjust based on your pricing model)
    const todayCompletedRides = await Ride.find({ 
      driver: driver._id, 
      status: 'completed',
      endTime: { $gte: startOfDay, $lte: endOfDay } 
    });

    const todayEarnings = todayCompletedRides.reduce((total, ride) => {
      // Mock calculation: base fare + distance-based fare
      const baseFare = 500; // LKR 500 base fare
      const perKmRate = 50; // LKR 50 per km
      const rideEarning = baseFare + ((ride.distance || 0) * perKmRate);
      return total + rideEarning;
    }, 0);

    const monthlyCompletedRides = await Ride.find({ 
      driver: driver._id, 
      status: 'completed',
      endTime: { $gte: startOfMonth, $lte: endOfMonth } 
    });

    const monthlyEarnings = monthlyCompletedRides.reduce((total, ride) => {
      const baseFare = 500;
      const perKmRate = 50;
      const rideEarning = baseFare + ((ride.distance || 0) * perKmRate);
      return total + rideEarning;
    }, 0);

    return NextResponse.json({
      driver: {
        fullName: driver.fullName,
        rating: driver.rating,
        totalDistance: driver.totalDistance,
        status: driver.status
      },
      statistics: {
        totalRides,
        completedRides,
        todayRides,
        monthlyRides,
        todayRoutes,
        monthlyRoutes,
        averageRating: averageRating[0]?.avgRating || 0,
        todayEarnings,
        monthlyEarnings,
        totalEarnings: monthlyEarnings * 12 // Mock annual calculation
      },
      recentActivities: {
        rides: recentRides,
        routes: recentRoutes
      }
    });
  } catch (error) {
    console.error('Error fetching driver dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
