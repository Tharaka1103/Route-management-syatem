import { NextRequest, NextResponse } from 'next/server';
import {connectDB} from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { vehicleNumber, model, capacity } = body;

    const existingVehicle = await Vehicle.findOne({ vehicleNumber });
    if (existingVehicle) {
      return NextResponse.json({ error: 'Vehicle already exists' }, { status: 400 });
    }

    const vehicle = new Vehicle({
      vehicleNumber,
      model,
      capacity
    });

    await vehicle.save();

    return NextResponse.json({ 
      message: 'Vehicle created successfully',
      vehicle
    });
  } catch (error) {
    console.error('Vehicle creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const vehicles = await Vehicle.find();
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Get vehicles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}