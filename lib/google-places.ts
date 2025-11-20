import { RestaurantData } from '@/types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_API_BASE = 'https://places.googleapis.com/v1';

// In-memory cache for pending requests to prevent duplicates
const pendingRequests = new Map<string, Promise<RestaurantData[]>>();

export interface PlacesSearchParams {
  city: string;
  query?: string; // Free-form search query (e.g., restaurant name)
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
  // Create cache key for request deduplication
  const cacheKey = JSON.stringify(params);
  
  // Check if request is already pending
  if (pendingRequests.has(cacheKey)) {
    console.log('Request deduplication: reusing pending request');
    return pendingRequests.get(cacheKey)!;
  }

  // Create the actual search function
  const performSearch = async (): Promise<RestaurantData[]> => {
    const { city, query: customQuery, cuisines, priceLevel, minRating, limit = 20 } = params;

    // Build the text query
    let query = customQuery || `restaurants in ${city}`;
    if (!customQuery && cuisines && cuisines.length > 0) {
      query = `${cuisines.join(' or ')} ${query}`;
    } else if (customQuery && !customQuery.toLowerCase().includes(city.toLowerCase())) {
      // If custom query doesn't include city, append it
      query = `${customQuery} in ${city}`;
    }

    const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      // Optimized field mask: only request fields we actually use
      // Fields: id, name, address, rating, price, types, location, photos, phone, website, hours, status
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location,places.photos,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.businessStatus',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.min(limit, 20), // API max is 20
      ...(minRating && { minRating }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }
    console.error('Google Places API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorDetails,
      request: { 
        textQuery: query, 
        maxResultCount: Math.min(limit, 20),
        fieldMask: 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location,places.photos,places.internationalPhoneNumber,places.websiteUri,places.regularOpeningHours,places.businessStatus'
      },
      apiKeyConfigured: !!GOOGLE_PLACES_API_KEY
    });
    
    // Provide helpful error message based on status code
    if (response.status === 400) {
      throw new Error(`Invalid request to Google Places API: ${JSON.stringify(errorDetails)}. Check API key permissions, enabled APIs (Places API New), and request format.`);
    }
    throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(errorDetails)}`);
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
  };

  // Create request promise and store it
  const requestPromise = performSearch();
  pendingRequests.set(cacheKey, requestPromise);

  // Clean up after request completes (success or error)
  requestPromise.finally(() => {
    // Small delay before cleanup to allow rapid duplicate requests to benefit
    setTimeout(() => {
      pendingRequests.delete(cacheKey);
    }, 1000);
  });

  return requestPromise;
}

/**
 * Get details for a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<RestaurantData> {
  const response = await fetch(`${PLACES_API_BASE}/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      // Optimized field mask: only request fields we actually use
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,priceLevel,types,location,photos,internationalPhoneNumber,websiteUri,regularOpeningHours,businessStatus',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }
    console.error('Google Places API error (getPlaceDetails):', {
      status: response.status,
      statusText: response.statusText,
      error: errorDetails,
      placeId,
      apiKeyConfigured: !!GOOGLE_PLACES_API_KEY
    });
    
    if (response.status === 400) {
      throw new Error(`Invalid request to Google Places API: ${JSON.stringify(errorDetails)}. Check API key permissions, enabled APIs (Places API New), and request format.`);
    }
    throw new Error(`Google Places API error: ${response.status} - ${JSON.stringify(errorDetails)}`);
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
    place_id: place.id || '', // Use actual Google place_id
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
