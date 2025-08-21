'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Car,
  MapPin,
  Navigation,
  Clock,
  Star,
  Phone,
  User,
  CheckCircle,
  Square,
  Activity,
  Route,
  Timer,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { Ride, Driver as DriverType, Vehicle, Location } from '@/types'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'

// Dynamic import for LeafletMap to avoid SSR issues
const RealTimeMap = dynamic(() => import('@/components/maps/RealTimeMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">Loading real-time map...</div>
})

export default function RideTrackingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const rideId = Array.isArray(params.id) ? params.id[0] : params.id as string

  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [driverLocation, setDriverLocation] = useState<Location | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [tripProgress, setTripProgress] = useState(0)
  const [actualDistance, setActualDistance] = useState(0)
  const [tripStartLocation, setTripStartLocation] = useState<Location | null>(null)

  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!rideId) return

    loadRideData()
    
    // Set up real-time location updates
    if (session?.user?.role === 'driver') {
      startLocationTracking()
    } else {
      startLocationListening()
    }

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current)
      }
    }
  }, [])

  const loadRideData = async () => {
    try {
      const response = await fetch(`/api/rides/${rideId}`)
      if (response.ok) {
        const data = await response.json()
        setRide(data.ride)
      } else {
        toast.error('Failed to load ride data')
        // Redirect based on user role
        if (session?.user?.role === 'driver') {
          router.push('/driver')
        } else if (session?.user?.role === 'admin') {
          router.push('/admin')
        } else if (session?.user?.role === 'department_head') {
          router.push('/department-head')
        } else if (session?.user?.role === 'project_manager') {
          router.push('/project-manager')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error loading ride:', error)
      toast.error('Error loading ride data')
    } finally {
      setLoading(false)
    }
  }

  const startLocationTracking = () => {
    // For drivers - update their location
    if (navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            try {
              await fetch('/api/location/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
              })
              
              const currentLocation = { latitude, longitude, address: 'Current Location' }
              setDriverLocation(currentLocation)
              calculateProgress(latitude, longitude)
              
              // Track actual distance traveled
              if (tripStartLocation) {
                const distanceTraveled = calculateDistance(tripStartLocation, currentLocation)
                setActualDistance(prev => Math.max(prev, distanceTraveled))
              } else if (ride?.status === 'ongoing') {
                // Set trip start location when ride is ongoing
                setTripStartLocation(currentLocation)
              }
            } catch (error) {
              console.error('Error updating location:', error)
            }
          },
          (error) => {
            console.error('Geolocation error:', error)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )
      }

      // Update location immediately and then every 10 seconds
      updateLocation()
      locationUpdateInterval.current = setInterval(updateLocation, 10000)
    }
  }

  const startLocationListening = () => {
    // For users - listen for driver location updates
    const fetchDriverLocation = async () => {
      if (!ride?.driver) return

      try {
        const response = await fetch(`/api/location/driver/${(ride.driver as any)._id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.location) {
            setDriverLocation(data.location)
            calculateProgress(data.location.latitude, data.location.longitude)
          }
        }
      } catch (error) {
        console.error('Error fetching driver location:', error)
      }
    }

    // Fetch driver location every 5 seconds
    fetchDriverLocation()
    locationUpdateInterval.current = setInterval(fetchDriverLocation, 5000)
  }

  const calculateProgress = (driverLat: number, driverLng: number) => {
    if (!ride) return

    const totalDistance = calculateDistance(
      ride.startLocation,
      ride.endLocation
    )

    const distanceFromStart = calculateDistance(
      ride.startLocation,
      { latitude: driverLat, longitude: driverLng, address: '' }
    )

    const progress = Math.min((distanceFromStart / totalDistance) * 100, 100)
    setTripProgress(progress)

    // Calculate ETA (simplified)
    const distanceToEnd = calculateDistance(
      { latitude: driverLat, longitude: driverLng, address: '' },
      ride.endLocation
    )
    const estimatedMinutes = Math.max(distanceToEnd * 2, 1) // Rough estimate: 2 minutes per km
    setEta(estimatedMinutes)
  }

  const calculateDistance = (start: Location, end: Location): number => {
    const R = 6371 // Earth's radius in km
    const dLat = toRadians(end.latitude - start.latitude)
    const dLon = toRadians(end.longitude - start.longitude)
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  const handleCompleteRide = async () => {
    if (!ride || session?.user?.role !== 'driver') return

    try {
      const completionData: any = {}
      
      // Include actual distance if tracked
      if (actualDistance > 0) {
        completionData.actualDistance = actualDistance
      }
      
      // Include end location if available
      if (driverLocation) {
        completionData.endLocation = driverLocation
      }

      const response = await fetch(`/api/driver/rides/${rideId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Ride completed! Distance: ${data.distance?.toFixed(2) || 0} km, Duration: ${data.duration || 0} minutes`, {
          description: `Total distance driven: ${data.driverTotalDistance?.toFixed(2) || 0} km`
        })
        
        // Stop location tracking
        if (locationUpdateInterval.current) {
          clearInterval(locationUpdateInterval.current)
        }
        
        // Redirect after a short delay to show completion
        setTimeout(() => {
          router.push('/driver')
        }, 4000)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to complete ride')
      }
    } catch (error) {
      toast.error('Error completing ride')
    }
  }

  const handleCallUser = () => {
    if (ride?.user && (ride.user as any).contact) {
      window.open(`tel:${(ride.user as any).contact}`, '_self')
    }
  }

  const handleCallDriver = () => {
    if (ride?.driver && (ride.driver as any).contact) {
      window.open(`tel:${(ride.driver as any).contact}`, '_self')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Ride not found</p>
          <Button onClick={() => {
            // Redirect based on user role
            if (session?.user?.role === 'driver') {
              router.push('/driver')
            } else if (session?.user?.role === 'admin') {
              router.push('/admin')
            } else if (session?.user?.role === 'department_head') {
              router.push('/department-head')
            } else if (session?.user?.role === 'project_manager') {
              router.push('/project-manager')
            } else {
              router.push('/dashboard')
            }
          }} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => {
                // Redirect based on user role
                if (session?.user?.role === 'driver') {
                  router.push('/driver')
                } else if (session?.user?.role === 'admin') {
                  router.push('/admin')
                } else if (session?.user?.role === 'department_head') {
                  router.push('/department-head')
                } else if (session?.user?.role === 'project_manager') {
                  router.push('/project-manager')
                } else {
                  router.push('/dashboard')
                }
              }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Car className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Ride Tracking</h1>
                <p className="text-sm text-gray-600">Ride ID: {rideId}</p>
              </div>
            </div>
            <Badge className={getStatusColor(ride.status)}>
              {ride.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Map */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  Live Location Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeMap
                  ride={ride}
                  driverLocation={driverLocation}
                  height="500px"
                />
              </CardContent>
            </Card>

            {/* Trip Progress */}
            {ride.status === 'ongoing' && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Trip Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{tripProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={tripProgress} className="h-2" />
                    {eta && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Timer className="h-4 w-4" />
                        <span>Estimated arrival: {eta.toFixed(0)} minutes</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Ride Details */}
          <div className="space-y-6">
            {/* Ride Information */}
            <Card>
              <CardHeader>
                <CardTitle>Ride Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Passenger</p>
                  <p className="font-medium">{(ride.user as any)?.fullName}</p>
                </div>

                {ride.driver && (
                  <div>
                    <p className="text-sm text-gray-600">Driver</p>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{(ride.driver as any).fullName}</p>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-sm ml-1">{(ride.driver as any).rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{(ride.driver as any).contact}</p>
                  </div>
                )}

                {ride.vehicle && (
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium">{(ride.vehicle as any).vehicleNumber}</p>
                    <p className="text-sm text-gray-500">{(ride.vehicle as any).model}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-medium">{ride.distance?.toFixed(2) || 0} km</p>
                </div>

                {ride.startTime && (
                  <div>
                    <p className="text-sm text-gray-600">Started</p>
                    <p className="font-medium">{format(new Date(ride.startTime), 'MMM dd, HH:mm')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locations */}
            <Card>
              <CardHeader>
                <CardTitle>Route Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location</p>
                      <p className="text-sm font-medium">{ride.startLocation.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Navigation className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Destination</p>
                      <p className="text-sm font-medium">{ride.endLocation.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driver Controls */}
            {session?.user?.role === 'driver' && ride.status === 'ongoing' && (
              <Card>
                <CardHeader>
                  <CardTitle>Trip Controls</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleCompleteRide} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Trip
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* User Contact (for drivers) */}
                  {session?.user?.role === 'driver' && ride.user && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Passenger</p>
                        <p className="text-sm text-gray-700">{(ride.user as any).fullName}</p>
                        <p className="text-xs text-gray-600">{(ride.user as any).contact}</p>
                      </div>
                      <Button size="sm" onClick={handleCallUser} className="bg-blue-600 hover:bg-blue-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  )}

                  {/* Driver Contact (for users) */}
                  {session?.user?.role !== 'driver' && ride.driver && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800">Driver</p>
                        <p className="text-sm text-gray-700">{(ride.driver as any).fullName}</p>
                        <p className="text-xs text-gray-600">{(ride.driver as any).contact}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs">{(ride.driver as any).rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <Button size="sm" onClick={handleCallDriver} className="bg-green-600 hover:bg-green-700">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Emergency Contact</p>
                    <p className="text-sm text-gray-700">RouteBook Security: +94 11 123 4567</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Ride Requested</p>
                      <p className="text-xs text-gray-500">{format(new Date(ride.createdAt), 'MMM dd, HH:mm')}</p>
                    </div>
                  </div>
                  
                  {ride.approvalStatus === 'approved' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Approved by Department Head</p>
                        <p className="text-xs text-gray-500">{format(new Date(ride.updatedAt), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  )}

                  {ride.driver && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Driver Assigned</p>
                        <p className="text-xs text-gray-500">{(ride.driver as any).fullName}</p>
                      </div>
                    </div>
                  )}

                  {ride.startTime && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Trip Started</p>
                        <p className="text-xs text-gray-500">{format(new Date(ride.startTime), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  )}

                  {ride.endTime && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Trip Completed</p>
                        <p className="text-xs text-gray-500">{format(new Date(ride.endTime), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
