import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Driver from '@/models/Driver'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const drivers = await Driver.find({}).sort({ createdAt: -1 })
    
    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, contact, email, nic, password, address } = await request.json()

    if (!fullName || !contact || !nic || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ nic })
    if (existingDriver) {
      return NextResponse.json({ error: 'Driver with this NIC already exists' }, { status: 400 })
    }

    const hashedPassword = bcrypt.hashSync(password, 12)

    const newDriver = new Driver({
      fullName,
      contact,
      email: email || undefined,
      nic,
      password: hashedPassword,
      address: address || undefined,
      rating: 0,
      totalDistance: 0,
      ratingCount: 0,
      status: 'available',
      isActive: true
    })

    await newDriver.save()

    // Return driver without password
    const driverResponse = { ...newDriver.toObject() }
    delete driverResponse.password

    return NextResponse.json({ 
      message: 'Driver created successfully',
      driver: driverResponse
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating driver:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
