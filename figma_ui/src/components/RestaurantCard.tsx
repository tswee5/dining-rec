import { Restaurant } from '../types';
import { Star, MapPin, DollarSign, Clock, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  onFeedback?: (restaurantId: string, liked: boolean) => void;
  userFeedback?: boolean | null; // true = liked, false = disliked, null = no feedback
}

export function RestaurantCard({ restaurant, onSave, isSaved, onFeedback, userFeedback }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40 sm:h-48">
        <ImageWithFallback
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        {onSave && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 sm:top-3 sm:right-3 rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => onSave(restaurant.id)}
          >
            <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        )}
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="flex-1 text-base sm:text-lg line-clamp-1">{restaurant.name}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm sm:text-base">{restaurant.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2 sm:mb-3 text-muted-foreground text-sm sm:text-base">
          <span>{restaurant.cuisine}</span>
          <span>•</span>
          <span>{restaurant.priceRange}</span>
        </div>

        <p className="text-muted-foreground mb-2 sm:mb-3 text-sm sm:text-base line-clamp-2">{restaurant.description}</p>

        <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
            <span className="text-xs sm:text-sm line-clamp-1">{restaurant.location.address}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{restaurant.hours}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {restaurant.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Feedback buttons */}
        {onFeedback && (
          <div className="flex items-center gap-2 pt-3 border-t">
            <span className="text-xs text-muted-foreground flex-1">Help us learn:</span>
            <Button
              size="sm"
              variant={userFeedback === true ? "default" : "outline"}
              className="h-8 px-3"
              onClick={() => onFeedback(restaurant.id, true)}
            >
              <ThumbsUp className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${userFeedback === true ? 'fill-current' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant={userFeedback === false ? "destructive" : "outline"}
              className="h-8 px-3"
              onClick={() => onFeedback(restaurant.id, false)}
            >
              <ThumbsDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${userFeedback === false ? 'fill-current' : ''}`} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
