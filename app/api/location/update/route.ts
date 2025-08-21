import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { latitude, longitude } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    await dbConnect()

    // Update driver location if user is a driver
    if (session.user.role === 'driver') {
      await Driver.findByIdAndUpdate(session.user.id, {
        currentLocation: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          updatedAt: new Date()
        },
        updatedAt: new Date()
      })
    }

    return NextResponse.json({ 
      message: 'Location updated successfully',
      location: { latitude, longitude, timestamp: new Date() }
    })

  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
