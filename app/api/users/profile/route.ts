import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Driver from '@/models/Driver';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let userData = null;

    // Check if user is a driver
    if (session.user.role === 'driver') {
      userData = await Driver.findById(session.user.id).select('-password');
      if (userData) {
        return NextResponse.json({ 
          user: {
            _id: userData._id,
            email: userData.email || '',
            fullName: userData.fullName,
            contact: userData.contact || '',
            address: userData.address || '',
            nic: userData.nic,
            role: 'driver',
            rating: userData.rating || 0,
            totalDistance: userData.totalDistance || 0,
            status: userData.status,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          }
        });
      }
    } else {
      userData = await User.findById(session.user.id).select('-password');
      if (userData) {
        return NextResponse.json({ 
          user: {
            _id: userData._id,
            email: userData.email,
            fullName: userData.fullName,
            department: userData.department,
            role: userData.role,
            contact: userData.contact || '',
            address: userData.address || '',
            image: userData.image || '',
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          }
        });
      }
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, contact, address, image, currentPassword, newPassword } = await req.json();

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    await dbConnect();

    let updatedData: any = null;

    // Handle driver profile update
    if (session.user.role === 'driver') {
      const updateFields: any = {
        fullName,
        contact: contact || '',
        address: address || '',
        updatedAt: new Date()
      };

      // Handle password update for drivers
      if (currentPassword && newPassword) {
        const driver = await Driver.findById(session.user.id);
        if (!driver || !bcrypt.compareSync(currentPassword, driver.password)) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        updateFields.password = bcrypt.hashSync(newPassword, 12);
      }

      updatedData = await Driver.findByIdAndUpdate(
        session.user.id,
        updateFields,
        { new: true }
      ).select('-password');

      if (updatedData) {
        return NextResponse.json({
          message: 'Profile updated successfully',
          user: {
            _id: updatedData._id,
            email: updatedData.email || '',
            fullName: updatedData.fullName,
            contact: updatedData.contact || '',
            address: updatedData.address || '',
            nic: updatedData.nic,
            role: 'driver',
            rating: updatedData.rating || 0,
            totalDistance: updatedData.totalDistance || 0,
            status: updatedData.status,
            createdAt: updatedData.createdAt,
            updatedAt: updatedData.updatedAt
          }
        });
      }
    } else {
      // Handle regular user profile update
      const updateFields: any = {
        fullName,
        contact: contact || '',
        address: address || '',
        image: image || '',
        updatedAt: new Date()
      };

      // Handle password update for users
      if (currentPassword && newPassword) {
        const user = await User.findById(session.user.id);
        if (!user || !user.password || !bcrypt.compareSync(currentPassword, user.password)) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
        updateFields.password = bcrypt.hashSync(newPassword, 12);
      }

      updatedData = await User.findByIdAndUpdate(
        session.user.id,
        updateFields,
        { new: true }
      ).select('-password');

      if (updatedData) {
        return NextResponse.json({
          message: 'Profile updated successfully',
          user: {
            _id: updatedData._id,
            email: updatedData.email,
            fullName: updatedData.fullName,
            department: updatedData.department,
            role: updatedData.role,
            contact: updatedData.contact || '',
            address: updatedData.address || '',
            image: updatedData.image || '',
            createdAt: updatedData.createdAt,
            updatedAt: updatedData.updatedAt
          }
        });
      }
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password, confirmDelete } = await req.json();

    if (!confirmDelete || confirmDelete !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ 
        error: 'Please type "DELETE MY ACCOUNT" to confirm account deletion' 
      }, { status: 400 });
    }

    await dbConnect();

    let deletedUser = null;

    if (session.user.role === 'driver') {
      // Verify password for drivers
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }

      const driver = await Driver.findById(session.user.id);
      if (!driver || !bcrypt.compareSync(password, driver.password)) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
      }

      deletedUser = await Driver.findByIdAndDelete(session.user.id);
    } else {
      // Verify password for regular users (if they have one)
      const user = await User.findById(session.user.id);
      if (user?.password) {
        if (!password || !bcrypt.compareSync(password, user.password)) {
          return NextResponse.json({ error: 'Incorrect password' }, { status: 400 });
        }
      }

      deletedUser = await User.findByIdAndDelete(session.user.id);
    }

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
