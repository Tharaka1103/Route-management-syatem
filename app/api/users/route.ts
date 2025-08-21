import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { email, fullName, department, role, contact, address } = body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const user = new User({
      email,
      fullName,
      department,
      role: role || 'user',
      contact,
      address
    });

    await user.save();

    return NextResponse.json({ 
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const department = searchParams.get('department');

    let filter: any = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const users = await User.find(filter).select('-password');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}