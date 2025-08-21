import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { Department } from '@/types'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { email, fullName, department, contact, address, password } = await request.json()

    // Validate required fields
    if (!email || !fullName || !department || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate department
    const validDepartments: Department[] = ['mechanical', 'civil', 'electrical', 'HSEQ', 'HR']
    if (!validDepartments.includes(department)) {
      return NextResponse.json(
        { error: 'Invalid department' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 12)

    // Create new user
    const newUser = new User({
      email,
      fullName,
      department,
      contact: contact || undefined,
      address: address || undefined,
      password: hashedPassword,
      role: 'user'
    })

    const savedUser = await newUser.save()

    // Return user without password
    const userResponse = {
      id: savedUser._id,
      email: savedUser.email,
      fullName: savedUser.fullName,
      department: savedUser.department,
      role: savedUser.role,
      contact: savedUser.contact,
      address: savedUser.address,
      createdAt: savedUser.createdAt
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userResponse
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
