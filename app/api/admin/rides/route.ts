import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const rides = await Ride.find({})
      .populate('user', 'fullName email department')
      .populate('driver', 'fullName contact rating')
      .populate('vehicle', 'vehicleNumber model')
      .populate('departmentHead', 'fullName')
      .populate('projectManager', 'fullName')
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ rides })
  } catch (error) {
    console.error('Error fetching rides:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
