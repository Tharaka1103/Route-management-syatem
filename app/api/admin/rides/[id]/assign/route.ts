import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'
import Driver from '@/models/Driver'
import Vehicle from '@/models/Vehicle'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { driverId, vehicleId } = await request.json()
    const { id: rideId } = await params

    if (!driverId || !vehicleId) {
      return NextResponse.json({ error: 'Driver ID and Vehicle ID are required' }, { status: 400 })
    }

    await dbConnect()

    // Check if driver and vehicle are available
    const [driver, vehicle, ride] = await Promise.all([
      Driver.findById(driverId),
      Vehicle.findById(vehicleId),
      Ride.findById(rideId)
    ])

    if (!driver || !vehicle || !ride) {
      return NextResponse.json({ error: 'Driver, vehicle, or ride not found' }, { status: 404 })
    }

    if (driver.status !== 'available') {
      return NextResponse.json({ error: 'Driver is not available' }, { status: 400 })
    }

    if (vehicle.status !== 'available') {
      return NextResponse.json({ error: 'Vehicle is not available' }, { status: 400 })
    }

    if (ride.status !== 'approved') {
      return NextResponse.json({ error: 'Ride is not in approved status' }, { status: 400 })
    }

    // Update ride with driver and vehicle assignment
    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        driver: driverId,
        vehicle: vehicleId,
        status: 'assigned',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'fullName email')
     .populate('driver', 'fullName contact')
     .populate('vehicle', 'vehicleNumber model')

    // Update driver and vehicle status
    await Promise.all([
      Driver.findByIdAndUpdate(driverId, { status: 'busy' }),
      Vehicle.findByIdAndUpdate(vehicleId, { status: 'busy', currentDriver: driverId })
    ])

    return NextResponse.json({ 
      message: 'Ride assigned successfully',
      ride: updatedRide
    })

  } catch (error) {
    console.error('Error assigning ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
