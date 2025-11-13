export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  description: string;
  image: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  tags: string[];
  hours: string;
}

export interface UserPreferences {
  cuisine: string[];
  priceRange: string[];
  dietary: string[];
  distance: number;
}

export interface RestaurantList {
  id: string;
  name: string;
  description: string;
  restaurantIds: string[];
  createdAt: string;
}

export interface UserFeedback {
  restaurantId: string;
  liked: boolean; // true for thumbs up, false for thumbs down
  timestamp: string;
}

export interface UserFeedbackMap {
  [restaurantId: string]: boolean; // true = liked, false = disliked
}
