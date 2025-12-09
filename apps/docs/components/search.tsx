'use client';

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'fumadocs-ui/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { cn } from '@/lib/cn';

const API_BASE_URL = 'https://v2.jkt48connect.com/api/admin/search';
const API_USERNAME = 'vzy';
const API_PASSWORD = 'vzy';

interface SearchResult {
  id: string;
  score: number;
  document: {
    category: string;
    content: string;
    id: string;
    path: string;
    section: string;
    title: string;
  };
}

interface SearchResponse {
  status: boolean;
  message: string;
  data: {
    query: string;
    tag: string;
    total: number;
    results: SearchResult[];
  };
}

const items = [
  {
    name: 'All',
    value: 'all',
  },
  {
    name: 'Api',
    description: 'Only results about api documentation & guides',
    value: 'ui',
  },
  {
    name: 'Core',
    description: 'Only results about core features',
    value: 'headless',
  },
  {
    name: 'Blog',
    description: 'Only results about Blog',
    value: 'blog',
  },
];

// Function to extract page hierarchy from path
function getPageHierarchy(path: string, category: string) {
  const segments = path.split('/').filter(Boolean);
  
  // Extract parent page from path (e.g., /docs/ui/news -> ui)
  const parentPage = segments.length > 2 ? segments[1] : null;
  
  return {
    category: category || segments[0] || 'Docs',
    parent: parentPage ? parentPage.charAt(0).toUpperCase() + parentPage.slice(1) : null,
  };
}

export default function CustomSearchDialog(props: SharedProps) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!search || search.length < 2) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: search,
          tag: tag,
          limit: '30',
          username: API_USERNAME,
          password: API_PASSWORD,
        });

        const response = await fetch(`${API_BASE_URL}?${params}`);
        const data: SearchResponse = await response.json();

        if (data.status && data.data.results.length > 0) {
          // Transform results to match fumadocs format with breadcrumbs
          const transformedResults = data.data.results.map((result) => {
            const hierarchy = getPageHierarchy(result.document.path, result.document.category);
            
            return {
              id: result.document.path,
              type: 'page',
              content: result.document.title,
              url: result.document.path,
              // Add structured data for page tree display
              structured: {
                tag: hierarchy.category,
                heading: hierarchy.parent,
              },
            };
          });
          setResults(transformedResults);
        } else {
          setResults('empty');
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults('empty');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, tag]);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={results !== 'empty' ? results : null} />
        <SearchDialogFooter className="flex flex-row flex-wrap gap-2 items-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={buttonVariants({
                size: 'sm',
                color: 'ghost',
                className: '-m-1.5 me-auto',
              })}
            >
              <span className="text-fd-muted-foreground/80 me-2">Filter</span>
              {items.find((item) => item.value === tag)?.name}
              <ChevronDown className="size-3.5 text-fd-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="flex flex-col p-1 gap-1" align="start">
              {items.map((item, i) => {
                const isSelected = item.value === tag;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setTag(item.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'rounded-lg text-start px-2 py-1.5',
                      isSelected
                        ? 'text-fd-primary bg-fd-primary/10'
                        : 'hover:text-fd-accent-foreground hover:bg-fd-accent',
                    )}
                  >
                    <p className="font-medium mb-0.5">{item.name}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </button>
                );
              })}
            </PopoverContent>
          </Popover>
          <a
            href="https://jkt48connect.com"
            rel="noreferrer noopener"
            className="text-xs text-nowrap text-fd-muted-foreground"
          >
            Powered by JKT48Connect
          </a>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
