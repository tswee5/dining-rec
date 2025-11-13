// Cuisine Options
export const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Japanese',
  'Thai',
  'Indian',
  'American',
  'Mediterranean',
  'Chinese',
  'French',
  'Korean',
  'Vietnamese',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'Brazilian',
  'Caribbean',
  'Seafood',
  'Steakhouse',
  'Vegetarian',
  'Vegan',
] as const;

// Price Level Options
export const PRICE_LEVELS = [
  { value: 1, label: '$', description: 'Inexpensive' },
  { value: 2, label: '$$', description: 'Moderate' },
  { value: 3, label: '$$$', description: 'Expensive' },
  { value: 4, label: '$$$$', description: 'Very Expensive' },
] as const;

// Vibe Tags
export const VIBE_TAGS = [
  'Romantic',
  'Casual',
  'Trendy',
  'Family-friendly',
  'Quiet',
  'Lively',
  'Outdoor seating',
  'Date night',
  'Business',
  'Quick bite',
  'Fine dining',
  'Local favorite',
  'Hidden gem',
  'Instagram-worthy',
] as const;

// Distance Options (in miles)
export const DISTANCE_OPTIONS = {
  min: 0.5,
  max: 25,
  default: 10,
  step: 0.5,
} as const;

// Rating Options
export const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
] as const;

// Pagination
export const RESULTS_PER_PAGE = 20;

// Interaction Thresholds
export const MIN_INTERACTIONS_FOR_RECOMMENDATIONS = 5;

// Cache TTL (in days)
export const RESTAURANT_CACHE_TTL_DAYS = 7;

// API Rate Limits
export const RECOMMENDATION_RATE_LIMIT_MINUTES = 5;

// Map Configuration
export const DEFAULT_MAP_ZOOM = 13;
export const MAP_CENTER_DEFAULT = { lat: 40.7128, lng: -74.0060 }; // NYC default

// Pin Colors
export const PIN_COLORS = {
  default: '#9CA3AF',
  liked: '#10B981',
  maybe: '#F59E0B',
  saved: '#FBBF24',
  passed: '#EF4444',
} as const;
