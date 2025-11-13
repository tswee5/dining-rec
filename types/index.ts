// Database Types
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_city: string;
  preferred_cuisines: string[];
  price_range: number[];
  max_distance: number;
  vibe_tags: string[];
  age_range?: string;
  neighborhood?: string;
  dining_frequency?: string;
  typical_spend?: string;
  created_at: string;
  updated_at: string;
}

export type InteractionAction = 'like' | 'pass' | 'maybe' | 'save' | 'open';

export interface UserInteraction {
  id: string;
  user_id: string;
  place_id: string;
  action: InteractionAction;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Restaurant {
  place_id: string;
  data: RestaurantData;
  cached_at: string;
  website?: string;
  maps_url?: string;
  photo_references?: string[];
}

export interface RestaurantData {
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  business_status?: string;
  url?: string; // Google Maps URL
}

export interface PreferenceSummary {
  user_id: string;
  summary: string;
  updated_at: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListRestaurant {
  id: string;
  list_id: string;
  place_id: string;
  added_at: string;
}

// API Request/Response Types
export interface SearchFilters {
  city: string;
  cuisines?: string[];
  priceLevel?: number[];
  maxDistance?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  restaurants: RestaurantData[];
  totalCount: number;
  hasMore: boolean;
}

export interface RecommendationRequest {
  city: string;
  filters?: SearchFilters;
  chat?: string;
  force?: boolean;
}

export interface RecommendationResponse {
  recommendations: RestaurantData[];
}

export interface InteractionRequest {
  placeId: string;
  action: InteractionAction;
  metadata?: Record<string, any>;
}

export interface CreateListRequest {
  name: string;
}

export interface UpdateListRequest {
  name: string;
}

export interface AddToListRequest {
  placeId: string;
}

// UI Component Types
export interface RestaurantCardProps {
  restaurant: RestaurantData;
  onLike?: () => void;
  onPass?: () => void;
  onMaybe?: () => void;
  onSave?: () => void;
  onOpen?: () => void;
}

export interface FilterFormData {
  city: string;
  cuisines: string[];
  priceLevel: number[];
  maxDistance: number;
  minRating: number;
}

// Onboarding Types
export interface OnboardingStep1Data {
  defaultCity: string;
}

export interface OnboardingStep2Data {
  preferredCuisines: string[];
  priceRange: number[];
  maxDistance: number;
}

export interface OnboardingStep3Data {
  vibeTags: string[];
}

export type OnboardingData = OnboardingStep1Data & OnboardingStep2Data & OnboardingStep3Data;

// Claude API Types
export interface ClaudeRecommendation {
  name: string;
  cuisine: string;
  priceLevel: number;
  reasoning: string;
  expectedRating: number;
  neighborhood?: string;
}

export interface ClaudeRecommendationResponse {
  recommendations: ClaudeRecommendation[];
}
