import { useState } from 'react';
import { Restaurant, RestaurantList, UserFeedbackMap } from '../types';
import { mockRestaurants } from '../data/mockRestaurants';
import { RestaurantCard } from './RestaurantCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, List, Heart, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface ProfilePageProps {
  savedRestaurants: string[];
  onSaveRestaurant: (id: string) => void;
  userFeedback: UserFeedbackMap;
  onFeedback: (restaurantId: string, liked: boolean) => void;
}

export function ProfilePage({ savedRestaurants, onSaveRestaurant, userFeedback, onFeedback }: ProfilePageProps) {
  const [lists, setLists] = useState<RestaurantList[]>([
    {
      id: '1',
      name: 'Date Night Spots',
      description: 'Perfect restaurants for romantic evenings',
      restaurantIds: ['1', '4'],
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Quick Lunch',
      description: 'Fast and delicious options for busy days',
      restaurantIds: ['3'],
      createdAt: new Date().toISOString()
    }
  ]);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const savedRestaurantObjects = mockRestaurants.filter(r => 
    savedRestaurants.includes(r.id)
  );

  const createNewList = () => {
    if (!newListName.trim()) return;

    const newList: RestaurantList = {
      id: Date.now().toString(),
      name: newListName,
      description: newListDescription,
      restaurantIds: [],
      createdAt: new Date().toISOString()
    };

    setLists([...lists, newList]);
    setNewListName('');
    setNewListDescription('');
    setDialogOpen(false);
  };

  const deleteList = (listId: string) => {
    setLists(lists.filter(l => l.id !== listId));
    if (selectedList === listId) {
      setSelectedList(null);
    }
  };

  const addToList = (listId: string, restaurantId: string) => {
    setLists(lists.map(list => {
      if (list.id === listId) {
        if (list.restaurantIds.includes(restaurantId)) {
          return {
            ...list,
            restaurantIds: list.restaurantIds.filter(id => id !== restaurantId)
          };
        } else {
          return {
            ...list,
            restaurantIds: [...list.restaurantIds, restaurantId]
          };
        }
      }
      return list;
    }));
  };

  const getRestaurantsByList = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return [];
    return mockRestaurants.filter(r => list.restaurantIds.includes(r.id));
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your saved restaurants and lists
        </p>
      </div>

      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="saved" className="text-xs sm:text-sm">
            <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Saved </span>({savedRestaurants.length})
          </TabsTrigger>
          <TabsTrigger value="lists" className="text-xs sm:text-sm">
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">My </span>Lists ({lists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-4 sm:mt-6">
          {savedRestaurantObjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="mb-2 text-base sm:text-lg">No saved restaurants yet</h3>
                <p className="text-muted-foreground text-center text-sm sm:text-base px-4">
                  Start exploring and save your favorites
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {savedRestaurantObjects.map((restaurant) => (
                <div key={restaurant.id}>
                  <RestaurantCard
                    restaurant={restaurant}
                    onSave={onSaveRestaurant}
                    isSaved={true}
                    onFeedback={onFeedback}
                    userFeedback={userFeedback[restaurant.id] ?? null}
                  />
                  {lists.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">Add to list:</Label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {lists.map((list) => (
                          <Badge
                            key={list.id}
                            variant={list.restaurantIds.includes(restaurant.id) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => addToList(list.id, restaurant.id)}
                          >
                            {list.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lists" className="mt-4 sm:mt-6">
          <div className="mb-4 sm:mb-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="list-name">List Name</Label>
                    <Input
                      id="list-name"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g., Weekend Brunch Spots"
                    />
                  </div>
                  <div>
                    <Label htmlFor="list-description">Description (optional)</Label>
                    <Textarea
                      id="list-description"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="Add a description for your list..."
                    />
                  </div>
                  <Button onClick={createNewList} className="w-full">
                    Create List
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {lists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
                <List className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <h3 className="mb-2 text-base sm:text-lg">No lists created yet</h3>
                <p className="text-muted-foreground text-center text-sm sm:text-base px-4">
                  Create custom lists to organize your favorites
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {lists.map((list) => (
                <Card key={list.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{list.name}</CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {list.description}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0 h-8 w-8"
                        onClick={() => deleteList(list.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      {list.restaurantIds.length} restaurant{list.restaurantIds.length !== 1 ? 's' : ''}
                    </div>
                    {list.restaurantIds.length > 0 ? (
                      <div className="space-y-2">
                        {getRestaurantsByList(list.id).map((restaurant) => (
                          <div
                            key={restaurant.id}
                            className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-muted/50"
                          >
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm sm:text-base">{restaurant.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {restaurant.cuisine} • {restaurant.priceRange}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                        No restaurants in this list yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
