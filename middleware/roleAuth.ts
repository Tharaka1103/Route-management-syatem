import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export type UserRole = 'admin' | 'driver' | 'project_manager' | 'department_head' | 'employee';

export async function requireRole(req: NextRequest, allowedRoles: UserRole[]) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // No error, proceed
  } catch (error) {
    console.error('Role authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export function withRole(handler: Function, allowedRoles: UserRole[]) {
  return async (req: NextRequest, context: any) => {
    const roleCheck = await requireRole(req, allowedRoles);
    if (roleCheck) return roleCheck;
    
    return handler(req, context);
  };
}

// Helper function for API routes
export async function checkUserRole(allowedRoles: UserRole[]) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error('Authentication required');
  }

  const userRole = session.user.role as UserRole;
  
  if (!allowedRoles.includes(userRole)) {
    throw new Error('Insufficient permissions');
  }

  return { user: session.user, role: userRole };
}
