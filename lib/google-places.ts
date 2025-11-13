import { RestaurantData } from '@/types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_API_BASE = 'https://places.googleapis.com/v1';

export interface PlacesSearchParams {
  city: string;
  cuisines?: string[];
  priceLevel?: number[];
  maxDistance?: number;
  minRating?: number;
  limit?: number;
}

/**
 * Search for restaurants using Google Places API (New)
 */
export async function searchRestaurants(params: PlacesSearchParams): Promise<RestaurantData[]> {
  const { city, cuisines, priceLevel, minRating, limit = 20 } = params;

  // Build the text query
  let query = `restaurants in ${city}`;
  if (cuisines && cuisines.length > 0) {
    query = `${cuisines.join(' or ')} ${query}`;
  }

  const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location,places.photos,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.businessStatus',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.min(limit, 20), // API max is 20
      ...(minRating && { minRating }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google Places API error:', error);
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();
  const places = data.places || [];

  // Filter by price level if specified
  let filteredPlaces = places;
  if (priceLevel && priceLevel.length > 0) {
    filteredPlaces = places.filter((place: any) => {
      const placePriceLevel = convertPriceLevelToNumber(place.priceLevel);
      return priceLevel.includes(placePriceLevel);
    });
  }

  // Convert to our RestaurantData format
  return filteredPlaces.map((place: any) => convertPlaceToRestaurant(place));
}

/**
 * Get details for a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<RestaurantData> {
  const response = await fetch(`${PLACES_API_BASE}/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,priceLevel,types,location,photos,internationalPhoneNumber,websiteUri,regularOpeningHours,businessStatus',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const place = await response.json();
  return convertPlaceToRestaurant(place);
}

/**
 * Convert Google Places price level to our number format (1-4)
 */
function convertPriceLevelToNumber(priceLevel?: string): number {
  if (!priceLevel) return 2; // Default to moderate

  const mapping: Record<string, number> = {
    'PRICE_LEVEL_FREE': 1,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'PRICE_LEVEL_MODERATE': 2,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4,
  };

  return mapping[priceLevel] || 2;
}

/**
 * Convert Google Place to our RestaurantData format
 */
function convertPlaceToRestaurant(place: any): RestaurantData {
  const photos = place.photos?.map((photo: any) => ({
    photo_reference: photo.name,
    width: photo.widthPx || 400,
    height: photo.heightPx || 300,
  })) || [];

  return {
    name: place.displayName?.text || 'Unknown Restaurant',
    formatted_address: place.formattedAddress || '',
    formatted_phone_number: place.internationalPhoneNumber,
    website: place.websiteUri,
    rating: place.rating,
    user_ratings_total: place.userRatingCount || 0,
    price_level: convertPriceLevelToNumber(place.priceLevel),
    types: place.types || [],
    geometry: {
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
    },
    photos,
    opening_hours: place.regularOpeningHours ? {
      open_now: place.regularOpeningHours.openNow || false,
      weekday_text: place.regularOpeningHours.weekdayDescriptions || [],
    } : undefined,
    business_status: place.businessStatus,
  };
}

/**
 * Get photo URL from photo reference
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  // For new Places API, the photo name is the full resource name
  return `${PLACES_API_BASE}/${photoReference}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`;
}
