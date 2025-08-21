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

    // Get all rides that have been approved by department heads
    // Project managers review department head approvals
    const rides = await Ride.find({
      departmentHead: { $exists: true }
    })
      .populate('user', 'fullName email department')
      .populate('departmentHead', 'fullName department')
      .populate('projectManager', 'fullName')
      .sort({ createdAt: -1 })
      .exec();

    return NextResponse.json({ rides });
  } catch (error) {
    console.error('Error fetching project manager rides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
