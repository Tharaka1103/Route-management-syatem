'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Car, 
  MapPin, 
  Clock, 
  Star, 
  User, 
  Settings, 
  LogOut, 
  Plus,
  Calendar,
  BarChart3,
  Navigation,
  Phone,
  Mail,
  Edit,
  Save,
  X,
  Filter,
  Loader2,
  Trash2,
  Shield,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Ride, User as UserType, Location } from '@/types';
import { format } from 'date-fns';
import { locationService } from '@/lib/location-service';
import StarRating from '@/components/StarRating';
import LogoutButton from '@/components/LogoutButton';

// Dynamic import for LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

const UserDashboard: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  
  // Booking form state
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [requestedTime, setRequestedTime] = useState('');
  
  // Profile edit state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    contact: '',
    address: '',
    image: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmDelete: ''
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    ongoingRides: 0,
    totalDistance: 0,
    averageRating: 0
  });

  // Calculate distance using our location service
  const calculateDistance = (start: Location, end: Location): number => {
    return locationService.calculateDistance(start, end);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setProfileForm({
          fullName: data.user.fullName || '',
          contact: data.user.contact || '',
          address: data.user.address || '',
          image: data.user.image || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchRides = async () => {
    try {
      const response = await fetch('/api/rides/user?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRides(data.rides);
        console.log("rides", rides)
        // Calculate stats
        const completed = data.rides.filter((r: Ride) => r.status === 'completed');
        const ongoing = data.rides.filter((r: Ride) => ['approved', 'assigned', 'ongoing'].includes(r.status));
        const totalDist = data.rides.reduce((sum: number, r: Ride) => sum + (r.distance || 0), 0);
        const avgRating = completed.length > 0 ? 
          completed.reduce((sum: number, r: Ride) => sum + (r.rating || 0), 0) / completed.length : 0;
        
        setStats({
          totalRides: data.rides.length,
          completedRides: completed.length,
          ongoingRides: ongoing.length,
          totalDistance: totalDist,
          averageRating: avgRating
        });
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchUserProfile(), fetchRides()]).finally(() => setLoading(false));
    }
  }, [status]);

  const handleLocationSelect = (location: Location, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartLocation(location);
    } else {
      setEndLocation(location);
    }
  };

  const handleBookRide = async () => {
    if (!startLocation || !endLocation) {
      toast.error('Please select both start and end locations');
      return;
    }

    setBookingLoading(true);
    try {
      // Calculate distance using our location service
      const distance = calculateDistance(startLocation, endLocation);
      
      const response = await fetch('/api/rides/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLocation,
          endLocation,
          distance,
          requestedTime: requestedTime ? new Date(requestedTime).toISOString() : null
        })
      });

      if (response.ok) {
        toast.success(`Ride booked successfully! Distance: ${distance.toFixed(2)} km`);
        setIsBookingDialogOpen(false);
        setStartLocation(null);
        setEndLocation(null);
        setRequestedTime('');
        fetchRides();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to book ride');
      }
    } catch (error) {
      toast.error('Error booking ride');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate password fields if changing password
      if (profileForm.newPassword || profileForm.currentPassword) {
        if (!profileForm.currentPassword) {
          toast.error('Current password is required to change password');
          return;
        }
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
        if (profileForm.newPassword.length < 6) {
          toast.error('New password must be at least 6 characters long');
          return;
        }
      }

      const updateData: any = {
        fullName: profileForm.fullName,
        contact: profileForm.contact,
        address: profileForm.address,
        image: profileForm.image
      };

      // Include password change if provided
      if (profileForm.currentPassword && profileForm.newPassword) {
        updateData.currentPassword = profileForm.currentPassword;
        updateData.newPassword = profileForm.newPassword;
      }

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setEditProfile(false);
        setShowPasswordChange(false);
        // Reset password fields
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        fetchUserProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Error updating profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (deleteForm.confirmDelete !== 'DELETE MY ACCOUNT') {
        toast.error('Please type "DELETE MY ACCOUNT" to confirm');
        return;
      }

      const response = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deleteForm.password,
          confirmDelete: deleteForm.confirmDelete
        })
      });

      if (response.ok) {
        toast.success('Account deleted successfully!');
        signOut({ callbackUrl: '/auth/signin' });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Error deleting account');
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (!confirm('Are you sure you want to delete this ride? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/rides/${rideId}/delete`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Ride deleted successfully!');
        fetchRides(); // Refresh rides list
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete ride');
      }
    } catch (error) {
      toast.error('Error deleting ride');
    }
  };

  // handleRating is now handled by the StarRating component

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      assigned: 'bg-purple-100 text-purple-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const ongoingRides = rides.filter(ride => ['pending', 'approved', 'assigned', 'ongoing'].includes(ride.status));
  const recentRides = rides.filter(ride => ['completed', 'cancelled'].includes(ride.status)).slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Car className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name || userProfile?.fullName}
              </span>
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!editProfile ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{userProfile?.fullName}</p>
                            <p className="text-sm text-gray-500">{userProfile?.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Department</p>
                            <p className="font-medium capitalize">{userProfile?.department || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Role</p>
                            <p className="font-medium capitalize">{userProfile?.role?.replace('_', ' ')}</p>
                          </div>
                          {userProfile?.contact && (
                            <div>
                              <p className="text-gray-500">Contact</p>
                              <p className="font-medium">{userProfile.contact}</p>
                            </div>
                          )}
                          {userProfile?.address && (
                            <div className="col-span-2">
                              <p className="text-gray-500">Address</p>
                              <p className="font-medium">{userProfile.address}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Button onClick={() => setEditProfile(true)} className="w-full">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                          <Button variant="outline" onClick={() => setShowDeleteAccount(true)} className="w-full text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    ) : (
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
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          />
                        </div>
                        
                        {/* Password Change Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Change Password</Label>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowPasswordChange(!showPasswordChange)}
                            >
                              {showPasswordChange ? 'Hide' : 'Change Password'}
                            </Button>
                          </div>
                          {showPasswordChange && (
                            <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                              <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                  id="currentPassword"
                                  type="password"
                                  value={profileForm.currentPassword}
                                  onChange={(e) => setProfileForm({...profileForm, currentPassword: e.target.value})}
                                  placeholder="Enter current password"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  value={profileForm.newPassword}
                                  onChange={(e) => setProfileForm({...profileForm, newPassword: e.target.value})}
                                  placeholder="Enter new password (min 6 characters)"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  value={profileForm.confirmPassword}
                                  onChange={(e) => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                                  placeholder="Confirm new password"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Button onClick={handleProfileUpdate} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => {
                            setEditProfile(false);
                            setShowPasswordChange(false);
                            setProfileForm(prev => ({
                              ...prev,
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            }));
                          }}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
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
        {ongoingRides.length > 0 && (
          <div className="mb-6">
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-1">You have {ongoingRides.length} ongoing ride{ongoingRides.length > 1 ? 's' : ''}!</h3>
                    <p className="text-sm text-blue-600">Track your rides in real-time</p>
                  </div>
                  <div className="flex space-x-2">
                    {ongoingRides.slice(0, 2).map((ride) => (
                      <Button 
                        key={ride._id}
                        onClick={() => router.push(`/ride/${ride._id}`)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        {ride.status === 'ongoing' ? 'Track Live' : 'View Details'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Cards */}
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
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ongoing</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.ongoingRides}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Book Ride & Ongoing Rides */}
          <div className="lg:col-span-2 space-y-6">
            {/* Book New Ride */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Book New Ride</CardTitle>
                <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Book a New Ride</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Location</Label>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm">{startLocation?.address || 'Click on map to select'}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>End Location</Label>
                          <div className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm">{endLocation?.address || 'Click on map to select'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <LeafletMap 
                        onLocationSelect={handleLocationSelect}
                        startLocation={startLocation || undefined}
                        endLocation={endLocation || undefined}
                      />
                      
                      <div className="space-y-2">
                        <Label htmlFor="requestedTime">Requested Time (Optional)</Label>
                        <Input
                          id="requestedTime"
                          type="datetime-local"
                          value={requestedTime}
                          onChange={(e) => setRequestedTime(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleBookRide} 
                        className="w-full" 
                        disabled={bookingLoading || !startLocation || !endLocation}
                      >
                        {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Car className="h-4 w-4 mr-2" />}
                        Book Ride
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center py-8">
                  Click "New Booking" to book a ride with map location selection
                </p>
              </CardContent>
            </Card>

            {/* Ongoing Rides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Ongoing Rides
                  </div>
                  {ongoingRides.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {ongoingRides.length} active
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ongoingRides.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No ongoing rides</p>
                    <p className="text-sm text-gray-400">Your active rides will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ongoingRides.map((ride) => (
                      <div key={ride._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                            </Badge>
                            {ride.status === 'ongoing' && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-green-600 font-medium">LIVE</span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(new Date(ride.createdAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Pickup</p>
                              <p className="text-gray-600">{ride.startLocation.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Navigation className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Destination</p>
                              <p className="text-gray-600">{ride.endLocation.address}</p>
                            </div>
                          </div>
                        </div>

                        {ride.driver && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{(ride.driver as any).fullName}</p>
                                  <p className="text-xs text-gray-600">{(ride.driver as any).contact}</p>
                                </div>
                              </div>
                              {ride.vehicle && (
                                <div className="text-right">
                                  <p className="text-sm font-medium">{(ride.vehicle as any).vehicleNumber}</p>
                                  <p className="text-xs text-gray-600">{(ride.vehicle as any).model}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => router.push(`/ride/${ride._id}`)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            {ride.status === 'ongoing' ? 'Track Live Location' : 'View Ride Details'}
                          </Button>
                          {ride.driver && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if ((ride.driver as any).contact) {
                                  window.open(`tel:${(ride.driver as any).contact}`, '_self')
                                }
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
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
          </div>

          {/* Right Column - Recent Rides */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Rides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {recentRides.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent rides</p>
                  ) : (
                    <div className="space-y-4">
                      {recentRides.map((ride) => (
                        <div key={ride._id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(ride.createdAt), 'MMM dd')}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                              <span className="text-xs leading-tight">{ride.startLocation.address}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Navigation className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                              <span className="text-xs leading-tight">{ride.endLocation.address}</span>
                            </div>
                          </div>

                          {ride.driver && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Driver: {(ride.driver as any).fullName}</span>
                              {ride.vehicle && <span className="text-gray-600">{(ride.vehicle as any).vehicleNumber}</span>}
                            </div>
                          )}

                          {ride.distance && (
                            <div className="text-xs text-gray-600">
                              Distance: {ride.distance.toFixed(2)} km
                            </div>
                          )}

                          {ride.status === 'completed' && ride.driver && (
                            <div className="pt-3 border-t space-y-3">
                              <StarRating 
                                rideId={ride._id}
                                currentRating={ride.rating}
                                driverName={(ride.driver as any).fullName}
                                onRatingSubmit={() => fetchRides()}
                                size="sm"
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteRide(ride._id)}
                                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete Ride
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Delete Account Dialog */}
        <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Delete Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action cannot be undone. Your account and all associated data will be permanently deleted.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deleteForm.password}
                  onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                  placeholder="Password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmDelete">Type "DELETE MY ACCOUNT" to confirm</Label>
                <Input
                  id="confirmDelete"
                  value={deleteForm.confirmDelete}
                  onChange={(e) => setDeleteForm({...deleteForm, confirmDelete: e.target.value})}
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleDeleteAccount} 
                  variant="destructive" 
                  className="flex-1"
                  disabled={deleteForm.confirmDelete !== 'DELETE MY ACCOUNT'}
                >
                  Delete Account Permanently
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteForm({ password: '', confirmDelete: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserDashboard;
