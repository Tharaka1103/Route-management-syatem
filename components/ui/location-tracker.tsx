'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Play, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  locationTrackingService, 
  LocationData,
  LocationUtils 
} from '@/lib/location-tracking';

interface LocationTrackerProps {
  driverId: string;
  rideId?: string;
  dailyRouteId?: string;
  onLocationUpdate?: (location: LocationData) => void;
}

export function LocationTracker({
  driverId,
  rideId,
  dailyRouteId,
  onLocationUpdate,
}: LocationTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    const status = locationTrackingService.getTrackingStatus();
    setIsTracking(status.isTracking);
    setCurrentLocation(status.lastLocation);
  }, []);

  const checkLocationPermission = async () => {
    try {
      const permissionStatus = await LocationUtils.checkPermissions();
      setPermission(permissionStatus);
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      const granted = await LocationUtils.requestPermissions();
      if (granted) {
        setPermission('granted');
        setError(null);
      } else {
        setPermission('denied');
        setError('Location permission denied. Please enable location access in your browser settings.');
      }
    } catch (error) {
      setError('Failed to request location permission.');
    } finally {
      setIsLoading(false);
    }
  };

  const startTracking = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await locationTrackingService.startTracking(driverId, {
        rideId,
        dailyRouteId,
        interval: 5000, // Update every 5 seconds
        minDistance: 10, // Update only if moved more than 10 meters
      });

      setIsTracking(true);
      
      // Get initial location
      const location = await locationTrackingService.getCurrentLocation();
      setCurrentLocation(location);
      onLocationUpdate?.(location);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start location tracking');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = () => {
    locationTrackingService.stopTracking();
    setIsTracking(false);
    setCurrentLocation(null);
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const location = await locationTrackingService.getCurrentLocation();
      setCurrentLocation(location);
      onLocationUpdate?.(location);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get current location');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAccuracy = (accuracy: number) => {
    return accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy / 1000).toFixed(1)}km`;
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A';
    // Convert m/s to km/h
    return `${(speed * 3.6).toFixed(1)} km/h`;
  };

  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isTracking) return 'success';
    return 'secondary';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isTracking) return 'Active';
    return 'Inactive';
  };

  if (permission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Location access is denied. Please enable location permissions in your browser settings to use location tracking.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={checkLocationPermission} 
            className="mt-3 w-full"
            variant="outline"
          >
            Check Permission Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Tracking</span>
          </div>
          <Badge variant={getStatusColor() as any}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === 'prompt' && (
          <Alert>
            <AlertDescription>
              Location permission is required for tracking.
            </AlertDescription>
            <Button 
              onClick={requestLocationPermission} 
              className="mt-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Grant Permission
            </Button>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isTracking}
              onCheckedChange={isTracking ? stopTracking : startTracking}
              disabled={permission !== 'granted' || isLoading}
            />
            <span className="text-sm font-medium">
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={permission !== 'granted' || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        {currentLocation && (
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">Current Location</h4>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <p className="font-mono">{currentLocation.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <p className="font-mono">{currentLocation.longitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <p>{formatAccuracy(currentLocation.accuracy)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Speed:</span>
                <p>{formatSpeed(currentLocation.speed)}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Last updated: {currentLocation.timestamp.toLocaleTimeString()}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const coords = LocationUtils.formatCoordinates(
                    currentLocation.latitude,
                    currentLocation.longitude
                  );
                  navigator.clipboard.writeText(coords);
                }}
              >
                Copy Coordinates
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
                  window.open(url, '_blank');
                }}
              >
                Open in Maps
              </Button>
            </div>
          </div>
        )}

        {isTracking && rideId && (
          <div className="text-sm text-muted-foreground">
            <p>Tracking for ride: {rideId}</p>
            {dailyRouteId && <p>Route: {dailyRouteId}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
