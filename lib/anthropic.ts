import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface RecommendationRequest {
  userPreferences: {
    preferredCuisines: string[];
    priceRange: number[];
    maxDistance: number;
    vibeTags: string[];
    defaultCity?: string;
    ageRange?: string;
    neighborhood?: string;
    diningFrequency?: string;
    typicalSpend?: string;
  };
  interactionHistory: {
    likes: Array<{
      name: string;
      types: string[];
      price_level?: number;
      rating?: number;
    }>;
    passes: Array<{
      name: string;
      types: string[];
    }>;
    maybes: Array<{
      name: string;
      types: string[];
    }>;
  };
  preferenceSummary?: string;
  chatIntent?: string;
  filters?: {
    cuisines?: string[];
    priceLevel?: number[];
    maxDistance?: number;
    minRating?: number;
  };
  city: string;
  limit?: number;
}

export interface RecommendationResponse {
  recommendations: Array<{
    restaurantName: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
}

export async function getClaudeRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const { userPreferences, interactionHistory, city, limit = 10, preferenceSummary, chatIntent, filters } = request;

  // Build the prompt
  const prompt = buildRecommendationPrompt(userPreferences, interactionHistory, city, limit, preferenceSummary, chatIntent, filters);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the response
    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return parseClaudeResponse(responseText);
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to get recommendations from Claude');
  }
}

function buildRecommendationPrompt(
  preferences: RecommendationRequest['userPreferences'],
  history: RecommendationRequest['interactionHistory'],
  city: string,
  limit: number,
  preferenceSummary?: string,
  chatIntent?: string,
  filters?: RecommendationRequest['filters']
): string {
  const likedRestaurants = history.likes
    .map(
      (r) =>
        `- ${r.name} (${r.types.slice(0, 3).join(', ')}, ${
          r.price_level ? '$'.repeat(r.price_level) : 'price unknown'
        }, rating: ${r.rating || 'N/A'})`
    )
    .join('\n');

  const passedRestaurants = history.passes
    .map((r) => `- ${r.name} (${r.types.slice(0, 3).join(', ')})`)
    .join('\n');

  const maybeRestaurants = history.maybes
    .map((r) => `- ${r.name} (${r.types.slice(0, 3).join(', ')})`)
    .join('\n');

  // Build global profile section
  const globalProfile = [];
  if (preferences.ageRange) globalProfile.push(`Age Range: ${preferences.ageRange}`);
  if (preferences.neighborhood) globalProfile.push(`Preferred Neighborhood: ${preferences.neighborhood}`);
  if (preferences.diningFrequency) globalProfile.push(`Dining Frequency: ${preferences.diningFrequency}`);
  if (preferences.typicalSpend) globalProfile.push(`Typical Spend: ${preferences.typicalSpend}`);

  // Build active filters section
  const activeFilters = [];
  if (filters?.cuisines && filters.cuisines.length > 0) {
    activeFilters.push(`Cuisines: ${filters.cuisines.join(', ')}`);
  }
  if (filters?.priceLevel && filters.priceLevel.length > 0) {
    activeFilters.push(`Price Levels: ${filters.priceLevel.map(p => '$'.repeat(p)).join(', ')}`);
  }
  if (filters?.maxDistance) {
    activeFilters.push(`Max Distance: ${filters.maxDistance} miles`);
  }
  if (filters?.minRating) {
    activeFilters.push(`Min Rating: ${filters.minRating} stars`);
  }

  return `You are a dining concierge assistant. Based on the user's profile, preferences, interaction history, and specific request, recommend ${limit} restaurants in ${city}.

${globalProfile.length > 0 ? `GLOBAL PROFILE:\n${globalProfile.map(p => `- ${p}`).join('\n')}\n` : ''}
${chatIntent ? `USER REQUEST:\n"${chatIntent}"\n` : ''}
${preferenceSummary ? `PREFERENCE SUMMARY (from past behavior):\n${preferenceSummary}\n` : ''}
SAVED PREFERENCES:
- Preferred Cuisines: ${preferences.preferredCuisines.join(', ') || 'No specific preferences'}
- Price Range: ${preferences.priceRange.map((p) => '$'.repeat(p)).join(', ') || 'Any'}
- Max Distance: ${preferences.maxDistance} miles
- Vibe Tags: ${preferences.vibeTags.join(', ') || 'No specific vibe preferences'}

${activeFilters.length > 0 ? `ACTIVE FILTERS (current search):\n${activeFilters.map(f => `- ${f}`).join('\n')}\n` : ''}

INTERACTION HISTORY:

Restaurants the user LIKED:
${likedRestaurants || 'None yet'}

Restaurants the user PASSED on:
${passedRestaurants || 'None yet'}

Restaurants the user is UNSURE about (Maybe):
${maybeRestaurants || 'None yet'}

TASK:
Based on the above information, recommend up to ${limit} specific restaurants in ${city} that the user would likely enjoy.${chatIntent ? ' PRIORITIZE matching the user request above.' : ''} Focus on:
1. ${chatIntent ? 'Fulfilling the specific user request/intent' : 'Matching their stated preferences'}
2. ${chatIntent ? 'Considering global profile and filters' : 'Learning from their liked restaurants (cuisine types, price levels, vibes)'}
3. Learning from preference summary and interaction history
4. Avoiding types of places they passed on
5. Suggesting variety while staying within constraints

IMPORTANT FORMAT REQUIREMENTS:
- Recommend REAL restaurants that exist in ${city}${preferences.neighborhood ? ` (preferably in or near ${preferences.neighborhood})` : ''}
- Provide the exact restaurant name as it would appear on Google Maps
- Include a brief reason for each recommendation (1-2 sentences max)
- Assign a confidence level: high, medium, or low
- Return ≤${limit} recommendations (you may return fewer if appropriate matches are limited)

Return your response in this exact JSON format:
{
  "recommendations": [
    {
      "restaurantName": "Exact Restaurant Name",
      "reason": "Brief explanation of why this matches",
      "confidence": "high"
    }
  ]
}

Return ONLY valid JSON, no additional text before or after.`;
}

function parseClaudeResponse(responseText: string): RecommendationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the structure
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid response structure');
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse Claude response:', error);
    console.error('Raw response:', responseText);

    // Return empty recommendations on parse failure
    return { recommendations: [] };
  }
}
