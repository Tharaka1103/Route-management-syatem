import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { RideModel } from '@/lib/models';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;
        const decoded = verifyToken(token!) as any;

        if (decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const { driverId } = await request.json();

        // Get ID from URL search params
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Ride ID is required' }, { status: 400 });
        }
        const ride = await RideModel.findById(id);
        if (!ride) {
            return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
        }

        if (ride.status !== 'approved') {
            return NextResponse.json({ error: 'Ride must be approved first' }, { status: 400 });
        }

        ride.driverId = driverId;
        await ride.save();

        return NextResponse.json(ride);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}