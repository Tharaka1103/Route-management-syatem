import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()
    const { id: rideId } = await params

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    await dbConnect()

    // Verify the ride belongs to this department head
    const ride = await Ride.findOne({
      _id: rideId,
      departmentHead: session.user.id,
      approvalStatus: 'pending'
    })

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found or already processed' }, { status: 404 })
    }

    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        approvalStatus: 'rejected',
        status: 'cancelled',
        rejectionReason: reason,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'fullName email')
     .populate('departmentHead', 'fullName')

    return NextResponse.json({ 
      message: 'Ride rejected successfully',
      ride: updatedRide
    })

  } catch (error) {
    console.error('Error rejecting ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
