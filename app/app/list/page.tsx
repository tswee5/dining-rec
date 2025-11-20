'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ChatDock } from '@/components/ChatDock';
import { ChatPanel } from '@/components/ChatPanel';
import { toast } from 'sonner';
import { Loader2, Sparkles, SlidersHorizontal } from 'lucide-react';
import { CUISINE_OPTIONS, PRICE_LEVELS, DISTANCE_OPTIONS } from '@/lib/constants';
import { RestaurantCard } from '@/components/RestaurantCard';
import type { RestaurantData } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ListPage() {
  const [city, setCity] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<number[]>([1, 2, 3, 4]);
  const [maxDistance, setMaxDistance] = useState<number[]>([DISTANCE_OPTIONS.default]);
  const [minRating, setMinRating] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'search' | 'recommendations'>('search');
  const [showFilters, setShowFilters] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentChatIntent, setCurrentChatIntent] = useState<string>('');

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
    enabled: false, // Only run when triggered
    staleTime: 10 * 60 * 1000, // 10 minutes - keep results fresh across tab switches
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
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
    enabled: false, // Only run when triggered
    staleTime: 10 * 60 * 1000, // 10 minutes - keep results fresh across tab switches
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
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
    const placeId = `${restaurant.name}-${restaurant.formatted_address}`.toLowerCase().replace(/\s+/g, '-');
    interactionMutation.mutate({ placeId, action });
  };

  // Chat handlers
  const handleChatSubmit = async (message: string) => {
    if (!city.trim()) {
      toast.error('Please enter a city first');
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);
    setCurrentChatIntent(message);
    setIsChatLoading(true);

    try {
      // Call recommendations API with chat intent
      const response = await fetch('/api/places/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          chat: message,
          filters: {
            cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
            priceLevel: selectedPrices,
            maxDistance: maxDistance[0],
            minRating: minRating > 0 ? minRating : undefined,
          },
          limit: 10,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get recommendations');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I found ${data.recommendations.length} restaurants matching your request. Check them out below!`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);

      // Update view mode and trigger recommendations
      setViewMode('recommendations');
      setHasSearched(true);
      recommendationsQuery.refetch();

      toast.success('Recommendations updated!');
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't process that request: ${(error as Error).message}`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get recommendations');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    setCurrentChatIntent('');
    toast.success('Chat cleared');
  };

  // Get restaurants based on view mode
  const restaurants = viewMode === 'search'
    ? searchQuery.data?.restaurants || []
    : recommendationsQuery.data?.recommendations.map((r: any) => r.restaurant) || [];

  const isLoading = viewMode === 'search'
    ? searchQuery.isFetching
    : recommendationsQuery.isFetching;

  // Filter content component for reuse in drawer and sidebar
  const FilterContent = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">What are you craving?</h2>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g., New York, San Francisco"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Cuisines */}
        <div className="space-y-3">
          <Label>Cuisines</Label>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((cuisine) => (
              <Badge
                key={cuisine}
                variant={selectedCuisines.includes(cuisine) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisine}
              </Badge>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label>Price Range</Label>
          <div className="flex gap-4">
            {PRICE_LEVELS.map((level) => (
              <div key={level.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`price-${level.value}`}
                  checked={selectedPrices.includes(level.value)}
                  onCheckedChange={() => togglePrice(level.value)}
                />
                <label htmlFor={`price-${level.value}`} className="text-sm cursor-pointer">
                  {level.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Maximum Distance</Label>
            <span className="text-sm text-gray-600">{maxDistance[0]} miles</span>
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
      <div className="flex gap-3">
        <Button onClick={handleSearch} className="flex-1" disabled={searchQuery.isFetching}>
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
          className="flex-1"
          disabled={recommendationsQuery.isFetching}
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
    </div>
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header with Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Discover Restaurants</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {viewMode === 'recommendations'
              ? 'AI-powered recommendations based on your preferences'
              : 'Find your next favorite dining spot'}
          </p>
        </div>

        {/* Mobile Filter Button - Drawer */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden w-full sm:w-auto"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Filter Restaurants</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <FilterContent />
            </div>
          </DrawerContent>
        </Drawer>

        {/* Desktop Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="hidden lg:flex"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar Filters */}
        {showFilters && (
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Area */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {hasSearched ? (
            <div className="space-y-4">
              {isLoading && (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-4 text-sm sm:text-base">
                    {viewMode === 'recommendations' ? 'Getting AI recommendations...' : 'Finding restaurants...'}
                  </p>
                </div>
              )}

              {!isLoading && recommendationsQuery.isError && viewMode === 'recommendations' && (
                <div className="text-center py-12">
                  <p className="text-destructive font-medium text-sm sm:text-base">
                    {(recommendationsQuery.error as Error)?.message || 'Failed to get recommendations'}
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
                    Try interacting with more restaurants first, or try a regular search.
                  </p>
                </div>
              )}

              {!isLoading && restaurants.length === 0 && !recommendationsQuery.isError && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    No restaurants found. Try adjusting your filters.
                  </p>
                </div>
              )}

              {!isLoading && restaurants.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="text-muted-foreground text-sm sm:text-base">
                      Showing {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
                    </div>
                    {viewMode === 'recommendations' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Picks
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {restaurants.map((restaurant: RestaurantData, index: number) => (
                      <RestaurantCard
                        key={index}
                        restaurant={restaurant}
                        onPass={() => handleInteraction(restaurant, 'pass')}
                        onMaybe={() => handleInteraction(restaurant, 'maybe')}
                        onLike={() => handleInteraction(restaurant, 'like')}
                        onSave={() => handleInteraction(restaurant, 'save')}
                        isInteracting={interactionMutation.isPending}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm sm:text-base">
                Enter a city and select your preferences to discover restaurants
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Components */}
      <ChatPanel
        open={isChatPanelOpen}
        onOpenChange={setIsChatPanelOpen}
        messages={chatMessages}
        isLoading={isChatLoading}
        onClearChat={handleClearChat}
        currentIntent={currentChatIntent}
      />

      <ChatDock
        onSubmit={handleChatSubmit}
        onOpenPanel={() => setIsChatPanelOpen(true)}
        isPanelOpen={isChatPanelOpen}
        disabled={isChatLoading}
        placeholder="Try: 'Date night in East Village, pasta + wine, under $50pp'"
      />
    </div>
  );
}
