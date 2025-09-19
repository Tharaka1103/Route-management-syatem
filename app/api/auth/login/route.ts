import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TRIMIDS:12345@cluster0.d6p1bgq.mongodb.net/route-management?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return mongoose.connections[0];
  }
  await mongoose.connect(MONGODB_URI);
  return mongoose.connections[0];
}

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'driver', 'project_manager', 'admin'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// Auth functions
const JWT_SECRET = process.env.JWT_SECRET || 'hbf346cbt4ttrn64nc67rt4ct67i54bct7c5ni5c67i54cbt67ict47grye4ts4rfcyerj45r7';

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

function generateToken(user: any): string {
  try {
    const payload = { 
      userId: user._id.toString(), 
      email: user.email, 
      role: user.role 
    };
    
    console.log('🎫 Generating token for:', payload);
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ Token generated successfully');
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    throw new Error('Token generation failed');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt started');
    
    await connectDB();
    console.log('✅ Database connected');
    
    const { email, password } = await request.json();
    console.log('📧 Login attempt for:', email);

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('👤 User found:', { id: user._id, email: user.email, role: user.role });

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('✅ Password verified');

    const token = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role
    });

    console.log('🎫 Token created:', token.substring(0, 50) + '...');

    const response = NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

    // Set cookie with proper format
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/'
    });

    console.log('🍪 Cookie set successfully');
    console.log('🎉 Login completed successfully');

    return response;
  } catch (error) {
    console.error('💥 Login error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}