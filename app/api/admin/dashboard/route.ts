import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import User from '@/models/User';
import Driver from '@/models/Driver';
import Vehicle from '@/models/Vehicle';
import Ride from '@/models/Ride';
import Route from '@/models/Route';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [
      totalUsers,
      totalDrivers,
      totalVehicles,
      totalRoutes,
      totalRides,
      activeRides,
      pendingRides,
      completedRides,
      availableDrivers,
      busyDrivers,
      availableVehicles,
      maintenanceVehicles,
      recentRides,
      usersByDepartment,
      ridesByStatus
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Driver.countDocuments(),
      Vehicle.countDocuments(),
      Route.countDocuments(),
      Ride.countDocuments(),
      Ride.countDocuments({ status: { $in: ['assigned', 'ongoing'] } }),
      Ride.countDocuments({ status: 'pending' }),
      Ride.countDocuments({ status: 'completed' }),
      Driver.countDocuments({ status: 'available' }),
      Driver.countDocuments({ status: 'busy' }),
      Vehicle.countDocuments({ status: 'available' }),
      Vehicle.countDocuments({ status: 'maintenance' }),
      Ride.find()
        .populate('user', 'fullName email')
        .populate('driver', 'fullName')
        .populate('vehicle', 'vehicleNumber')
        .sort({ createdAt: -1 })
        .limit(10),
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } }
      ]),
      Ride.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalDrivers,
        totalVehicles,
        totalRoutes,
        totalRides
      },
      rides: {
        active: activeRides,
        pending: pendingRides,
        completed: completedRides
      },
      drivers: {
        available: availableDrivers,
        busy: busyDrivers,
        offline: totalDrivers - availableDrivers - busyDrivers
      },
      vehicles: {
        available: availableVehicles,
        busy: totalVehicles - availableVehicles - maintenanceVehicles,
        maintenance: maintenanceVehicles
      },
      charts: {
        usersByDepartment: usersByDepartment.map(item => ({
          department: item._id || 'No Department',
          count: item.count
        })),
        ridesByStatus: ridesByStatus.map(item => ({
          status: item._id,
          count: item.count
        }))
      },
      recentRides
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
