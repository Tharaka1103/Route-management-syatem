import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    // Get assigned rides (not completed)
    const assignedRides = await Ride.find({
      driver: session.user.id,
      status: { $in: ['assigned', 'ongoing'] }
    })
    .populate('user', 'fullName email contact')
    .populate('vehicle', 'vehicleNumber model')
    .sort({ createdAt: -1 })

    // Get ride history (completed rides)
    const rideHistory = await Ride.find({
      driver: session.user.id,
      status: { $in: ['completed', 'cancelled'] }
    })
    .populate('user', 'fullName email contact')
    .populate('vehicle', 'vehicleNumber model')
    .sort({ updatedAt: -1 })
    .limit(20)

    return NextResponse.json({ 
      assigned: assignedRides,
      history: rideHistory
    })
  } catch (error) {
    console.error('Error fetching driver rides:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
