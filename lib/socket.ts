'use client';

import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Driver location updates
  updateLocation(data: {
    driverId: string;
    latitude: number;
    longitude: number;
    rideId?: string;
    dailyRouteId?: string;
  }) {
    if (this.socket) {
      this.socket.emit('location_update', data);
    }
  }

  // Listen for location updates
  onLocationUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('location_updated', callback);
    }
  }

  // Ride notifications
  notifyRideAssignment(data: {
    driverId: string;
    rideId: string;
    message: string;
  }) {
    if (this.socket) {
      this.socket.emit('ride_assigned', data);
    }
  }

  onRideAssignment(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('ride_assignment', callback);
    }
  }

  // Approval notifications
  notifyApprovalRequest(data: {
    departmentHeadId: string;
    rideId: string;
    message: string;
  }) {
    if (this.socket) {
      this.socket.emit('approval_request', data);
    }
  }

  onApprovalRequest(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('approval_request_received', callback);
    }
  }

  // Join room for specific user
  joinRoom(userId: string, role: string) {
    if (this.socket) {
      this.socket.emit('join_room', { userId, role });
    }
  }

  // Leave room
  leaveRoom(userId: string) {
    if (this.socket) {
      this.socket.emit('leave_room', { userId });
    }
  }
}

export const socketService = new SocketService();