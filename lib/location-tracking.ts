import { socketClient } from './socket-client';
import { calculateDistance } from './google-maps';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export interface DriverLocation extends LocationData {
  driverId: string;
  rideId?: string;
  dailyRouteId?: string;
  status: 'active' | 'inactive' | 'break';
}

class LocationTrackingService {
  private watchId: number | null = null;
  private isTracking = false;
  private lastLocation: LocationData | null = null;
  private trackingInterval: NodeJS.Timeout | null = null;
  private driverId: string | null = null;
  private currentRideId: string | null = null;
  private currentDailyRouteId: string | null = null;

  // Start location tracking
  async startTracking(
    driverId: string,
    options: {
      rideId?: string;
      dailyRouteId?: string;
      interval?: number; // milliseconds
      minDistance?: number; // meters
    } = {}
  ): Promise<void> {
    const { rideId, dailyRouteId, interval = 5000, minDistance = 10 } = options;

    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return;
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.driverId = driverId;
    this.currentRideId = rideId || null;
    this.currentDailyRouteId = dailyRouteId || null;
    this.isTracking = true;

    const geolocationOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Start continuous watching
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };

        // Only update if moved significantly
        if (this.shouldUpdateLocation(locationData, minDistance)) {
          this.updateLocation(locationData);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.handleLocationError(error);
      },
      geolocationOptions
    );

    // Set up periodic updates as backup
    this.trackingInterval = setInterval(() => {
      if (this.lastLocation) {
        this.sendLocationUpdate(this.lastLocation);
      }
    }, interval);
  }

  // Stop location tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    this.isTracking = false;
    this.driverId = null;
    this.currentRideId = null;
    this.currentDailyRouteId = null;
    this.lastLocation = null;
  }

  // Get current location once
  async getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };
          resolve(locationData);
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
    });
  }

  // Update location manually
  updateLocation(location: LocationData): void {
    this.lastLocation = location;
    this.sendLocationUpdate(location);
  }

  // Update ride context
  updateRideContext(rideId: string | null, dailyRouteId: string | null): void {
    this.currentRideId = rideId;
    this.currentDailyRouteId = dailyRouteId;
  }

  // Check if location should be updated based on distance
  private shouldUpdateLocation(newLocation: LocationData, minDistance: number): boolean {
    if (!this.lastLocation) return true;

    const distance = calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    return distance * 1000 > minDistance; // Convert km to meters
  }

  // Send location update via socket
  private sendLocationUpdate(location: LocationData): void {
    if (!this.driverId) return;

    const updateData = {
      driverId: this.driverId,
      latitude: location.latitude,
      longitude: location.longitude,
      rideId: this.currentRideId || undefined,
      dailyRouteId: this.currentDailyRouteId || undefined,
    };

    socketClient.updateLocation(updateData);
  }

  // Handle geolocation errors
  private handleLocationError(error: GeolocationPositionError): void {
    let errorMessage = 'Unknown location error';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out';
        break;
    }

    console.error('Location tracking error:', errorMessage);
    
    // Try to restart tracking after a delay
    setTimeout(() => {
      if (this.isTracking && this.driverId) {
        console.log('Attempting to restart location tracking...');
        this.stopTracking();
        this.startTracking(this.driverId, {
          rideId: this.currentRideId || undefined,
          dailyRouteId: this.currentDailyRouteId || undefined,
        });
      }
    }, 5000);
  }

  // Get tracking status
  getTrackingStatus(): {
    isTracking: boolean;
    driverId: string | null;
    currentRideId: string | null;
    currentDailyRouteId: string | null;
    lastLocation: LocationData | null;
  } {
    return {
      isTracking: this.isTracking,
      driverId: this.driverId,
      currentRideId: this.currentRideId,
      currentDailyRouteId: this.currentDailyRouteId,
      lastLocation: this.lastLocation,
    };
  }

  // Calculate ETA based on current location and destination
  calculateETA(destination: { latitude: number; longitude: number }): number | null {
    if (!this.lastLocation) return null;

    const distance = calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      destination.latitude,
      destination.longitude
    );

    // Estimate speed (30 km/h average in city)
    const averageSpeed = 30; // km/h
    const etaHours = distance / averageSpeed;
    const etaMinutes = etaHours * 60;

    return Math.round(etaMinutes);
  }
}

export const locationTrackingService = new LocationTrackingService();

// Location utilities
export const LocationUtils = {
  // Check if location permissions are granted
  async checkPermissions(): Promise<PermissionState> {
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    }
    return 'prompt';
  },

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000,
        });
      });
      return true;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  },

  // Format coordinates for display
  formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  },

  // Check if two locations are within a certain radius
  isWithinRadius(
    location1: { latitude: number; longitude: number },
    location2: { latitude: number; longitude: number },
    radiusKm: number
  ): boolean {
    const distance = calculateDistance(
      location1.latitude,
      location1.longitude,
      location2.latitude,
      location2.longitude
    );
    return distance <= radiusKm;
  },
};
