import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync('Admin@135', 12);

    // Create admin user
    const adminUser = new User({
      email: 'admin@gmail.com',
      fullName: 'System Administrator',
      role: 'admin',
      password: hashedPassword,
      isActive: true
    });

    const savedAdmin = await adminUser.save();

    return NextResponse.json(
      { 
        message: 'Admin user created successfully',
        admin: {
          id: savedAdmin._id,
          email: savedAdmin.email,
          fullName: savedAdmin.fullName,
          role: savedAdmin.role,
          createdAt: savedAdmin.createdAt
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
