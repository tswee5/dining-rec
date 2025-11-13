import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Sparkles, User, Bot } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useIsMobile } from './ui/use-mobile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMessage?: string;
}

export function ChatPanel({ open, onOpenChange, initialMessage }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (initialMessage && open) {
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('italian') || lowerMessage.includes('pasta') || lowerMessage.includes('pizza')) {
      return "I'd recommend La Bella Vita! It's an authentic Italian restaurant with homemade pasta and wood-fired pizzas. Perfect for a romantic date night with an excellent wine selection. The rating is 4.5 stars and it's in the $$$ price range.";
    } else if (lowerMessage.includes('sushi') || lowerMessage.includes('japanese')) {
      return "Sakura Sushi is a great choice! They serve fresh sushi and sashimi prepared by master chefs. It has a 4.7-star rating and offers traditional Japanese cuisine at moderate prices ($$). Perfect if you're looking for quality sushi.";
    } else if (lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('affordable')) {
      return "For budget-friendly options, I recommend Taco Fiesta! They offer vibrant Mexican street food with authentic flavors at just $ price range. It's casual, perfect for a quick bite, and has a solid 4.3-star rating.";
    } else if (lowerMessage.includes('fancy') || lowerMessage.includes('upscale') || lowerMessage.includes('fine dining')) {
      return "Le Petit Bistro would be perfect for you! It's a classic French bistro with seasonal ingredients and elegant ambiance. With a 4.8-star rating and $$$$ price range, it's ideal for special occasions. They have an excellent wine selection too.";
    } else if (lowerMessage.includes('romantic') || lowerMessage.includes('date')) {
      return "For a romantic date, I'd suggest either La Bella Vita (Italian, $$$) or Le Petit Bistro (French, $$$$). Both offer intimate atmospheres with excellent wine selections and are perfect for date nights.";
    } else if (lowerMessage.includes('vegetarian') || lowerMessage.includes('healthy')) {
      return "The Garden Terrace is perfect for healthy eating! It features Mediterranean flavors with a rooftop garden dining experience. They have great vegetarian options, outdoor seating, and a 4.6-star rating at $$$ price range.";
    } else if (lowerMessage.includes('quick') || lowerMessage.includes('lunch')) {
      return "For a quick lunch, I recommend either Taco Fiesta (Mexican, $) or Noodle House (Asian, $$). Both are casual, perfect for a quick bite, and offer delicious comfort food options.";
    } else if (lowerMessage.includes('best') || lowerMessage.includes('top rated')) {
      return "The highest-rated restaurants in our list are:\n1. Le Petit Bistro - 4.8★ (French, $$$$)\n2. Sakura Sushi - 4.7★ (Japanese, $$)\n3. The Garden Terrace - 4.6★ (Mediterranean, $$$)\n\nWould you like more details about any of these?";
    } else if (lowerMessage.includes('map') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return "I can help you find restaurants by location! All our recommendations are in the New York area. You can check the Map view to see exactly where each restaurant is located and find ones closest to you.";
    } else if (lowerMessage.includes('save') || lowerMessage.includes('favorite')) {
      return "You can save any restaurant by clicking the heart icon on the restaurant card. Your saved restaurants will appear in your Profile page where you can also organize them into custom lists!";
    } else {
      return "I can help you discover great restaurants! I can recommend places based on:\n• Cuisine type (Italian, Japanese, Mexican, etc.)\n• Budget ($, $$, $$$, $$$$)\n• Occasion (date night, quick lunch, etc.)\n• Dietary preferences (vegetarian, healthy options)\n\nWhat are you looking for today?";
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(textToSend),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const ChatContent = () => (
    <>
      <ScrollArea className="flex-1 px-4 sm:px-6" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="mb-2">Welcome! How can I help?</h3>
                <p className="text-sm text-muted-foreground">
                  Ask me for restaurant recommendations
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {[
                  "Find me Italian restaurants",
                  "What's good for a date night?",
                  "Show me budget-friendly options",
                  "I want something healthy"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start"
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-2xl px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl px-4 py-3 bg-muted">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isTyping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DrawerTitle>Restaurant AI Assistant</DrawerTitle>
                <p className="text-sm text-muted-foreground">Ask me anything</p>
              </div>
            </div>
          </DrawerHeader>
          <ChatContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle>Restaurant AI Assistant</SheetTitle>
              <p className="text-sm text-muted-foreground">Ask me anything about restaurants</p>
            </div>
          </div>
        </SheetHeader>
        <ChatContent />
      </SheetContent>
    </Sheet>
  );
}
