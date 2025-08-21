import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Vehicle from '@/models/Vehicle'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleNumber, model, make, year, capacity } = await request.json()
    const url = new URL(request.url)
    const vehicleId = url.pathname.split('/')[4] // /api/admin/vehicles/[id]

    if (!vehicleNumber || !model || !make || !year || !capacity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      {
        vehicleNumber,
        model,
        make,
        year: parseInt(year),
        capacity: parseInt(capacity),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('currentDriver', 'fullName')

    if (!updatedVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Vehicle updated successfully',
      vehicle: updatedVehicle
    })

  } catch (error) {
    console.error('Error updating vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const vehicleId = url.pathname.split('/')[4] // /api/admin/vehicles/[id]

    await dbConnect()

    const deletedVehicle = await Vehicle.findByIdAndDelete(vehicleId)

    if (!deletedVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Vehicle deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting vehicle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
