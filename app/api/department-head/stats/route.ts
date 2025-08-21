import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all users in the same department
    const departmentUsers = await User.find({ 
      department: session.user.department,
      role: { $in: ['user'] }
    }).select('_id');
    
    const userIds = departmentUsers.map(user => user._id);

    // Get ride statistics for the department
    const [
      totalRides,
      pendingApprovals,
      approvedRides,
      rejectedRides,
      teamMembers,
      monthlyRides
    ] = await Promise.all([
      Ride.countDocuments({ user: { $in: userIds } }),
      Ride.countDocuments({ 
        user: { $in: userIds },
        approvalStatus: 'pending'
      }),
      Ride.countDocuments({ 
        user: { $in: userIds },
        approvalStatus: 'approved'
      }),
      Ride.countDocuments({ 
        user: { $in: userIds },
        approvalStatus: 'rejected'
      }),
      User.countDocuments({ 
        department: session.user.department,
        role: 'user',
        isActive: true
      }),
      Ride.countDocuments({
        user: { $in: userIds },
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    const stats = {
      totalRides,
      pendingApprovals,
      approvedRides,
      rejectedRides,
      teamMembers,
      monthlyRides
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
