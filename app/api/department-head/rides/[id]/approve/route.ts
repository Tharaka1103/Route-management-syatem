import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Ride from '@/models/Ride'
import User from '@/models/User'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'department_head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: rideId } = await params

    await dbConnect()

    // Verify the ride belongs to this department head
    const ride = await Ride.findOne({
      _id: rideId,
      departmentHead: session.user.id,
      approvalStatus: 'pending'
    }).populate('user', 'fullName email role')

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found or already processed' }, { status: 404 })
    }

    // Check if the requesting user is a department head
    const requestingUser = ride.user as any
    let finalStatus = 'approved'
    let projectManagerRequired = false

    if (requestingUser.role === 'department_head') {
      // Department head requesting ride - needs project manager approval
      projectManagerRequired = true
      finalStatus = 'pending' // Keep pending until project manager approves
      
      // Find a project manager
      const projectManager = await User.findOne({ role: 'project_manager' })
      if (projectManager) {
        await Ride.findByIdAndUpdate(rideId, {
          projectManager: projectManager._id,
          approvalStatus: 'approved', // Approved by dept head, now pending for PM
          status: 'pending',
          updatedAt: new Date()
        })

        return NextResponse.json({ 
          message: 'Ride approved and forwarded to Project Manager for final approval',
          ride: ride,
          requiresProjectManagerApproval: true
        })
      }
    } else {
      // Regular user ride - approve directly
      await Ride.findByIdAndUpdate(rideId, {
        approvalStatus: 'approved',
        status: 'approved',
        updatedAt: new Date()
      })
    }

    const updatedRide = await Ride.findById(rideId)
      .populate('user', 'fullName email')
      .populate('departmentHead', 'fullName')

    return NextResponse.json({ 
      message: 'Ride approved successfully',
      ride: updatedRide,
      requiresProjectManagerApproval: projectManagerRequired
    })

  } catch (error) {
    console.error('Error approving ride:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
