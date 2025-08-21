'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Navigation,
  Bell
} from 'lucide-react';
import { RealTimeMap } from '@/components/maps/real-time-map';
import { LocationTracker } from '@/components/ui/location-tracker';
import { NotificationCenter } from '@/components/ui/notification-center';
import { useRealTime } from '@/hooks/useRealTime';

interface RealTimeDashboardProps {
  userRole: 'admin' | 'driver' | 'project_manager' | 'department_head' | 'employee';
  userId: string;
  userName: string;
}

export function RealTimeDashboard({ userRole, userId, userName }: RealTimeDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [liveStats, setLiveStats] = useState({
    totalRides: 0,
    activeRides: 0,
    completedToday: 0,
    activeDrivers: 0,
    pendingApprovals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const {
    isConnected,
    getNotifications,
    getUnreadCount,
    startLocationTracking,
    stopLocationTracking,
    getTrackingStatus,
  } = useRealTime({
    enableLocation: userRole === 'driver',
    enableNotifications: true,
    onLocationUpdate: (location) => {
      console.log('Location updated:', location);
    },
    onNotification: (notification) => {
      console.log('New notification:', notification);
      // Add to recent activity
      setRecentActivity(prev => [
        {
          id: Date.now(),
          type: 'notification',
          title: notification.title,
          message: notification.message,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9)
      ]);
    },
    onRideUpdate: (ride) => {
      console.log('Ride updated:', ride);
      // Add to recent activity
      setRecentActivity(prev => [
        {
          id: Date.now(),
          type: 'ride',
          title: `Ride ${ride.type}`,
          message: ride.message || `Ride status updated`,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9)
      ]);
    },
  });

  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveStats = async () => {
    try {
      // Fetch different stats based on user role
      const endpoints = [];
      
      if (userRole === 'admin' || userRole === 'project_manager') {
        endpoints.push(
          fetch('/api/rides?status=active&limit=1'),
          fetch('/api/rides?limit=1'),
          fetch('/api/location/drivers'),
          fetch('/api/rides?status=pending&limit=1')
        );
      } else if (userRole === 'driver') {
        endpoints.push(
          fetch(`/api/driver/rides?driverId=${userId}&status=active`),
          fetch(`/api/driver/rides?driverId=${userId}`),
        );
      } else if (userRole === 'department_head') {
        endpoints.push(
          fetch('/api/department-head/rides?status=pending'),
          fetch('/api/department-head/rides'),
        );
      } else {
        endpoints.push(
          fetch(`/api/rides?userId=${userId}&status=active`),
          fetch(`/api/rides?userId=${userId}`),
        );
      }

      const responses = await Promise.allSettled(endpoints);
      
      // Process responses safely
      const stats = {
        totalRides: 0,
        activeRides: 0,
        completedToday: 0,
        activeDrivers: 0,
        pendingApprovals: 0,
      };

      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value.ok) {
          response.value.json().then(data => {
            switch (index) {
              case 0:
                stats.activeRides = data.total || data.data?.length || 0;
                break;
              case 1:
                stats.totalRides = data.total || data.data?.length || 0;
                break;
              case 2:
                stats.activeDrivers = data.count || data.data?.length || 0;
                break;
              case 3:
                stats.pendingApprovals = data.total || data.data?.length || 0;
                break;
            }
          });
        }
      });

      // Set completed today to a mock value for now
      stats.completedToday = Math.floor(Math.random() * 20) + 5;

      setLiveStats(stats);
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'ride':
        return <Car className="h-4 w-4 text-green-500" />;
      case 'location':
        return <MapPin className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground mt-1">
            {userRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <NotificationCenter userId={userId} />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveStats.totalRides}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{liveStats.activeRides}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{liveStats.completedToday}</div>
          </CardContent>
        </Card>

        {(userRole === 'admin' || userRole === 'project_manager') && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{liveStats.activeDrivers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{liveStats.pendingApprovals}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
          {userRole === 'driver' && (
            <TabsTrigger value="tracking">Location Tracking</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No recent activity
                    </p>
                  ) : (
                    recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userRole === 'employee' && (
                  <Button className="w-full" size="sm">
                    <Car className="h-4 w-4 mr-2" />
                    Book New Ride
                  </Button>
                )}
                
                {userRole === 'driver' && (
                  <>
                    <Button className="w-full" size="sm" variant="outline">
                      <Navigation className="h-4 w-4 mr-2" />
                      View Assigned Rides
                    </Button>
                    <Button 
                      className="w-full" 
                      size="sm" 
                      variant={getTrackingStatus().isTracking ? "destructive" : "default"}
                      onClick={getTrackingStatus().isTracking ? stopLocationTracking : () => startLocationTracking()}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {getTrackingStatus().isTracking ? 'Stop Tracking' : 'Start Tracking'}
                    </Button>
                  </>
                )}

                {(userRole === 'admin' || userRole === 'project_manager') && (
                  <>
                    <Button className="w-full" size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Drivers
                    </Button>
                    <Button className="w-full" size="sm" variant="outline">
                      <Car className="h-4 w-4 mr-2" />
                      Fleet Overview
                    </Button>
                  </>
                )}

                <Button className="w-full" size="sm" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  View All Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <RealTimeMap
            showAllDrivers={userRole === 'admin' || userRole === 'project_manager'}
            focusedDriverId={userRole === 'driver' ? userId : undefined}
            className="w-full"
            height="500px"
          />
        </TabsContent>

        {userRole === 'driver' && (
          <TabsContent value="tracking" className="space-y-4">
            <LocationTracker
              driverId={userId}
              onLocationUpdate={(location) => {
                console.log('Location updated:', location);
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
