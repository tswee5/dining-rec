import { useState, useEffect } from 'react';
import { Restaurant, UserPreferences, UserFeedbackMap } from '../types';
import { mockRestaurants } from '../data/mockRestaurants';
import { RestaurantCard } from './RestaurantCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from './ui/drawer';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { RecommendationEngine } from '../utils/recommendationEngine';
import { Badge } from './ui/badge';

interface ListPageProps {
  savedRestaurants: string[];
  onSaveRestaurant: (id: string) => void;
  userFeedback: UserFeedbackMap;
  onFeedback: (restaurantId: string, liked: boolean) => void;
}

export function ListPage({ savedRestaurants, onSaveRestaurant, userFeedback, onFeedback }: ListPageProps) {
  const [showFilters, setShowFilters] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    cuisine: [],
    priceRange: [],
    dietary: [],
    distance: 5
  });
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [useRecommendations, setUseRecommendations] = useState(false);

  const cuisines = ['Italian', 'Japanese', 'Mexican', 'French', 'Asian', 'Mediterranean'];
  const priceRanges = ['$', '$$', '$$$', '$$$$'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'];

  const handleCuisineChange = (cuisine: string, checked: boolean) => {
    const updated = checked
      ? [...preferences.cuisine, cuisine]
      : preferences.cuisine.filter(c => c !== cuisine);
    setPreferences({ ...preferences, cuisine: updated });
  };

  const handlePriceChange = (price: string, checked: boolean) => {
    const updated = checked
      ? [...preferences.priceRange, price]
      : preferences.priceRange.filter(p => p !== price);
    setPreferences({ ...preferences, priceRange: updated });
  };

  const handleDietaryChange = (dietary: string, checked: boolean) => {
    const updated = checked
      ? [...preferences.dietary, dietary]
      : preferences.dietary.filter(d => d !== dietary);
    setPreferences({ ...preferences, dietary: updated });
  };

  const applyFilters = () => {
    if (useRecommendations && Object.keys(userFeedback).length > 0) {
      // Use recommendation engine
      const recommended = RecommendationEngine.getRecommendations(
        mockRestaurants,
        userFeedback,
        preferences.cuisine.length > 0 || preferences.priceRange.length > 0 ? preferences : undefined
      );
      setFilteredRestaurants(recommended);
    } else {
      // Use basic filtering
      let filtered = mockRestaurants;

      if (preferences.cuisine.length > 0) {
        filtered = filtered.filter(r => preferences.cuisine.includes(r.cuisine));
      }

      if (preferences.priceRange.length > 0) {
        filtered = filtered.filter(r => preferences.priceRange.includes(r.priceRange));
      }

      setFilteredRestaurants(filtered);
    }
  };

  // Auto-apply filters when feedback changes if recommendations are enabled
  useEffect(() => {
    if (useRecommendations && Object.keys(userFeedback).length > 0) {
      applyFilters();
    }
  }, [userFeedback, useRecommendations]);

  // Get user insights
  const insights = Object.keys(userFeedback).length > 0 
    ? RecommendationEngine.getUserInsights(userFeedback, mockRestaurants)
    : null;

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block">Cuisine Type</Label>
        <div className="space-y-3">
          {cuisines.map((cuisine) => (
            <div key={cuisine} className="flex items-center space-x-2">
              <Checkbox
                id={cuisine}
                checked={preferences.cuisine.includes(cuisine)}
                onCheckedChange={(checked) => 
                  handleCuisineChange(cuisine, checked as boolean)
                }
              />
              <label htmlFor={cuisine} className="text-sm cursor-pointer">
                {cuisine}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Price Range</Label>
        <div className="space-y-3">
          {priceRanges.map((price) => (
            <div key={price} className="flex items-center space-x-2">
              <Checkbox
                id={price}
                checked={preferences.priceRange.includes(price)}
                onCheckedChange={(checked) => 
                  handlePriceChange(price, checked as boolean)
                }
              />
              <label htmlFor={price} className="text-sm cursor-pointer">
                {price}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Dietary Preferences</Label>
        <div className="space-y-3">
          {dietaryOptions.map((dietary) => (
            <div key={dietary} className="flex items-center space-x-2">
              <Checkbox
                id={dietary}
                checked={preferences.dietary.includes(dietary)}
                onCheckedChange={(checked) => 
                  handleDietaryChange(dietary, checked as boolean)
                }
              />
              <label htmlFor={dietary} className="text-sm cursor-pointer">
                {dietary}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-3 block">
          Distance: {preferences.distance} miles
        </Label>
        <Slider
          value={[preferences.distance]}
          onValueChange={(value) => 
            setPreferences({ ...preferences, distance: value[0] })
          }
          max={25}
          min={1}
          step={1}
        />
      </div>

      <div className="space-y-3">
        {Object.keys(userFeedback).length > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-primary/10 rounded-lg">
            <Checkbox
              id="use-recommendations"
              checked={useRecommendations}
              onCheckedChange={(checked) => setUseRecommendations(checked as boolean)}
            />
            <label htmlFor="use-recommendations" className="text-sm cursor-pointer flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Recommendations
            </label>
          </div>
        )}
        
        <Button className="w-full" onClick={applyFilters}>
          <Search className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* User Insights Banner */}
      {insights && insights.favoriteCuisines.length > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-2 sm:gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base mb-2">Your Preferences</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
                {insights.favoriteCuisines.slice(0, 3).map((cuisine) => (
                  <Badge key={cuisine} variant="secondary" className="bg-purple-100 dark:bg-purple-900">
                    {cuisine}
                  </Badge>
                ))}
                {insights.preferredPriceRanges.slice(0, 2).map((price) => (
                  <Badge key={price} variant="secondary" className="bg-pink-100 dark:bg-pink-900">
                    {price}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl">Discover Restaurants</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {useRecommendations && Object.keys(userFeedback).length > 0 
              ? 'Personalized recommendations based on your preferences'
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <div className="mb-3 sm:mb-4 text-muted-foreground text-sm sm:text-base">
            Showing {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onSave={onSaveRestaurant}
                isSaved={savedRestaurants.includes(restaurant.id)}
                onFeedback={onFeedback}
                userFeedback={userFeedback[restaurant.id] ?? null}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
