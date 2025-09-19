import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/mongodb';
import { RideModel } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const decoded = verifyToken(token!) as any;
    
    await connectDB();
    // Get ID from URL search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Ride ID is required' }, { status: 400 });
    }
    const ride = await RideModel.findById(id);
    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }
    
    if (decoded.role === 'project_manager' && ride.status === 'awaiting_pm') {
      ride.approval.projectManager = {
        approved: true,
        approvedAt: new Date()
      };
      ride.status = 'awaiting_admin';
    } else if (decoded.role === 'admin' && ride.status === 'awaiting_admin') {
      ride.approval.admin = {
        approved: true,
        approvedAt: new Date()
      };
      ride.status = 'approved';
    } else {
      return NextResponse.json({ error: 'Cannot approve this ride' }, { status: 400 });
    }
    
    await ride.save();
    
    return NextResponse.json(ride);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}