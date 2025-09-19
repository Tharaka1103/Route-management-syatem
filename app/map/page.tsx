'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, 
  Truck, 
  Clock, 
  RefreshCw, 
  Search, 
  Grid3X3, 
  List, 
  Eye,
  Activity,
  Signal,
  Gauge,
  Navigation,
  Settings,
  Phone,
  Calendar,
  Zap,
  CheckCircle,
  AlertCircle,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Map,
  X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';

interface Device {
  _id: string;
  terminalId: string;
  vehicle: string;
  vehicleType: string;
  status: string;
  latitude: string;
  longitude: string;
  speed: number;
  lastMessage: string;
  expire: string;
  phone?: string;
  speedLimit?: number;
}

type ViewMode = 'list' | 'grid';

export default function MapPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterDevices();
  }, [devices, searchQuery, statusFilter]);

  const fetchDevices = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
        toast.success('Vehicle data updated successfully');
      } else {
        toast.error('Failed to fetch vehicle data');
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      toast.error('Network error while fetching data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterDevices = () => {
    let filtered = devices;

    if (searchQuery) {
      filtered = filtered.filter(device =>
        device.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.terminalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    setFilteredDevices(filtered);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      online: {
        color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300',
        icon: CheckCircle,
        pulse: true
      },
      offline: {
        color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300',
        icon: AlertCircle,
        pulse: false
      },
      idle: {
        color: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        pulse: true
      }
    };
    return configs[status as keyof typeof configs] || configs.offline;
  };

  const getVehicleIcon = (vehicleType: string) => {
    const icons = {
      truck: '🚛',
      car: '🚗',
      van: '🚐',
      bike: '🏍️',
      bus: '🚌'
    };
    return icons[vehicleType.toLowerCase() as keyof typeof icons] || '🚙';
  };

  const getSpeedStatus = (speed: number) => {
    if (speed === 0) return { color: 'text-gray-500', status: 'Stopped', bgColor: 'bg-gray-100' };
    if (speed < 30) return { color: 'text-green-600', status: 'Slow', bgColor: 'bg-green-100' };
    if (speed < 60) return { color: 'text-yellow-600', status: 'Moderate', bgColor: 'bg-yellow-100' };
    return { color: 'text-red-600', status: 'Fast', bgColor: 'bg-red-100' };
  };

  // Vehicle Details Dialog Component
  const VehicleDetailsDialog = ({ device }: { device: Device }) => {
    const statusConfig = getStatusConfig(device.status);
    const StatusIcon = statusConfig.icon;
    const speedStatus = getSpeedStatus(device.speed);

    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <span className="text-3xl">{getVehicleIcon(device.vehicleType)}</span>
            <div>
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                {device.vehicle}
              </span>
              <p className="text-sm text-gray-500 font-normal">
                {device.vehicleType.charAt(0).toUpperCase() + device.vehicleType.slice(1)} Vehicle
              </p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive vehicle information and real-time tracking data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Status Overview */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Live Status</h3>
                <Badge className={`${statusConfig.color} border text-sm px-3 py-1 ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {device.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`text-center p-4 ${speedStatus.bgColor} rounded-xl`}>
                  <Gauge className={`w-8 h-8 ${speedStatus.color} mx-auto mb-2`} />
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Speed</p>
                  <p className={`text-xl font-bold ${speedStatus.color}`}>{device.speed}</p>
                  <p className="text-xs text-gray-500">km/h • {speedStatus.status}</p>
                </div>
                
                <div className="text-center p-4 bg-green-100 rounded-xl">
                  <Signal className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Signal</p>
                  <p className="text-xl font-bold text-green-600">Strong</p>
                  <p className="text-xs text-gray-500">GPS Active</p>
                </div>
                
                <div className="text-center p-4 bg-purple-100 rounded-xl">
                  <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Activity</p>
                  <p className="text-xl font-bold text-purple-600">
                    {device.speed > 0 ? 'Moving' : 'Parked'}
                  </p>
                  <p className="text-xs text-gray-500">Real-time</p>
                </div>
                
                <div className="text-center p-4 bg-orange-100 rounded-xl">
                  <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Engine</p>
                  <p className="text-xl font-bold text-orange-600">
                    {device.status === 'online' ? 'ON' : 'OFF'}
                  </p>
                  <p className="text-xs text-gray-500">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Vehicle ID</p>
                      <p className="text-sm text-gray-600">{device.vehicle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Navigation className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Terminal ID</p>
                      <p className="text-sm text-gray-600 font-mono">{device.terminalId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Activity className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Vehicle Type</p>
                      <p className="text-sm text-gray-600 capitalize">{device.vehicleType}</p>
                    </div>
                  </div>
                  
                  {device.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contact</p>
                        <p className="text-sm text-gray-600">{device.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" />
                  Location Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Latitude</p>
                        <p className="text-lg font-mono text-blue-600">{device.latitude}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Longitude</p>
                        <p className="text-lg font-mono text-blue-600">{device.longitude}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Update</p>
                      <p className="text-sm text-gray-600">{new Date(device.lastMessage).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {device.expire && (
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <Calendar className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Service Expires</p>
                        <p className="text-sm text-yellow-600">{new Date(device.expire).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    );
  };

  // Real-time Map Dialog Component
  const MapViewDialog = () => {
    return (
      <DialogContent className="max-w-6xl max-h-[90vh] w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Map className="w-6 h-6 text-blue-600" />
            Real-Time Fleet Map
          </DialogTitle>
          <DialogDescription>
            Interactive map showing live vehicle positions and tracking data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Map Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-700 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                {devices.filter(d => d.status === 'online').length} Online
              </Badge>
              <Badge variant="outline" className="text-red-700 border-red-300">
                <AlertCircle className="w-3 h-3 mr-1" />
                {devices.filter(d => d.status === 'offline').length} Offline
              </Badge>
              <Badge variant="outline" className="text-purple-700 border-purple-300">
                <Activity className="w-3 h-3 mr-1" />
                {devices.filter(d => d.speed > 0).length} Moving
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="h-[60vh] bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 rounded-lg flex items-center justify-center relative border-2 border-dashed border-gray-300">
            <div className="text-center max-w-lg px-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <MapPin className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">Interactive Fleet Map</h3>
              <p className="text-gray-600 text-base leading-relaxed mb-6">
                Real-time Google Maps integration displaying live vehicle positions, 
                routes, geofences, and comprehensive tracking analytics with clustering 
                and custom markers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border">
                  <h4 className="font-semibold text-gray-700 mb-2">Live Tracking</h4>
                  <p className="text-xs text-gray-600">
                    Real-time vehicle positions with automatic updates every 30 seconds
                  </p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border">
                  <h4 className="font-semibold text-gray-700 mb-2">Advanced Features</h4>
                  <p className="text-xs text-gray-600">
                    Route history, geofencing, speed monitoring, and custom overlays
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Online Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Offline Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Idle Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Moving Vehicles</span>
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const movingDevices = devices.filter(d => d.speed > 0).length;
  const averageSpeed = devices.length > 0 
    ? (devices.reduce((sum, d) => sum + d.speed, 0) / devices.length).toFixed(1)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Live Vehicle Tracking
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Real-time fleet monitoring with interactive map visualization</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Badge 
              variant="outline" 
              className="text-base sm:text-lg px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {onlineDevices} Online
            </Badge>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="default" 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Map className="w-4 h-4" />
                    <span className="hidden sm:inline">Real-Time Map</span>
                    <span className="sm:hidden">Map</span>
                  </Button>
                </DialogTrigger>
                <MapViewDialog />
              </Dialog>
              <Button 
                variant="outline" 
                onClick={fetchDevices}
                disabled={refreshing}
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Fleet</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{devices.length}</p>
                  <p className="text-xs text-gray-500">Vehicles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Online</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{onlineDevices}</p>
                  <p className="text-xs text-gray-500">Active now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Moving</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{movingDevices}</p>
                  <p className="text-xs text-gray-500">In transit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Speed</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{averageSpeed}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search vehicles by ID, type, or terminal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({devices.length})
                </Button>
                <Button
                  variant={statusFilter === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('online')}
                  className="text-green-600 hover:text-green-700"
                >
                  Online ({onlineDevices})
                </Button>
                <Button
                  variant={statusFilter === 'offline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('offline')}
                  className="text-red-600 hover:text-red-700"
                >
                  Offline ({offlineDevices})
                </Button>
                <Button
                  variant={statusFilter === 'idle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('idle')}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  Idle ({devices.filter(d => d.status === 'idle').length})
                </Button>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {filteredDevices.length} of {devices.length} vehicles
                </span>
                <span>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Available Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-4 sm:p-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters' 
                    : 'No vehicles are currently available'
                  }
                </p>
              </div>
            ) : (
              <div className={`p-4 sm:p-6 ${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                  : 'space-y-3'
              }`}>
                {filteredDevices.map((device, index) => {
                  const statusConfig = getStatusConfig(device.status);
                  const speedStatus = getSpeedStatus(device.speed);
                  
                  return (
                    <Dialog key={device._id}>
                      <DialogTrigger asChild>
                        <div
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-all duration-300 border rounded-lg hover:shadow-md animate-fade-in-up ${
                            viewMode === 'grid' ? 'border-gray-200' : 'border-l-4 border-l-transparent hover:border-l-blue-500'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-lg sm:text-xl">{getVehicleIcon(device.vehicleType)}</span>
                              </div>
                              <div>
                                <p className="font-semibold text-sm sm:text-base text-gray-900">{device.vehicle}</p>
                                <p className="text-xs text-gray-500 capitalize">{device.vehicleType}</p>
                              </div>
                            </div>
                            <Badge className={`${statusConfig.color} text-xs border ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                              {device.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="font-mono">
                                {parseFloat(device.latitude).toFixed(3)}, {parseFloat(device.longitude).toFixed(3)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs">
                                <Gauge className="w-3 h-3 text-gray-500" />
                                <span className={speedStatus.color}>
                                  {device.speed} km/h
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(device.lastMessage).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <VehicleDetailsDialog device={device} />
                    </Dialog>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}