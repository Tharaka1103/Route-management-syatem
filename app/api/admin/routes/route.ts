import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Route from '@/models/Route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const routes = await Route.find({}).sort({ createdAt: -1 })
    
    return NextResponse.json({ routes })
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, startLocation, endLocation } = await request.json()

    if (!name || !startLocation || !endLocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    // Calculate distance (simplified)
    const distance = Math.sqrt(
      Math.pow(endLocation.latitude - startLocation.latitude, 2) + 
      Math.pow(endLocation.longitude - startLocation.longitude, 2)
    ) * 111 // Approximate km conversion

    const newRoute = new Route({
      name,
      startLocation: {
        latitude: startLocation.latitude,
        longitude: startLocation.longitude,
        address: startLocation.address
      },
      endLocation: {
        latitude: endLocation.latitude,
        longitude: endLocation.longitude,
        address: endLocation.address
      },
      distance
    })

    await newRoute.save()

    return NextResponse.json({ 
      message: 'Route created successfully',
      route: newRoute
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
