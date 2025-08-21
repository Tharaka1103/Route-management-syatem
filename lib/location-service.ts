import { Location } from '@/types'

export interface SearchResult {
  place_id: string
  display_name: string
  lat: string
  lon: string
  type: string
  importance: number
  address: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
  }
}

class LocationService {
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
  
  // Sri Lanka bounding box for focused searches
  private readonly SRI_LANKA_BOUNDS = {
    minLat: 5.916,
    maxLat: 9.835,
    minLng: 79.652,
    maxLng: 81.881
  }

  async searchLocations(query: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      // First try searching within Sri Lanka
      let url = `${this.NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
        format: 'json',
        q: query,
        countrycodes: 'lk', // Restrict to Sri Lanka
        limit: limit.toString(),
        addressdetails: '1',
        extratags: '1',
        namedetails: '1'
      })

      let response = await fetch(url)
      let data = await response.json()

      // If no results in Sri Lanka, try broader search with "Sri Lanka" appended
      if (data.length === 0) {
        url = `${this.NOMINATIM_BASE_URL}/search?` + new URLSearchParams({
          format: 'json',
          q: `${query} Sri Lanka`,
          limit: limit.toString(),
          addressdetails: '1',
          extratags: '1',
          namedetails: '1'
        })

        response = await fetch(url)
        data = await response.json()
      }

      return data.filter((item: any) => 
        parseFloat(item.lat) >= this.SRI_LANKA_BOUNDS.minLat &&
        parseFloat(item.lat) <= this.SRI_LANKA_BOUNDS.maxLat &&
        parseFloat(item.lon) >= this.SRI_LANKA_BOUNDS.minLng &&
        parseFloat(item.lon) <= this.SRI_LANKA_BOUNDS.maxLng
      )
    } catch (error) {
      console.error('Location search error:', error)
      throw new Error('Failed to search locations')
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `${this.NOMINATIM_BASE_URL}/reverse?` + new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lng.toString(),
        addressdetails: '1'
      })

      const response = await fetch(url)
      const data = await response.json()

      if (data.display_name) {
        return data.display_name
      } else {
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
  }

  calculateDistance(start: Location, end: Location): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(end.latitude - start.latitude)
    const dLon = this.toRadians(end.longitude - start.longitude)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(start.latitude)) * Math.cos(this.toRadians(end.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    
    return distance
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Get popular Sri Lankan cities for quick selection
  getPopularCities(): Location[] {
    return [
      {
        latitude: 6.9271,
        longitude: 79.8612,
        address: 'Colombo, Western Province, Sri Lanka'
      },
      {
        latitude: 7.2906,
        longitude: 80.6337,
        address: 'Kandy, Central Province, Sri Lanka'
      },
      {
        latitude: 6.0535,
        longitude: 80.2210,
        address: 'Galle, Southern Province, Sri Lanka'
      },
      {
        latitude: 8.3114,
        longitude: 80.4037,
        address: 'Anuradhapura, North Central Province, Sri Lanka'
      },
      {
        latitude: 7.9403,
        longitude: 81.0188,
        address: 'Polonnaruwa, North Central Province, Sri Lanka'
      },
      {
        latitude: 6.8259,
        longitude: 79.9250,
        address: 'Nugegoda, Western Province, Sri Lanka'
      },
      {
        latitude: 6.7077,
        longitude: 79.9119,
        address: 'Dehiwala, Western Province, Sri Lanka'
      },
      {
        latitude: 7.0873,
        longitude: 79.9553,
        address: 'Kotte, Western Province, Sri Lanka'
      }
    ]
  }

  // Check if coordinates are within Sri Lanka
  isWithinSriLanka(lat: number, lng: number): boolean {
    return lat >= this.SRI_LANKA_BOUNDS.minLat &&
           lat <= this.SRI_LANKA_BOUNDS.maxLat &&
           lng >= this.SRI_LANKA_BOUNDS.minLng &&
           lng <= this.SRI_LANKA_BOUNDS.maxLng
  }
}

export const locationService = new LocationService()
