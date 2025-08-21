const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL 
      : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.NEXTAUTH_URL 
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

const activeUsers = new Map();
const driverLocations = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room based on user role and ID
  socket.on('join_room', ({ userId, role }) => {
    const roomId = `${role}_${userId}`;
    socket.join(roomId);
    activeUsers.set(socket.id, { userId, role, roomId });
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // Handle location updates from drivers
  socket.on('location_update', (data) => {
    const { driverId, latitude, longitude, rideId, dailyRouteId } = data;
    
    // Store driver location
    driverLocations.set(driverId, {
      latitude,
      longitude,
      timestamp: new Date(),
      rideId,
      dailyRouteId
    });

    // Broadcast to relevant users (passengers, admin)
    if (rideId) {
      io.to(`ride_${rideId}`).emit('location_updated', {
        driverId,
        latitude,
        longitude,
        timestamp: new Date()
      });
    }

    // Broadcast to admin
    io.to('admin').emit('driver_location_updated', {
      driverId,
      latitude,
      longitude,
      rideId,
      dailyRouteId
    });
  });

  // Handle ride assignments
  socket.on('ride_assigned', (data) => {
    const { driverId, rideId, message } = data;
    io.to(`driver_${driverId}`).emit('ride_assignment', {
      rideId,
      message,
      timestamp: new Date()
    });
  });

  // Handle approval requests
  socket.on('approval_request', (data) => {
    const { departmentHeadId, rideId, message } = data;
    io.to(`department_head_${departmentHeadId}`).emit('approval_request_received', {
      rideId,
      message,
      timestamp: new Date()
    });
  });

  // Handle project manager notifications
  socket.on('pm_approval_request', (data) => {
    const { projectManagerId, rideId, message } = data;
    io.to(`project_manager_${projectManagerId}`).emit('pm_approval_received', {
      rideId,
      message,
      timestamp: new Date()
    });
  });

  // Handle ride tracking room joins
  socket.on('join_ride_tracking', (rideId) => {
    socket.join(`ride_${rideId}`);
    console.log(`Socket ${socket.id} joined ride tracking room ${rideId}`);
  });

  // Handle ride status updates
  socket.on('ride_status_update', (data) => {
    const { rideId, status, location, message } = data;
    
    // Broadcast to all users tracking this ride
    io.to(`ride_${rideId}`).emit('ride_status_changed', {
      rideId,
      status,
      location,
      message,
      timestamp: new Date()
    });

    console.log(`Ride ${rideId} status updated to ${status}`);
  });

  // Handle emergency alerts
  socket.on('emergency_alert', (data) => {
    const { driverId, location, message } = data;
    
    // Broadcast to all admins and project managers
    io.to('admin').emit('emergency_alert_received', {
      driverId,
      location,
      message,
      timestamp: new Date()
    });

    console.log(`Emergency alert from driver ${driverId}`);
  });

  // Handle chat messages
  socket.on('chat_message', (data) => {
    const { rideId, senderId, message, senderRole } = data;
    
    // Broadcast to ride participants
    io.to(`ride_${rideId}`).emit('chat_message_received', {
      rideId,
      senderId,
      message,
      senderRole,
      timestamp: new Date()
    });
  });

  // Handle system notifications
  socket.on('system_notification', (data) => {
    const { targetRole, message, type } = data;
    
    // Broadcast to specific role
    io.to(targetRole).emit('system_notification_received', {
      message,
      type,
      timestamp: new Date()
    });
  });

  // Handle bulk location updates for route optimization
  socket.on('bulk_location_update', (data) => {
    const { locations } = data;
    
    locations.forEach(location => {
      driverLocations.set(location.driverId, {
        ...location,
        timestamp: new Date()
      });
    });

    // Broadcast to admin for fleet management
    io.to('admin').emit('bulk_locations_updated', {
      locations,
      timestamp: new Date()
    });
  });

  // Handle connection heartbeat
  socket.on('heartbeat', () => {
    socket.emit('heartbeat_ack', { timestamp: new Date() });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    if (userData) {
      console.log(`User ${userData.userId} (${userData.role}) disconnected`);
      
      // If it's a driver, notify about disconnection
      if (userData.role === 'driver') {
        io.to('admin').emit('driver_disconnected', {
          driverId: userData.userId,
          timestamp: new Date()
        });
        
        // Remove from active driver locations
        driverLocations.delete(userData.userId);
      }
      
      activeUsers.delete(socket.id);
    }
  });
});

// Periodic cleanup of stale locations
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [driverId, location] of driverLocations.entries()) {
    if (now - new Date(location.timestamp).getTime() > staleThreshold) {
      driverLocations.delete(driverId);
      console.log(`Removed stale location for driver ${driverId}`);
    }
  }
}, 60000); // Check every minute

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeUsers: activeUsers.size,
    activeDrivers: driverLocations.size,
    uptime: process.uptime()
  });
});

// Get active drivers endpoint
app.get('/active-drivers', (req, res) => {
  const drivers = Array.from(driverLocations.entries()).map(([driverId, location]) => ({
    driverId,
    ...location
  }));
  
  res.json({
    count: drivers.length,
    drivers
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});