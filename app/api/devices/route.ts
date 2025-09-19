import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/mongodb';
import { DeviceModel } from '@/lib/models';
import { DeviceApiResponse } from '@/lib/types';

const DEVICE_API_KEY = process.env.DEVICE_API_KEY || 'your_api_key';

export async function GET() {
  try {
    await connectDB();
    
    // Fetch from external API
    const response = await fetch('https://api.oronlanka.com/api/server/monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: DEVICE_API_KEY }),
    });
    
    const devices: DeviceApiResponse[] = await response.json();
    
    // Update local database
    for (const deviceData of devices) {
      await DeviceModel.findOneAndUpdate(
        { terminalId: deviceData.terminal_id },
        {
          terminalId: deviceData.terminal_id,
          vehicle: deviceData.vehicle,
          vehicleType: deviceData.vehicle_type,
          status: deviceData.status,
          latitude: deviceData.latitude,
          longitude: deviceData.longitude,
          speed: deviceData.speed,
          lastMessage: deviceData.last_message,
          expire: deviceData.expire,
        },
        { upsert: true, new: true }
      );
    }
    
    const localDevices = await DeviceModel.find({});
    
    return NextResponse.json(localDevices);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}