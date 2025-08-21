export const calculateDistance = async (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google) {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [{ lat: start.latitude, lng: start.longitude }],
        destinations: [{ lat: end.latitude, lng: end.longitude }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === 'OK' && response?.rows[0]?.elements[0]?.distance) {
          const distanceInMeters = response.rows[0].elements[0].distance.value;
          resolve(distanceInMeters / 1000); // Convert to kilometers
        } else {
          reject(new Error('Failed to calculate distance'));
        }
      });
    } else {
      // Fallback: Haversine formula for server-side calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = toRad(end.latitude - start.latitude);
      const dLon = toRad(end.longitude - start.longitude);
      const lat1 = toRad(start.latitude);
      const lat2 = toRad(end.latitude);

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      resolve(distance);
    }
  });
};

const toRad = (value: number) => {
  return value * Math.PI / 180;
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error('Failed to get address'));
        }
      });
    } else {
      resolve(`${lat}, ${lng}`); // Fallback to coordinates
    }
  });
};