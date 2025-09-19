'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Check, X, AlertCircle } from 'lucide-react';
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

export default function ProjectManagerDashboard() {
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

  const approveRide = async (rideId: string) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchRides();
      }
    } catch (error) {
      console.error('Failed to approve ride:', error);
    }
  };

  const rejectRide = async (rideId: string) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchRides();
      }
    } catch (error) {
      console.error('Failed to reject ride:', error);
    }
  };

  const pendingRides = rides.filter(ride => ride.status === 'awaiting_pm');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Ride Approvals</h1>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {pendingRides.length} Pending Approvals
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">Loading rides...</div>
          </div>
        ) : pendingRides.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">All caught up!</h3>
              <p className="text-gray-500">No rides pending your approval at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingRides.map((ride) => (
              <Card key={ride._id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        Ride #{ride._id.slice(-6)} - Approval Required
                      </CardTitle>
                      <CardDescription>
                        Long distance ride ({ride.distanceKm.toFixed(1)} km) - Requested on {new Date(ride.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      Awaiting PM Approval
                    </Badge>
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
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="font-medium text-yellow-800">Long Distance Alert</span>
                          </div>
                          <p className="text-sm text-yellow-700">
                            This ride is {ride.distanceKm.toFixed(1)} km, which exceeds the 25 km threshold and requires PM approval.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Customer ID: {ride.userId.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={() => approveRide(ride._id)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Approve Ride
                      </Button>
                      <Button
                        onClick={() => rejectRide(ride._id)}
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Reject Ride
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Rides Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rides.filter(ride => 
                  new Date(ride.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Long Distance Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rides.filter(ride => ride.distanceKm > 25).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingRides.length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}