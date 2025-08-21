import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry'],
});

export { loader };

// Distance calculation utility
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

// Geocoding utilities
export async function geocodeAddress(address: string): Promise<google.maps.GeocoderResult[]> {
  const { Geocoder } = await loader.importLibrary('geocoding');
  const geocoder = new Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results) {
        resolve(results);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<google.maps.GeocoderResult[]> {
  const { Geocoder } = await loader.importLibrary('geocoding');
  const geocoder = new Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results) {
        resolve(results);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
}

// Route calculation
export async function calculateRoute(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  waypoints?: google.maps.DirectionsWaypoint[]
): Promise<google.maps.DirectionsResult> {
  const { DirectionsService } = await loader.importLibrary('routes');
  const directionsService = new DirectionsService();

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        waypoints: waypoints || [],
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          reject(new Error(`Directions service failed: ${status}`));
        }
      }
    );
  });
}

// Estimate travel time and distance
export async function getTravelEstimate(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<{
  distance: string;
  duration: string;
  distanceValue: number;
  durationValue: number;
}> {
  const { DistanceMatrixService } = await loader.importLibrary('routes');
  const service = new DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0]?.elements[0];
          if (element && element.status === 'OK') {
            resolve({
              distance: element.distance!.text,
              duration: element.duration!.text,
              distanceValue: element.distance!.value,
              durationValue: element.duration!.value,
            });
          } else {
            reject(new Error('No route found'));
          }
        } else {
          reject(new Error(`Distance matrix service failed: ${status}`));
        }
      }
    );
  });
}

// Map style configurations
export const mapStyles = {
  default: [],
  silver: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    // Add more styles as needed
  ],
  dark: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#212121' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    // Add more styles as needed
  ],
};
