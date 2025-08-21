'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Briefcase,
  MapPin,
  Navigation,
  Clock,
  BarChart3,
  User,
  Users,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Activity,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
  Building
} from 'lucide-react'
import { User as UserType, Ride } from '@/types'
import { format } from 'date-fns'

export default function ProjectManagerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserType | null>(null)
  const [pendingRides, setPendingRides] = useState<Ride[]>([])
  const [allRides, setAllRides] = useState<Ride[]>([])
  const [departmentHeads, setDepartmentHeads] = useState<UserType[]>([])
  
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [profileDialog, setProfileDialog] = useState(false)
  const [editProfile, setEditProfile] = useState(false)

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    contact: '',
    address: ''
  })

  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approvedToday: 0,
    totalRides: 0,
    departmentHeads: 0,
    monthlyRides: 0,
    crossDepartmentRides: 0
  })

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'project_manager') {
        router.push('/unauthorized')
        return
      }
      loadProjectManagerData()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session, router])

  const loadProjectManagerData = async () => {
    try {
      setLoading(true)
      const [profileRes, ridesRes, departmentHeadsRes] = await Promise.all([
        fetch('/api/users/profile'),
        fetch('/api/project-manager/rides'),
        fetch('/api/project-manager/department-heads')
      ])

      const [profileData, ridesData, departmentHeadsData] = await Promise.all([
        profileRes.ok ? profileRes.json() : { user: null },
        ridesRes.ok ? ridesRes.json() : { pending: [], all: [] },
        departmentHeadsRes.ok ? departmentHeadsRes.json() : { departmentHeads: [] }
      ])

      setUserProfile(profileData.user)
      setPendingRides(ridesData.pending || [])
      setAllRides(ridesData.all || [])
      setDepartmentHeads(departmentHeadsData.departmentHeads || [])

      if (profileData.user) {
        setProfileForm({
          fullName: profileData.user.fullName || '',
          contact: profileData.user.contact || '',
          address: profileData.user.address || ''
        })
      }

      // Calculate stats
      const approvedToday = ridesData.all?.filter((r: Ride) => 
        r.approvalStatus === 'approved' && 
        new Date(r.updatedAt).toDateString() === new Date().toDateString()
      ).length || 0

      const monthlyRides = ridesData.all?.filter((r: Ride) => {
        const rideDate = new Date(r.createdAt)
        const currentDate = new Date()
        return rideDate.getMonth() === currentDate.getMonth() && 
               rideDate.getFullYear() === currentDate.getFullYear()
      }).length || 0

      // Cross-department rides are rides from department heads
      const crossDepartmentRides = ridesData.all?.filter((r: Ride) => 
        (r.user as any)?.role === 'department_head'
      ).length || 0

      setStats({
        pendingApprovals: ridesData.pending?.length || 0,
        approvedToday,
        totalRides: ridesData.all?.length || 0,
        departmentHeads: departmentHeadsData.departmentHeads?.length || 0,
        monthlyRides,
        crossDepartmentRides
      })

    } catch (error) {
      console.error('Error loading project manager data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRide = async (rideId: string) => {
    try {
      const response = await fetch(`/api/project-manager/rides/${rideId}/approve`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success('Ride approved successfully!')
        loadProjectManagerData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve ride')
      }
    } catch (error) {
      toast.error('Error approving ride')
    }
  }

  const handleRejectRide = async () => {
    if (!selectedRide || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      const response = await fetch(`/api/project-manager/rides/${selectedRide._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      })

      if (response.ok) {
        toast.success('Ride rejected successfully!')
        setApprovalDialog(false)
        setSelectedRide(null)
        setRejectionReason('')
        loadProjectManagerData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject ride')
      }
    } catch (error) {
      toast.error('Error rejecting ride')
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setEditProfile(false)
        loadProjectManagerData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Error updating profile')
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      assigned: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDepartmentColor = (department: string) => {
    const colors = {
      mechanical: 'bg-blue-100 text-blue-800',
      civil: 'bg-green-100 text-green-800',
      electrical: 'bg-yellow-100 text-yellow-800',
      HSEQ: 'bg-red-100 text-red-800',
      HR: 'bg-purple-100 text-purple-800'
    }
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Manager Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Cross-Department Management - Welcome, {userProfile?.fullName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!editProfile ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <Label>Full Name</Label>
                            <p className="text-sm font-medium">{userProfile?.fullName}</p>
                          </div>
                          <div>
                            <Label>Email</Label>
                            <p className="text-sm font-medium">{userProfile?.email}</p>
                          </div>
                          <div>
                            <Label>Department</Label>
                            <p className="text-sm font-medium">{userProfile?.department?.toUpperCase()}</p>
                          </div>
                          <div>
                            <Label>Role</Label>
                            <p className="text-sm font-medium">Project Manager</p>
                          </div>
                          {userProfile?.contact && (
                            <div>
                              <Label>Contact</Label>
                              <p className="text-sm font-medium">{userProfile.contact}</p>
                            </div>
                          )}
                          {userProfile?.address && (
                            <div>
                              <Label>Address</Label>
                              <p className="text-sm font-medium">{userProfile.address}</p>
                            </div>
                          )}
                        </div>
                        <Button onClick={() => setEditProfile(true)} className="w-full">
                          Edit Profile
                        </Button>
                      </>
                    ) : (
                      <>
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
                        </div>
                        <div className="flex space-x-2">
                          <Button onClick={handleUpdateProfile} className="flex-1">
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditProfile(false)}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved Today</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approvedToday}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rides</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalRides}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Department Heads</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.departmentHeads}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Rides</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.monthlyRides}</p>
                </div>
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cross-Dept Rides</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.crossDepartmentRides}</p>
                </div>
                <Building className="h-8 w-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
            <TabsTrigger value="rides">All Rides</TabsTrigger>
            <TabsTrigger value="department-heads">Department Heads</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Pending Approvals */}
          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle>Pending Department Head Approvals</CardTitle>
                <CardDescription>Review and approve ride requests from department heads</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRides.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRides.map((ride) => (
                      <div key={ride._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium">{(ride.user as any)?.fullName}</p>
                              <Badge className={getDepartmentColor((ride.user as any)?.department || '')}>
                                {(ride.user as any)?.department?.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{(ride.user as any)?.email}</p>
                            <p className="text-sm text-gray-500">
                              Requested: {format(new Date(ride.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                            <Badge variant="outline">
                              Department Head Request
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(ride.approvalStatus)}>
                            {ride.approvalStatus}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{ride.startLocation.address}</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Navigation className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{ride.endLocation.address}</span>
                          </div>
                          {ride.distance && (
                            <div className="flex items-center space-x-2">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">Distance: {ride.distance.toFixed(2)} km</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" onClick={() => handleApproveRide(ride._id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedRide(ride)
                              setApprovalDialog(true)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Rides */}
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle>All Rides Overview</CardTitle>
                <CardDescription>Complete view of all ride requests across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {allRides.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No rides found</p>
                  ) : (
                    <div className="space-y-4">
                      {allRides.map((ride) => (
                        <div key={ride._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium">{(ride.user as any)?.fullName}</p>
                                <Badge className={getDepartmentColor((ride.user as any)?.department || '')}>
                                  {(ride.user as any)?.department?.toUpperCase()}
                                </Badge>
                                {(ride.user as any)?.role === 'department_head' && (
                                  <Badge variant="outline" >
                                    Dept Head
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {format(new Date(ride.createdAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(ride.status)}>
                                {ride.status}
                              </Badge>
                              <div className="mt-1">
                                <Badge variant="outline" className={getStatusColor(ride.approvalStatus)}>
                                  {ride.approvalStatus}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                              <span className="text-sm">{ride.startLocation.address}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <Navigation className="h-3 w-3 text-red-600 mt-1 flex-shrink-0" />
                              <span className="text-sm">{ride.endLocation.address}</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Distance: {ride.distance?.toFixed(2) || 0} km</span>
                            {ride.driver && (
                              <span>Driver: {(ride.driver as any).fullName}</span>
                            )}
                          </div>

                          {ride.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 rounded border-l-4 border-red-400">
                              <p className="text-sm text-red-700">
                                <strong>Rejection Reason:</strong> {ride.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Heads */}
          <TabsContent value="department-heads">
            <Card>
              <CardHeader>
                <CardTitle>Department Heads</CardTitle>
                <CardDescription>All department heads in the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departmentHeads.map((head) => (
                    <Card key={head._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{head.fullName}</p>
                              <p className="text-sm text-gray-600">{head.email}</p>
                              {head.contact && (
                                <p className="text-sm text-gray-500">{head.contact}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={getDepartmentColor(head.department || '')}>
                            {head.department?.toUpperCase()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department-wise Ride Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['mechanical', 'civil', 'electrical', 'HSEQ', 'HR'].map((dept) => {
                      const deptRides = allRides.filter(r => (r.user as any)?.department === dept)
                      return (
                        <div key={dept} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getDepartmentColor(dept)}>
                              {dept.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{deptRides.length} rides</span>
                            <p className="text-sm text-gray-500">
                              {deptRides.filter(r => r.status === 'completed').length} completed
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Rides This Month</span>
                      <span className="font-medium">{stats.monthlyRides}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Approved This Month</span>
                      <span className="font-medium text-green-600">
                        {allRides.filter(r => 
                          r.approvalStatus === 'approved' && 
                          new Date(r.createdAt).getMonth() === new Date().getMonth()
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending This Month</span>
                      <span className="font-medium text-yellow-600">
                        {allRides.filter(r => 
                          r.approvalStatus === 'pending' && 
                          new Date(r.createdAt).getMonth() === new Date().getMonth()
                        ).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Department Head Requests</span>
                      <span className="font-medium text-blue-600">{stats.crossDepartmentRides}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Ride Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rejection</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for rejecting this ride request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleRejectRide} variant="destructive" className="flex-1">
                  Reject Ride
                </Button>
                <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
