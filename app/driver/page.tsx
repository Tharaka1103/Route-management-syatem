'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Car,
  MapPin,
  Navigation,
  Star,
  Clock,
  BarChart3,
  User,
  Phone,
  LogOut,
  Play,
  Square,
  CheckCircle,
  Activity,
  Route,
  Calendar,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react'
import { Driver as DriverType, Ride, DailyRoute, Route as RouteType } from '@/types'
import { format } from 'date-fns'
import LogoutButton from '@/components/LogoutButton'

export default function DriverDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [driverProfile, setDriverProfile] = useState<DriverType | null>(null)
  const [assignedRides, setAssignedRides] = useState<Ride[]>([])
  const [rideHistory, setRideHistory] = useState<Ride[]>([])
  const [dailyRoutes, setDailyRoutes] = useState<DailyRoute[]>([])
  const [availableRoutes, setAvailableRoutes] = useState<RouteType[]>([])
  
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null)
  const [dailyRouteDialog, setDailyRouteDialog] = useState(false)
  const [profileDialog, setProfileDialog] = useState(false)
  const [editProfile, setEditProfile] = useState(false)

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    contact: '',
    email: '',
    address: ''
  })

  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    totalDistance: 0,
    averageRating: 0,
    todayEarnings: 0,
    monthlyEarnings: 0
  })

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'driver') {
        router.push('/unauthorized')
        return
      }
      loadDriverData()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session, router])

  const loadDriverData = async () => {
    try {
      setLoading(true)
      const [profileRes, ridesRes, dailyRoutesRes, routesRes] = await Promise.all([
        fetch('/api/driver/profile'),
        fetch('/api/driver/rides'),
        fetch('/api/driver/daily-routes'),
        fetch('/api/routes')
      ])

      const [profileData, ridesData, dailyRoutesData, routesData] = await Promise.all([
        profileRes.ok ? profileRes.json() : { driver: null },
        ridesRes.ok ? ridesRes.json() : { assigned: [], history: [] },
        dailyRoutesRes.ok ? dailyRoutesRes.json() : { dailyRoutes: [] },
        routesRes.ok ? routesRes.json() : { routes: [] }
      ])

      setDriverProfile(profileData.driver)
      setAssignedRides(ridesData.assigned || [])
      setRideHistory(ridesData.history || [])
      setDailyRoutes(dailyRoutesData.dailyRoutes || [])
      setAvailableRoutes(routesData.routes || [])

      if (profileData.driver) {
        setProfileForm({
          fullName: profileData.driver.fullName || '',
          contact: profileData.driver.contact || '',
          email: profileData.driver.email || '',
          address: profileData.driver.address || ''
        })

        // Calculate stats
        const completedRides = ridesData.history?.filter((r: Ride) => r.status === 'completed') || []
        const totalDist = completedRides.reduce((sum: number, r: Ride) => sum + (r.distance || 0), 0)
        const avgRating = completedRides.length > 0 ? 
          completedRides.reduce((sum: number, r: Ride) => sum + (r.rating || 0), 0) / completedRides.length : 0

        setStats({
          totalRides: (ridesData.assigned?.length || 0) + (ridesData.history?.length || 0),
          completedRides: completedRides.length,
          totalDistance: profileData.driver.totalDistance || 0,
          averageRating: profileData.driver.rating || 0,
          todayEarnings: Math.floor(Math.random() * 5000) + 2000, // Mock data
          monthlyEarnings: Math.floor(Math.random() * 50000) + 20000 // Mock data
        })
      }

    } catch (error) {
      console.error('Error loading driver data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleStartRide = async (rideId: string) => {
    try {
      const response = await fetch(`/api/driver/rides/${rideId}/start`, {
        method: 'PATCH'
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Ride started successfully!')
        // Redirect to real-time tracking page
        window.open(`/ride/${rideId}`, '_blank')
        loadDriverData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start ride')
      }
    } catch (error) {
      toast.error('Error starting ride')
    }
  }

  const handleCompleteRide = async (rideId: string) => {
    try {
      const response = await fetch(`/api/driver/rides/${rideId}/complete`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success('Ride completed successfully!')
        loadDriverData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to complete ride')
      }
    } catch (error) {
      toast.error('Error completing ride')
    }
  }

  const handleStartDailyRoute = async () => {
    if (!selectedRoute) return

    try {
      const response = await fetch('/api/driver/daily-routes/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId: selectedRoute._id })
      })

      if (response.ok) {
        toast.success('Daily route started successfully!')
        setDailyRouteDialog(false)
        setSelectedRoute(null)
        loadDriverData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to start daily route')
      }
    } catch (error) {
      toast.error('Error starting daily route')
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('/api/driver/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setEditProfile(false)
        loadDriverData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Error updating profile')
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      assigned: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      available: 'bg-green-100 text-green-800',
      busy: 'bg-orange-100 text-orange-800',
      offline: 'bg-red-100 text-red-800'
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Car className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {driverProfile?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getStatusColor(driverProfile?.status || 'offline')}>
                {driverProfile?.status?.toUpperCase()}
              </Badge>
              <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Driver Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!editProfile ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <Label>Full Name</Label>
                            <p className="text-sm font-medium">{driverProfile?.fullName}</p>
                          </div>
                          <div>
                            <Label>Contact</Label>
                            <p className="text-sm font-medium">{driverProfile?.contact}</p>
                          </div>
                          <div>
                            <Label>NIC</Label>
                            <p className="text-sm font-medium">{driverProfile?.nic}</p>
                          </div>
                          {driverProfile?.email && (
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm font-medium">{driverProfile.email}</p>
                            </div>
                          )}
                          {driverProfile?.address && (
                            <div>
                              <Label>Address</Label>
                              <p className="text-sm font-medium">{driverProfile.address}</p>
                            </div>
                          )}
                          <div>
                            <Label>Rating</Label>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{driverProfile?.rating?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => setEditProfile(true)} className="w-full">
                          Edit Profile
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              value={profileForm.fullName}
                              onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contact">Contact</Label>
                            <Input
                              id="contact"
                              value={profileForm.contact}
                              onChange={(e) => setProfileForm({...profileForm, contact: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              value={profileForm.address}
                              onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleUpdateProfile} className="flex-1">
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditProfile(false)}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Access to Ongoing Rides */}
        {assignedRides.filter(r => r.status === 'ongoing').length > 0 && (
          <div className="mb-6">
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-1">
                      You have {assignedRides.filter(r => r.status === 'ongoing').length} ongoing trip{assignedRides.filter(r => r.status === 'ongoing').length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-sm text-green-600">Track your current rides in real-time</p>
                  </div>
                  <div className="flex space-x-2">
                    {assignedRides.filter(r => r.status === 'ongoing').slice(0, 2).map((ride) => (
                      <Button 
                        key={ride._id}
                        onClick={() => router.push(`/ride/${ride._id}`)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Track Live
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* New Rides Alert */}
        {assignedRides.filter(r => r.status === 'assigned').length > 0 && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-800 mb-1">
                      You have {assignedRides.filter(r => r.status === 'assigned').length} new ride assignment{assignedRides.filter(r => r.status === 'assigned').length > 1 ? 's' : ''}!
                    </h3>
                    <p className="text-sm text-orange-600">Ready to start your next ride</p>
                  </div>
                  <div className="flex space-x-2">
                    {assignedRides.filter(r => r.status === 'assigned').slice(0, 2).map((ride) => (
                      <Button 
                        key={ride._id}
                        onClick={() => handleStartRide(ride._id)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Ride
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rides</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRides}</p>
                </div>
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedRides}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalDistance.toFixed(0)} km</p>
                </div>
                <Navigation className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rides" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rides">Assigned Rides</TabsTrigger>
            <TabsTrigger value="daily-routes">Daily Routes</TabsTrigger>
            <TabsTrigger value="history">Ride History</TabsTrigger>
          </TabsList>

          {/* Assigned Rides */}
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Assigned Rides
                  </div>
                  {assignedRides.length > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {assignedRides.length} assigned
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Your currently assigned rides</CardDescription>
              </CardHeader>
              <CardContent>
                {assignedRides.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No assigned rides at the moment</p>
                    <p className="text-sm text-gray-400">New ride assignments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedRides.map((ride) => (
                      <div key={ride._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium">{(ride.user as any)?.fullName}</p>
                              {ride.status === 'ongoing' && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{(ride.user as any)?.contact}</p>
                            <p className="text-xs text-gray-500">Requested: {format(new Date(ride.createdAt), 'MMM dd, HH:mm')}</p>
                          </div>
                          <Badge className={getStatusColor(ride.status)}>
                            {ride.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Pickup Location</p>
                              <p className="text-sm font-medium">{ride.startLocation.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Navigation className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">Destination</p>
                              <p className="text-sm font-medium">{ride.endLocation.address}</p>
                            </div>
                          </div>
                        </div>

                        {ride.vehicle && (
                          <div className="bg-blue-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium">{(ride.vehicle as any).vehicleNumber}</p>
                                <p className="text-xs text-gray-600">{(ride.vehicle as any).model} - {(ride.vehicle as any).capacity} seats</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {ride.status === 'assigned' && (
                            <Button 
                              onClick={() => handleStartRide(ride._id)}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start Ride
                            </Button>
                          )}
                          {ride.status === 'ongoing' && (
                            <>
                              <Button 
                                onClick={() => router.push(`/ride/${ride._id}`)}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Track Live
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => handleCompleteRide(ride._id)}
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if ((ride.user as any).contact) {
                                window.open(`tel:${(ride.user as any).contact}`, '_self')
                              }
                            }}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>

                        {ride.distance && (
                          <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
                            <span>Distance: {ride.distance.toFixed(2)} km</span>
                            {ride.startTime && (
                              <span>Started: {format(new Date(ride.startTime), 'HH:mm')}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Routes */}
          <TabsContent value="daily-routes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Start Daily Route</CardTitle>
                    <Dialog open={dailyRouteDialog} onOpenChange={setDailyRouteDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Route className="h-4 w-4 mr-2" />
                          Start Route
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select Daily Route</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {availableRoutes.map((route) => (
                            <div
                              key={route._id}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedRoute?._id === route._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedRoute(route)}
                            >
                              <div className="font-medium">{route.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {route.startLocation.address} → {route.endLocation.address}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Distance: {route.distance.toFixed(2)} km
                              </div>
                            </div>
                          ))}
                          <Button 
                            onClick={handleStartDailyRoute} 
                            disabled={!selectedRoute}
                            className="w-full"
                          >
                            Start Selected Route
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Select and start your daily route</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Today's Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {dailyRoutes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No daily routes started today</p>
                    ) : (
                      <div className="space-y-3">
                        {dailyRoutes.map((dailyRoute) => (
                          <div key={dailyRoute._id} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{(dailyRoute.route as any)?.name}</p>
                                <p className="text-sm text-gray-600">
                                  Started: {format(new Date(dailyRoute.startTime), 'HH:mm')}
                                </p>
                                {dailyRoute.endTime && (
                                  <p className="text-sm text-gray-600">
                                    Ended: {format(new Date(dailyRoute.endTime), 'HH:mm')}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Distance: {dailyRoute.distance.toFixed(2)} km
                                </p>
                              </div>
                              <Badge className={getStatusColor(dailyRoute.status)}>
                                {dailyRoute.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ride History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Ride History</CardTitle>
                <CardDescription>Your completed rides</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {rideHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No ride history available</p>
                  ) : (
                    <div className="space-y-4">
                      {rideHistory.map((ride) => (
                        <div key={ride._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{(ride.user as any)?.fullName}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(ride.createdAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status}
                            </Badge>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                              <span className="text-sm">{ride.startLocation.address}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Navigation className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                              <span className="text-sm">{ride.endLocation.address}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Distance: {ride.distance?.toFixed(2) || 0} km</span>
                            {ride.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{ride.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
