'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'icon' | 'sm' | 'lg'
  className?: string
  showText?: boolean
}

export default function LogoutButton({ 
  variant = 'outline', 
  size = 'sm', 
  className = '',
  showText = true 
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      toast.success('Logging out...')
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Sign out and redirect
      await signOut({ 
        callbackUrl: '/auth/signin',
        redirect: true 
      })
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error logging out')
      setIsLoggingOut(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-2">
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </span>
      )}
    </Button>
  )
}
