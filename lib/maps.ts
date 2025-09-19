const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
    }>;
    overview_polyline: { points: string };
  }>;
}

export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceKm: number; polyline: string }> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await fetch(url);
  const data: DirectionsResponse = await response.json();
  
  if (data.routes && data.routes.length > 0) {
    const route = data.routes[0];
    const leg = route.legs[0];
    const distanceKm = leg.distance.value / 1000; // Convert meters to kilometers
    const polyline = route.overview_polyline.points;
    
    return { distanceKm, polyline };
  }
  
  throw new Error('No route found');
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return { lat: location.lat, lng: location.lng };
  }
  
  throw new Error('Address not found');
}