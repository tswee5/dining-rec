'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfileInitModal } from './ProfileInitModal';
import { toast } from 'sonner';

export function ProfileInitWrapper() {
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkProfileCompleteness();
  }, []);

  const checkProfileCompleteness = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsChecking(false);
        return;
      }

      // Check if user preferences exist and if new fields are filled
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('age_range, neighborhood, dining_frequency, typical_spend, default_city')
        .eq('user_id', user.id)
        .single();

      // Show modal if any required profile field is missing
      if (!preferences ||
          !preferences.age_range ||
          !preferences.dining_frequency ||
          !preferences.typical_spend ||
          !preferences.default_city) {
        setShowModal(true);
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setIsChecking(false);
    }
  };

  const handleProfileComplete = async (data: {
    ageRange: string;
    city: string;
    neighborhood?: string;
    diningFrequency: string;
    typicalSpend: string;
  }) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get existing preferences or create new
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({
            age_range: data.ageRange,
            default_city: data.city,
            neighborhood: data.neighborhood,
            dining_frequency: data.diningFrequency,
            typical_spend: data.typicalSpend,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            age_range: data.ageRange,
            default_city: data.city,
            neighborhood: data.neighborhood,
            dining_frequency: data.diningFrequency,
            typical_spend: data.typicalSpend,
            preferred_cuisines: [],
            price_range: [1, 2, 3, 4],
            max_distance: 10,
            vibe_tags: [],
          });

        if (error) throw error;
      }

      setShowModal(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
      throw error;
    }
  };

  if (isChecking) {
    return null; // Don't render anything while checking
  }

  return (
    <ProfileInitModal
      open={showModal}
      onComplete={handleProfileComplete}
    />
  );
}
