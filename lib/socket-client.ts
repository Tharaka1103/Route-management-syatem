import { io, Socket } from 'socket.io-client';

class SocketClient {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private role: string | null = null;

  connect(userId: string, role: string) {
    if (this.socket?.connected && this.userId === userId) {
      return this.socket;
    }

    this.disconnect();

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket']
    });

    this.userId = userId;
    this.role = role;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.socket?.emit('join_room', { userId, role });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.role = null;
    }
  }

  // Location tracking methods
  updateLocation(data: {
    driverId: string;
    latitude: number;
    longitude: number;
    rideId?: string;
    dailyRouteId?: string;
  }) {
    this.socket?.emit('location_update', data);
  }

  // Ride tracking methods
  joinRideTracking(rideId: string) {
    this.socket?.emit('join_ride_tracking', rideId);
  }

  // Notification methods
  sendRideAssignment(data: {
    driverId: string;
    rideId: string;
    message: string;
  }) {
    this.socket?.emit('ride_assigned', data);
  }

  sendApprovalRequest(data: {
    departmentHeadId: string;
    rideId: string;
    message: string;
  }) {
    this.socket?.emit('approval_request', data);
  }

  sendPMApprovalRequest(data: {
    projectManagerId: string;
    rideId: string;
    message: string;
  }) {
    this.socket?.emit('pm_approval_request', data);
  }

  // Event listeners
  onLocationUpdate(callback: (data: any) => void) {
    this.socket?.on('location_updated', callback);
  }

  onDriverLocationUpdate(callback: (data: any) => void) {
    this.socket?.on('driver_location_updated', callback);
  }

  onRideAssignment(callback: (data: any) => void) {
    this.socket?.on('ride_assignment', callback);
  }

  onApprovalRequest(callback: (data: any) => void) {
    this.socket?.on('approval_request_received', callback);
  }

  onPMApprovalRequest(callback: (data: any) => void) {
    this.socket?.on('pm_approval_received', callback);
  }

  // Remove listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  getSocket() {
    return this.socket;
  }
}

export const socketClient = new SocketClient();
