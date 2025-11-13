import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface ChatBarProps {
  onOpenChat: () => void;
  onSendMessage: (message: string) => void;
}

export function ChatBar({ onOpenChat, onSendMessage }: ChatBarProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      onOpenChat();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask AI for recommendations..."
                className="pl-8 sm:pl-10 pr-3 sm:pr-4 h-10 sm:h-12 text-sm sm:text-base"
                onFocus={onOpenChat}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0"
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
