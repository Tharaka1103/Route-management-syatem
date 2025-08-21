import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Ride from '@/models/Ride';
import Driver from '@/models/Driver';
import Vehicle from '@/models/Vehicle';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    await dbConnect();

    let query: any = { user: session.user.id };
    
    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate('driver', 'fullName contact rating')
      .populate('vehicle', 'vehicleNumber model make')
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({ 
      rides: rides,
      total: await Ride.countDocuments(query)
    });

  } catch (error) {
    console.error('Error fetching user rides:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rideId, rating } = await req.json();

    if (!rideId || !rating) {
      return NextResponse.json({ error: 'Ride ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await dbConnect();

    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, user: session.user.id },
      { rating, updatedAt: new Date() },
      { new: true }
    );

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Update driver's average rating
    if (ride.driver) {
      try {
        const allRatedRides = await Ride.find({ 
          driver: ride.driver, 
          rating: { $exists: true, $ne: null }
        });
        
        if (allRatedRides.length > 0) {
          const averageRating = allRatedRides.reduce((sum, r) => sum + (r.rating || 0), 0) / allRatedRides.length;
          await Driver.findByIdAndUpdate(ride.driver, {
            rating: averageRating,
            ratingCount: allRatedRides.length
          });
        }
      } catch (error) {
        console.error('Error updating driver rating:', error);
      }
    }

    return NextResponse.json({ 
      message: 'Rating updated successfully',
      ride: ride
    });

  } catch (error) {
    console.error('Error updating ride rating:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
