import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'project_manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const departments = ['mechanical', 'civil', 'electrical', 'HSEQ', 'HR'];

    // Get overall statistics
    const [
      totalRides,
      pendingApprovals,
      approvedRides,
      rejectedRides,
      monthlyRides
    ] = await Promise.all([
      Ride.countDocuments({}),
      Ride.countDocuments({ 
        departmentHead: { $exists: true },
        projectManager: { $exists: false }
      }),
      Ride.countDocuments({ 
        projectManager: { $exists: true },
        approvalStatus: 'approved'
      }),
      Ride.countDocuments({ 
        approvalStatus: 'rejected'
      }),
      Ride.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    // Get cross-department rides (rides between different departments)
    const crossDepartmentRides = await Ride.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'departmentHead',
          foreignField: '_id',
          as: 'deptHeadInfo'
        }
      },
      {
        $match: {
          $expr: {
            $ne: [
              { $arrayElemAt: ['$userInfo.department', 0] },
              { $arrayElemAt: ['$deptHeadInfo.department', 0] }
            ]
          }
        }
      },
      { $count: 'total' }
    ]);

    // Get department-wise statistics
    const departmentStats: { [key: string]: any } = {};
    
    for (const dept of departments) {
      const deptUsers = await User.find({ 
        department: dept,
        role: { $in: ['user'] }
      }).select('_id');
      
      const userIds = deptUsers.map(user => user._id);

      const [deptTotal, deptPending, deptApproved] = await Promise.all([
        Ride.countDocuments({ user: { $in: userIds } }),
        Ride.countDocuments({ 
          user: { $in: userIds },
          departmentHead: { $exists: true },
          projectManager: { $exists: false }
        }),
        Ride.countDocuments({ 
          user: { $in: userIds },
          projectManager: { $exists: true }
        })
      ]);

      departmentStats[dept] = {
        totalRides: deptTotal,
        pendingApprovals: deptPending,
        approvedRides: deptApproved
      };
    }

    const stats = {
      totalRides,
      pendingApprovals,
      approvedRides,
      rejectedRides,
      crossDepartmentRides: crossDepartmentRides[0]?.total || 0,
      monthlyRides,
      departmentStats
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching project manager stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
