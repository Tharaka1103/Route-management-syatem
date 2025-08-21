import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Driver from '@/models/Driver';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { fullName, contact, email, nic, password, address } = body;

    const existingDriver = await Driver.findOne({ nic });
    if (existingDriver) {
      return NextResponse.json({ error: 'Driver already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const driver = new Driver({
      fullName,
      contact,
      email,
      nic,
      password: hashedPassword,
      address
    });

    await driver.save();

    return NextResponse.json({ 
      message: 'Driver created successfully',
      driver: {
        id: driver._id,
        fullName: driver.fullName,
        contact: driver.contact,
        nic: driver.nic
      }
    });
  } catch (error) {
    console.error('Driver creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const drivers = await Driver.find().select('-password');
    return NextResponse.json(drivers);
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}