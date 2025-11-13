import { Restaurant, UserFeedbackMap, UserPreferences } from '../types';

/**
 * Recommendation engine that uses user feedback to score and rank restaurants
 */
export class RecommendationEngine {
  /**
   * Calculate a preference score for a restaurant based on user feedback
   */
  private static calculateFeedbackScore(
    restaurant: Restaurant,
    feedback: UserFeedbackMap
  ): number {
    // Check if user has given feedback on this restaurant
    if (restaurant.id in feedback) {
      return feedback[restaurant.id] ? 10 : -10; // +10 for like, -10 for dislike
    }
    return 0;
  }

  /**
   * Calculate cuisine preference score based on user's liked/disliked restaurants
   */
  private static calculateCuisineScore(
    restaurant: Restaurant,
    feedback: UserFeedbackMap,
    allRestaurants: Restaurant[]
  ): number {
    const cuisinePreferences: { [cuisine: string]: number } = {};

    // Build cuisine preference map from feedback
    Object.entries(feedback).forEach(([restaurantId, liked]) => {
      const feedbackRestaurant = allRestaurants.find(r => r.id === restaurantId);
      if (feedbackRestaurant) {
        const cuisine = feedbackRestaurant.cuisine;
        cuisinePreferences[cuisine] = (cuisinePreferences[cuisine] || 0) + (liked ? 1 : -1);
      }
    });

    // Return score for this restaurant's cuisine
    return cuisinePreferences[restaurant.cuisine] || 0;
  }

  /**
   * Calculate price range preference score
   */
  private static calculatePriceScore(
    restaurant: Restaurant,
    feedback: UserFeedbackMap,
    allRestaurants: Restaurant[]
  ): number {
    const pricePreferences: { [price: string]: number } = {};

    // Build price preference map from feedback
    Object.entries(feedback).forEach(([restaurantId, liked]) => {
      const feedbackRestaurant = allRestaurants.find(r => r.id === restaurantId);
      if (feedbackRestaurant) {
        const price = feedbackRestaurant.priceRange;
        pricePreferences[price] = (pricePreferences[price] || 0) + (liked ? 1 : -1);
      }
    });

    return pricePreferences[restaurant.priceRange] || 0;
  }

  /**
   * Calculate tag/feature preference score
   */
  private static calculateTagScore(
    restaurant: Restaurant,
    feedback: UserFeedbackMap,
    allRestaurants: Restaurant[]
  ): number {
    const tagPreferences: { [tag: string]: number } = {};

    // Build tag preference map from feedback
    Object.entries(feedback).forEach(([restaurantId, liked]) => {
      const feedbackRestaurant = allRestaurants.find(r => r.id === restaurantId);
      if (feedbackRestaurant) {
        feedbackRestaurant.tags.forEach(tag => {
          tagPreferences[tag] = (tagPreferences[tag] || 0) + (liked ? 1 : -1);
        });
      }
    });

    // Sum up scores for all tags this restaurant has
    return restaurant.tags.reduce((score, tag) => {
      return score + (tagPreferences[tag] || 0);
    }, 0);
  }

  /**
   * Calculate overall recommendation score for a restaurant
   */
  private static calculateScore(
    restaurant: Restaurant,
    feedback: UserFeedbackMap,
    allRestaurants: Restaurant[]
  ): number {
    // Direct feedback has the highest weight
    const feedbackScore = this.calculateFeedbackScore(restaurant, feedback) * 2;
    
    // Indirect preferences have lower weights
    const cuisineScore = this.calculateCuisineScore(restaurant, feedback, allRestaurants) * 3;
    const priceScore = this.calculatePriceScore(restaurant, feedback, allRestaurants) * 2;
    const tagScore = this.calculateTagScore(restaurant, feedback, allRestaurants) * 1;

    // Base rating score (normalized to 0-5 range)
    const ratingScore = restaurant.rating * 1;

    return feedbackScore + cuisineScore + priceScore + tagScore + ratingScore;
  }

  /**
   * Get recommended restaurants sorted by preference score
   */
  static getRecommendations(
    restaurants: Restaurant[],
    feedback: UserFeedbackMap,
    preferences?: UserPreferences
  ): Restaurant[] {
    // Filter by preferences first if provided
    let filtered = restaurants;

    if (preferences) {
      if (preferences.cuisine.length > 0) {
        filtered = filtered.filter(r => preferences.cuisine.includes(r.cuisine));
      }
      if (preferences.priceRange.length > 0) {
        filtered = filtered.filter(r => preferences.priceRange.includes(r.priceRange));
      }
    }

    // Calculate scores and sort
    const scoredRestaurants = filtered.map(restaurant => ({
      restaurant,
      score: this.calculateScore(restaurant, feedback, restaurants)
    }));

    // Sort by score descending
    scoredRestaurants.sort((a, b) => b.score - a.score);

    return scoredRestaurants.map(item => item.restaurant);
  }

  /**
   * Get insights about user preferences based on feedback
   */
  static getUserInsights(
    feedback: UserFeedbackMap,
    allRestaurants: Restaurant[]
  ): {
    favoriteCuisines: string[];
    preferredPriceRanges: string[];
    popularTags: string[];
  } {
    const cuisineScores: { [cuisine: string]: number } = {};
    const priceScores: { [price: string]: number } = {};
    const tagScores: { [tag: string]: number } = {};

    Object.entries(feedback).forEach(([restaurantId, liked]) => {
      const restaurant = allRestaurants.find(r => r.id === restaurantId);
      if (restaurant) {
        const weight = liked ? 1 : -1;
        
        cuisineScores[restaurant.cuisine] = (cuisineScores[restaurant.cuisine] || 0) + weight;
        priceScores[restaurant.priceRange] = (priceScores[restaurant.priceRange] || 0) + weight;
        
        restaurant.tags.forEach(tag => {
          tagScores[tag] = (tagScores[tag] || 0) + weight;
        });
      }
    });

    const sortByScore = (obj: { [key: string]: number }) => 
      Object.entries(obj)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key);

    return {
      favoriteCuisines: sortByScore(cuisineScores),
      preferredPriceRanges: sortByScore(priceScores),
      popularTags: sortByScore(tagScores)
    };
  }
}
