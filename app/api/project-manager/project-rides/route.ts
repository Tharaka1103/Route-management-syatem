import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Ride from '@/models/Ride';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'project_manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get project-related rides
    // For this demo, we'll consider high priority or long-distance rides as project-related
    const projectRides = await Ride.find({
      $or: [
        { distance: { $gte: 50 } }, // Long distance rides
        { priority: 'high' }
      ]
    })
      .populate('user', 'fullName email department')
      .populate('departmentHead', 'fullName department')
      .populate('projectManager', 'fullName')
      .sort({ createdAt: -1 })
      .exec();

    // Add mock project data for demonstration
    const ridesWithProjects = projectRides.map(ride => ({
      ...ride.toObject(),
      project: ride.distance && ride.distance >= 50 ? 'Site Visit Project' : 'High Priority Task',
      priority: ride.priority || (ride.distance && ride.distance >= 50 ? 'high' : 'medium')
    }));

    return NextResponse.json({ rides: ridesWithProjects });
  } catch (error) {
    console.error('Error fetching project rides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
