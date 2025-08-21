import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, contact, email, nic, password, address } = await request.json()
    const url = new URL(request.url)
    const driverId = url.pathname.split('/')[4]

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const driverId = url.pathname.split('/')[4]

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
