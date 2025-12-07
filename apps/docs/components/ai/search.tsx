'use client';
import {
  type ComponentProps,
  createContext,
  type SyntheticEvent,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, MessageCircleIcon, RefreshCw, Send, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import Link from 'fumadocs-core/link';
import { Presence } from '@radix-ui/react-presence';
import { Markdown } from './markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  clearMessages: () => void;
} | null>(null);

function useChatContext() {
  const ctx = use(Context);
  if (!ctx) throw new Error('useChatContext must be used within Context');
  return ctx;
}

function Header() {
  const { setOpen } = useChatContext();

  return (
    <div className="sticky top-0 flex items-start gap-2">
      <div className="flex-1 p-3 border rounded-xl bg-fd-card text-fd-card-foreground">
        <p className="text-sm font-medium mb-2">Ask AI</p>
        <p className="text-xs text-fd-muted-foreground">
          Powered by{' '}
          <a
            href="https://docs.jkt48connect.com"
            target="_blank"
            rel="noreferrer noopener"
          >
            JKT48Connect AI
          </a>
        </p>
      </div>
      <button
        aria-label="Close"
        tabIndex={-1}
        className={cn(
          buttonVariants({
            size: 'icon-sm',
            color: 'secondary',
            className: 'rounded-full',
          }),
        )}
        onClick={() => {
          setOpen(false);
        }}
      >
        <X />
      </button>
    </div>
  );
}

function SearchAIActions() {
  const { messages, clearMessages } = useChatContext();

  if (messages.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'rounded-full',
          }),
        )}
        onClick={clearMessages}
      >
        Clear Chat
      </button>
    </>
  );
}

const StorageKeyInput = '__ai_search_input';

function SearchAIInput(props: ComponentProps<'form'>) {
  const { sendMessage, isLoading } = useChatContext();
  const [input, setInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(StorageKeyInput) ?? '';
    }
    return '';
  });

  const onStart = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      await sendMessage(input);
      setInput('');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(StorageKeyInput, input);
    }
  }, [input]);

  useEffect(() => {
    if (isLoading) {
      document.getElementById('nd-ai-input')?.focus();
    }
  }, [isLoading]);

  return (
    <form
      {...props}
      className={cn('flex items-start pe-2', props.className)}
      onSubmit={onStart}
    >
      <Input
        value={input}
        placeholder={isLoading ? 'AI is answering...' : 'Ask a question'}
        autoFocus
        className="p-3"
        disabled={isLoading}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === 'Enter') {
            void onStart(event);
          }
        }}
      />
      <button
        key="bn"
        type="submit"
        className={cn(
          buttonVariants({
            color: 'secondary',
            className: 'transition-all rounded-full mt-2',
          }),
        )}
        disabled={input.length === 0 || isLoading}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </button>
    </form>
  );
}

function List(props: Omit<ComponentProps<'div'>, 'dir'>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn(
        'fd-scroll-container overflow-y-auto min-w-0 flex flex-col',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

function Input(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLDivElement>(null);
  const shared = cn('col-start-1 row-start-1', props.className);

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-ai-input"
        {...props}
        className={cn(
          'resize-none bg-transparent placeholder:text-fd-muted-foreground focus-visible:outline-none',
          shared,
        )}
      />
      <div ref={ref} className={cn(shared, 'break-all invisible')}>
        {`${props.value?.toString() ?? ''}\n`}
      </div>
    </div>
  );
}

const roleName: Record<string, string> = {
  user: 'you',
  assistant: 'jkt48connect',
};

function Message({
  message,
  ...props
}: { message: Message } & ComponentProps<'div'>) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isStreamComplete, setIsStreamComplete] = useState(!message.isStreaming);

  useEffect(() => {
    if (!message.isStreaming || isStreamComplete) {
      setDisplayedContent(message.content);
      return;
    }

    let currentIndex = 0;
    const fullContent = message.content;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < fullContent.length) {
        const charsToAdd = Math.min(Math.floor(Math.random() * 3) + 2, fullContent.length - currentIndex);
        currentIndex += charsToAdd;
        setDisplayedContent(fullContent.slice(0, currentIndex));
      } else {
        setIsStreamComplete(true);
        clearInterval(streamInterval);
      }
    }, 30);

    return () => clearInterval(streamInterval);
  }, [message.content, message.isStreaming, isStreamComplete]);

  return (
    <div {...props}>
      <p
        className={cn(
          'mb-1 text-sm font-medium text-fd-muted-foreground',
          message.role === 'assistant' && 'text-fd-primary',
        )}
      >
        {roleName[message.role] ?? 'unknown'}
      </p>
      <div className="prose text-sm">
        <Markdown text={displayedContent} />
        {message.isStreaming && !isStreamComplete && (
          <span className="inline-block w-1.5 h-4 bg-fd-primary animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}

export function AISearchTrigger() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.result,
          isStreaming: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg
            )
          );
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        isStreaming: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      e.preventDefault();
    }

    if (e.key === '/' && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true);
      e.preventDefault();
    }
  };

  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;
  
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      onKeyPressRef.current(e);
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);

  const contextValue = useMemo(
    () => ({ open, setOpen, messages, sendMessage, isLoading, clearMessages }),
    [open, messages, isLoading],
  );

  return (
    <Context value={contextValue}>
      <style>
        {`
        @keyframes ask-ai-open {
          from {
            translate: 100% 0;
          }
        }
        
        @keyframes ask-ai-close {
          to {
            translate: 100% 0;
            opacity: 0;
          }
        }`}
      </style>
      <Presence present={open}>
        <div
          className={cn(
            'fixed flex flex-col inset-y-2 p-2 bg-fd-popover text-fd-popover-foreground border rounded-2xl shadow-lg z-30 sm:w-[460px] sm:end-2 max-sm:inset-x-2',
            open
              ? 'animate-[ask-ai-open_300ms]'
              : 'animate-[ask-ai-close_300ms]',
          )}
        >
          <Header />
          <List
            className="px-3 py-4 flex-1 overscroll-contain"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)',
            }}
          >
            <div className="flex flex-col gap-4">
              {messages.map((item) => (
                <Message key={item.id} message={item} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-fd-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          </List>
          <div className="rounded-xl border bg-fd-card text-fd-card-foreground has-focus-visible:ring-2 has-focus-visible:ring-fd-ring">
            <SearchAIInput />
            <div className="flex items-center gap-1.5 p-1 empty:hidden">
              <SearchAIActions />
            </div>
          </div>
        </div>
      </Presence>
      <button
        className={cn(
          'fixed flex items-center gap-2 bottom-4 right-4 bg-fd-secondary px-2 gap-3 w-24 h-10 text-sm font-medium text-fd-muted-foreground rounded-2xl border shadow-lg z-20 transition-[translate,opacity]',
          open && 'translate-y-10 opacity-0',
        )}
        onClick={() => {
          setOpen(true);
        }}
      >
        <MessageCircleIcon className="size-4.5" />
        Ask AI
      </button>
    </Context>
  );
}
