// Run this script to create an admin user
import connectDB from '../lib/mongodb'
import User from '../lib/models/User'

async function createAdmin() {
  try {
    await connectDB()
    
    const adminUser = new User({
      email: 'admin@trimids.com',
      password: 'Admin@12345', // This will be hashed
      role: 'admin'
    })
    
    await adminUser.save()
    console.log('Admin user created successfully!')
    console.log('Email: admin@japanstore.com')
    console.log('Password: Admin@123456')
    
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('Admin user already exists!')
    } else {
      console.error('Error creating admin:', error)
    }
  } finally {
    process.exit(0)
  }
}

createAdmin()