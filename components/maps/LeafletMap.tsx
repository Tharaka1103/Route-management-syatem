'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, MapPin, Navigation } from 'lucide-react'
import { Location } from '@/types'
import { toast } from 'sonner'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LeafletMapProps {
  onLocationSelect: (location: Location, type: 'start' | 'end') => void
  startLocation?: Location
  endLocation?: Location
  height?: string
  center?: { lat: number; lng: number }
  zoom?: number
}

// Sri Lanka coordinates
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 } // Center of Sri Lanka
const DEFAULT_ZOOM = 8

export default function LeafletMap({
  onLocationSelect,
  startLocation,
  endLocation,
  height = '400px',
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)
  const endMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  
  const [isSelectingStart, setIsSelectingStart] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Custom icons
  const startIcon = L.divIcon({
    html: `<div style="background-color: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  const endIcon = L.divIcon({
    html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    const map = L.map(containerRef.current).setView([center.lat, center.lng], zoom)
    mapRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Handle map clicks
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng
      
      try {
        // Reverse geocoding using Nominatim
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        )
        const data = await response.json()
        
        const location: Location = {
          latitude: lat,
          longitude: lng,
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        }

        onLocationSelect(location, isSelectingStart ? 'start' : 'end')
        setIsSelectingStart(!isSelectingStart)
      } catch (error) {
        console.error('Error getting address:', error)
        toast.error('Failed to get address for selected location')
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [center.lat, center.lng, zoom, onLocationSelect, isSelectingStart])

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return

    // Update start marker
    if (startLocation) {
      if (startMarkerRef.current) {
        startMarkerRef.current.remove()
      }
      startMarkerRef.current = L.marker([startLocation.latitude, startLocation.longitude], { icon: startIcon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>Start:</strong><br>${startLocation.address}`)
    }

    // Update end marker
    if (endLocation) {
      if (endMarkerRef.current) {
        endMarkerRef.current.remove()
      }
      endMarkerRef.current = L.marker([endLocation.latitude, endLocation.longitude], { icon: endIcon })
        .addTo(mapRef.current)
        .bindPopup(`<strong>Destination:</strong><br>${endLocation.address}`)
    }

    // Draw route between start and end
    if (startLocation && endLocation) {
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
      }
      
      const latlngs: [number, number][] = [
        [startLocation.latitude, startLocation.longitude],
        [endLocation.latitude, endLocation.longitude]
      ]
      
      routeLayerRef.current = L.polyline(latlngs, { 
        color: '#3b82f6', 
        weight: 4,
        opacity: 0.7 
      }).addTo(mapRef.current)

      // Fit map to show both markers
      const group = new L.FeatureGroup([startMarkerRef.current!, endMarkerRef.current!])
      mapRef.current.fitBounds(group.getBounds().pad(0.1))
    }
  }, [startLocation, endLocation])

  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Search using Nominatim with Sri Lanka bias
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=lk&limit=5&addressdetails=1`
      )
      const data = await response.json()
      
      if (data.length > 0) {
        setSearchResults(data)
      } else {
        // Fallback: search globally if no Sri Lankan results
        const globalResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Sri Lanka')}&limit=5&addressdetails=1`
        )
        const globalData = await globalResponse.json()
        setSearchResults(globalData)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search locations')
    } finally {
      setIsSearching(false)
    }
  }

  const selectSearchResult = (result: any) => {
    const location: Location = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name
    }

    onLocationSelect(location, isSelectingStart ? 'start' : 'end')
    setIsSelectingStart(!isSelectingStart)
    setSearchResults([])
    setSearchQuery('')

    // Pan map to selected location
    if (mapRef.current) {
      mapRef.current.setView([location.latitude, location.longitude], 15)
    }
  }

  return (
    <div className="space-y-4">
      {/* Location Search */}
      <div className="space-y-2">
        <Label>Search Location</Label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location in Sri Lanka..."
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    onClick={() => selectSearchResult(result)}
                  >
                    <div className="text-sm font-medium">{result.display_name}</div>
                    <div className="text-xs text-gray-500">{result.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={searchLocation} disabled={isSearching || !searchQuery.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Map Control Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={isSelectingStart ? "default" : "outline"} 
          size="sm"
          onClick={() => setIsSelectingStart(true)}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Select Start Location
        </Button>
        <Button 
          variant={!isSelectingStart ? "default" : "outline"} 
          size="sm"
          onClick={() => setIsSelectingStart(false)}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Select End Location
        </Button>
      </div>

      {/* Selected Locations Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-green-600">Start Location</Label>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md min-h-[60px]">
            <p className="text-sm">{startLocation?.address || 'Click on map or search to select start location'}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-red-600">End Location</Label>
          <div className="p-3 bg-red-50 border border-red-200 rounded-md min-h-[60px]">
            <p className="text-sm">{endLocation?.address || 'Click on map or search to select end location'}</p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={containerRef}
        style={{ height }}
        className="w-full border border-gray-300 rounded-lg shadow-sm"
      />

      {/* Instructions */}
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-md">
        <p><strong>Instructions:</strong></p>
        <p>• Search for locations using the search box above</p>
        <p>• Click on the map to select locations</p>
        <p>• Green marker = Start location, Red marker = Destination</p>
        <p>• Use the buttons to switch between selecting start/end locations</p>
      </div>
    </div>
  )
}
