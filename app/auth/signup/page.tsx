'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Building2, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Department } from '@/types'
import { cn } from '@/lib/utils'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    department: '' as Department | '',
    contact: '',
    address: '',
    password: '',
    confirmPassword: ''
  })

  const departments: Department[] = ['mechanical', 'civil', 'electrical', 'HSEQ', 'HR']

  // Calculate password strength
  useEffect(() => {
    const password = formData.password
    let strength = 0
    
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    
    setPasswordStrength(strength)
  }, [formData.password])

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {}
    
    switch (field) {
      case 'email':
        if (!value) {
          errors.email = 'Email is required'
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errors.email = 'Please enter a valid email'
        }
        break
      case 'fullName':
        if (!value) {
          errors.fullName = 'Full name is required'
        } else if (value.length < 2) {
          errors.fullName = 'Name must be at least 2 characters'
        }
        break
      case 'password':
        if (!value) {
          errors.password = 'Password is required'
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters'
        }
        break
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password'
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match'
        }
        break
      case 'department':
        if (!value) {
          errors.department = 'Please select a department'
        }
        break
      case 'contact':
        if (value && !/^[\d\s\-\+KATEX_INLINE_OPENKATEX_INLINE_CLOSE]+$/.test(value)) {
          errors.contact = 'Please enter a valid phone number'
        }
        break
    }
    
    setFieldErrors(prev => ({ ...prev, [field]: errors[field] || '' }))
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (touchedFields[field]) {
      validateField(field, value)
    }
  }

  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    validateField(field, formData[field as keyof typeof formData])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate all fields
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field as keyof typeof formData])
    })

    // Check for any errors
    const hasErrors = Object.values(fieldErrors).some(error => error !== '')
    if (hasErrors) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          department: formData.department,
          contact: formData.contact,
          address: formData.address,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Account created successfully!')
        
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          loginType: 'user',
          redirect: false
        })

        if (result?.ok) {
          router.push('/dashboard')
        } else {
          router.push('/auth/signin')
        }
      } else {
        setError(data.error || 'An error occurred during registration')
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('An error occurred during registration')
      toast.error('Registration failed')
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

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 2) return 'bg-orange-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    if (passwordStrength <= 4) return 'bg-lime-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 2) return 'Fair'
    if (passwordStrength <= 3) return 'Good'
    if (passwordStrength <= 4) return 'Strong'
    return 'Very Strong'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />
      
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Welcome Section */}
        <div className="hidden lg:block space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to RouteBook
            </h1>
            <p className="text-xl text-gray-600">
              Your comprehensive route management solution
            </p>
          </div>
          
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Smart Route Planning</h3>
                <p className="text-gray-600 text-sm">Optimize your routes with intelligent algorithms</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Department Integration</h3>
                <p className="text-gray-600 text-sm">Seamless collaboration across all departments</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
                <p className="text-gray-600 text-sm">Stay informed with live route tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              Join RouteBook to start managing routes efficiently
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name and Email Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange('fullName', e.target.value)}
                      onBlur={() => handleFieldBlur('fullName')}
                      className={cn(
                        "pl-10 transition-all",
                        touchedFields.fullName && fieldErrors.fullName && "border-red-500 focus:ring-red-500"
                      )}
                      required
                    />
                    {touchedFields.fullName && fieldErrors.fullName && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      className={cn(
                        "pl-10 transition-all",
                        touchedFields.email && fieldErrors.email && "border-red-500 focus:ring-red-500"
                      )}
                      required
                    />
                    {touchedFields.email && fieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Department and Contact Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => {
                      handleFieldChange('department', value)
                      handleFieldBlur('department')
                    }}
                  >
                    <SelectTrigger className={cn(
                      "transition-all",
                      touchedFields.department && fieldErrors.department && "border-red-500 focus:ring-red-500"
                    )}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept.charAt(0).toUpperCase() + dept.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touchedFields.department && fieldErrors.department && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.department}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-sm font-medium">
                    Contact Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="contact"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.contact}
                      onChange={(e) => handleFieldChange('contact', e.target.value)}
                      onBlur={() => handleFieldBlur('contact')}
                      className={cn(
                        "pl-10 transition-all",
                        touchedFields.contact && fieldErrors.contact && "border-red-500 focus:ring-red-500"
                      )}
                    />
                    {touchedFields.contact && fieldErrors.contact && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.contact}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, City, State"
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="pl-10 transition-all"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleFieldBlur('password')}
                      className={cn(
                        "pl-10 pr-10 transition-all",
                        touchedFields.password && fieldErrors.password && "border-red-500 focus:ring-red-500"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touchedFields.password && fieldErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Password strength:</span>
                        <span className={cn(
                          "font-medium",
                          passwordStrength <= 2 ? "text-red-500" : 
                          passwordStrength <= 3 ? "text-yellow-500" : 
                          "text-green-500"
                        )}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            getPasswordStrengthColor()
                          )}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                      onBlur={() => handleFieldBlur('confirmPassword')}
                      className={cn(
                        "pl-10 pr-10 transition-all",
                        touchedFields.confirmPassword && fieldErrors.confirmPassword && "border-red-500 focus:ring-red-500"
                      )}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]" 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create Account
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
              className="w-full hover:bg-gray-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              size="lg"
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
              Sign up with Google
            </Button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}