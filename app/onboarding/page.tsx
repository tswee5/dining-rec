'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CUISINE_OPTIONS, PRICE_LEVELS, VIBE_TAGS, DISTANCE_OPTIONS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

const step1Schema = z.object({
  defaultCity: z.string().min(2, 'Please enter a city'),
});

const step2Schema = z.object({
  preferredCuisines: z.array(z.string()).min(1, 'Select at least one cuisine'),
  priceRange: z.array(z.number()).min(1, 'Select at least one price level'),
  maxDistance: z.number().min(0.5).max(25),
});

const step3Schema = z.object({
  vibeTags: z.array(z.string()),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      defaultCity: '',
    },
  });

  // Step 2 state
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([1, 2, 3, 4]);
  const [maxDistance, setMaxDistance] = useState<number[]>([DISTANCE_OPTIONS.default]);

  // Step 3 state
  const [vibeTags, setVibeTags] = useState<string[]>([]);

  const handleStep1Next = step1Form.handleSubmit(async () => {
    setStep(2);
  });

  const handleStep2Next = () => {
    if (preferredCuisines.length === 0) {
      toast.error('Please select at least one cuisine');
      return;
    }
    if (priceRange.length === 0) {
      toast.error('Please select at least one price level');
      return;
    }
    setStep(3);
  };

  const handleStep3Submit = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Not authenticated');
        router.push('/auth/signin');
        return;
      }

      const { error } = await supabase.from('user_preferences').insert({
        user_id: user.id,
        default_city: step1Form.getValues('defaultCity'),
        preferred_cuisines: preferredCuisines,
        price_range: priceRange,
        max_distance: maxDistance[0],
        vibe_tags: vibeTags,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Preferences saved! Welcome to TasteSwipe!');
      router.push('/app/list');
      router.refresh();
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setPreferredCuisines((prev) =>
      prev.includes(cuisine) ? prev.filter((c) => c !== cuisine) : [...prev, cuisine]
    );
  };

  const togglePriceLevel = (level: number) => {
    setPriceRange((prev) =>
      prev.includes(level) ? prev.filter((p) => p !== level) : [...prev, level]
    );
  };

  const toggleVibeTag = (tag: string) => {
    setVibeTags((prev) => (prev.includes(tag) ? prev.filter((v) => v !== tag) : [...prev, tag]));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Step {step} of 3</span>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-12 rounded-full ${
                    s <= step ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && 'Where are you dining?'}
            {step === 2 && 'What are your preferences?'}
            {step === 3 && 'What vibe are you looking for?'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us your location to find restaurants near you'}
            {step === 2 && 'Help us understand your taste in food'}
            {step === 3 && 'Choose vibes that match your dining style (optional)'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., New York, San Francisco, Chicago"
                  {...step1Form.register('defaultCity')}
                />
                {step1Form.formState.errors.defaultCity && (
                  <p className="text-sm text-red-500">
                    {step1Form.formState.errors.defaultCity.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="submit" size="lg">
                  Next
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Favorite Cuisines</Label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <Badge
                      key={cuisine}
                      variant={preferredCuisines.includes(cuisine) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleCuisine(cuisine)}
                    >
                      {cuisine}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Selected: {preferredCuisines.length || 'None'}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Price Range</Label>
                <div className="flex gap-3">
                  {PRICE_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`price-${level.value}`}
                        checked={priceRange.includes(level.value)}
                        onCheckedChange={() => togglePriceLevel(level.value)}
                      />
                      <label
                        htmlFor={`price-${level.value}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {level.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Maximum Distance</Label>
                  <span className="text-sm text-gray-600">{maxDistance[0]} miles</span>
                </div>
                <Slider
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  min={DISTANCE_OPTIONS.min}
                  max={DISTANCE_OPTIONS.max}
                  step={DISTANCE_OPTIONS.step}
                  className="w-full"
                />
              </div>

              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={handleStep2Next}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Dining Vibes (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {VIBE_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={vibeTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleVibeTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500">Selected: {vibeTags.length || 'None'}</p>
              </div>

              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="button" onClick={handleStep3Submit} disabled={loading}>
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
