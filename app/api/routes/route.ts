import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import dbConnect from '@/lib/mongodb'
import Route from '@/models/Route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    
    const routes = await Route.find({}).sort({ name: 1 })
    
    return NextResponse.json({ routes })
  } catch (error) {
    console.error('Error fetching routes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
