import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'
import User from '@/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get the department head's department
    const departmentHead = await User.findById(session.user.id)
    if (!departmentHead || !departmentHead.department) {
      return NextResponse.json({ error: 'Department head not found or department not set' }, { status: 404 })
    }

    // Get pending rides for this department
    const pendingRides = await Ride.find({
      departmentHead: session.user.id,
      approvalStatus: 'pending'
    })
    .populate('user', 'fullName email department')
    .sort({ createdAt: -1 })

    // Get all rides from this department
    const allDepartmentRides = await Ride.find({
      departmentHead: session.user.id
    })
    .populate('user', 'fullName email department')
    .populate('driver', 'fullName contact rating')
    .populate('vehicle', 'vehicleNumber model')
    .sort({ createdAt: -1 })

    return NextResponse.json({ 
      pending: pendingRides,
      all: allDepartmentRides
    })
  } catch (error) {
    console.error('Error fetching department head rides:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
