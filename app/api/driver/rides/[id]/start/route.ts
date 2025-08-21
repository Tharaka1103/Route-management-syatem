import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'
import Driver from '@/models/Driver'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rideId } = await params

    await dbConnect()

    // Verify the ride is assigned to this driver
    const ride = await Ride.findOne({
      _id: rideId,
      driver: session.user.id,
      status: 'assigned'
    }).populate('user', 'fullName email')
     .populate('vehicle', 'vehicleNumber model')

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found or not assigned to you' }, { status: 404 })
    }

    // Update ride status to ongoing
    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        status: 'ongoing',
        startTime: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'fullName email')
     .populate('driver', 'fullName contact')
     .populate('vehicle', 'vehicleNumber model')

    // Update driver status
    await Driver.findByIdAndUpdate(session.user.id, {
      status: 'busy'
    })

    return NextResponse.json({ 
      message: 'Ride started successfully',
      ride: updatedRide
    })

  } catch (error) {
    console.error('Error starting ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
