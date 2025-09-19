'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Play, CheckCircle, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface Ride {
  _id: string;
  userId: string;
  status: string;
  distanceKm: number;
  startLocation: { address: string };
  endLocation: { address: string };
  createdAt: string;
}

export default function DriverDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const response = await fetch('/api/rides');
      if (response.ok) {
        const data = await response.json();
        setRides(data);
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchRides();
      }
    } catch (error) {
      console.error('Failed to update ride status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const canStartRide = (status: string) => status === 'approved';
  const canCompleteRide = (status: string) => status === 'in_progress';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Assigned Rides</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {rides.length} Active Rides
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading rides...</div>
          </div>
        ) : rides.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No rides assigned</h3>
              <p className="text-gray-500">You don't have any rides assigned at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {rides.map((ride) => (
              <Card key={ride._id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Ride #{ride._id.slice(-6)}</CardTitle>
                      <CardDescription>
                        Requested on {new Date(ride.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(ride.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Pickup Location</p>
                            <p className="text-gray-600">{ride.startLocation.address}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">Destination</p>
                            <p className="text-gray-600">{ride.endLocation.address}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Distance: {ride.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Customer ID: {ride.userId.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      {canStartRide(ride.status) && (
                        <Button
                          onClick={() => updateRideStatus(ride._id, 'in_progress')}
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Ride
                        </Button>
                      )}
                      {canCompleteRide(ride.status) && (
                        <Button
                          onClick={() => updateRideStatus(ride._id, 'completed')}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Complete Ride
                        </Button>
                      )}
                      {ride.status === 'completed' && (
                        <Badge variant="secondary" className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Completed
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
    </DashboardLayout>
  );
}