'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

interface ProfileInitModalProps {
  open: boolean;
  onComplete: (data: ProfileData) => Promise<void>;
}

interface ProfileData {
  ageRange: string;
  city: string;
  neighborhood?: string;
  diningFrequency: string;
  typicalSpend: string;
}

const AGE_RANGES = [
  '15-19', '20-24', '25-29', '30-34', '35-39',
  '40-44', '45-49', '50-54', '55-59', '60-64', '65+'
];

const DINING_FREQUENCIES = [
  '≤1/mo', '2-3/mo', 'Weekly', 'Multiple times/week'
];

const TYPICAL_SPENDS = ['$', '$$', '$$$', '$$$$'];

const NYC_NEIGHBORHOODS = [
  'East Village', 'West Village', 'Lower East Side', 'SoHo', 'Tribeca',
  'Upper West Side', 'Upper East Side', 'Midtown', 'Chelsea', 'Gramercy',
  'Williamsburg', 'Greenpoint', 'Park Slope', 'DUMBO', 'Brooklyn Heights'
];

export function ProfileInitModal({ open, onComplete }: ProfileInitModalProps) {
  const [ageRange, setAgeRange] = useState('');
  const [customAge, setCustomAge] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [customNeighborhood, setCustomNeighborhood] = useState('');
  const [diningFrequency, setDiningFrequency] = useState('');
  const [customFrequency, setCustomFrequency] = useState('');
  const [typicalSpend, setTypicalSpend] = useState('');
  const [customSpend, setCustomSpend] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  const customAgeRef = useRef<HTMLInputElement>(null);
  const customNeighborhoodRef = useRef<HTMLInputElement>(null);
  const customFrequencyRef = useRef<HTMLInputElement>(null);
  const customSpendRef = useRef<HTMLInputElement>(null);

  // Auto-focus custom inputs when "Custom" is selected
  useEffect(() => {
    if (ageRange === 'custom') {
      customAgeRef.current?.focus();
    }
  }, [ageRange]);

  useEffect(() => {
    if (neighborhood === 'custom') {
      customNeighborhoodRef.current?.focus();
    }
  }, [neighborhood]);

  useEffect(() => {
    if (diningFrequency === 'custom') {
      customFrequencyRef.current?.focus();
    }
  }, [diningFrequency]);

  useEffect(() => {
    if (typicalSpend === 'custom') {
      customSpendRef.current?.focus();
    }
  }, [typicalSpend]);

  // Request GPS location
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      setGpsEnabled(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocode to get city and neighborhood
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();

            if (data.results && data.results[0]) {
              const addressComponents = data.results[0].address_components;
              const cityComponent = addressComponents.find((c: any) =>
                c.types.includes('locality')
              );
              const neighborhoodComponent = addressComponents.find((c: any) =>
                c.types.includes('neighborhood') || c.types.includes('sublocality')
              );

              if (cityComponent) {
                setCity(cityComponent.long_name);
              }
              if (neighborhoodComponent) {
                setNeighborhood(neighborhoodComponent.long_name);
              }

              toast.success('Location detected!');
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            toast.error('Could not detect location');
          } finally {
            setGpsEnabled(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Location access denied');
          setGpsEnabled(false);
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const handleSubmit = async () => {
    // Validation
    const finalAgeRange = ageRange === 'custom' ? customAge : ageRange;
    const finalNeighborhood = neighborhood === 'custom' ? customNeighborhood : neighborhood;
    const finalFrequency = diningFrequency === 'custom' ? customFrequency : diningFrequency;
    const finalSpend = typicalSpend === 'custom' ? customSpend : typicalSpend;

    if (!finalAgeRange || !city || !finalFrequency || !finalSpend) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      await onComplete({
        ageRange: finalAgeRange,
        city,
        neighborhood: finalNeighborhood || undefined,
        diningFrequency: finalFrequency,
        typicalSpend: finalSpend,
      });
      toast.success('Profile saved!');
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNeighborhoods = city.toLowerCase().includes('new york') || city.toLowerCase().includes('nyc');

  return (
    <Dialog open={open} modal>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to TasteSwipe!</DialogTitle>
          <DialogDescription>
            Help us personalize your restaurant recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Age Range */}
          <div className="space-y-3">
            <Label>Age Range *</Label>
            <RadioGroup value={ageRange} onValueChange={setAgeRange}>
              <div className="grid grid-cols-2 gap-2">
                {AGE_RANGES.map((range) => (
                  <div key={range} className="flex items-center space-x-2">
                    <RadioGroupItem value={range} id={`age-${range}`} />
                    <label htmlFor={`age-${range}`} className="text-sm cursor-pointer">
                      {range}
                    </label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="age-custom" />
                  <label htmlFor="age-custom" className="text-sm cursor-pointer">
                    Custom
                  </label>
                </div>
              </div>
            </RadioGroup>
            {ageRange === 'custom' && (
              <Input
                ref={customAgeRef}
                placeholder="Enter your age range"
                value={customAge}
                onChange={(e) => setCustomAge(e.target.value)}
              />
            )}
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="city">City *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={requestLocation}
                disabled={gpsEnabled}
              >
                {gpsEnabled ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use my location
                  </>
                )}
              </Button>
            </div>
            <Input
              id="city"
              placeholder="e.g., New York, San Francisco"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Neighborhood (conditional) */}
          {showNeighborhoods && (
            <div className="space-y-3">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Select value={neighborhood} onValueChange={setNeighborhood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  {NYC_NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {neighborhood === 'custom' && (
                <Input
                  ref={customNeighborhoodRef}
                  placeholder="Enter your neighborhood"
                  value={customNeighborhood}
                  onChange={(e) => setCustomNeighborhood(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Dining Frequency */}
          <div className="space-y-3">
            <Label>How often do you dine out? *</Label>
            <RadioGroup value={diningFrequency} onValueChange={setDiningFrequency}>
              <div className="space-y-2">
                {DINING_FREQUENCIES.map((freq) => (
                  <div key={freq} className="flex items-center space-x-2">
                    <RadioGroupItem value={freq} id={`freq-${freq}`} />
                    <label htmlFor={`freq-${freq}`} className="text-sm cursor-pointer">
                      {freq}
                    </label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="freq-custom" />
                  <label htmlFor="freq-custom" className="text-sm cursor-pointer">
                    Custom
                  </label>
                </div>
              </div>
            </RadioGroup>
            {diningFrequency === 'custom' && (
              <Input
                ref={customFrequencyRef}
                placeholder="Enter your dining frequency"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
              />
            )}
          </div>

          {/* Typical Spend */}
          <div className="space-y-3">
            <Label>Typical spending per person? *</Label>
            <RadioGroup value={typicalSpend} onValueChange={setTypicalSpend}>
              <div className="flex gap-4">
                {TYPICAL_SPENDS.map((spend) => (
                  <div key={spend} className="flex items-center space-x-2">
                    <RadioGroupItem value={spend} id={`spend-${spend}`} />
                    <label htmlFor={`spend-${spend}`} className="text-sm cursor-pointer">
                      {spend}
                    </label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="spend-custom" />
                  <label htmlFor="spend-custom" className="text-sm cursor-pointer">
                    Custom
                  </label>
                </div>
              </div>
            </RadioGroup>
            {typicalSpend === 'custom' && (
              <Input
                ref={customSpendRef}
                placeholder="Enter typical spend (e.g., $20-30)"
                value={customSpend}
                onChange={(e) => setCustomSpend(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
