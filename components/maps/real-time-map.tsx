'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Minimize2, RotateCcw, Navigation } from 'lucide-react';
import { socketClient } from '@/lib/socket-client';
import { calculateDistance, formatDistance } from '@/utils/distance';

interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: 'active' | 'inactive' | 'break';
  driver: {
    name: string;
    email: string;
  };
  rideId?: string;
  dailyRouteId?: string;
}

interface RealTimeMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  showAllDrivers?: boolean;
  focusedDriverId?: string;
  rideId?: string;
  className?: string;
  height?: string;
  showControls?: boolean;
  onDriverClick?: (driver: DriverLocation) => void;
}

const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo, Sri Lanka

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: true,
};

export function RealTimeMap({
  center = defaultCenter,
  zoom = 12,
  showAllDrivers = true,
  focusedDriverId,
  rideId,
  className,
  height = '400px',
  showControls = true,
  onDriverClick,
}: RealTimeMapProps) {
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['geometry', 'places'],
  });

  useEffect(() => {
    if (isLoaded) {
      fetchDriverLocations();
      setupRealtimeUpdates();
    }
  }, [isLoaded]);

  const fetchDriverLocations = async () => {
    try {
      const response = await fetch('/api/location/drivers');
      if (response.ok) {
        const data = await response.json();
        setDriverLocations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching driver locations:', error);
    }
  };

  const setupRealtimeUpdates = () => {
    socketClient.onDriverLocationUpdate((data) => {
      setDriverLocations(prev => {
        const updated = prev.filter(d => d.driverId !== data.driverId);
        updated.push({
          driverId: data.driverId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date(data.timestamp),
          status: 'active',
          driver: { name: 'Driver', email: '' }, // Will be populated by API
          rideId: data.rideId,
          dailyRouteId: data.dailyRouteId,
        });
        return updated;
      });
    });

    socketClient.onLocationUpdate((data) => {
      if (rideId && data.rideId === rideId) {
        // Update specific ride location
        setDriverLocations(prev => 
          prev.map(driver => 
            driver.driverId === data.driverId 
              ? { 
                  ...driver, 
                  latitude: data.latitude, 
                  longitude: data.longitude, 
                  timestamp: new Date(data.timestamp) 
                }
              : driver
          )
        );
      }
    });
  };

  const getMarkerIcon = (driver: DriverLocation) => {
    const isSelected = selectedDriver?.driverId === driver.driverId;
    const isFocused = focusedDriverId === driver.driverId;
    
    let color = '#10B981'; // green for active
    if (driver.status === 'inactive') color = '#EF4444'; // red for inactive
    if (driver.status === 'break') color = '#F59E0B'; // yellow for break

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: isSelected || isFocused ? 1 : 0.8,
      strokeColor: '#ffffff',
      strokeWeight: isSelected || isFocused ? 3 : 2,
      scale: isSelected || isFocused ? 12 : 8,
    };
  };

  const handleMarkerClick = (driver: DriverLocation) => {
    setSelectedDriver(driver);
    onDriverClick?.(driver);
  };

  const centerOnDriver = (driver: DriverLocation) => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: driver.latitude, lng: driver.longitude });
      mapRef.current.setZoom(15);
    }
  };

  const resetMapView = () => {
    setMapCenter(center);
    setMapZoom(zoom);
    if (mapRef.current) {
      mapRef.current.panTo(center);
      mapRef.current.setZoom(zoom);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const filteredDrivers = showAllDrivers 
    ? driverLocations 
    : driverLocations.filter(d => d.driverId === focusedDriverId);

  if (loadError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-red-500">Error loading Google Maps</p>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading map...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {showControls && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Real-time Driver Locations</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetMapView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={`p-0 ${isFullscreen ? 'h-full' : ''}`}>
        <GoogleMap
          mapContainerStyle={{
            ...mapContainerStyle,
            height: isFullscreen ? '100%' : height,
          }}
          center={mapCenter}
          zoom={mapZoom}
          options={mapOptions}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {filteredDrivers.map((driver) => (
            <Marker
              key={driver.driverId}
              position={{ lat: driver.latitude, lng: driver.longitude }}
              icon={getMarkerIcon(driver)}
              onClick={() => handleMarkerClick(driver)}
              title={`${driver.driver.name} - ${driver.status}`}
            />
          ))}

          {selectedDriver && (
            <InfoWindow
              position={{ lat: selectedDriver.latitude, lng: selectedDriver.longitude }}
              onCloseClick={() => setSelectedDriver(null)}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-semibold text-sm">{selectedDriver.driver.name}</h3>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge 
                      variant={selectedDriver.status === 'active' ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {selectedDriver.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Update:</span>
                    <span>{selectedDriver.timestamp.toLocaleTimeString()}</span>
                  </div>
                  {selectedDriver.rideId && (
                    <div className="flex justify-between">
                      <span>Current Ride:</span>
                      <span className="font-mono text-xs">{selectedDriver.rideId.slice(-6)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => centerOnDriver(selectedDriver)}
                    className="text-xs"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Center
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${selectedDriver.latitude},${selectedDriver.longitude}`;
                      window.open(url, '_blank');
                    }}
                    className="text-xs"
                  >
                    Open Maps
                  </Button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </CardContent>

      {showControls && filteredDrivers.length > 0 && (
        <CardContent className="pt-3 pb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Active drivers visible on map</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDriverLocations}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
