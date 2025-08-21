import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get all drivers with their current locations
    const drivers = await Driver.find({
      isActive: true,
      currentLocation: { $exists: true }
    }).select('fullName contact status currentLocation rating')

    return NextResponse.json({ 
      drivers: drivers.map(driver => ({
        id: driver._id,
        fullName: driver.fullName,
        status: driver.status,
        rating: driver.rating,
        location: driver.currentLocation || null
      }))
    })

  } catch (error) {
    console.error('Error fetching driver locations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
