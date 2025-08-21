import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'
import Driver from '@/models/Driver'
import Vehicle from '@/models/Vehicle'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rideId } = await params
    const { endLocation, actualDistance } = await request.json()

    await dbConnect()

    // Verify the ride is assigned to this driver and ongoing
    const ride = await Ride.findOne({
      _id: rideId,
      driver: session.user.id,
      status: 'ongoing'
    })

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found or not in progress' }, { status: 404 })
    }

    // Calculate trip duration
    const startTime = ride.startTime
    const endTime = new Date()
    const duration = startTime ? Math.abs(endTime.getTime() - startTime.getTime()) / (1000 * 60) : 0 // minutes

    // Use actual distance if provided, otherwise use original estimated distance
    const finalDistance = actualDistance || ride.distance || 0

    // Update ride status to completed
    const updatedRide = await Ride.findByIdAndUpdate(
      rideId,
      {
        status: 'completed',
        endTime: endTime,
        distance: finalDistance, // Update with actual distance traveled
        updatedAt: new Date()
      },
      { new: true }
    ).populate('user', 'fullName email')
     .populate('driver', 'fullName contact')
     .populate('vehicle', 'vehicleNumber model')

    // Update driver total distance and status
    const driver = await Driver.findById(session.user.id)
    if (driver && finalDistance) {
      await Driver.findByIdAndUpdate(session.user.id, {
        status: 'available',
        totalDistance: (driver.totalDistance || 0) + finalDistance,
        currentLocation: endLocation ? {
          latitude: endLocation.latitude,
          longitude: endLocation.longitude,
          updatedAt: new Date()
        } : driver.currentLocation
      })
    }

    // Update vehicle status and total distance
    if (ride.vehicle && finalDistance) {
      const vehicle = await Vehicle.findById(ride.vehicle)
      if (vehicle) {
        await Vehicle.findByIdAndUpdate(ride.vehicle, {
          status: 'available',
          currentDriver: null,
          totalDistance: (vehicle.totalDistance || 0) + finalDistance
        })
      }
    }

    return NextResponse.json({ 
      message: 'Ride completed successfully',
      ride: updatedRide,
      duration: Math.round(duration),
      distance: finalDistance,
      driverTotalDistance: (driver?.totalDistance || 0) + finalDistance
    })

  } catch (error) {
    console.error('Error completing ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
