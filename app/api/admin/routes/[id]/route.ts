import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Route from '@/models/Route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const routeId = url.pathname.split('/')[4] // /api/admin/routes/[id]

    await dbConnect()

    const route = await Route.findById(routeId)

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    return NextResponse.json({ route })

  } catch (error) {
    console.error('Error fetching route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, startLocation, endLocation } = await request.json()
    const url = new URL(request.url)
    const routeId = url.pathname.split('/')[4] // /api/admin/routes/[id]

    if (!name || !startLocation || !endLocation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await dbConnect()

    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(endLocation.latitude - startLocation.latitude, 2) + 
      Math.pow(endLocation.longitude - startLocation.longitude, 2)
    ) * 111 // Approximate km conversion

    const updatedRoute = await Route.findByIdAndUpdate(
      routeId,
      {
        name,
        startLocation,
        endLocation,
        distance,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Route updated successfully',
      route: updatedRoute
    })

  } catch (error) {
    console.error('Error updating route:', error)
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
    const routeId = url.pathname.split('/')[4] // /api/admin/routes/[id]

    await dbConnect()

    const deletedRoute = await Route.findByIdAndDelete(routeId)

    if (!deletedRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Route deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
