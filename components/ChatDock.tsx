'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageSquare, Send, X } from 'lucide-react';
import { cn } from './ui/utils';

interface ChatDockProps {
  onSubmit: (message: string) => void;
  onOpenPanel: () => void;
  isPanelOpen: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatDock({
  onSubmit,
  onOpenPanel,
  isPanelOpen,
  disabled = false,
  placeholder = "Ask for restaurant recommendations..."
}: ChatDockProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    onSubmit(trimmed);
    setMessage('');

    // Open panel on submit if not already open
    if (!isPanelOpen) {
      onOpenPanel();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  // Global keyboard shortcut: "/" to focus chat
  if (typeof window !== 'undefined') {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    // Cleanup and setup listener
    if (inputRef.current) {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenPanel}
            className={cn(
              "flex-shrink-0",
              isPanelOpen && "bg-accent"
            )}
            title="Toggle chat panel (or press /)"
          >
            {isPanelOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-10"
              aria-label="Chat message input"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              /
            </span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            size="icon"
            className="flex-shrink-0"
            title="Send message (Enter)"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press <kbd className="px-1 py-0.5 rounded bg-muted">/</kbd> to focus • <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to send • <kbd className="px-1 py-0.5 rounded bg-muted">Esc</kbd> to close panel
        </p>
      </div>
    </div>
  );
}
