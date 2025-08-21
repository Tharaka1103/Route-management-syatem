'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Shield, 
  Users, 
  Activity, 
  Clock, 
  Navigation,
  Bell,
  Smartphone,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeDrivers: 0,
    totalRides: 0,
    completedToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return // Wait for session to load
    
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role;
      
      // Setup real-time notifications and socket connection
      setupRealtimeFeatures(session.user.id, role);
      
      // Redirect based on role with a small delay to prevent conflicts
      const redirectTimeout = setTimeout(() => {
        switch (role) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'driver':
            router.replace('/driver');
            break;
          case 'department_head':
            router.replace('/department-head');
            break;
          case 'project_manager':
            router.replace('/project-manager');
            break;
          default:
            router.replace('/dashboard');
        }
      }, 100);
      
      return () => clearTimeout(redirectTimeout);
    } else if (status === 'unauthenticated') {
      // Fetch public stats for non-authenticated users
      fetchPublicStats();
    }
  }, [session, status, router]);

  const setupRealtimeFeatures = async (userId: string, role: string) => {
    try {
      // This will be implemented later with real-time features
      console.log('Setting up real-time features for user:', userId, 'role:', role);
    } catch (error) {
      console.error('Error setting up real-time features:', error);
    }
  };

  const fetchPublicStats = async () => {
    try {
      let driversData = { count: 0 };
      let ridesData = { total: 0 };

      try {
        const driversRes = await fetch('/api/location/drivers');
        if (driversRes.ok) {
          driversData = await driversRes.json();
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }

      try {
        const ridesRes = await fetch('/api/rides?limit=1');
        if (ridesRes.ok) {
          ridesData = await ridesRes.json();
        }
      } catch (error) {
        console.error('Error fetching rides:', error);
      }

      setStats({
        activeDrivers: driversData.count || 0,
        totalRides: ridesData.total || 0,
        completedToday: Math.floor(Math.random() * 50) + 10, // Mock data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading RouteBook...</p>
        </div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-pulse">
            <Car className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.name}!
          </h2>
          <p className="text-gray-600 mb-4">Redirecting to your dashboard...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-500">Setting up real-time features</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
                <Car className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">RouteBook</h1>
            </div>
            <div className="space-x-4">
              <Link href="/auth/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Smart Route Booking System
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your company's transportation with our intelligent route booking platform. 
            Book rides, track vehicles, and manage routes with ease.
          </p>
          <div className="mt-10">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-3">
                Start Booking Routes
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader className="pb-3">
              <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 mx-auto rounded"></div>
                ) : (
                  stats.activeDrivers
                )}
              </CardTitle>
              <CardDescription>Active Drivers</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 mx-auto rounded"></div>
                ) : (
                  stats.totalRides.toLocaleString()
                )}
              </CardTitle>
              <CardDescription>Total Rides Booked</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-3">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 mx-auto rounded"></div>
                ) : (
                  stats.completedToday
                )}
              </CardTitle>
              <CardDescription>Completed Today</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MapPin className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="flex items-center justify-between">
                Real-time Tracking
                <Badge variant="outline" className="text-xs">Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your rides in real-time with GPS integration and live updates. 
                Get notifications about driver location and ETA.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bell className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle className="flex items-center justify-between">
                Smart Notifications
                <Badge variant="outline" className="text-xs">New</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receive instant notifications for ride approvals, driver assignments,
                and status updates across all devices.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure authorization system with different access levels for
                employees, drivers, department heads, and administrators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Smartphone className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Mobile Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Responsive design works perfectly on all devices. Book rides,
                track drivers, and manage routes from anywhere.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Book a Ride</h4>
              <p className="text-gray-600">Select your pickup and destination points on the map.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Get Approval</h4>
              <p className="text-gray-600">Your department head reviews and approves the request.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Track & Ride</h4>
              <p className="text-gray-600">Get assigned a driver and track your ride in real-time.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Car className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-lg font-bold">RouteBook</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner for efficient route booking and fleet management.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Features</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Real-time Tracking</li>
                <li>Route Management</li>
                <li>Driver Assignment</li>
                <li>Analytics Dashboard</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Departments</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Mechanical</li>
                <li>Civil</li>
                <li>Electrical</li>
                <li>HSEQ</li>
                <li>Human Resources</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Documentation</li>
                <li>System Status</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 RouteBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}