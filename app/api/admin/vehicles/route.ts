import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Vehicle from '@/models/Vehicle'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Debug logging
    console.log('Session:', {
      exists: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    })
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      console.log('Authorization failed:', {
        hasSession: !!session,
        hasUserId: !!session?.user?.id,
        userRole: session?.user?.role,
        expectedRole: 'admin'
      })
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          userRole: session?.user?.role,
          expectedRole: 'admin'
        }
      }, { status: 401 })
    }

    await dbConnect()
    
    const vehicles = await Vehicle.find({}).populate('currentDriver', 'fullName').sort({ createdAt: -1 })
    
    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleNumber, model, make, year, capacity } = await request.json()

    if (!vehicleNumber || !model || !make || !year || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    // Check if vehicle already exists
    const existingVehicle = await Vehicle.findOne({ vehicleNumber })
    if (existingVehicle) {
      return NextResponse.json({ error: 'Vehicle with this number already exists' }, { status: 400 })
    }

    const newVehicle = new Vehicle({
      vehicleNumber,
      model,
      make,
      year: parseInt(year),
      capacity: parseInt(capacity),
      status: 'available',
      totalDistance: 0,
      isActive: true
    })

    await newVehicle.save()

    return NextResponse.json({ 
      message: 'Vehicle created successfully',
      vehicle: newVehicle
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
