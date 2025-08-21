import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
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

    // Get all members of this department
    const members = await User.find({
      department: departmentHead.department,
      role: { $in: ['user'] } // Only regular users, not other dept heads
    }).select('-password').sort({ fullName: 1 })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching department members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
