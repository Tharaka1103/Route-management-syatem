import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Ride from '@/models/Ride';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get rides from employees in the same department
    const rides = await Ride.find({})
      .populate({
        path: 'user',
        match: { department: session.user.department },
        select: 'fullName email department'
      })
      .populate('departmentHead', 'fullName')
      .populate('driver', 'fullName')
      .sort({ createdAt: -1 })
      .exec();

    // Filter out rides where user is null (not from same department)
    const filteredRides = rides.filter(ride => ride.user !== null);

    // Create CSV content
    const csvHeaders = [
      'Date',
      'Employee Name',
      'Employee Email',
      'Start Location',
      'End Location',
      'Distance (km)',
      'Approval Status',
      'Ride Status',
      'Driver',
      'Rejection Reason'
    ];

    const csvRows = filteredRides.map(ride => [
      new Date(ride.createdAt).toLocaleDateString(),
      ride.user.fullName,
      ride.user.email,
      ride.startLocation.address,
      ride.endLocation.address,
      ride.distance || 'N/A',
      ride.approvalStatus,
      ride.status,
      ride.driver ? ride.driver.fullName : 'Not assigned',
      ride.rejectionReason || 'N/A'
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="department-rides-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting rides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
