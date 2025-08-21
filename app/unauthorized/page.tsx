'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const handleGoHome = () => {
    if (session?.user?.role === 'admin') {
      router.push('/admin')
    } else if (session?.user?.role === 'driver') {
      router.push('/driver')
    } else if (session?.user?.role === 'department_head') {
      router.push('/department-head')
    } else if (session?.user?.role === 'project_manager') {
      router.push('/project-manager')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 backdrop-blur-sm text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
