import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const rideId = url.pathname.split('/')[3] // /api/rides/[id]

    await dbConnect()

    const ride = await Ride.findById(rideId)
      .populate('user', 'fullName email contact')
      .populate('driver', 'fullName contact rating')
      .populate('vehicle', 'vehicleNumber model make')
      .populate('departmentHead', 'fullName')
      .populate('projectManager', 'fullName')

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 })
    }

    return NextResponse.json({ ride })

  } catch (error) {
    console.error('Error fetching ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
