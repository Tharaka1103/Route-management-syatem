'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Clock, Check, X, Plus, Users, Car, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Ride {
  _id: string;
  userId: string;
  driverId?: string;
  status: string;
  distanceKm: number;
  startLocation: { address: string };
  endLocation: { address: string };
  createdAt: string;
}

export default function AdminDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rides');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'driver'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ridesRes, usersRes] = await Promise.all([
        fetch('/api/rides'),
        fetch('/api/users')
      ]);

      if (ridesRes.ok) {
        const ridesData = await ridesRes.json();
        setRides(ridesData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
        setDrivers(usersData.filter((user: User) => user.role === 'driver'));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        fetchData();
      }
    } catch (error) {
      console.error('Failed to approve ride:', error);
    }
  };

  const assignDriver = async (rideId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to assign driver:', error);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setIsCreateUserOpen(false);
        setNewUser({ name: '', email: '', password: '', role: 'driver' });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      awaiting_pm: 'bg-blue-100 text-blue-800',
      awaiting_admin: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const pendingRides = rides.filter(ride => ride.status === 'awaiting_admin');
  const approvedRides = rides.filter(ride => ride.status === 'approved');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new driver or project manager account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingRides.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drivers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rides.filter(ride => ['approved', 'in_progress'].includes(ride.status)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {rides.filter(ride => 
                  ride.status === 'completed' && 
                  new Date(ride.createdAt).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('rides')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rides'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Ride Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              User Management
            </button>
          </div>
        </div>

        {/* Ride Management Tab */}
        {activeTab === 'rides' && (
          <div className="space-y-6">
            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Rides Awaiting Admin Approval</CardTitle>
                <CardDescription>
                  {pendingRides.length} rides need your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRides.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No rides pending approval</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRides.map((ride) => (
                      <div key={ride._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">Ride #{ride._id.slice(-6)}</h4>
                            <p className="text-sm text-gray-600">
                              {ride.distanceKm.toFixed(1)} km • {new Date(ride.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(ride.status)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{ride.startLocation.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="text-sm">{ride.endLocation.address}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveRide(ride._id)}>
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Driver Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Approved Rides - Driver Assignment</CardTitle>
                <CardDescription>
                  {approvedRides.length} approved rides need driver assignment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {approvedRides.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No approved rides awaiting driver assignment</p>
                ) : (
                  <div className="space-y-4">
                    {approvedRides.map((ride) => (
                      <div key={ride._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">Ride #{ride._id.slice(-6)}</h4>
                            <p className="text-sm text-gray-600">
                              {ride.distanceKm.toFixed(1)} km • {new Date(ride.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(ride.status)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{ride.startLocation.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <span className="text-sm">{ride.endLocation.address}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Select onValueChange={(driverId) => assignDriver(ride._id, driverId)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {drivers.map((driver) => (
                                <SelectItem key={driver._id} value={driver._id}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage drivers and project managers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(user => user.role !== 'user').map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}