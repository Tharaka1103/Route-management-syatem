import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const users = await User.find({}).select('-password').sort({ createdAt: -1 })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, fullName, department, role, contact, address } = await request.json()

    if (!email || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
    }

    // Generate random password for new user
    const randomPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = bcrypt.hashSync(randomPassword, 12)

    const newUser = new User({
      email,
      fullName,
      department: department || undefined,
      role,
      contact: contact || undefined,
      address: address || undefined,
      password: hashedPassword,
      isActive: true
    })

    await newUser.save()

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      fullName: newUser.fullName,
      department: newUser.department,
      role: newUser.role,
      contact: newUser.contact,
      address: newUser.address,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      temporaryPassword: randomPassword // Send this once to admin
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: userResponse
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
