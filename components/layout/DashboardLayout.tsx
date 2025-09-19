'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Car, 
  Users, 
  MapPin, 
  Menu, 
  X, 
  LogOut,
  UserCheck,
  Shield,
  Truck,
  Bell,
  Settings,
  User as UserIcon,
  ChevronRight,
  Zap
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Map View',
        href: '/map',
        icon: MapPin,
        roles: ['user', 'driver', 'project_manager', 'admin'],
        gradient: 'from-emerald-400 to-teal-500',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700'
      }
    ];

    const roleSpecificItems = {
      user: [
        { 
          name: 'My Rides', 
          href: '/dashboard/user', 
          icon: Car,
          gradient: 'from-blue-400 to-indigo-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        },
      ],
      driver: [
        { 
          name: 'Assigned Rides', 
          href: '/dashboard/driver', 
          icon: Truck,
          gradient: 'from-purple-400 to-pink-500',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700'
        },
      ],
      project_manager: [
        { 
          name: 'Approvals', 
          href: '/dashboard/pm', 
          icon: UserCheck,
          gradient: 'from-orange-400 to-red-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700'
        },
      ],
      admin: [
        { 
          name: 'Admin Panel', 
          href: '/dashboard/admin', 
          icon: Shield,
          gradient: 'from-red-400 to-rose-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        },
      ]
    };

    const userRole = user?.role as keyof typeof roleSpecificItems;
    const items = userRole ? roleSpecificItems[userRole] || [] : [];
    
    return [...items, ...baseItems.filter(item => item.roles.includes(user?.role || ''))];
  };

  const getUserRoleDisplay = (role: string) => {
    const roleDisplays = {
      user: 'User',
      driver: 'Driver',
      project_manager: 'Project Manager',
      admin: 'Administrator'
    };
    return roleDisplays[role as keyof typeof roleDisplays] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      user: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      driver: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      project_manager: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
      admin: 'bg-gradient-to-r from-red-500 to-red-600 text-white'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="w-full max-w-sm shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center animate-pulse">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded-full w-3/4 mx-auto animate-pulse"></div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed positioning for desktop, overlay for mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80  bg-white backdrop-blur-xl shadow-2xl border-r-2 border-blue-500 transform transition-all duration-500 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Sidebar Header */}
        <div className="relative h-20 px-6 border-b border-gray-200/50 bg-blue-500">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">RideManager</span>
                <p className="text-blue-100 text-xs font-medium">Transport Solutions</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/20 transition-all duration-200 group"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
          
          {/* Decorative gradient overlay */}
        </div>

        <div className="flex flex-col">
          {/* User Profile Section */}
          <div className="p-6 border-b bg-blue-200/50">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {getInitials(user.name)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-lg">{user.name}</h3>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <Badge className={`mt-2 text-xs font-medium px-3 py-1 ${getRoleBadgeColor(user.role)} shadow-lg`}>
                  <Zap className="w-3 h-3 mr-1" />
                  {getUserRoleDisplay(user.role)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Navigation</p>
            </div>
            
            {getNavigationItems().map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <div key={item.name} className="relative group">
                  <button
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${
                      isActive
                        ? `${item.bgColor} ${item.textColor} scale-[1.02] border border-blue-200`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 ${
                        isActive 
                          ? 'bg-white' 
                          : `bg-gradient-to-br ${item.gradient} group-hover:shadow-lg group-hover:scale-110`
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? item.textColor : 'text-white'}`} />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    
                    <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                    }`} />
                  </button>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-t border-gray-200/50">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Quick Actions</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <Bell className="w-5 h-5 text-gray-600 mb-1 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs text-gray-600 font-medium">Alerts</span>
              </button>
              <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <Settings className="w-5 h-5 text-gray-600 mb-1 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs text-gray-600 font-medium">Settings</span>
              </button>
            </div>
          </div>

          {/* Logout Section */}
          <div className="p-4 border-t border-gray-200/50">
            <Button 
              variant="outline" 
              onClick={logout}
              className="w-full group bg-gradient-to-r from-red-50 to-pink-50 border-red-200 hover:from-red-100 hover:to-pink-100 hover:border-red-300 text-red-600 hover:text-red-700 transition-all duration-300 transform hover:scale-[1.02] h-12 rounded-xl font-medium"
            >
              <LogOut className="w-4 h-4 mr-3 group-hover:animate-pulse" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area - Properly positioned with left margin on desktop */}
      <div className="lg:pl-80 min-h-screen flex flex-col">
        {/* Enhanced Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
              >
                <Menu className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              </button>
              
              <div className="hidden lg:block">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      Welcome back, <span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">{user.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-xs text-gray-500">Have a productive day!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
              
              {/* Notification bell */}
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
                <Bell className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform duration-200" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-bounce"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Page content - Now properly positioned */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}