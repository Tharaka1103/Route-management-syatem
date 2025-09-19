import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from './types';

// IMPORTANT: Use the same JWT_SECRET everywhere
const JWT_SECRET = process.env.JWT_SECRET || 'nj4fh346cbtc6tr4xni37xnix37bxt3xnir7t4i36xr3txtr348xxo8li3gexwui3gihruiyhg4regbmretgye7rfgyte2w7rbczu';

export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 12);
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Password hashing failed');
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

export function generateToken(user: Partial<User>): string {
  try {
    const payload = { 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    };
    
    console.log('Generating token for:', payload);
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new Error('Token generation failed');
  }
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verified:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Export JWT_SECRET for use in middleware
export { JWT_SECRET };