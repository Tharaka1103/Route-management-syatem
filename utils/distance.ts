// Distance calculation utilities
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
  unit: 'km' | 'miles' = 'km'
): number {
  const R = unit === 'miles' ? 3959 : 6371; // Earth's radius in miles or km
  
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

// Calculate bearing between two points
export function calculateBearing(point1: Coordinates, point2: Coordinates): number {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  const x = Math.sin(deltaLonRad) * Math.cos(lat2Rad);
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
           Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLonRad);

  const bearingRad = Math.atan2(x, y);
  const bearingDeg = toDegrees(bearingRad);
  
  return (bearingDeg + 360) % 360; // Normalize to 0-360 degrees
}

// Calculate destination point given start point, bearing, and distance
export function calculateDestination(
  start: Coordinates,
  bearing: number,
  distance: number,
  unit: 'km' | 'miles' = 'km'
): Coordinates {
  const R = unit === 'miles' ? 3959 : 6371;
  
  const lat1Rad = toRadians(start.latitude);
  const lon1Rad = toRadians(start.longitude);
  const bearingRad = toRadians(bearing);
  
  const lat2Rad = Math.asin(
    Math.sin(lat1Rad) * Math.cos(distance / R) +
    Math.cos(lat1Rad) * Math.sin(distance / R) * Math.cos(bearingRad)
  );
  
  const lon2Rad = lon1Rad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1Rad),
    Math.cos(distance / R) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
  );

  return {
    latitude: toDegrees(lat2Rad),
    longitude: toDegrees(lon2Rad),
  };
}

// Check if a point is within a certain radius of another point
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radius: number,
  unit: 'km' | 'miles' = 'km'
): boolean {
  const distance = calculateDistance(center, point, unit);
  return distance <= radius;
}

// Calculate the center point of multiple coordinates
export function calculateCenter(coordinates: Coordinates[]): Coordinates {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate center of empty coordinates array');
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  let totalLat = 0;
  let totalLon = 0;

  coordinates.forEach(coord => {
    totalLat += coord.latitude;
    totalLon += coord.longitude;
  });

  return {
    latitude: totalLat / coordinates.length,
    longitude: totalLon / coordinates.length,
  };
}

// Calculate bounding box for a set of coordinates
export function calculateBoundingBox(
  coordinates: Coordinates[],
  padding: number = 0.01
): {
  northeast: Coordinates;
  southwest: Coordinates;
} {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounding box of empty coordinates array');
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLon = coordinates[0].longitude;
  let maxLon = coordinates[0].longitude;

  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLon = Math.min(minLon, coord.longitude);
    maxLon = Math.max(maxLon, coord.longitude);
  });

  return {
    northeast: {
      latitude: maxLat + padding,
      longitude: maxLon + padding,
    },
    southwest: {
      latitude: minLat - padding,
      longitude: minLon - padding,
    },
  };
}

// Format distance for display
export function formatDistance(
  distance: number,
  unit: 'km' | 'miles' = 'km',
  decimals: number = 2
): string {
  if (distance < 1) {
    const meters = distance * (unit === 'km' ? 1000 : 1609.34);
    return `${Math.round(meters)} ${unit === 'km' ? 'm' : 'ft'}`;
  }
  
  return `${distance.toFixed(decimals)} ${unit}`;
}

// Estimate travel time based on distance and mode
export function estimateTravelTime(
  distance: number,
  mode: 'driving' | 'walking' | 'cycling' = 'driving',
  unit: 'km' | 'miles' = 'km'
): number {
  // Average speeds in km/h or mph
  const speeds = {
    driving: unit === 'km' ? 40 : 25,  // City driving
    walking: unit === 'km' ? 5 : 3,   // Walking
    cycling: unit === 'km' ? 15 : 9,  // Cycling
  };

  const timeInHours = distance / speeds[mode];
  return timeInHours * 60; // Return minutes
}

// Format travel time for display
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

// Utility functions
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

// Validate coordinates
export function isValidCoordinate(coord: Coordinates): boolean {
  return (
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180 &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
}

// Parse coordinate string (e.g., "40.7128,-74.0060")
export function parseCoordinateString(coordString: string): Coordinates | null {
  try {
    const [lat, lon] = coordString.split(',').map(s => parseFloat(s.trim()));
    const coord = { latitude: lat, longitude: lon };
    
    return isValidCoordinate(coord) ? coord : null;
  } catch {
    return null;
  }
}

// Convert coordinates to string
export function coordinatesToString(coord: Coordinates, precision: number = 6): string {
  return `${coord.latitude.toFixed(precision)},${coord.longitude.toFixed(precision)}`;
}
