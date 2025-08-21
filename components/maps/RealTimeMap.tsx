'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Ride, Location } from '@/types'
import { Activity } from 'lucide-react'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface RealTimeMapProps {
  ride: Ride
  driverLocation?: Location | null
  height?: string
}

export default function RealTimeMap({ ride, driverLocation, height = '400px' }: RealTimeMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startMarkerRef = useRef<L.Marker | null>(null)
  const endMarkerRef = useRef<L.Marker | null>(null)
  const driverMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)

  // Custom icons
  const startIcon = L.divIcon({
    html: `<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-div-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  })

  const endIcon = L.divIcon({
    html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-div-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  })

  const driverIcon = L.divIcon({
    html: `
      <div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 12px;">🚗</div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map centered on start location
    const map = L.map(containerRef.current).setView(
      [ride.startLocation.latitude, ride.startLocation.longitude], 
      13
    )
    mapRef.current = map

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add start marker
    startMarkerRef.current = L.marker(
      [ride.startLocation.latitude, ride.startLocation.longitude], 
      { icon: startIcon }
    )
    .addTo(map)
    .bindPopup(`<strong>Pickup:</strong><br>${ride.startLocation.address}`)

    // Add end marker
    endMarkerRef.current = L.marker(
      [ride.endLocation.latitude, ride.endLocation.longitude], 
      { icon: endIcon }
    )
    .addTo(map)
    .bindPopup(`<strong>Destination:</strong><br>${ride.endLocation.address}`)

    // Add route line
    const routePoints: [number, number][] = [
      [ride.startLocation.latitude, ride.startLocation.longitude],
      [ride.endLocation.latitude, ride.endLocation.longitude]
    ]
    
    routeLayerRef.current = L.polyline(routePoints, { 
      color: '#6366f1', 
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(map)

    // Fit map to show all markers
    const group = new L.FeatureGroup([startMarkerRef.current, endMarkerRef.current])
    map.fitBounds(group.getBounds().pad(0.1))

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [ride])

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove()
    }

    // Add new driver marker
    driverMarkerRef.current = L.marker(
      [driverLocation.latitude, driverLocation.longitude],
      { icon: driverIcon }
    )
    .addTo(mapRef.current)
    .bindPopup(`<strong>Driver Location</strong><br>Last updated: ${new Date().toLocaleTimeString()}`)

    // If ride is ongoing, draw path from driver to destination
    if (ride.status === 'ongoing' && routeLayerRef.current) {
      routeLayerRef.current.remove()
      
      const currentRoutePoints: [number, number][] = [
        [driverLocation.latitude, driverLocation.longitude],
        [ride.endLocation.latitude, ride.endLocation.longitude]
      ]
      
      routeLayerRef.current = L.polyline(currentRoutePoints, { 
        color: '#22c55e', 
        weight: 4,
        opacity: 0.8
      }).addTo(mapRef.current)
    }

    // Auto-center on driver if trip is ongoing
    if (ride.status === 'ongoing') {
      mapRef.current.setView([driverLocation.latitude, driverLocation.longitude], 15)
    }

  }, [driverLocation, ride.status])

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {ride.status === 'ongoing' ? 'Trip in Progress' : 'Waiting for Trip to Start'}
            </span>
          </div>
          {driverLocation && (
            <span className="text-xs text-blue-600">
              Last update: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div 
        ref={containerRef}
        style={{ height }}
        className="w-full border border-gray-300 rounded-lg shadow-sm"
      />

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Pickup Location</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Destination</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Driver Location</span>
        </div>
      </div>
    </div>
  )
}
