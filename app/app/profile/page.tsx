'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Heart,
  Star,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Loader2,
  LogOut,
  Settings,
} from 'lucide-react';
import { CUISINE_OPTIONS, PRICE_LEVELS, DISTANCE_OPTIONS, VIBE_TAGS } from '@/lib/constants';
import type { RestaurantData } from '@/types';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isEditListOpen, setIsEditListOpen] = useState(false);
  const [isEditPrefsOpen, setIsEditPrefsOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [editingList, setEditingList] = useState<any>(null);

  // Preference editing states
  const [defaultCity, setDefaultCity] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([1, 2, 3, 4]);
  const [maxDistance, setMaxDistance] = useState<number[]>([DISTANCE_OPTIONS.default]);
  const [vibeTags, setVibeTags] = useState<string[]>([]);

  // Get user
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get user preferences
  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      const response = await fetch('/api/user/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: !!userQuery.data,
  });

  // Get all lists
  const listsQuery = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const response = await fetch('/api/lists');
      if (!response.ok) throw new Error('Failed to fetch lists');
      return response.json();
    },
    enabled: !!userQuery.data,
  });

  // Get restaurants in selected list
  const listRestaurantsQuery = useQuery({
    queryKey: ['listRestaurants', selectedList],
    queryFn: async () => {
      if (!selectedList) return { restaurants: [] };
      const response = await fetch(`/api/lists/${selectedList}`);
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      return response.json();
    },
    enabled: !!selectedList,
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setIsCreateListOpen(false);
      setNewListName('');
      setNewListDescription('');
      toast.success('List created!');
    },
    onError: () => {
      toast.error('Failed to create list');
    },
  });

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: async ({
      listId,
      data,
    }: {
      listId: string;
      data: { name: string; description: string };
    }) => {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setIsEditListOpen(false);
      setEditingList(null);
      toast.success('List updated!');
    },
    onError: () => {
      toast.error('Failed to update list');
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const response = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete list');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setSelectedList(null);
      toast.success('List deleted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete list');
    },
  });

  // Remove restaurant from list mutation
  const removeRestaurantMutation = useMutation({
    mutationFn: async ({ listId, placeId }: { listId: string; placeId: string }) => {
      const response = await fetch(`/api/lists/${listId}/restaurants?placeId=${placeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove restaurant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listRestaurants', selectedList] });
      toast.success('Restaurant removed!');
    },
    onError: () => {
      toast.error('Failed to remove restaurant');
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const handleCreateList = () => {
    if (!newListName.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    createListMutation.mutate({ name: newListName, description: newListDescription });
  };

  const handleUpdateList = () => {
    if (!editingList || !editingList.name.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    updateListMutation.mutate({
      listId: editingList.id,
      data: { name: editingList.name, description: editingList.description || '' },
    });
  };

  const handleDeleteList = (listId: string) => {
    if (confirm('Are you sure you want to delete this list?')) {
      deleteListMutation.mutate(listId);
    }
  };

  const handleRemoveRestaurant = (placeId: string) => {
    if (!selectedList) return;
    removeRestaurantMutation.mutate({ listId: selectedList, placeId });
  };

  const openEditPreferences = () => {
    const prefs = preferencesQuery.data?.preferences;
    if (prefs) {
      setDefaultCity(prefs.default_city || '');
      setSelectedCuisines(prefs.preferred_cuisines || []);
      setPriceRange(prefs.price_range || [1, 2, 3, 4]);
      setMaxDistance([prefs.max_distance || DISTANCE_OPTIONS.default]);
      setVibeTags(prefs.vibe_tags || []);
    }
    setIsEditPrefsOpen(true);
  };

  const lists = listsQuery.data?.lists || [];
  const defaultList = lists.find((l: any) => l.is_default);
  const customLists = lists.filter((l: any) => !l.is_default);
  const currentList = lists.find((l: any) => l.id === selectedList);
  const restaurants = listRestaurantsQuery.data?.restaurants || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">
            {userQuery.data?.email || 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEditPreferences}>
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Lists</p>
              <p className="text-2xl font-bold">{lists.length}</p>
            </div>
            <Star className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Favorites</p>
              <p className="text-2xl font-bold">
                {defaultList ? listRestaurantsQuery.data?.restaurants?.length || 0 : 0}
              </p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custom Lists</p>
              <p className="text-2xl font-bold">{customLists.length}</p>
            </div>
            <Plus className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Lists Tabs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Lists</h2>
          <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
                <DialogDescription>
                  Create a custom list to organize your favorite restaurants.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listName">List Name</Label>
                  <Input
                    id="listName"
                    placeholder="e.g., Date Night Spots"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="listDescription">Description (Optional)</Label>
                  <Input
                    id="listDescription"
                    placeholder="Add a description..."
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateList}
                  disabled={createListMutation.isPending}
                >
                  {createListMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create List'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs
          value={selectedList || defaultList?.id}
          onValueChange={setSelectedList}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {defaultList && (
              <TabsTrigger value={defaultList.id}>
                <Star className="w-4 h-4 mr-2" />
                {defaultList.name}
              </TabsTrigger>
            )}
            {customLists.map((list: any) => (
              <TabsTrigger key={list.id} value={list.id}>
                {list.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {lists.map((list: any) => (
            <TabsContent key={list.id} value={list.id} className="mt-4">
              <div className="space-y-4">
                {/* List Header */}
                {!list.is_default && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{list.name}</h3>
                      {list.description && (
                        <p className="text-sm text-gray-600">{list.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingList(list);
                          setIsEditListOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteList(list.id)}
                        disabled={deleteListMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Restaurants */}
                {listRestaurantsQuery.isFetching ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-gray-600 mt-4">Loading restaurants...</p>
                  </div>
                ) : restaurants.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">
                      No restaurants in this list yet. Start adding some!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {restaurants.map((restaurant: RestaurantData, index: number) => {
                      const placeId = `${restaurant.name}-${restaurant.formatted_address}`
                        .toLowerCase()
                        .replace(/\s+/g, '-');

                      return (
                        <Card
                          key={index}
                          className="overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {/* Photo */}
                          {restaurant.photos && restaurant.photos.length > 0 && (
                            <div className="h-40 bg-gray-200 relative">
                              <img
                                src={`https://via.placeholder.com/400x300?text=${encodeURIComponent(
                                  restaurant.name
                                )}`}
                                alt={restaurant.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="p-4 space-y-3">
                            <div>
                              <h3 className="font-semibold text-sm line-clamp-1">
                                {restaurant.name}
                              </h3>
                              <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {restaurant.formatted_address}
                              </p>
                            </div>

                            {/* Rating & Price */}
                            <div className="flex items-center gap-3 text-xs">
                              {restaurant.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{restaurant.rating}</span>
                                  <span className="text-gray-500">
                                    ({restaurant.user_ratings_total})
                                  </span>
                                </div>
                              )}
                              {restaurant.price_level && (
                                <div className="flex items-center text-gray-600">
                                  {Array(restaurant.price_level)
                                    .fill(0)
                                    .map((_, i) => (
                                      <DollarSign key={i} className="w-3 h-3" />
                                    ))}
                                </div>
                              )}
                            </div>

                            {/* Remove Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveRestaurant(placeId)}
                              disabled={removeRestaurantMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Edit List Dialog */}
      <Dialog open={isEditListOpen} onOpenChange={setIsEditListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
            <DialogDescription>Update your list name and description.</DialogDescription>
          </DialogHeader>
          {editingList && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editListName">List Name</Label>
                <Input
                  id="editListName"
                  value={editingList.name}
                  onChange={(e) =>
                    setEditingList({ ...editingList, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editListDescription">Description (Optional)</Label>
                <Input
                  id="editListDescription"
                  value={editingList.description || ''}
                  onChange={(e) =>
                    setEditingList({ ...editingList, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleUpdateList}
              disabled={updateListMutation.isPending}
            >
              {updateListMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update List'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Preferences Dialog */}
      <Dialog open={isEditPrefsOpen} onOpenChange={setIsEditPrefsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Preferences</DialogTitle>
            <DialogDescription>
              Update your restaurant preferences to get better recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="defaultCity">Default City</Label>
              <Input
                id="defaultCity"
                placeholder="e.g., New York"
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Cuisines</Label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <Badge
                    key={cuisine}
                    variant={selectedCuisines.includes(cuisine) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setSelectedCuisines((prev) =>
                        prev.includes(cuisine)
                          ? prev.filter((c) => c !== cuisine)
                          : [...prev, cuisine]
                      )
                    }
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex gap-4">
                {PRICE_LEVELS.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pref-price-${level.value}`}
                      checked={priceRange.includes(level.value)}
                      onCheckedChange={() =>
                        setPriceRange((prev) =>
                          prev.includes(level.value)
                            ? prev.filter((p) => p !== level.value)
                            : [...prev, level.value]
                        )
                      }
                    />
                    <label
                      htmlFor={`pref-price-${level.value}`}
                      className="text-sm cursor-pointer"
                    >
                      {level.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Max Distance</Label>
                <span className="text-sm text-gray-600">{maxDistance[0]} miles</span>
              </div>
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                min={DISTANCE_OPTIONS.min}
                max={DISTANCE_OPTIONS.max}
                step={DISTANCE_OPTIONS.step}
              />
            </div>

            <div className="space-y-2">
              <Label>Vibe Tags</Label>
              <div className="flex flex-wrap gap-2">
                {VIBE_TAGS.map((vibe) => (
                  <Badge
                    key={vibe}
                    variant={vibeTags.includes(vibe) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() =>
                      setVibeTags((prev) =>
                        prev.includes(vibe)
                          ? prev.filter((v) => v !== vibe)
                          : [...prev, vibe]
                      )
                    }
                  >
                    {vibe}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => toast.info('Preferences update coming soon!')}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
