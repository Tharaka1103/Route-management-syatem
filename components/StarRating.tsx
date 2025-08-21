'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface StarRatingProps {
  rideId: string
  currentRating?: number
  driverName?: string
  onRatingSubmit?: (rating: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ 
  rideId, 
  currentRating, 
  driverName, 
  onRatingSubmit, 
  disabled = false,
  size = 'md'
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(currentRating || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const starSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleRating = async (rating: number) => {
    if (disabled || currentRating) return

    setSelectedRating(rating)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/rides/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, rating })
      })

      if (response.ok) {
        toast.success(`Thank you for rating ${driverName || 'the driver'}!`)
        onRatingSubmit?.(rating)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to submit rating')
        setSelectedRating(currentRating || 0)
      }
    } catch (error) {
      toast.error('Error submitting rating')
      setSelectedRating(currentRating || 0)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoveredRating || selectedRating || currentRating || 0

  if (currentRating) {
    // Display existing rating (read-only)
    return (
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-600">Your rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize[size]} ${
              star <= currentRating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600">({currentRating}/5)</span>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-500">Rating not available</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-600">Rate {driverName || 'driver'}:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            disabled={isSubmitting}
            className="transition-colors duration-150 disabled:cursor-not-allowed"
          >
            <Star
              className={`${starSize[size]} transition-colors ${
                star <= displayRating 
                  ? 'text-yellow-400 fill-current hover:text-yellow-500' 
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            />
          </button>
        ))}
        {selectedRating > 0 && (
          <span className="text-sm text-gray-600">({selectedRating}/5)</span>
        )}
      </div>
      
      {hoveredRating > 0 && (
        <p className="text-xs text-gray-500">
          {hoveredRating === 1 ? 'Poor' :
           hoveredRating === 2 ? 'Fair' :
           hoveredRating === 3 ? 'Good' :
           hoveredRating === 4 ? 'Very Good' : 'Excellent'}
        </p>
      )}
      
      {isSubmitting && (
        <p className="text-xs text-blue-600">Submitting rating...</p>
      )}
    </div>
  )
}
