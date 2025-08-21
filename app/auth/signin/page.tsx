'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, IdCard, Eye, EyeOff, AlertCircle, Shield, Truck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [showDriverPassword, setShowDriverPassword] = useState(false)
  const router = useRouter()

  const [userCredentials, setUserCredentials] = useState({
    email: '',
    password: ''
  })

  const [driverCredentials, setDriverCredentials] = useState({
    nic: '',
    password: ''
  })

  const handleUserSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: userCredentials.email,
        password: userCredentials.password,
        loginType: 'user',
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
        toast.error('Invalid email or password')
      } else {
        const session = await getSession()
        toast.success(`Successfully signed in as ${userCredentials.email}!`)
        
        // Redirect based on role
        if (session?.user?.role === 'admin') {
          window.location.href = '/admin'
        } else if (session?.user?.role === 'department_head') {
          window.location.href = '/department-head'
        } else if (session?.user?.role === 'project_manager') {
          window.location.href = '/project-manager'
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An error occurred during sign in')
      toast.error('An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDriverSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        nic: driverCredentials.nic,
        password: driverCredentials.password,
        loginType: 'driver',
        redirect: false
      })

      if (result?.error) {
        setError('Invalid NIC or password')
        toast.error('Invalid NIC or password')
      } else {
        toast.success('Signed in successfully!')
        window.location.href = '/driver'
      }
    } catch (error) {
      console.error('Driver sign in error:', error)
      setError('An error occurred during sign in')
      toast.error('An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error('An error occurred during Google sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />
      
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Welcome Back Section */}
        <div className="hidden lg:block space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-xl text-gray-600">
              Continue managing your routes efficiently
            </p>
          </div>
          
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Secure Access</h3>
                <p className="text-gray-600 text-sm">Multi-role authentication for users and drivers</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Role-Based Dashboard</h3>
                <p className="text-gray-600 text-sm">Customized experience based on your role</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fleet Management</h3>
                <p className="text-gray-600 text-sm">Track and manage routes in real-time</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-100">
              <p className="text-3xl font-bold text-blue-600">98%</p>
              <p className="text-sm text-gray-600">Route Efficiency</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-gray-100">
              <p className="text-3xl font-bold text-indigo-600">24/7</p>
              <p className="text-sm text-gray-600">System Availability</p>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold">Sign in to RouteBook</CardTitle>
            <CardDescription>
              Access your route management dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="user" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <User size={16} />
                  User
                </TabsTrigger>
                <TabsTrigger 
                  value="driver" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                >
                  <IdCard size={16} />
                  Driver
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="user" className="space-y-6 mt-0">
                <form onSubmit={handleUserSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={userCredentials.email}
                        onChange={(e) => setUserCredentials(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10 h-11 transition-all hover:border-gray-300 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => router.push('/auth/forgot-password')}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="password"
                        type={showUserPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={userCredentials.password}
                        onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 h-11 transition-all hover:border-gray-300 focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword(!showUserPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] h-11" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] h-11"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </TabsContent>

              <TabsContent value="driver" className="space-y-6 mt-0">
                <form onSubmit={handleDriverSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="nic" className="text-sm font-medium">
                      NIC Number
                    </Label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="nic"
                        type="text"
                        placeholder="Enter your NIC number"
                        value={driverCredentials.nic}
                        onChange={(e) => setDriverCredentials(prev => ({ ...prev, nic: e.target.value }))}
                        className="pl-10 h-11 transition-all hover:border-gray-300 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="driver-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                        onClick={() => router.push('/auth/forgot-password')}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="driver-password"
                        type={showDriverPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={driverCredentials.password}
                        onChange={(e) => setDriverCredentials(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 h-11 transition-all hover:border-gray-300 focus:border-green-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowDriverPassword(!showDriverPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showDriverPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] h-11" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Sign In as Driver
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Driver Help Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-900">Need help?</p>
                      <p className="text-xs text-green-700">
                        Contact your fleet manager if you're having trouble signing in
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}