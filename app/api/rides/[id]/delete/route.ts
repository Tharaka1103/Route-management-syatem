import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rideId } = await params

    await dbConnect()

    let canDelete = false
    let ride = null

    if (session.user.role === 'admin') {
      // Admin can delete any ride
      ride = await Ride.findById(rideId)
      canDelete = true
    } else if (session.user.role === 'driver') {
      // Driver can only delete their own completed rides
      ride = await Ride.findOne({
        _id: rideId,
        driver: session.user.id,
        status: { $in: ['completed', 'cancelled'] }
      })
      canDelete = !!ride
    } else {
      // Users can only delete their own rides that are completed or cancelled
      ride = await Ride.findOne({
        _id: rideId,
        user: session.user.id,
        status: { $in: ['completed', 'cancelled', 'rejected'] }
      })
      canDelete = !!ride
    }

    if (!canDelete || !ride) {
      return NextResponse.json({ 
        error: 'Ride not found or you do not have permission to delete this ride' 
      }, { status: 404 })
    }

    // Check if ride is still active
    if (['pending', 'approved', 'assigned', 'ongoing'].includes(ride.status)) {
      return NextResponse.json({ 
        error: 'Cannot delete active rides. Please cancel the ride first.' 
      }, { status: 400 })
    }

    await Ride.findByIdAndDelete(rideId)

    return NextResponse.json({ 
      message: 'Ride deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
