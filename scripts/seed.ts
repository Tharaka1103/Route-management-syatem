import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TRIMIDS:12345@cluster0.d6p1bgq.mongodb.net/route-management?retryWrites=true&w=majority&appName=Cluster0';

async function connectDB() {
  try {
    if (mongoose.connections[0].readyState) {
      return mongoose.connections[0];
    }
    
    const conn = await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
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

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function fixUsers() {
  try {
    console.log('🔧 Fixing user password hashes...');
    await connectDB();
    
    // Define users with their correct passwords
    const usersToFix = [
      { email: 'admin@gmail.com', password: 'admin12345', name: 'Admin User', role: 'admin' },
      { email: 'pm@gmail.com', password: 'pm12345', name: 'Supun Tharaka Manager', role: 'project_manager' },
      { email: 'driver@gmail.com', password: 'driver12345', name: 'Vimukthi Shehan', role: 'driver' },
      { email: 'user@gmail.com', password: 'user12345', name: 'John Doe', role: 'user' }
    ];

    for (const userData of usersToFix) {
      console.log(`🔧 Fixing user: ${userData.email}`);
      
      // Delete existing user if exists
      await UserModel.deleteOne({ email: userData.email });
      
      // Create new user with proper password hash
      const passwordHash = await hashPassword(userData.password);
      
      const user = new UserModel({
        name: userData.name,
        email: userData.email,
        passwordHash: passwordHash,
        role: userData.role
      });
      
      await user.save();
      console.log(`✅ User ${userData.email} created with proper password hash`);
    }

    console.log('🎉 All users fixed successfully!');
    
    // Verify one user
    const testUser = await UserModel.findOne({ email: 'admin@gmail.com' });
    console.log('🧪 Test user verification:', {
      email: testUser?.email,
      hasPasswordHash: !!testUser?.passwordHash,
      passwordHashLength: testUser?.passwordHash?.length
    });

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixUsers();