'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  AlertCircle, 
  Loader2, 
  Shield, 
  MapPin, 
  Clock,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Zap,
  Globe,
  BarChart3
} from 'lucide-react';

// Move components outside to prevent re-creation on each render
const SystemBrand = () => (
  <div className="h-full flex flex-col justify-center space-y-8 text-white">
    <div className="text-center">
      <div className="flex items-center justify-center mb-6">
        <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Truck className="w-9 h-9 text-white" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
        RideManager
      </h1>
      <p className="text-xl md:text-2xl text-blue-100 font-light max-w-md mx-auto">
        Smart Fleet Management for the Modern World
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
        <MapPin className="w-8 h-8 text-blue-200 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Real-time Tracking</h3>
        <p className="text-blue-100 text-sm">Live GPS monitoring and route optimization for your entire fleet.</p>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
        <Shield className="w-8 h-8 text-blue-200 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
        <p className="text-blue-100 text-sm">Bank-level security with advanced encryption and compliance.</p>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
        <BarChart3 className="w-8 h-8 text-blue-200 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
        <p className="text-blue-100 text-sm">Comprehensive insights and reporting for data-driven decisions.</p>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
        <Zap className="w-8 h-8 text-blue-200 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Instant Deployment</h3>
        <p className="text-blue-100 text-sm">Quick setup and seamless integration with existing systems.</p>
      </div>
    </div>

    <div className="text-center space-y-4">
      <div className="flex items-center justify-center space-x-8 text-blue-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">99.9%</div>
          <div className="text-sm">Uptime</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">500K+</div>
          <div className="text-sm">Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">24/7</div>
          <div className="text-sm">Support</div>
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2 text-blue-200">
        <Globe className="w-4 h-4" />
        <span className="text-sm">Trusted by companies in 50+ countries</span>
      </div>
    </div>
  </div>
);

const MobileBrandHeader = () => (
  <div className="text-center lg:hidden">
    <div className="flex items-center justify-center mb-4">
      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
        <Truck className="w-7 h-7 text-white" />
      </div>
      <span className="text-2xl font-bold text-gray-900 ml-3">RideManager</span>
    </div>
  </div>
);

const TrustBadges = () => (
  <div className="flex items-center justify-center space-x-6 text-gray-400 text-sm">
    <div className="flex items-center">
      <Shield className="w-4 h-4 mr-1" />
      <span>Secure</span>
    </div>
    <div className="flex items-center">
      <CheckCircle className="w-4 h-4 mr-1" />
      <span>Verified</span>
    </div>
    <div className="flex items-center">
      <Clock className="w-4 h-4 mr-1" />
      <span>24/7 Support</span>
    </div>
  </div>
);

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/dashboard/${data.user.role}`);
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setError('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - System Brand */}
        <div className="flex-1 bg-blue-500 p-12 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <SystemBrand />
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 bg-white p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <AuthForm
              isLogin={isLogin}
              showPassword={showPassword}
              formData={formData}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              onInputChange={handleInputChange}
              onTogglePassword={togglePasswordVisibility}
              onToggleMode={toggleMode}
            />
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Layout */}
      <div className="lg:hidden min-h-screen">
        {/* Top Section - Brand (Mobile) */}
        <div className="bg-blue-500 px-6 py-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Truck className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              RideManager
            </h1>
            <p className="text-lg text-blue-100">
              Smart Fleet Management Platform
            </p>
          </div>
        </div>

        {/* Bottom Section - Form */}
        <div className="bg-white px-6 py-12 min-h-screen">
          <AuthForm
            isLogin={isLogin}
            showPassword={showPassword}
            formData={formData}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onTogglePassword={togglePasswordVisibility}
            onToggleMode={toggleMode}
          />
        </div>
      </div>

      {/* Background Pattern */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 w-1/2 h-full bg-blue-500 opacity-5"
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             }}>
        </div>
      </div>
    </div>
  );
}

// Separate AuthForm component with proper props
interface AuthFormProps {
  isLogin: boolean;
  showPassword: boolean;
  formData: {
    name: string;
    email: string;
    password: string;
  };
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTogglePassword: () => void;
  onToggleMode: () => void;
}

const AuthForm = ({
  isLogin,
  showPassword,
  formData,
  loading,
  error,
  onSubmit,
  onInputChange,
  onTogglePassword,
  onToggleMode
}: AuthFormProps) => (
  <div className="h-full flex flex-col justify-center">
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Mobile Brand Header */}
      <MobileBrandHeader />

      {/* Form Header */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-gray-600 text-lg">
          {isLogin 
            ? 'Sign in to access your dashboard' 
            : 'Join thousands of satisfied users'
          }
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={onInputChange('name')}
                    required={!isLogin}
                    className="h-14 pl-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={onInputChange('email')}
                  required
                  className="h-14 pl-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={onInputChange('password')}
                  required
                  className="h-14 pl-12 pr-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-xl transition-all duration-200 transform hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Switch Form Type */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
        </p>
        <button
          type="button"
          onClick={onToggleMode}
          className="text-blue-500 hover:text-blue-600 font-semibold text-lg transition-colors duration-200"
        >
          {isLogin ? 'Create new account' : 'Sign in instead'}
        </button>
      </div>

      {/* Trust Badges */}
      <TrustBadges />
    </div>
  </div>
);