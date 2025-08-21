import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import DailyRoute from '@/models/DailyRoute'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    // Get today's daily routes
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dailyRoutes = await DailyRoute.find({
      driver: session.user.id,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('route', 'name startLocation endLocation distance')
    .populate('vehicle', 'vehicleNumber model')
    .sort({ startTime: -1 })

    return NextResponse.json({ dailyRoutes })
  } catch (error) {
    console.error('Error fetching daily routes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
