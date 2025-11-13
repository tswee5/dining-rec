import { useState } from 'react';
import { ListPage } from './components/ListPage';
import { MapView } from './components/MapView';
import { ProfilePage } from './components/ProfilePage';
import { ChatBar } from './components/ChatBar';
import { ChatPanel } from './components/ChatPanel';
import { Button } from './components/ui/button';
import { List, Map, User } from 'lucide-react';
import { UserFeedbackMap } from './types';

type Page = 'list' | 'map' | 'profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('list');
  const [savedRestaurants, setSavedRestaurants] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const [userFeedback, setUserFeedback] = useState<UserFeedbackMap>({});

  const handleSaveRestaurant = (id: string) => {
    setSavedRestaurants(prev => 
      prev.includes(id) 
        ? prev.filter(restaurantId => restaurantId !== id)
        : [...prev, id]
    );
  };

  const handleFeedback = (restaurantId: string, liked: boolean) => {
    setUserFeedback(prev => ({
      ...prev,
      [restaurantId]: liked
    }));
  };

  const handleSendMessage = (message: string) => {
    setPendingMessage(message);
  };

  const handleOpenChat = () => {
    setChatOpen(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'list':
        return (
          <ListPage
            savedRestaurants={savedRestaurants}
            onSaveRestaurant={handleSaveRestaurant}
            userFeedback={userFeedback}
            onFeedback={handleFeedback}
          />
        );
      case 'map':
        return (
          <MapView
            savedRestaurants={savedRestaurants}
            onSaveRestaurant={handleSaveRestaurant}
            userFeedback={userFeedback}
            onFeedback={handleFeedback}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            savedRestaurants={savedRestaurants}
            onSaveRestaurant={handleSaveRestaurant}
            userFeedback={userFeedback}
            onFeedback={handleFeedback}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground text-sm sm:text-base">🍽️</span>
              </div>
              <h2 className="text-base sm:text-lg hidden xs:block">RestaurantFinder</h2>
            </div>
            
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant={currentPage === 'list' ? 'default' : 'ghost'}
                onClick={() => setCurrentPage('list')}
                size="sm"
                className="h-9 px-2 sm:px-4"
              >
                <List className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Discover</span>
              </Button>
              <Button
                variant={currentPage === 'map' ? 'default' : 'ghost'}
                onClick={() => setCurrentPage('map')}
                size="sm"
                className="h-9 px-2 sm:px-4"
              >
                <Map className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Map</span>
              </Button>
              <Button
                variant={currentPage === 'profile' ? 'default' : 'ghost'}
                onClick={() => setCurrentPage('profile')}
                size="sm"
                className="h-9 px-2 sm:px-4"
              >
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {renderPage()}
      </main>

      {/* AI Chat Components */}
      <ChatBar onOpenChat={handleOpenChat} onSendMessage={handleSendMessage} />
      <ChatPanel 
        open={chatOpen} 
        onOpenChange={setChatOpen}
        initialMessage={pendingMessage}
      />
    </div>
  );
}
