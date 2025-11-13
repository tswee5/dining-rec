'use client';

import { RestaurantData } from '@/types';
import { Star, MapPin, DollarSign, Clock, Heart, X, HelpCircle, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './ImageWithFallback';

interface RestaurantCardProps {
  restaurant: RestaurantData;
  onPass?: (restaurant: RestaurantData) => void;
  onMaybe?: (restaurant: RestaurantData) => void;
  onLike?: (restaurant: RestaurantData) => void;
  onSave?: (restaurant: RestaurantData) => void;
  onThumbsUp?: (restaurant: RestaurantData) => void;
  onThumbsDown?: (restaurant: RestaurantData) => void;
  isSaved?: boolean;
  isInteracting?: boolean;
  userFeedback?: 'up' | 'down' | null;
}

export function RestaurantCard({
  restaurant,
  onPass,
  onMaybe,
  onLike,
  onSave,
  onThumbsUp,
  onThumbsDown,
  isSaved,
  isInteracting,
  userFeedback
}: RestaurantCardProps) {
  // Get photo URL from Google Places API
  const getPhotoUrl = () => {
    if (restaurant.photos && restaurant.photos.length > 0) {
      const photoRef = restaurant.photos[0].photo_reference;
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    }
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(restaurant.name)}`;
  };

  // Get cuisine type from types array
  const getCuisine = () => {
    const cuisineTypes = restaurant.types.filter(type =>
      !['point_of_interest', 'establishment', 'food'].includes(type)
    );
    return cuisineTypes[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Restaurant';
  };

  // Get current open status
  const getOpenStatus = () => {
    if (restaurant.opening_hours?.open_now !== undefined) {
      return restaurant.opening_hours.open_now ? 'Open now' : 'Closed';
    }
    return 'Hours not available';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40 sm:h-48">
        <ImageWithFallback
          src={getPhotoUrl()}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {onSave && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 rounded-full h-8 w-8 sm:h-10 sm:w-10 shadow-lg"
            onClick={() => onSave(restaurant)}
            disabled={isInteracting}
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        {/* Title and Rating */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="flex-1 text-base sm:text-lg font-semibold line-clamp-1">{restaurant.name}</h3>
          {restaurant.rating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm sm:text-base font-medium">{restaurant.rating}</span>
              {restaurant.user_ratings_total && (
                <span className="text-xs sm:text-sm text-muted-foreground">
                  ({restaurant.user_ratings_total})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cuisine and Price */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3 text-muted-foreground text-sm sm:text-base">
          <span>{getCuisine()}</span>
          {restaurant.price_level && (
            <>
              <span>•</span>
              <div className="flex items-center">
                {Array(restaurant.price_level)
                  .fill(0)
                  .map((_, i) => (
                    <DollarSign key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Location and Hours */}
        <div className="space-y-1.5 sm:space-y-2 mb-3">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
            <span className="text-xs sm:text-sm line-clamp-1">{restaurant.formatted_address}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className={`text-xs sm:text-sm ${restaurant.opening_hours?.open_now ? 'text-green-600' : ''}`}>
              {getOpenStatus()}
            </span>
          </div>
        </div>

        {/* Tags from types */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {restaurant.types.slice(0, 3).filter(type =>
            !['point_of_interest', 'establishment', 'food'].includes(type)
          ).map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              {type.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>

        {/* Action Buttons */}
        {(onPass || onMaybe || onLike) && (
          <div className="flex gap-2 pt-2 border-t">
            {onPass && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-50 h-8 sm:h-9"
                onClick={() => onPass(restaurant)}
                disabled={isInteracting}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                Pass
              </Button>
            )}
            {onMaybe && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-yellow-600 hover:bg-yellow-50 h-8 sm:h-9"
                onClick={() => onMaybe(restaurant)}
                disabled={isInteracting}
              >
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                Maybe
              </Button>
            )}
            {onLike && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-green-600 hover:bg-green-50 h-8 sm:h-9"
                onClick={() => onLike(restaurant)}
                disabled={isInteracting}
              >
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                Like
              </Button>
            )}
          </div>
        )}

        {/* Quick Feedback - Thumbs Up/Down */}
        {(onThumbsUp || onThumbsDown) && (
          <div className="flex items-center gap-2 pt-3 border-t mt-3">
            <span className="text-xs text-muted-foreground flex-1">Quick feedback:</span>
            {onThumbsUp && (
              <Button
                size="sm"
                variant={userFeedback === 'up' ? 'default' : 'outline'}
                className="h-8 px-3"
                onClick={() => onThumbsUp(restaurant)}
                disabled={isInteracting}
              >
                <ThumbsUp className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${userFeedback === 'up' ? 'fill-current' : ''}`} />
              </Button>
            )}
            {onThumbsDown && (
              <Button
                size="sm"
                variant={userFeedback === 'down' ? 'destructive' : 'outline'}
                className="h-8 px-3"
                onClick={() => onThumbsDown(restaurant)}
                disabled={isInteracting}
              >
                <ThumbsDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${userFeedback === 'down' ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
        )}

        {/* Website and Reserve Buttons */}
        {(restaurant.website || restaurant.url) && (
          <div className="flex gap-2 pt-3 border-t mt-3">
            {restaurant.website && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 sm:h-9"
                asChild
              >
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  Website
                </a>
              </Button>
            )}
            {restaurant.url && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 sm:h-9"
                asChild
              >
                <a href={restaurant.url} target="_blank" rel="noopener noreferrer">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  View on Maps
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
