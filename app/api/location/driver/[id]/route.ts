import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: driverId } = await params

    await dbConnect()

    const driver = await Driver.findById(driverId).select('currentLocation fullName status')

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      location: driver.currentLocation || null,
      driverName: driver.fullName,
      status: driver.status,
      timestamp: new Date()
    })

  } catch (error) {
    console.error('Error fetching driver location:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
