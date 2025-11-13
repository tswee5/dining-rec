import { useState } from 'react';
import { Restaurant, UserFeedbackMap } from '../types';
import { mockRestaurants } from '../data/mockRestaurants';
import { Star, MapPin, X, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface MapViewProps {
  savedRestaurants: string[];
  onSaveRestaurant: (id: string) => void;
  userFeedback: UserFeedbackMap;
  onFeedback: (restaurantId: string, liked: boolean) => void;
}

export function MapView({ savedRestaurants, onSaveRestaurant, userFeedback, onFeedback }: MapViewProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Calculate relative positions for restaurants on a map grid
  const getMapPosition = (lat: number, lng: number) => {
    // NYC bounds approximation
    const minLat = 40.75;
    const maxLat = 40.77;
    const minLng = -73.99;
    const maxLng = -73.97;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;

    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="h-screen w-full relative bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 z-20 bg-background border rounded-lg shadow-lg px-3 sm:px-6 py-2 sm:py-3 max-w-[90%] sm:max-w-none">
        <h2 className="text-center text-base sm:text-lg">Restaurant Map View</h2>
        <p className="text-muted-foreground text-center text-xs sm:text-sm hidden sm:block">
          Click on markers to see restaurant details
        </p>
      </div>

      {/* Map Container */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid background to simulate map */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-gray-300" />
            ))}
          </div>
        </div>

        {/* Street labels */}
        <div className="absolute top-1/4 left-4 text-sm text-muted-foreground/60 rotate-90 origin-left">
          Madison Avenue
        </div>
        <div className="absolute bottom-1/4 left-4 text-sm text-muted-foreground/60 rotate-90 origin-left">
          Park Avenue
        </div>
        <div className="absolute top-4 left-1/4 text-sm text-muted-foreground/60">
          Broadway
        </div>
        <div className="absolute top-4 right-1/4 text-sm text-muted-foreground/60">
          Fifth Avenue
        </div>

        {/* Restaurant markers */}
        {mockRestaurants.map((restaurant) => {
          const position = getMapPosition(restaurant.location.lat, restaurant.location.lng);
          return (
            <button
              key={restaurant.id}
              className="absolute transform -translate-x-1/2 -translate-y-full transition-all hover:scale-110 z-10"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
              }}
              onClick={() => setSelectedRestaurant(restaurant)}
            >
              <div className="relative group">
                {/* Marker pin */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    savedRestaurants.includes(restaurant.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-primary -mt-1" />
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-background border rounded-lg shadow-xl px-3 py-2 whitespace-nowrap">
                    <p className="text-sm">{restaurant.name}</p>
                    <p className="text-xs text-muted-foreground">{restaurant.cuisine} • {restaurant.priceRange}</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Restaurant Card */}
      {selectedRestaurant && (
        <div className="absolute inset-0 bg-black/30 z-30 flex items-center justify-center p-4" onClick={() => setSelectedRestaurant(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-3 right-3 rounded-full"
                onClick={() => setSelectedRestaurant(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h2>{selectedRestaurant.name}</h2>
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span>{selectedRestaurant.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <span>{selectedRestaurant.cuisine}</span>
                <span>•</span>
                <span>{selectedRestaurant.priceRange}</span>
              </div>

              <p className="text-muted-foreground mb-4">
                {selectedRestaurant.description}
              </p>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span className="text-sm">{selectedRestaurant.location.address}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRestaurant.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  variant={savedRestaurants.includes(selectedRestaurant.id) ? "secondary" : "default"}
                  onClick={() => onSaveRestaurant(selectedRestaurant.id)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${savedRestaurants.includes(selectedRestaurant.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  {savedRestaurants.includes(selectedRestaurant.id) ? 'Saved' : 'Save Restaurant'}
                </Button>

                {/* Feedback buttons */}
                <div className="flex items-center gap-2 pt-3 border-t">
                  <span className="text-xs text-muted-foreground flex-1">Help us learn:</span>
                  <Button
                    size="sm"
                    variant={userFeedback[selectedRestaurant.id] === true ? "default" : "outline"}
                    className="h-8 px-3"
                    onClick={() => onFeedback(selectedRestaurant.id, true)}
                  >
                    <ThumbsUp className={`h-4 w-4 ${userFeedback[selectedRestaurant.id] === true ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant={userFeedback[selectedRestaurant.id] === false ? "destructive" : "outline"}
                    className="h-8 px-3"
                    onClick={() => onFeedback(selectedRestaurant.id, false)}
                  >
                    <ThumbsDown className={`h-4 w-4 ${userFeedback[selectedRestaurant.id] === false ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend - Hidden on mobile */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-20 bg-background border rounded-lg shadow-lg p-3 sm:p-4">
        <h3 className="mb-2 text-sm sm:text-base">Legend</h3>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
            </div>
            <span>Restaurant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 flex items-center justify-center">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
            </div>
            <span>Saved</span>
          </div>
        </div>
      </div>

      {/* Restaurant count */}
      <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-20 bg-background border rounded-lg shadow-lg px-3 sm:px-4 py-1.5 sm:py-2">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {mockRestaurants.length} nearby
        </p>
      </div>
    </div>
  );
}
