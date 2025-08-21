'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car,
  Users,
  MapPin,
  Route,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Navigation,
  Clock,
  Shield,
  UserCheck,
  Activity,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  X,
  Bell,
  RefreshCw,
  Info,
  Star
} from 'lucide-react'
import { Driver, User as UserType, Vehicle, Route as RouteType, Ride, Department, UserRole, Location } from '@/types'
import { format } from 'date-fns'
import { locationService } from '@/lib/location-service'
import LogoutButton from '@/components/LogoutButton'
import dynamic from 'next/dynamic'

// Dynamic import for LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routes, setRoutes] = useState<RouteType[]>([])
  const [rides, setRides] = useState<Ride[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [alerts, setAlerts] = useState<Array<{id: string, type: 'info' | 'warning' | 'error', message: string}>>([])
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{open: boolean, type: string, id: string, name: string}>({
    open: false,
    type: '',
    id: '',
    name: ''
  })
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalRoutes: 0,
    totalRides: 0,
    activeRides: 0,
    completedToday: 0,
    availableDrivers: 0
  })

  // Form states
  const [userForm, setUserForm] = useState({ email: '', fullName: '', department: '', role: '', contact: '', address: '' })
  const [driverForm, setDriverForm] = useState({ fullName: '', contact: '', email: '', nic: '', password: '', address: '' })
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', model: '', make: '', year: '', capacity: '' })
  const [routeForm, setRouteForm] = useState({ name: '', startAddress: '', endAddress: '', startLat: '', startLng: '', endLat: '', endLng: '' })
  
  // Map location states for route creation
  const [routeStartLocation, setRouteStartLocation] = useState<Location | null>(null)
  const [routeEndLocation, setRouteEndLocation] = useState<Location | null>(null)

  // Dialog states
  const [userDialog, setUserDialog] = useState(false)
  const [driverDialog, setDriverDialog] = useState(false)
  const [vehicleDialog, setVehicleDialog] = useState(false)
  const [routeDialog, setRouteDialog] = useState(false)
  const [assignDialog, setAssignDialog] = useState(false)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)

  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [editingRoute, setEditingRoute] = useState<RouteType | null>(null)
  
  // Assignment selection states
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  // Route editing state
  const [routeEditStartLocation, setRouteEditStartLocation] = useState<Location | null>(null)
  const [routeEditEndLocation, setRouteEditEndLocation] = useState<Location | null>(null)

  const departments: Department[] = ['mechanical', 'civil', 'electrical', 'HSEQ', 'HR']
  const roles: UserRole[] = ['user', 'department_head', 'project_manager', 'admin']

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/unauthorized')
        return
      }
      loadAllData()
      checkForAlerts()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session, router])

  const checkForAlerts = () => {
    const newAlerts = []
    
    // Check for low driver availability
    if (stats.availableDrivers < 2) {
      newAlerts.push({
        id: 'low-drivers',
        type: 'warning' as const,
        message: 'Low driver availability. Consider assigning more drivers.'
      })
    }
    
    // Check for pending rides
    const pendingRides = rides.filter(r => r.status === 'pending').length
    if (pendingRides > 5) {
      newAlerts.push({
        id: 'pending-rides',
        type: 'info' as const,
        message: `${pendingRides} rides pending approval.`
      })
    }
    
    setAlerts(newAlerts)
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [usersRes, driversRes, vehiclesRes, routesRes, ridesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/drivers'), 
        fetch('/api/admin/vehicles'),
        fetch('/api/admin/routes'),
        fetch('/api/admin/rides')
      ])

      const [usersData, driversData, vehiclesData, routesData, ridesData] = await Promise.all([
        usersRes.ok ? usersRes.json() : { users: [] },
        driversRes.ok ? driversRes.json() : { drivers: [] },
        vehiclesRes.ok ? vehiclesRes.json() : { vehicles: [] },
        routesRes.ok ? routesRes.json() : { routes: [] },
        ridesRes.ok ? ridesRes.json() : { rides: [] }
      ])

      setUsers(usersData.users || [])
      setDrivers(driversData.drivers || [])
      setVehicles(vehiclesData.vehicles || [])
      setRoutes(routesData.routes || [])
      setRides(ridesData.rides || [])

      // Calculate stats
      const activeRides = ridesData.rides?.filter((r: Ride) => ['approved', 'assigned', 'ongoing'].includes(r.status)).length || 0
      const completedToday = ridesData.rides?.filter((r: Ride) => 
        r.status === 'completed' && 
        new Date(r.updatedAt).toDateString() === new Date().toDateString()
      ).length || 0
      const availableDrivers = driversData.drivers?.filter((d: Driver) => d.status === 'available').length || 0

      setStats({
        totalUsers: usersData.users?.length || 0,
        totalDrivers: driversData.drivers?.length || 0,
        totalVehicles: vehiclesData.vehicles?.length || 0,
        totalRoutes: routesData.routes?.length || 0,
        totalRides: ridesData.rides?.length || 0,
        activeRides,
        completedToday,
        availableDrivers
      })

    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    toast.success('Dashboard refreshed')
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const confirmDelete = (type: string, id: string, name: string) => {
    setDeleteConfirmDialog({ open: true, type, id, name })
  }

  const handleConfirmedDelete = async () => {
    const { type, id } = deleteConfirmDialog
    
    switch(type) {
      case 'user':
        await handleDeleteUser(id)
        break
      case 'driver':
        await handleDeleteDriver(id)
        break
      case 'vehicle':
        await handleDeleteVehicle(id)
        break
    }
    
    setDeleteConfirmDialog({ open: false, type: '', id: '', name: '' })
  }

  // User management functions
  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        toast.success('User created successfully', {
          description: `${userForm.fullName} has been added to the system.`
        })
        setUserDialog(false)
        setUserForm({ email: '', fullName: '', department: '', role: '', contact: '', address: '' })
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to create user', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error creating user', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        toast.success('User updated successfully', {
          description: `${userForm.fullName}'s information has been updated.`
        })
        setUserDialog(false)
        setEditingUser(null)
        setUserForm({ email: '', fullName: '', department: '', role: '', contact: '', address: '' })
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to update user', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error updating user', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User deleted successfully', {
          description: 'The user has been removed from the system.'
        })
        loadAllData()
      } else {
        toast.error('Failed to delete user', {
          description: 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error deleting user', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  // Driver management functions
  const handleCreateDriver = async () => {
    try {
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm)
      })

      if (response.ok) {
        toast.success('Driver created successfully', {
          description: `${driverForm.fullName} has been added as a driver.`
        })
        setDriverDialog(false)
        setDriverForm({ fullName: '', contact: '', email: '', nic: '', password: '', address: '' })
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to create driver', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error creating driver', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const handleUpdateDriver = async () => {
    if (!editingDriver) return
    
    try {
      const response = await fetch(`/api/admin/drivers/${editingDriver._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverForm)
      })

      if (response.ok) {
        toast.success('Driver updated successfully', {
          description: `${driverForm.fullName}'s information has been updated.`
        })
        setDriverDialog(false)
        setEditingDriver(null)
        setDriverForm({ fullName: '', contact: '', email: '', nic: '', password: '', address: '' })
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to update driver', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error updating driver', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const handleDeleteDriver = async (driverId: string) => {
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Driver deleted successfully', {
          description: 'The driver has been removed from the system.'
        })
        loadAllData()
      } else {
        toast.error('Failed to delete driver', {
          description: 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error deleting driver', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  // Vehicle management functions
  const handleCreateVehicle = async () => {
    try {
      const response = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleForm,
          year: parseInt(vehicleForm.year),
          capacity: parseInt(vehicleForm.capacity)
        })
      })

      if (response.ok) {
        toast.success('Vehicle created successfully', {
          description: `Vehicle ${vehicleForm.vehicleNumber} has been added.`
        })
        setVehicleDialog(false)
        setVehicleForm({ vehicleNumber: '', model: '', make: '', year: '', capacity: '' })
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to create vehicle', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error creating vehicle', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const handleUpdateVehicle = async () => {
    if (!editingVehicle) return
    
    try {
      const response = await fetch(`/api/admin/vehicles/${editingVehicle._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleForm,
          year: parseInt(vehicleForm.year),
          capacity: parseInt(vehicleForm.capacity)
        })
      })

      if (response.ok) {
        toast.success('Vehicle updated successfully', {
          description: `Vehicle ${vehicleForm.vehicleNumber} has been updated.`
        })
        setVehicleDialog(false)
        setEditingVehicle(null)
        setVehicleForm({ vehicleNumber: '', model: '', make: '', year: '', capacity: '' })
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to update vehicle', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error updating vehicle', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Vehicle deleted successfully', {
          description: 'The vehicle has been removed from the system.'
        })
        loadAllData()
      } else {
        toast.error('Failed to delete vehicle', {
          description: 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error deleting vehicle', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  // Route management functions
  const handleRouteLocationSelect = (location: Location, type: 'start' | 'end') => {
    if (type === 'start') {
      setRouteStartLocation(location)
      setRouteForm(prev => ({
        ...prev,
        startAddress: location.address,
        startLat: location.latitude.toString(),
        startLng: location.longitude.toString()
      }))
    } else {
      setRouteEndLocation(location)
      setRouteForm(prev => ({
        ...prev,
        endAddress: location.address,
        endLat: location.latitude.toString(),
        endLng: location.longitude.toString()
      }))
    }
  }

  const handleCreateRoute = async () => {
    if (!routeForm.name.trim()) {
      toast.error('Route name is required')
      return
    }

    if (!routeStartLocation || !routeEndLocation) {
      toast.error('Please select both start and end locations on the map')
      return
    }

    try {
      // Calculate distance using our location service
      const distance = locationService.calculateDistance(routeStartLocation, routeEndLocation)

      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: routeForm.name,
          startLocation: routeStartLocation,
          endLocation: routeEndLocation,
          distance
        })
      })

      if (response.ok) {
        toast.success('Route created successfully', {
          description: `Route "${routeForm.name}" has been added. Distance: ${distance.toFixed(2)} km`
        })
        setRouteDialog(false)
        setRouteForm({ name: '', startAddress: '', endAddress: '', startLat: '', startLng: '', endLat: '', endLng: '' })
        setRouteStartLocation(null)
        setRouteEndLocation(null)
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to create route', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error creating route', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  // Route update and delete functions
  const handleUpdateRoute = async () => {
    if (!editingRoute) return

    if (!routeForm.name.trim()) {
      toast.error('Route name is required')
      return
    }

    const startLoc = routeEditStartLocation || {
      latitude: parseFloat(routeForm.startLat),
      longitude: parseFloat(routeForm.startLng),
      address: routeForm.startAddress
    }

    const endLoc = routeEditEndLocation || {
      latitude: parseFloat(routeForm.endLat),
      longitude: parseFloat(routeForm.endLng),
      address: routeForm.endAddress
    }

    try {
      const response = await fetch(`/api/admin/routes/${editingRoute._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: routeForm.name,
          startLocation: startLoc,
          endLocation: endLoc
        })
      })

      if (response.ok) {
        toast.success('Route updated successfully')
        setRouteDialog(false)
        setEditingRoute(null)
        setRouteForm({ name: '', startAddress: '', endAddress: '', startLat: '', startLng: '', endLat: '', endLng: '' })
        setRouteStartLocation(null)
        setRouteEndLocation(null)
        setRouteEditStartLocation(null)
        setRouteEditEndLocation(null)
        loadAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update route')
      }
    } catch (error) {
      toast.error('Error updating route')
    }
  }

  const handleDeleteRoute = async (routeId: string, routeName: string) => {
    if (!confirm(`Are you sure you want to delete the route "${routeName}"?`)) return

    try {
      const response = await fetch(`/api/admin/routes/${routeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Route deleted successfully')
        loadAllData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete route')
      }
    } catch (error) {
      toast.error('Error deleting route')
    }
  }

  const openEditRoute = (route: RouteType) => {
    setEditingRoute(route)
    setRouteForm({
      name: route.name,
      startAddress: route.startLocation.address,
      endAddress: route.endLocation.address,
      startLat: route.startLocation.latitude.toString(),
      startLng: route.startLocation.longitude.toString(),
      endLat: route.endLocation.latitude.toString(),
      endLng: route.endLocation.longitude.toString()
    })
    setRouteEditStartLocation(route.startLocation)
    setRouteEditEndLocation(route.endLocation)
    setRouteDialog(true)
  }

  const handleAssignRide = async (driverId: string, vehicleId: string) => {
    if (!selectedRide) return

    try {
      const response = await fetch(`/api/admin/rides/${selectedRide._id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, vehicleId })
      })

      if (response.ok) {
        toast.success('Ride assigned successfully', {
          description: 'Driver and vehicle have been assigned to the ride.'
        })
        setAssignDialog(false)
        setSelectedRide(null)
        setSelectedDriver(null)
        setSelectedVehicle(null)
        loadAllData()
      } else {
        const error = await response.json()
        toast.error('Failed to assign ride', {
          description: error.error || 'Please try again later.'
        })
      }
    } catch (error) {
      toast.error('Error assigning ride', {
        description: 'An unexpected error occurred.'
      })
    }
  }

  const openEditUser = (user: UserType) => {
    setEditingUser(user)
    setUserForm({
      email: user.email,
      fullName: user.fullName,
      department: user.department || '',
      role: user.role,
      contact: user.contact || '',
      address: user.address || ''
    })
    setUserDialog(true)
  }

  const openEditDriver = (driver: Driver) => {
    setEditingDriver(driver)
    setDriverForm({
      fullName: driver.fullName,
      contact: driver.contact,
      email: driver.email || '',
      nic: driver.nic,
      password: '',
      address: driver.address || ''
    })
    setDriverDialog(true)
  }

  const openEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber,
      model: vehicle.model,
      make: (vehicle as any).make || '',
      year: (vehicle as any).year?.toString() || '',
      capacity: vehicle.capacity.toString()
    })
    setVehicleDialog(true)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      assigned: 'bg-purple-100 text-purple-800 border-purple-200',
      ongoing: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      available: 'bg-green-100 text-green-800 border-green-200',
      busy: 'bg-orange-100 text-orange-800 border-orange-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">


      {/* Main loading container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Glass morphism card */}
        <div className="backdrop-blur-sm bg-white/70 rounded-2xl shadow-xl border border-white/20 p-8 text-center">
          {/* Logo/Brand area */}
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Admin Dashboard</h2>
            <p className="text-sm text-gray-500">Preparing your workspace</p>
          </div>

          {/* Enhanced loading spinner */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-purple-600 animate-spin"></div>
              {/* Inner pulse */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 animate-pulse"></div>
              {/* Center dot */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"></div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Loading components...</span>
              <span className="font-medium">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000 ease-out animate-pulse" 
                   style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Loading steps */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Authenticating user</span>
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Loading dashboard data</span>
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Initializing widgets</span>
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div className="flex items-center justify-between opacity-50">
              <span className="text-gray-400">Finalizing setup</span>
              <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Additional message */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This may take a few moments on first load
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 hidden sm:block">Manage your transportation system</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={refreshing}
                className="hidden sm:flex"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </div>
              
              <div className="hidden md:flex items-center space-x-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <Button  size="sm" onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-colors rounded-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b shadow-lg absolute top-[73px] left-0 right-0 z-30"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
                <LogoutButton />
              </div>
              
              {alerts.length > 0 && (
                <div className="space-y-2 pt-2">
                  {alerts.map(alert => (
                    <Alert key={alert.id} className="py-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map(alert => (
              <Alert key={alert.id} className={`border ${
                alert.type === 'error' ? 'border-red-200 bg-red-50' : 
                alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                'border-blue-200 bg-blue-50'
              }`}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {alert.type === 'error' ? 'Error' : alert.type === 'warning' ? 'Warning' : 'Information'}
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-amber-50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <span className="hidden sm:inline">Dashboard</span>
              <BarChart3 className="h-4 w-4 sm:hidden" />
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <UserCheck className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <Car className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Vehicles</span>
            </TabsTrigger>
            <TabsTrigger value="routes" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <Route className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Routes</span>
            </TabsTrigger>
            <TabsTrigger value="rides" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <Navigation className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Rides</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-amber-400 data-[state=active]:shadow-sm">
              <Activity className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tracking</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">Total Users</CardTitle>
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{stats.totalUsers}</div>
                    <p className="text-xs text-blue-700 mt-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Active platform users
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">Total Drivers</CardTitle>
                    <div className="p-2 bg-green-600 rounded-lg">
                      <UserCheck className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">{stats.totalDrivers}</div>
                    <p className="text-xs text-green-700 mt-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      {stats.availableDrivers} available now
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900">Total Vehicles</CardTitle>
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Car className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">{stats.totalVehicles}</div>
                    <p className="text-xs text-purple-700 mt-1">
                      <Activity className="h-3 w-3 inline mr-1" />
                      Fleet vehicles
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-900">Active Rides</CardTitle>
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <Activity className="h-4 w-4 text-white animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-900">{stats.activeRides}</div>
                    <p className="text-xs text-orange-700 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {stats.completedToday} completed today
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-10">
                <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Recent Rides
                      <Badge variant="secondary" className="font-normal">
                        Last 24 hours
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px] pr-4">
                      {rides.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                          <Navigation className="h-12 w-12 mb-3 text-gray-300" />
                          <p>No rides to display</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {rides.slice(0, 10).map((ride) => (
                            <motion.div
                              key={ride._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-3 rounded-lg border bg-white hover:shadow-sm transition-all duration-200"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{(ride.user as any)?.fullName || 'Unknown User'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {ride.startLocation.address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                  {format(new Date(ride.createdAt), 'HH:mm')}
                                </span>
                                <Badge className={`${getStatusColor(ride.status)} border`}>
                                  {ride.status}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-gray-600" />
                        Driver Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {drivers.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No drivers available</p>
                        ) : (
                          drivers.slice(0, 5).map((driver) => (
                            <div key={driver._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                                  {driver.fullName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-sm font-medium">{driver.fullName}</span>
                              </div>
                              <Badge className={`${getStatusColor(driver.status)} border text-xs`}>
                                {driver.status}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Route className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Total Routes</span>
                          </div>
                          <span className="font-semibold text-gray-900">{stats.totalRoutes}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Total Rides</span>
                          </div>
                          <span className="font-semibold text-gray-900">{stats.totalRides}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-600">Completed Today</span>
                          </div>
                          <span className="font-semibold text-green-600">{stats.completedToday}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">User Management</CardTitle>
                      <CardDescription>Manage system users and their permissions</CardDescription>
                    </div>
                    <Dialog open={userDialog} onOpenChange={setUserDialog}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingUser(null)
                          setUserForm({ email: '', fullName: '', department: '', role: '', contact: '', address: '' })
                        }} className="bg-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                          <DialogDescription>
                            {editingUser ? 'Update user information below' : 'Fill in the details to create a new user'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                                placeholder="user@company.com"
                                className="focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                value={userForm.fullName}
                                onChange={(e) => setUserForm({...userForm, fullName: e.target.value})}
                                placeholder="John Doe"
                                className="focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="department">Department</Label>
                              <Select value={userForm.department} onValueChange={(value) => setUserForm({...userForm, department: value})}>
                                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept.toUpperCase()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role">Role</Label>
                              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role.replace('_', ' ').toUpperCase()}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="contact">Contact</Label>
                              <Input
                                id="contact"
                                value={userForm.contact}
                                onChange={(e) => setUserForm({...userForm, contact: e.target.value})}
                                placeholder="Phone number"
                                className="focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Address</Label>
                              <Input
                                id="address"
                                value={userForm.address}
                                onChange={(e) => setUserForm({...userForm, address: e.target.value})}
                                placeholder="Address"
                                className="focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <Button onClick={editingUser ? handleUpdateUser : handleCreateUser} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                            {editingUser ? 'Update User' : 'Create User'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden md:table-cell">Contact</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">{user.fullName}</TableCell>
                              <TableCell className="text-gray-600">{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-gray-100">
                                  {user.department?.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-600">{user.contact}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openEditUser(user)}
                                    className="hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => confirmDelete('user', user._id, user.fullName)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Driver Management */}
          <TabsContent value="drivers">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">Driver Management</CardTitle>
                      <CardDescription>Manage drivers and their assignments</CardDescription>
                    </div>
                    <Dialog open={driverDialog} onOpenChange={setDriverDialog}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingDriver(null)
                          setDriverForm({ fullName: '', contact: '', email: '', nic: '', password: '', address: '' })
                        }} className="bg-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Driver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
                          <DialogDescription>
                            {editingDriver ? 'Update driver information below' : 'Fill in the details to register a new driver'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input
                                id="fullName"
                                value={driverForm.fullName}
                                onChange={(e) => setDriverForm({...driverForm, fullName: e.target.value})}
                                placeholder="Driver Name"
                                className="focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="contact">Contact</Label>
                              <Input
                                id="contact"
                                value={driverForm.contact}
                                onChange={(e) => setDriverForm({...driverForm, contact: e.target.value})}
                                placeholder="Phone number"
                                className="focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nic">NIC</Label>
                              <Input
                                id="nic"
                                value={driverForm.nic}
                                onChange={(e) => setDriverForm({...driverForm, nic: e.target.value})}
                                placeholder="National ID"
                                className="focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email (Optional)</Label>
                              <Input
                                id="email"
                                value={driverForm.email}
                                onChange={(e) => setDriverForm({...driverForm, email: e.target.value})}
                                placeholder="driver@company.com"
                                className="focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="password">Password</Label>
                              <Input
                                id="password"
                                type="password"
                                value={driverForm.password}
                                onChange={(e) => setDriverForm({...driverForm, password: e.target.value})}
                                placeholder={editingDriver ? "Leave blank to keep current" : "Password"}
                                className="focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Address (Optional)</Label>
                              <Input
                                id="address"
                                value={driverForm.address}
                                onChange={(e) => setDriverForm({...driverForm, address: e.target.value})}
                                placeholder="Address"
                                className="focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                          </div>
                          <Button onClick={editingDriver ? handleUpdateDriver : handleCreateDriver} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                            {editingDriver ? 'Update Driver' : 'Create Driver'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>NIC</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Total Distance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drivers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              No drivers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          drivers.map((driver) => (
                            <TableRow key={driver._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">{driver.fullName}</TableCell>
                              <TableCell className="text-gray-600">{driver.contact}</TableCell>
                              <TableCell className="text-gray-600">{driver.nic}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{driver.rating?.toFixed(1)}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(driver.status)} border`}>
                                  {driver.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-gray-600">
                                {driver.totalDistance?.toFixed(2)} km
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openEditDriver(driver)}
                                    className="hover:bg-amber-50 hover:text-amber-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => confirmDelete('driver', driver._id, driver.fullName)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Vehicle Management */}
          <TabsContent value="vehicles">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">Vehicle Management</CardTitle>
                      <CardDescription>Manage your fleet vehicles</CardDescription>
                    </div>
                    <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
                      <DialogTrigger asChild>
                        <Button onClick={() => {
                          setEditingVehicle(null)
                          setVehicleForm({ vehicleNumber: '', model: '', make: '', year: '', capacity: '' })
                        }} className="bg-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Vehicle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                          <DialogDescription>
                            {editingVehicle ? 'Update vehicle information below' : 'Fill in the details to add a new vehicle'}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                              <Input
                                id="vehicleNumber"
                                value={vehicleForm.vehicleNumber}
                                onChange={(e) => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value})}
                                placeholder="ABC-1234"
                                className="focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="make">Make</Label>
                              <Input
                                id="make"
                                value={vehicleForm.make}
                                onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                                placeholder="Toyota"
                                className="focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="model">Model</Label>
                              <Input
                                id="model"
                                value={vehicleForm.model}
                                onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                                placeholder="Hiace"
                                className="focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="year">Year</Label>
                              <Input
                                id="year"
                                type="number"
                                value={vehicleForm.year}
                                onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})}
                                placeholder="2020"
                                className="focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity</Label>
                            <Input
                              id="capacity"
                              type="number"
                              value={vehicleForm.capacity}
                              onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})}
                              placeholder="8"
                              className="focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <Button onClick={editingVehicle ? handleUpdateVehicle : handleCreateVehicle} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                            {editingVehicle ? 'Update Vehicle' : 'Create Vehicle'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Vehicle Number</TableHead>
                          <TableHead>Make & Model</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vehicles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              No vehicles found
                            </TableCell>
                          </TableRow>
                        ) : (
                          vehicles.map((vehicle) => (
                            <TableRow key={vehicle._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-mono font-medium">{vehicle.vehicleNumber}</TableCell>
                              <TableCell className="text-gray-600">
                                {(vehicle as any).make} {vehicle.model}
                              </TableCell>
                              <TableCell className="text-gray-600">{(vehicle as any).year}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                  {vehicle.capacity} seats
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(vehicle.status)} border`}>
                                  {vehicle.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openEditVehicle(vehicle)}
                                    className="hover:bg-purple-50 hover:text-purple-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => confirmDelete('vehicle', vehicle._id, vehicle.vehicleNumber)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Route Management */}
          <TabsContent value="routes">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl">Route Management</CardTitle>
                      <CardDescription>Manage transportation routes</CardDescription>
                    </div>
                    <Dialog open={routeDialog} onOpenChange={setRouteDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-primary"
                          onClick={() => {
                            setEditingRoute(null)
                            setRouteForm({ name: '', startAddress: '', endAddress: '', startLat: '', startLng: '', endLat: '', endLng: '' })
                            setRouteStartLocation(null)
                            setRouteEndLocation(null)
                            setRouteEditStartLocation(null)
                            setRouteEditEndLocation(null)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Route
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                      <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
                      <DialogDescription>{editingRoute ? 'Update the transportation route details' : 'Create a new transportation route using map selection'}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                      <div className="space-y-2">
                      <Label htmlFor="routeName">Route Name *</Label>
                      <Input
                      id="routeName"
                      value={routeForm.name}
                      onChange={(e) => setRouteForm({...routeForm, name: e.target.value})}
                      placeholder="e.g., Office to Airport, Colombo to Kandy"
                      className="focus:ring-2 focus:ring-indigo-500"
                      />
                      </div>
                      
                      {/* Selected Locations Display */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                      <Label className="text-green-600">Start Location</Label>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md min-h-[60px]">
                        <p className="text-sm">{routeStartLocation?.address || 'Select start location on map or search'}</p>
                      </div>
                      </div>
                        <div className="space-y-2">
                          <Label className="text-red-600">End Location</Label>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md min-h-[60px]">
                        <p className="text-sm">{routeEndLocation?.address || 'Select end location on map or search'}</p>
                      </div>
                      </div>
                      </div>

                      {/* Map for Location Selection */}
                      <div className="space-y-2">
                      <Label>Select Locations on Map</Label>
                      <LeafletMap 
                      onLocationSelect={handleRouteLocationSelect}
                        startLocation={routeStartLocation || undefined}
                        endLocation={routeEndLocation || undefined}
                      height="350px"
                      />
                      </div>

                      {/* Distance Preview */}
                      {routeStartLocation && routeEndLocation && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                      <strong>Estimated Distance:</strong> {locationService.calculateDistance(routeStartLocation, routeEndLocation).toFixed(2)} km
                      </p>
                      </div>
                      )}

                      <div className="flex space-x-2">
                      <Button 
                      onClick={editingRoute ? handleUpdateRoute : handleCreateRoute} 
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                      disabled={!routeForm.name.trim() || (!routeStartLocation && !routeEditStartLocation) || (!routeEndLocation && !routeEditEndLocation)}
                      >
                      {editingRoute ? 'Update Route' : 'Create Route'}
                      </Button>
                        <Button 
                          variant="outline" 
                        onClick={() => {
                        setRouteDialog(false)
                        setRouteForm({ name: '', startAddress: '', endAddress: '', startLat: '', startLng: '', endLat: '', endLng: '' })
                      setRouteStartLocation(null)
                      setRouteEndLocation(null)
                      }}
                      >
                      Cancel
                      </Button>
                      </div>
                      </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Route Name</TableHead>
                          <TableHead>Start Location</TableHead>
                          <TableHead>End Location</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              <Route className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              No routes found
                            </TableCell>
                          </TableRow>
                        ) : (
                          routes.map((route) => (
                            <TableRow key={route._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">{route.name}</TableCell>
                              <TableCell className="text-gray-600 max-w-[200px] truncate">
                                {route.startLocation.address}
                              </TableCell>
                              <TableCell className="text-gray-600 max-w-[200px] truncate">
                                {route.endLocation.address}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                                  {route.distance.toFixed(2)} km
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => window.open(`/admin/routes/${route._id}`, '_blank')}
                                    className="hover:bg-indigo-50 hover:text-indigo-600"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openEditRoute(route)}
                                    className="hover:bg-indigo-50 hover:text-indigo-600"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteRoute(route._id, route.name)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Rides Management */}
          <TabsContent value="rides">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <CardTitle className="text-2xl">Ride Management</CardTitle>
                  <CardDescription>View and manage all ride requests</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>User</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead className="hidden lg:table-cell">Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rides.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                              <Navigation className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                              No rides found
                            </TableCell>
                          </TableRow>
                        ) : (
                          rides.map((ride) => (
                            <TableRow key={ride._id} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="font-medium">
                                {(ride.user as any)?.fullName || 'Unknown'}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate text-gray-600" title={ride.startLocation.address}>
                                {ride.startLocation.address}
                              </TableCell>
                              <TableCell className="max-w-[150px] truncate text-gray-600" title={ride.endLocation.address}>
                                {ride.endLocation.address}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusColor(ride.status)} border`}>
                                  {ride.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {ride.driver ? (ride.driver as any).fullName : '-'}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {ride.vehicle ? (ride.vehicle as any).vehicleNumber : '-'}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-gray-600">
                                {format(new Date(ride.createdAt), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  {ride.status === 'approved' && !ride.driver && (
                                  <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                  setSelectedRide(ride)
                                  setSelectedDriver(null)
                                    setSelectedVehicle(null)
                                    setAssignDialog(true)
                                    }}
                                  className="border-green-600 text-green-600 hover:bg-green-50"
                                  >
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Assign
                                  </Button>
                                  )}
                                   {ride.status === 'ongoing' && (
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => window.open(`/ride/${ride._id}`, '_blank')}
                                       className="border-green-600 text-green-600 hover:bg-green-50"
                                     >
                                       <Activity className="h-4 w-4 mr-1" />
                                       Track Live
                                     </Button>
                                   )}
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => window.open(`/ride/${ride._id}`, '_blank')}
                                     className="hover:bg-blue-50 hover:text-blue-600"
                                   >
                                     <Eye className="h-4 w-4" />
                                   </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Assign Ride Dialog */}
              <Dialog open={assignDialog} onOpenChange={setAssignDialog}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Assign Driver and Vehicle</DialogTitle>
                    {selectedRide && (
                      <DialogDescription>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p><strong>Passenger:</strong> {(selectedRide.user as any)?.fullName}</p>
                          <p><strong>Route:</strong> {selectedRide.startLocation.address} → {selectedRide.endLocation.address}</p>
                          <p><strong>Distance:</strong> {selectedRide.distance?.toFixed(2)} km</p>
                        </div>
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Available Drivers */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Available Drivers ({drivers.filter(d => d.status === 'available').length})</Label>
                      <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto border rounded-lg p-2">
                        {drivers.filter(d => d.status === 'available').map((driver) => (
                          <div 
                            key={driver._id} 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedDriver?._id === driver._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedDriver(driver)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{driver.fullName}</p>
                                <p className="text-sm text-gray-600">{driver.contact}</p>
                                <div className="flex items-center space-x-1 mt-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs">{(driver.rating || 0).toFixed(1)}</span>
                                  <span className="text-xs text-gray-500">({(driver as any).ratingCount || 0} rides)</span>
                                  <span className="text-xs text-gray-500 ml-2">{(driver.totalDistance || 0).toFixed(0)} km total</span>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {drivers.filter(d => d.status === 'available').length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>No available drivers</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Available Vehicles */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Available Vehicles ({vehicles.filter(v => v.status === 'available').length})</Label>
                      <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto border rounded-lg p-2">
                        {vehicles.filter(v => v.status === 'available').map((vehicle) => (
                          <div 
                            key={vehicle._id} 
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                              selectedVehicle?._id === vehicle._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedVehicle(vehicle)}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{vehicle.vehicleNumber}</p>
                                <p className="text-sm text-gray-600">{(vehicle as any).make} {vehicle.model} ({(vehicle as any).year})</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-gray-500">Capacity: {vehicle.capacity} passengers</span>
                                  <span className="text-xs text-gray-500">{(vehicle as any).totalDistance?.toFixed(0) || 0} km total</span>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {vehicles.filter(v => v.status === 'available').length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Car className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>No available vehicles</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignment Summary */}
                    {(selectedDriver || selectedVehicle) && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="font-medium text-blue-800 mb-2">Assignment Summary:</p>
                        <div className="text-sm space-y-1">
                          {selectedDriver && (
                            <p><strong>Driver:</strong> {selectedDriver.fullName} (⭐ {(selectedDriver.rating || 0).toFixed(1)}) - {selectedDriver.contact}</p>
                          )}
                          {selectedVehicle && (
                            <p><strong>Vehicle:</strong> {selectedVehicle.vehicleNumber} - {(selectedVehicle as any).make} {selectedVehicle.model} ({selectedVehicle.capacity} seats)</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => {
                          if (selectedDriver && selectedVehicle) {
                            handleAssignRide(selectedDriver._id, selectedVehicle._id)
                          } else {
                            toast.error('Please select both a driver and vehicle')
                          }
                        }}
                        disabled={!selectedDriver || !selectedVehicle}
                        className="flex-1"
                      >
                        Assign Ride
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setAssignDialog(false)
                          setSelectedRide(null)
                          setSelectedDriver(null)
                          setSelectedVehicle(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          </TabsContent>

          {/* Live Tracking */}
          <TabsContent value="tracking">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                  <CardTitle className="text-2xl">Live Tracking</CardTitle>
                  <CardDescription>Real-time tracking of active rides and drivers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-600" />
                          Active Rides
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ScrollArea className="h-[400px]">
                          {rides.filter(r => r.status === 'ongoing').length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
                              <Navigation className="h-12 w-12 mb-3 text-gray-300" />
                              <p>No active rides</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {rides.filter(r => r.status === 'ongoing').map((ride) => (
                                <motion.div
                                  key={ride._id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <p className="font-medium text-gray-900">{(ride.user as any)?.fullName}</p>
                                      <p className="text-sm text-gray-600">{(ride.driver as any)?.fullName}</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 border-green-200 animate-pulse">
                                      Ongoing
                                    </Badge>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                      <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                                      <span className="text-gray-700 flex-1">{ride.startLocation.address}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <Navigation className="h-4 w-4 text-red-600 mt-0.5" />
                                      <span className="text-gray-700 flex-1">{ride.endLocation.address}</span>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                                    <span className="text-gray-500">
                                      Started: {ride.startTime ? format(new Date(ride.startTime), 'HH:mm') : 'Not started'}
                                    </span>
                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                      Track
                                    </Button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                          Driver Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ScrollArea className="h-[400px]">
                          {drivers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
                              <UserCheck className="h-12 w-12 mb-3 text-gray-300" />
                              <p>No drivers available</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {drivers.map((driver) => (
                                <motion.div
                                  key={driver._id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                      driver.status === 'available' ? 'bg-green-100 text-green-700' :
                                      driver.status === 'busy' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {driver.fullName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{driver.fullName}</p>
                                      <p className="text-sm text-gray-600">{driver.contact}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge className={`${getStatusColor(driver.status)} border`}>
                                      {driver.status}
                                    </Badge>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span className="text-xs text-gray-600">{driver.rating?.toFixed(1)}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog({...deleteConfirmDialog, open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmDialog.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmDialog({open: false, type: '', id: '', name: ''})}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmedDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}