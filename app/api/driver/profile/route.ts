import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const driver = await Driver.findById(session.user.id).select('-password')
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Error fetching driver profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, contact, email, address } = await request.json()

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    await dbConnect()

    const updatedDriver = await Driver.findByIdAndUpdate(
      session.user.id,
      {
        fullName,
        contact: contact || '',
        email: email || '',
        address: address || '',
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password')

    if (!updatedDriver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      driver: updatedDriver
    })

  } catch (error) {
    console.error('Error updating driver profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
