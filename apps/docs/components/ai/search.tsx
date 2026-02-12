'use client';
import {
  type ComponentProps,
  createContext,
  type SyntheticEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, MessageCircleIcon, RefreshCw, Send, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import Link from 'fumadocs-core/link';
import { AnimatePresence, motion } from 'motion/react';
import { Markdown } from './markdown';
import { LiquidGlass } from '@specy/liquid-glass-react';

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
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useChatContext must be used within Context');
  return ctx;
}

function Header() {
  const { setOpen } = useChatContext();

  return (
    <div className="sticky top-0 max-sm:p-4 sm:p-0">
      <div className="flex items-start justify-between p-3 border rounded-xl bg-fd-card text-fd-card-foreground">
        <div className="flex-1">
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
        <motion.button
          aria-label="Close"
          tabIndex={-1}
          className={cn(
            buttonVariants({
              size: 'icon-sm',
              color: 'secondary',
              className: 'rounded-full',
            }),
          )}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            setOpen(false);
          }}
        >
          <X />
        </motion.button>
      </div>
    </div>
  );
}

function SearchAIActions() {
  const { messages, clearMessages } = useChatContext();

  if (messages.length === 0) return null;

  return (
    <>
      <motion.button
        type="button"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'rounded-full',
          }),
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={clearMessages}
      >
        Clear Chat
      </motion.button>
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
      <motion.button
        key="bn"
        type="submit"
        className={cn(
          buttonVariants({
            color: 'secondary',
            className: 'transition-all rounded-full mt-2',
          }),
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
        disabled={input.length === 0 || isLoading}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </motion.button>
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
  const streamRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayedContent(message.content);
      setIsStreamComplete(true);
      return;
    }

    if (isStreamComplete) {
      setDisplayedContent(message.content);
      return;
    }

    let currentIndex = 0;
    const fullContent = message.content;
    setDisplayedContent('');
    
    const streamText = () => {
      if (currentIndex < fullContent.length) {
        // Stream more characters at once for smoother animation (5-8 chars)
        const charsToAdd = Math.min(
          Math.floor(Math.random() * 4) + 5, 
          fullContent.length - currentIndex
        );
        currentIndex += charsToAdd;
        setDisplayedContent(fullContent.slice(0, currentIndex));
        
        streamRef.current = setTimeout(streamText, 20);
      } else {
        setIsStreamComplete(true);
        if (streamRef.current) {
          clearTimeout(streamRef.current);
        }
      }
    };

    streamText();

    return () => {
      if (streamRef.current) {
        clearTimeout(streamRef.current);
      }
    };
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
      <div className="prose text-sm relative">
        <Markdown text={displayedContent} />
        {message.isStreaming && !isStreamComplete && (
          <span className="inline-block w-1.5 h-4 bg-fd-primary animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}

export function AISearchTrigger() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalHeight, setModalHeight] = useState<'half' | 'full'>('half');

  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Adjust modal height based on messages count
  useEffect(() => {
    if (!isMobile) return;
    
    if (messages.length === 0) {
      setModalHeight('half');
    } else if (messages.length >= 2) {
      setModalHeight('full');
    }
  }, [messages.length, isMobile]);

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

  // LiquidGlass style configuration - memoized untuk prevent re-renders
  const glassStyle = useMemo(() => ({
    depth: 20,
  segments: 86,
  radius: 20,
  tint: null,
  reflectivity: 0.9,
  thickness: 50,
  dispersion: 6.4,
  roughness: 0.34,
  }), []);

  return (
    <Context.Provider value={contextValue}>
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,100..1000&display=swap');
        
        /* Glassmorphism Modal Styles */
        .glass-modal {
          --c-glass: #bbbbbc;
          --c-light: #fff;
          --c-dark: #000;
          --glass-reflex-dark: 1;
          --glass-reflex-light: 1;
          --saturation: 150%;
          
          font-family: "DM Sans", sans-serif;
          font-optical-sizing: auto;
          background-color: color-mix(in srgb, var(--c-glass) 12%, transparent) !important;
          backdrop-filter: blur(12px) saturate(var(--saturation));
          -webkit-backdrop-filter: blur(12px) saturate(var(--saturation));
          box-shadow: 
            inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 10%), transparent),
            inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent), 
            inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent), 
            inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent), 
            inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent), 
            inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent), 
            inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent), 
            inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent), 
            0px 1px 5px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent), 
            0px 6px 16px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 8%), transparent);
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .glass-modal {
            --c-glass: #bbbbbc;
            --c-light: #fff;
            --c-dark: #000;
            --glass-reflex-dark: 2;
            --glass-reflex-light: 0.3;
            --saturation: 150%;
          }
        }
        `}
      </style>
      <AnimatePresence initial={false}>
        {open && (
          <>
            {/* Backdrop blur overlay - hanya untuk mobile */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20 backdrop-blur-md bg-black/20 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            
            <motion.div
              key="modal"
              className={cn(
                "glass-modal fixed flex flex-col text-fd-popover-foreground border shadow-lg z-30",
                "sm:inset-y-2 sm:w-[460px] sm:end-2 sm:p-2 sm:rounded-2xl",
                "max-sm:inset-x-0 max-sm:border-x-0 max-sm:transition-all max-sm:duration-500",
                modalHeight === 'half' 
                  ? "max-sm:top-0 max-sm:max-h-[50vh] max-sm:rounded-b-3xl max-sm:rounded-t-none max-sm:border-t-0"
                  : "max-sm:top-0 max-sm:bottom-4 max-sm:rounded-b-3xl max-sm:rounded-t-none max-sm:border-t-0"
              )}
              initial={{ 
                opacity: 0, 
                scale: isMobile ? 1 : 0,
                y: isMobile ? -100 : 0
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0
              }}
              exit={{ 
                opacity: 0,
                scale: isMobile ? 1 : 0,
                y: isMobile ? -100 : 0
              }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
          <Header />
          <List
            className="px-3 py-4 flex-1 overscroll-contain max-sm:px-4"
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
          <div className="rounded-xl border bg-fd-card text-fd-card-foreground has-focus-visible:ring-2 has-focus-visible:ring-fd-ring max-sm:mx-4 max-sm:mb-4">
            <SearchAIInput />
            <div className="flex items-center gap-1.5 p-1 empty:hidden">
              <SearchAIActions />
            </div>
          </div>
        </motion.div>
        </>
        )}
      </AnimatePresence>
      <LiquidGlass
        glassStyle={glassStyle}
        wrapperStyle={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 20,
          opacity: open ? 0 : 1,
          transform: open ? 'translateY(2.5rem)' : 'translateY(0)',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: open ? 'none' : 'auto',
        }}
        style={{
          padding: '0.75rem 1rem',
          borderRadius: '9999px',
          cursor: 'pointer',
        }}
      >
        <motion.div
          className="flex items-center justify-center gap-2 text-sm font-medium"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => {
            setOpen(true);
          }}
        >
          <MessageCircleIcon className="size-4.5" />
          Ask AI
        </motion.div>
      </LiquidGlass>
    </Context.Provider>
  );
}
