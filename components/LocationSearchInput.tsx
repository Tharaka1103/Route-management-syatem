// components/LocationSearchInput.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, Navigation } from 'lucide-react';

// Define our own location interface to avoid conflicts
interface RideLocation {
  lat: number;
  lng: number;
  address: string;
  display_name?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type: string;
  importance: number;
}

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  onLocationSelect: (location: RideLocation | null) => void;
  selectedLocation: RideLocation | null;
  iconColor: string;
  value: string;
  onChange: (value: string) => void;
}

export default function LocationSearchInput({ 
  label, 
  placeholder, 
  onLocationSelect, 
  selectedLocation,
  iconColor,
  value,
  onChange
}: LocationSearchInputProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim API for geocoding (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=lk&addressdetails=1&bounded=1&viewbox=79.5,5.5,81.5,10.5`
      );
      
      if (response.ok) {
        const data: SearchResult[] = await response.json();
        // Sort by importance and filter relevant results
        const sortedResults = data
          .filter(result => result.importance > 0.3)
          .sort((a, b) => b.importance - a.importance);
        setSearchResults(sortedResults);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value && isFocused && !selectedLocation) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, isFocused, selectedLocation]);

  const handleLocationSelect = (result: SearchResult) => {
    const location: RideLocation = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name.split(',').slice(0, 3).join(',').trim(),
      display_name: result.display_name
    };
    
    onLocationSelect(location);
    onChange(location.address);
    setShowResults(false);
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear selected location if user starts typing again
    if (selectedLocation && newValue !== selectedLocation.address) {
      onLocationSelect(null);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value && !selectedLocation) {
      searchLocations(value);
    }
  };

  const handleBlur = () => {
    // Delay hiding results to allow for selection
    setTimeout(() => {
      setIsFocused(false);
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="space-y-2 relative">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <MapPin 
          className={`absolute left-3 top-3 w-4 h-4 z-10`} 
          style={{ color: selectedLocation ? iconColor : '#9CA3AF' }} 
        />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`pl-10 pr-10 transition-all duration-300 focus:ring-2 focus:ring-blue-500 ${
            selectedLocation ? 'border-green-300 bg-green-50' : ''
          }`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-gray-400" />
        )}
        {selectedLocation && (
          <Navigation className="absolute right-3 top-3 w-4 h-4 text-green-500" />
        )}
      </div>
      
      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg border-2 border-blue-100">
          <CardContent className="p-0">
            {searchResults.map((result, index) => (
              <button
                key={result.place_id}
                onClick={() => handleLocationSelect(result)}
                className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200 focus:outline-none focus:bg-blue-50"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5" style={{ color: iconColor }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">Selected Location</p>
              <p className="text-xs text-green-700 break-words">{selectedLocation.address}</p>
              <p className="text-xs text-green-600 font-mono mt-1">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export the type for use in other components
export type { RideLocation };