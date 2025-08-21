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

    // Get all rides for export
    const rides = await Ride.find({})
      .populate('user', 'fullName email department')
      .populate('departmentHead', 'fullName department')
      .populate('projectManager', 'fullName')
      .populate('driver', 'fullName')
      .sort({ createdAt: -1 })
      .exec();

    // Create CSV content
    const csvHeaders = [
      'Date',
      'Employee Name',
      'Employee Email',
      'Department',
      'Start Location',
      'End Location',
      'Distance (km)',
      'Department Head',
      'Project Manager',
      'Approval Status',
      'Ride Status',
      'Driver',
      'Rejection Reason'
    ];

    const csvRows = rides.map(ride => [
      new Date(ride.createdAt).toLocaleDateString(),
      ride.user.fullName,
      ride.user.email,
      ride.user.department,
      ride.startLocation.address,
      ride.endLocation.address,
      ride.distance || 'N/A',
      ride.departmentHead ? ride.departmentHead.fullName : 'Not approved',
      ride.projectManager ? ride.projectManager.fullName : 'Not processed',
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
        'Content-Disposition': `attachment; filename="project-manager-rides-${new Date().toISOString().split('T')[0]}.csv"`
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
