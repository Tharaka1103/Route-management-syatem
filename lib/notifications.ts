import { socketClient } from './socket-client';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: string;
  rideId?: string;
  createdAt: Date;
  read: boolean;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private subscribers: ((notifications: NotificationData[]) => void)[] = [];

  // Browser notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  // Show browser notification
  showBrowserNotification(title: string, message: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        ...options,
      });
    }
  }

  // Add notification to local state
  addNotification(notification: Omit<NotificationData, 'id' | 'createdAt' | 'read'>) {
    const newNotification: NotificationData = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      read: false,
    };

    this.notifications.unshift(newNotification);
    this.notifySubscribers();

    // Show browser notification
    this.showBrowserNotification(newNotification.title, newNotification.message);

    return newNotification;
  }

  // Get all notifications
  getNotifications(): NotificationData[] {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Mark notification as read
  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifySubscribers();
    }
  }

  // Mark all as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifySubscribers();
  }

  // Remove notification
  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifySubscribers();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifySubscribers();
  }

  // Subscribe to notification changes
  subscribe(callback: (notifications: NotificationData[]) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.notifications));
  }

  // Real-time notification handlers
  setupRealtimeHandlers(userId: string, role: string) {
    socketClient.onRideAssignment((data) => {
      this.addNotification({
        title: 'New Ride Assignment',
        message: data.message || 'You have been assigned a new ride',
        type: 'info',
        userId,
        rideId: data.rideId,
      });
    });

    socketClient.onApprovalRequest((data) => {
      this.addNotification({
        title: 'Approval Request',
        message: data.message || 'New ride approval request',
        type: 'warning',
        userId,
        rideId: data.rideId,
      });
    });

    socketClient.onPMApprovalRequest((data) => {
      this.addNotification({
        title: 'Project Manager Approval',
        message: data.message || 'Project manager approval required',
        type: 'warning',
        userId,
        rideId: data.rideId,
      });
    });

    socketClient.onLocationUpdate((data) => {
      if (role === 'employee' || role === 'admin') {
        this.addNotification({
          title: 'Driver Location Update',
          message: 'Your driver location has been updated',
          type: 'info',
          userId,
          rideId: data.rideId,
        });
      }
    });
  }

  // Send notifications via socket
  sendRideAssignmentNotification(driverId: string, rideId: string, message: string) {
    socketClient.sendRideAssignment({ driverId, rideId, message });
  }

  sendApprovalRequestNotification(departmentHeadId: string, rideId: string, message: string) {
    socketClient.sendApprovalRequest({ departmentHeadId, rideId, message });
  }

  sendPMApprovalRequestNotification(projectManagerId: string, rideId: string, message: string) {
    socketClient.sendPMApprovalRequest({ projectManagerId, rideId, message });
  }
}

export const notificationService = new NotificationService();

// Notification types for different scenarios
export const NotificationTypes = {
  RIDE_ASSIGNED: 'ride_assigned',
  RIDE_APPROVED: 'ride_approved',
  RIDE_REJECTED: 'ride_rejected',
  RIDE_COMPLETED: 'ride_completed',
  RIDE_CANCELLED: 'ride_cancelled',
  DRIVER_ARRIVED: 'driver_arrived',
  DRIVER_EN_ROUTE: 'driver_en_route',
  APPROVAL_REQUEST: 'approval_request',
  PAYMENT_RECEIVED: 'payment_received',
  SYSTEM_MAINTENANCE: 'system_maintenance',
} as const;

export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];
