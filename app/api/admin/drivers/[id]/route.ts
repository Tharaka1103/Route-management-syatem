import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, contact, email, nic, password, address } = await request.json()
    const { id: driverId } = await params

    if (!fullName || !contact || !nic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    const updateData: any = {
      fullName,
      contact,
      email: email || undefined,
      nic,
      address: address || undefined,
      updatedAt: new Date()
    }

    // Only update password if provided
    if (password && password.trim()) {
      updateData.password = bcrypt.hashSync(password, 12)
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      updateData,
      { new: true }
    ).select('-password')

    if (!updatedDriver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Driver updated successfully',
      driver: updatedDriver
    })

  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: driverId } = await params

    await dbConnect()

    const deletedDriver = await Driver.findByIdAndDelete(driverId)

    if (!deletedDriver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Driver deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
