# Real-Time System Setup Guide

## Overview
This guide covers the setup and usage of the real-time features in the Route Management System, including Socket.io integration, location tracking, and push notifications.

## Architecture

### Components Created
1. **Socket.io Server** (`server.js`) - Real-time communication hub
2. **Location Tracking Service** (`lib/location-tracking.ts`) - GPS tracking and management
3. **Notification System** (`lib/notifications.ts`) - Push notifications and alerts
4. **Real-time React Hook** (`hooks/useRealTime.ts`) - Easy integration in components
5. **API Endpoints** - Location and notification management
6. **UI Components** - Real-time dashboard, maps, and notifications

### Real-time Features
- ✅ Live location tracking for drivers
- ✅ Real-time ride status updates
- ✅ Push notifications for all events
- ✅ Live map with driver locations
- ✅ Socket.io integration with role-based rooms
- ✅ Offline/online status tracking
- ✅ Emergency alerts
- ✅ Chat messaging between drivers and passengers

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
```

### 2. Install Dependencies
Dependencies have been automatically installed:
- `socket.io` - Server-side Socket.io
- `socket.io-client` - Client-side Socket.io
- `concurrently` - Run multiple servers
- `cors` - Cross-origin resource sharing
- `express` - HTTP server framework

### 3. Start the Application
```bash
# Start both Next.js and Socket.io servers
npm run dev:all

# Or start individually:
npm run dev           # Next.js on :3000
npm run dev:socket    # Socket.io on :3001
```

### 4. Production Deployment
```bash
npm run build
npm run start:all
```

## API Endpoints Created

### Location Tracking
- `GET /api/location/track` - Get location history
- `POST /api/location/track` - Save location data
- `GET /api/location/drivers` - Get all active driver locations
- `GET /api/location/route/[routeId]` - Get location data for specific route

### Notifications
- `POST /api/notifications/send` - Send notifications
- `GET /api/notifications/user/[userId]` - Get user notifications
- `PATCH /api/notifications/user/[userId]` - Mark as read
- `DELETE /api/notifications/user/[userId]` - Delete notifications

### Ride Status
- `PATCH /api/rides/[rideId]/status` - Update ride status with real-time events
- `GET /api/rides/[rideId]/status` - Get ride status history

## Usage Examples

### 1. Using Real-time Hook in Components
```tsx
import { useRealTime } from '@/hooks/useRealTime';

function MyComponent() {
  const {
    isConnected,
    startLocationTracking,
    getNotifications,
    sendNotification
  } = useRealTime({
    enableLocation: true,
    onLocationUpdate: (location) => {
      console.log('New location:', location);
    },
    onNotification: (notification) => {
      console.log('New notification:', notification);
    }
  });

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

### 2. Driver Location Tracking
```tsx
import { LocationTracker } from '@/components/ui/location-tracker';

function DriverDashboard({ driverId, rideId }) {
  return (
    <LocationTracker
      driverId={driverId}
      rideId={rideId}
      onLocationUpdate={(location) => {
        // Handle location updates
      }}
    />
  );
}
```

### 3. Real-time Map
```tsx
import { RealTimeMap } from '@/components/maps/real-time-map';

function MapView() {
  return (
    <RealTimeMap
      showAllDrivers={true}
      onDriverClick={(driver) => {
        console.log('Driver clicked:', driver);
      }}
    />
  );
}
```

### 4. Notification Center
```tsx
import { NotificationCenter } from '@/components/ui/notification-center';

function Header({ userId }) {
  return (
    <div>
      <NotificationCenter userId={userId} />
    </div>
  );
}
```

## Socket.io Events

### Client to Server
- `join_room` - Join user/role-specific room
- `location_update` - Send location data
- `ride_assigned` - Assign ride to driver
- `approval_request` - Send approval request
- `ride_status_update` - Update ride status
- `emergency_alert` - Send emergency alert
- `chat_message` - Send chat message

### Server to Client
- `location_updated` - Location update received
- `driver_location_updated` - Driver location changed
- `ride_assignment` - New ride assignment
- `approval_request_received` - New approval request
- `ride_status_changed` - Ride status updated
- `emergency_alert_received` - Emergency alert
- `chat_message_received` - New chat message

## Security Features
- ✅ Role-based socket rooms
- ✅ JWT token validation for API routes
- ✅ Location permission management
- ✅ Rate limiting for notifications
- ✅ Input validation and sanitization

## Monitoring and Health Checks
- Socket.io health endpoint: `http://localhost:3001/health`
- Active drivers endpoint: `http://localhost:3001/active-drivers`
- Connection status monitoring
- Automatic stale location cleanup

## Troubleshooting

### Common Issues
1. **Socket connection failed**: Check if both servers are running
2. **Location permission denied**: Enable location in browser settings
3. **Notifications not working**: Check notification permissions
4. **Map not loading**: Verify Google Maps API key

### Debug Mode
Enable debug logging:
```bash
DEBUG=socket.io* npm run dev:socket
```

## Performance Optimization
- Location updates limited to significant movement (10m threshold)
- Socket room-based broadcasting to reduce overhead
- Automatic cleanup of stale connections
- Efficient state management with minimal re-renders

## Browser Compatibility
- Modern browsers with WebSocket support
- Location API support (HTTPS required in production)
- Push Notification API support
- Service Worker compatibility for offline functionality

## Next Steps
1. Add service worker for offline support
2. Implement push notification server (FCM/APNs)
3. Add analytics and monitoring
4. Implement caching strategies
5. Add automated testing for real-time features
