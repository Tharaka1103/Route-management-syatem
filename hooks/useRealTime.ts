import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { socketClient } from '@/lib/socket-client';
import { notificationService } from '@/lib/notifications';
import { locationTrackingService } from '@/lib/location-tracking';

interface UseRealTimeOptions {
  enableLocation?: boolean;
  enableNotifications?: boolean;
  onLocationUpdate?: (location: any) => void;
  onNotification?: (notification: any) => void;
  onRideUpdate?: (ride: any) => void;
}

export function useRealTime(options: UseRealTimeOptions = {}) {
  const { data: session } = useSession();
  const isInitialized = useRef(false);
  const {
    enableLocation = false,
    enableNotifications = true,
    onLocationUpdate,
    onNotification,
    onRideUpdate,
  } = options;

  // Initialize real-time features
  const initialize = useCallback(async () => {
    if (!session?.user || isInitialized.current) return;

    try {
      const userId = session.user.id;
      const role = session.user.role;

      // Connect to socket
      const socket = socketClient.connect(userId, role);

      // Setup notifications if enabled
      if (enableNotifications) {
        await notificationService.requestPermission();
        notificationService.setupRealtimeHandlers(userId, role);

        // Subscribe to notification changes
        const unsubscribe = notificationService.subscribe((notifications) => {
          const latestNotification = notifications[0];
          if (latestNotification && onNotification) {
            onNotification(latestNotification);
          }
        });

        // Clean up subscription on unmount
        return () => unsubscribe();
      }

      // Setup location tracking for drivers
      if (enableLocation && role === 'driver') {
        await setupLocationTracking(userId);
      }

      // Setup real-time event listeners
      setupEventListeners();

      isInitialized.current = true;
      console.log('Real-time features initialized for:', role);

    } catch (error) {
      console.error('Error initializing real-time features:', error);
    }
  }, [session, enableLocation, enableNotifications, onLocationUpdate, onNotification]);

  // Setup location tracking for drivers
  const setupLocationTracking = async (userId: string) => {
    try {
      // Request location permissions
      const hasPermission = await locationTrackingService.getCurrentLocation();
      if (hasPermission) {
        console.log('Location permissions granted for driver:', userId);
      }
    } catch (error) {
      console.warn('Location permission denied:', error);
    }
  };

  // Setup socket event listeners
  const setupEventListeners = () => {
    // Location updates
    socketClient.onLocationUpdate((data) => {
      if (onLocationUpdate) {
        onLocationUpdate(data);
      }
    });

    socketClient.onDriverLocationUpdate((data) => {
      if (onLocationUpdate) {
        onLocationUpdate(data);
      }
    });

    // Ride updates
    socketClient.onRideAssignment((data) => {
      if (onRideUpdate) {
        onRideUpdate({ type: 'assignment', ...data });
      }
    });

    // Approval requests
    socketClient.onApprovalRequest((data) => {
      if (onRideUpdate) {
        onRideUpdate({ type: 'approval_request', ...data });
      }
    });

    socketClient.onPMApprovalRequest((data) => {
      if (onRideUpdate) {
        onRideUpdate({ type: 'pm_approval', ...data });
      }
    });
  };

  // Start location tracking
  const startLocationTracking = useCallback(async (rideId?: string, dailyRouteId?: string) => {
    if (!session?.user || session.user.role !== 'driver') {
      throw new Error('Only drivers can start location tracking');
    }

    await locationTrackingService.startTracking(session.user.id, {
      rideId,
      dailyRouteId,
      interval: 5000, // 5 seconds
      minDistance: 10, // 10 meters
    });
  }, [session]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    locationTrackingService.stopTracking();
  }, []);

  // Send notification
  const sendNotification = useCallback((type: string, data: any) => {
    switch (type) {
      case 'ride_assignment':
        notificationService.sendRideAssignmentNotification(
          data.driverId,
          data.rideId,
          data.message
        );
        break;
      case 'approval_request':
        notificationService.sendApprovalRequestNotification(
          data.departmentHeadId,
          data.rideId,
          data.message
        );
        break;
      case 'pm_approval':
        notificationService.sendPMApprovalRequestNotification(
          data.projectManagerId,
          data.rideId,
          data.message
        );
        break;
    }
  }, []);

  // Join ride tracking room
  const joinRideTracking = useCallback((rideId: string) => {
    socketClient.joinRideTracking(rideId);
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    return await locationTrackingService.getCurrentLocation();
  }, []);

  // Get tracking status
  const getTrackingStatus = useCallback(() => {
    return locationTrackingService.getTrackingStatus();
  }, []);

  // Get notifications
  const getNotifications = useCallback(() => {
    return notificationService.getNotifications();
  }, []);

  // Get unread notification count
  const getUnreadCount = useCallback(() => {
    return notificationService.getUnreadCount();
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    socketClient.disconnect();
    locationTrackingService.stopTracking();
    isInitialized.current = false;
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initialize]);

  // Reinitialize if session changes
  useEffect(() => {
    if (session?.user && !isInitialized.current) {
      initialize();
    }
  }, [session, initialize]);

  return {
    // Status
    isInitialized: isInitialized.current,
    isConnected: socketClient.getSocket()?.connected || false,
    
    // Location tracking
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    getTrackingStatus,
    
    // Notifications
    sendNotification,
    getNotifications,
    getUnreadCount,
    markNotificationAsRead,
    
    // Ride tracking
    joinRideTracking,
    
    // Cleanup
    cleanup,
  };
}

// Hook for driver-specific features
export function useDriverRealTime(options: Omit<UseRealTimeOptions, 'enableLocation'> = {}) {
  return useRealTime({
    ...options,
    enableLocation: true,
  });
}

// Hook for admin/manager features
export function useAdminRealTime(options: UseRealTimeOptions = {}) {
  return useRealTime({
    ...options,
    enableLocation: false,
  });
}
