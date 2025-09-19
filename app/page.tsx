'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Users, Truck, Shield } from 'lucide-react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        setIsAuthenticated(true);
        router.push(`/dashboard/${user.role}`);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Truck className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RideManager</h1>
          </div>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Real-Time Ride & Route Management
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your transportation operations with our comprehensive ride management system.
            Track vehicles in real-time, manage ride approvals, and optimize routes efficiently.
          </p>
          <Button size="lg" onClick={() => router.push('/login')} className="text-lg px-8 py-4">
            Start Managing Rides
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Monitor all vehicles in real-time with live GPS tracking and status updates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Smart Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated approval workflow based on distance and role-based access control.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Multi-Role Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Support for users, drivers, project managers, and administrators with custom dashboards.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Truck className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Fleet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive fleet management with driver assignment and route optimization.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-3xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Request a Ride</h4>
              <p className="text-gray-600">Users can easily request rides by entering pickup and destination locations.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Approval Process</h4>
              <p className="text-gray-600">Rides go through an intelligent approval process based on distance and requirements.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Track & Complete</h4>
              <p className="text-gray-600">Drivers are assigned and rides are tracked in real-time until completion.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 RideManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}