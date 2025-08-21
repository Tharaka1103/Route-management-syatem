import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
          userType: session.user?.userType,
          department: session.user?.department
        }
      } : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({ 
      error: 'Error retrieving session',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
