const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Replace with your actual MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://TRIMIDS:12345@cluster0.d6p1bgq.mongodb.net/route-management?retryWrites=true&w=majority&appName=Cluster0';

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  department: { 
    type: String, 
    enum: ['mechanical', 'civil', 'electrical', 'HSEQ', 'HR'],
    required: false
  },
  role: { 
    type: String, 
    required: true,
    enum: ['user', 'driver', 'department_head', 'project_manager', 'admin'],
    default: 'user'
  },
  contact: String,
  address: String,
  image: String,
  password: String,
  googleId: String,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      await mongoose.connection.close();
      return;
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

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: Admin@135');
    console.log('👤 Role: admin');
    console.log('');
    console.log('You can now log in to the admin panel with these credentials.');

    await mongoose.connection.close();
    console.log('Database connection closed.');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();
