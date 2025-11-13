'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Heart,
  X,
  HelpCircle,
  Star,
  MapPin,
  DollarSign,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { CUISINE_OPTIONS, PRICE_LEVELS, DISTANCE_OPTIONS } from '@/lib/constants';
import type { RestaurantData } from '@/types';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function MapPage() {
  const [city, setCity] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<number[]>([1, 2, 3, 4]);
  const [maxDistance, setMaxDistance] = useState([DISTANCE_OPTIONS.default]);
  const [minRating, setMinRating] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'recommendations'>('search');
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantData | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to SF
  const [userInteractions, setUserInteractions] = useState<Record<string, string>>({});

  const searchQuery = useQuery({
    queryKey: ['restaurants', city, selectedCuisines, selectedPrices, maxDistance, minRating],
    queryFn: async () => {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          cuisines: selectedCuisines,
          priceLevel: selectedPrices,
          maxDistance: maxDistance[0],
          minRating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search restaurants');
      }

      return response.json();
    },
    enabled: false,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['recommendations', city],
    queryFn: async () => {
      const response = await fetch('/api/places/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, limit: 10 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get recommendations');
      }

      return response.json();
    },
    enabled: false,
  });

  const interactionMutation = useMutation({
    mutationFn: async ({ placeId, action }: { placeId: string; action: string }) => {
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to save interaction');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update local interactions state
      setUserInteractions((prev) => ({
        ...prev,
        [variables.placeId]: variables.action,
      }));

      if (variables.action === 'like') {
        toast.success('Added to likes!');
      } else if (variables.action === 'save') {
        toast.success('Saved to favorites!');
      } else if (variables.action === 'maybe') {
        toast.success('Added to maybe list!');
      }
    },
    onError: () => {
      toast.error('Failed to save action');
    },
  });

  const handleSearch = () => {
    if (!city.trim()) {
      toast.error('Please enter a city');
      return;
    }
    setViewMode('search');
    setHasSearched(true);
    searchQuery.refetch();
  };

  const handleGetRecommendations = () => {
    if (!city.trim()) {
      toast.error('Please enter a city');
      return;
    }
    setViewMode('recommendations');
    setHasSearched(true);
    recommendationsQuery.refetch();
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const togglePrice = (level: number) => {
    setSelectedPrices((prev) =>
      prev.includes(level) ? prev.filter((p) => p !== level) : [...prev, level]
    );
  };

  const handleInteraction = (restaurant: RestaurantData, action: string) => {
    const placeId = `${restaurant.name}-${restaurant.formatted_address}`
      .toLowerCase()
      .replace(/\s+/g, '-');
    interactionMutation.mutate({ placeId, action });
  };

  const restaurants = viewMode === 'search'
    ? searchQuery.data?.restaurants || []
    : recommendationsQuery.data?.recommendations.map((r: any) => r.restaurant) || [];

  const isLoading = viewMode === 'search'
    ? searchQuery.isFetching
    : recommendationsQuery.isFetching;

  // Update map center when we have restaurants
  useEffect(() => {
    if (restaurants.length > 0) {
      const firstRestaurant = restaurants[0];
      setMapCenter({
        lat: firstRestaurant.geometry.location.lat,
        lng: firstRestaurant.geometry.location.lng,
      });
    }
  }, [restaurants]);

  // Get pin color based on user interaction
  const getPinColor = (restaurant: RestaurantData) => {
    const placeId = `${restaurant.name}-${restaurant.formatted_address}`
      .toLowerCase()
      .replace(/\s+/g, '-');
    const interaction = userInteractions[placeId];

    if (interaction === 'like' || interaction === 'save') return '#10b981'; // green
    if (interaction === 'pass') return '#ef4444'; // red
    if (interaction === 'maybe') return '#f59e0b'; // yellow
    return '#3b82f6'; // default blue
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-96 overflow-y-auto border-r bg-white">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Map View</h1>
            <p className="text-gray-600 mt-1">Find restaurants on the map</p>
          </div>

          {/* Filters */}
          <Card className="p-4 space-y-4">
            <h2 className="font-semibold">Search Filters</h2>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., New York"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Cuisines */}
            <div className="space-y-2">
              <Label>Cuisines</Label>
              <div className="flex flex-wrap gap-1">
                {CUISINE_OPTIONS.slice(0, 8).map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant={selectedCuisines.includes(cuisine) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex gap-2">
                {PRICE_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-1">
                    <Checkbox
                      id={`price-${level.value}`}
                      checked={selectedPrices.includes(level.value)}
                      onCheckedChange={() => togglePrice(level.value)}
                    />
                    <label htmlFor={`price-${level.value}`} className="text-xs cursor-pointer">
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Distance</Label>
                <span className="text-xs text-gray-600">{maxDistance[0]} miles</span>
              </div>
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                min={DISTANCE_OPTIONS.min}
                max={DISTANCE_OPTIONS.max}
                step={DISTANCE_OPTIONS.step}
              />
            </div>

            {/* Search Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={handleSearch} className="w-full" disabled={isLoading}>
                {searchQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Find Restaurants'
                )}
              </Button>
              <Button
                onClick={handleGetRecommendations}
                variant="secondary"
                className="w-full"
                disabled={isLoading}
              >
                {recommendationsQuery.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Recommendations
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Results Summary */}
          {hasSearched && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
                </p>
                {viewMode === 'recommendations' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Picks
                  </Badge>
                )}
              </div>

              {/* Legend */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-600">Pin Colors:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>New</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Liked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Maybe</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Passed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error States */}
          {!isLoading && recommendationsQuery.isError && viewMode === 'recommendations' && (
            <div className="text-center py-4">
              <p className="text-red-600 text-sm font-medium">
                {(recommendationsQuery.error as Error)?.message || 'Failed to get recommendations'}
              </p>
              <p className="text-gray-600 mt-1 text-xs">
                Try interacting with more restaurants first.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!hasSearched ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Enter a city and search to view restaurants on the map</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-gray-600">
                {viewMode === 'recommendations' ? 'Getting AI recommendations...' : 'Finding restaurants...'}
              </p>
            </div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-gray-600">No restaurants found. Try adjusting your filters.</p>
            </div>
          </div>
        ) : (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultZoom={13}
              center={mapCenter}
              mapId="tasteswipe-map"
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {restaurants.map((restaurant: RestaurantData, index: number) => {
                const position = {
                  lat: restaurant.geometry.location.lat,
                  lng: restaurant.geometry.location.lng,
                };
                const pinColor = getPinColor(restaurant);

                return (
                  <AdvancedMarker
                    key={index}
                    position={position}
                    onClick={() => setSelectedRestaurant(restaurant)}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: pinColor }}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                  </AdvancedMarker>
                );
              })}

              {selectedRestaurant && (
                <InfoWindow
                  position={{
                    lat: selectedRestaurant.geometry.location.lat,
                    lng: selectedRestaurant.geometry.location.lng,
                  }}
                  onCloseClick={() => setSelectedRestaurant(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-sm mb-1">{selectedRestaurant.name}</h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {selectedRestaurant.formatted_address}
                    </p>

                    {/* Rating & Price */}
                    <div className="flex items-center gap-3 text-xs mb-3">
                      {selectedRestaurant.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{selectedRestaurant.rating}</span>
                        </div>
                      )}
                      {selectedRestaurant.price_level && (
                        <div className="flex items-center text-gray-600">
                          {Array(selectedRestaurant.price_level)
                            .fill(0)
                            .map((_, i) => (
                              <DollarSign key={i} className="w-3 h-3" />
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 px-2"
                        onClick={() => handleInteraction(selectedRestaurant, 'pass')}
                        disabled={interactionMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 px-2"
                        onClick={() => handleInteraction(selectedRestaurant, 'maybe')}
                        disabled={interactionMutation.isPending}
                      >
                        <HelpCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 px-2"
                        onClick={() => handleInteraction(selectedRestaurant, 'like')}
                        disabled={interactionMutation.isPending}
                      >
                        <Heart className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-7 px-2"
                        onClick={() => handleInteraction(selectedRestaurant, 'save')}
                        disabled={interactionMutation.isPending}
                      >
                        <Star className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        )}
      </div>
    </div>
  );
}
