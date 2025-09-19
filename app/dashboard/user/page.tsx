'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus, Clock, CheckCircle, AlertCircle, Car, TrendingUp, Calendar, Route, Loader2, Navigation, Calculator } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import LocationSearchInput from '@/components/LocationSearchInput';

interface Ride {
  _id: string;
  status: string;
  distanceKm: number;
  startLocation: { address: string; lat?: number; lng?: number };
  endLocation: { address: string; lat?: number; lng?: number };
  createdAt: string;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
  display_name?: string;
}

export default function UserDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState<number | null>(null);

  useEffect(() => {
    fetchRides();
  }, []);

  // Calculate distance when both locations are selected
  useEffect(() => {
    if (startLocation && endLocation) {
      const distance = calculateDistance(
        startLocation.lat,
        startLocation.lng,
        endLocation.lat,
        endLocation.lng
      );
      setEstimatedDistance(distance);
    } else {
      setEstimatedDistance(null);
    }
  }, [startLocation, endLocation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const fetchRides = async () => {
    try {
      const response = await fetch('/api/rides');
      if (response.ok) {
        const data = await response.json();
        setRides(data);
      } else {
        toast.error('Failed to fetch rides');
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      toast.error('Network error while fetching rides');
    } finally {
      setLoading(false);
    }
  };

  const createRide = async () => {
    if (!startLocation || !endLocation) {
      toast.error('Please select both pickup and destination locations');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLocation: {
            lat: startLocation.lat,
            lng: startLocation.lng,
            address: startLocation.address,
          },
          endLocation: {
            lat: endLocation.lat,
            lng: endLocation.lng,
            address: endLocation.address,
          },
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        fetchRides();
        toast.success('Ride request created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create ride');
      }
    } catch (error) {
      console.error('Failed to create ride:', error);
      toast.error('Failed to create ride. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setStartLocation(null);
    setEndLocation(null);
    setStartInput('');
    setEndInput('');
    setEstimatedDistance(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300', 
        icon: Clock,
        animate: 'animate-pulse' 
      },
      awaiting_pm: { 
        color: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300', 
        icon: AlertCircle,
        animate: 'animate-bounce' 
      },
      awaiting_admin: { 
        color: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300', 
        icon: AlertCircle,
        animate: 'animate-pulse' 
      },
      approved: { 
        color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300', 
        icon: CheckCircle,
        animate: '' 
      },
      in_progress: { 
        color: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300', 
        icon: Car,
        animate: 'animate-pulse' 
      },
      completed: { 
        color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300', 
        icon: CheckCircle,
        animate: '' 
      },
      rejected: { 
        color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300', 
        icon: AlertCircle,
        animate: '' 
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} ${config.animate} border transition-all duration-300 hover:scale-105`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: 'Your ride request is being processed',
      awaiting_pm: 'Waiting for Project Manager approval (long distance)',
      awaiting_admin: 'Waiting for Admin approval',
      approved: 'Approved - Driver will be assigned soon',
      in_progress: 'Your ride is currently in progress',
      completed: 'Ride completed successfully',
      rejected: 'Ride request was rejected',
    };
    
    return descriptions[status as keyof typeof descriptions] || 'Status unknown';
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, gradient, delay }: any) => (
    <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-500 hover:-translate-y-1 animate-fade-in-up`} 
          style={{ animationDelay: `${delay}ms` }}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Rides
            </h1>
            <p className="text-gray-600">Manage your ride requests and track their status in real-time</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Request New Ride
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Request New Ride
                </DialogTitle>
                <DialogDescription>
                  Search and select your pickup and destination locations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <LocationSearchInput
                  label="Pickup Location"
                  placeholder="Search for pickup location (e.g., Colombo Fort, Kandy City Center)"
                  onLocationSelect={setStartLocation}
                  selectedLocation={startLocation}
                  iconColor="#10b981"
                  value={startInput}
                  onChange={setStartInput}
                />
                
                <LocationSearchInput
                  label="Destination"
                  placeholder="Search for destination (e.g., Airport, Galle Face)"
                  onLocationSelect={setEndLocation}
                  selectedLocation={endLocation}
                  iconColor="#ef4444"
                  value={endInput}
                  onChange={setEndInput}
                />
                
                {/* Distance Estimation */}
                {estimatedDistance && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Trip Estimation</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-600">Distance</p>
                        <p className="text-xl font-bold text-blue-600">{estimatedDistance} km</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-600">Approval Type</p>
                        <p className={`text-sm font-medium ${estimatedDistance > 25 ? 'text-orange-600' : 'text-green-600'}`}>
                          {estimatedDistance > 25 ? 'Project Manager' : 'Admin'}
                        </p>
                      </div>
                    </div>
                    {estimatedDistance > 25 && (
                      <div className="mt-3 p-2 bg-orange-100 rounded text-center">
                        <p className="text-xs text-orange-700">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Long distance rides require Project Manager approval
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {startLocation && endLocation && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Route className="w-4 h-4" />
                      Route Summary
                    </h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p><strong>From:</strong> {startLocation.address}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p><strong>To:</strong> {endLocation.address}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={createRide} 
                  className="w-full bg-blue-500 transition-all duration-300" 
                  disabled={creating || !startLocation || !endLocation}
                  size="lg"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Ride Request...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Ride Request
                      {estimatedDistance && (
                        <span className="ml-2 text-xs opacity-75">
                          ({estimatedDistance} km)
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Car}
            title="Total Rides"
            value={loading ? "..." : rides.length}
            subtitle="All time"
            gradient="from-blue-500 to-blue-600"
            delay={0}
          />
          <StatCard
            icon={CheckCircle}
            title="Completed"
            value={loading ? "..." : rides.filter(ride => ride.status === 'completed').length}
            subtitle="Successfully finished"
            gradient="from-green-500 to-green-600"
            delay={100}
          />
          <StatCard
            icon={Clock}
            title="Pending"
            value={loading ? "..." : rides.filter(ride => ['pending', 'awaiting_pm', 'awaiting_admin'].includes(ride.status)).length}
            subtitle="Awaiting approval"
            gradient="from-yellow-500 to-yellow-600"
            delay={200}
          />
          <StatCard
            icon={TrendingUp}
            title="Total Distance"
            value={loading ? "..." : `${rides.reduce((sum, ride) => sum + ride.distanceKm, 0).toFixed(0)} km`}
            subtitle="Total traveled"
            gradient="from-purple-500 to-purple-600"
            delay={300}
          />
        </div>

        {/* Rides List */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Rides</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rides.length === 0 ? (
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>
              <CardContent className="p-12 text-center relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Car className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No rides yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start your journey by requesting your first ride. We'll handle the rest!
                </p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  size="lg"
                  className="bg-blue-500 transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Request First Ride
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rides.map((ride, index) => (
                <Card 
                  key={ride._id} 
                  className="group hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in-up border-l-4 border-l-blue-500 relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardContent className="p-6 relative">
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                              Ride #{ride._id.slice(-6)}
                            </h3>
                            {getStatusBadge(ride.status)}
                          </div>
                          <p className="text-sm text-gray-600">{getStatusDescription(ride.status)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Distance</p>
                          <p className="text-lg font-bold text-gray-900">{ride.distanceKm.toFixed(1)} km</p>
                        </div>
                      </div>
                      
                      {/* Locations */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors duration-300">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-green-800">Pickup Location</p>
                              <p className="text-sm text-green-700 break-words">{ride.startLocation.address}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors duration-300">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-red-800">Destination</p>
                              <p className="text-sm text-red-700 break-words">{ride.endLocation.address}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Requested on {new Date(ride.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {ride.distanceKm > 25 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Long Distance
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}