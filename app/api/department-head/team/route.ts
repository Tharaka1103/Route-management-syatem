import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Ride from '@/models/Ride';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all team members in the same department
    const teamMembers = await User.find({ 
      department: session.user.department,
      role: 'user'
    }).select('fullName email contact isActive');

    // Get ride counts for each team member
    const membersWithRideCount = await Promise.all(
      teamMembers.map(async (member) => {
        const totalRides = await Ride.countDocuments({ user: member._id });
        return {
          ...member.toObject(),
          totalRides
        };
      })
    );

    return NextResponse.json({ members: membersWithRideCount });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
