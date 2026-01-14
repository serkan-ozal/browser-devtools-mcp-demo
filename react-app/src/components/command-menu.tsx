import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconFolder,
  IconUsers,
  IconSearch,
  IconFileCode,
  IconChartArea,
  IconTable,
  IconRobot,
  IconUser,
  IconPalette,
  IconBrandGithub,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "page" | "component";
  keywords?: string[];
}

const searchItems: SearchItem[] = [
  // Pages
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Main dashboard page",
    url: "/",
    icon: IconDashboard,
    category: "page",
    keywords: ["dashboard", "main", "home"],
  },
  {
    id: "branches",
    title: "Branches",
    description: "View and manage repository branches",
    url: "/branches",
    icon: IconListDetails,
    category: "page",
    keywords: ["branches", "git", "repository"],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "View analytics and insights",
    url: "/analytics",
    icon: IconChartBar,
    category: "page",
    keywords: ["analytics", "stats", "insights", "metrics"],
  },
  {
    id: "organizations",
    title: "Organizations",
    description: "View your GitHub organizations",
    url: "/organizations",
    icon: IconFolder,
    category: "page",
    keywords: ["organizations", "orgs", "teams", "github", "projects"],
  },
  {
    id: "team",
    title: "Team",
    description: "View team members and collaboration",
    url: "/team",
    icon: IconUsers,
    category: "page",
    keywords: ["team", "members", "collaboration", "users"],
  },
  // Components
  {
    id: "chart-area-interactive",
    title: "Chart Area Interactive",
    description: "Interactive chart component",
    url: "#",
    icon: IconChartArea,
    category: "component",
    keywords: ["chart", "graph", "visualization", "interactive"],
  },
  {
    id: "data-table",
    title: "Data Table",
    description: "Table component for displaying data",
    url: "#",
    icon: IconTable,
    category: "component",
    keywords: ["table", "data", "grid", "list"],
  },
  {
    id: "github-chatbot",
    title: "GitHub Chatbot",
    description: "AI chatbot for GitHub interactions",
    url: "#",
    icon: IconRobot,
    category: "component",
    keywords: ["chatbot", "ai", "github", "chat"],
  },
  {
    id: "github-username-modal",
    title: "GitHub Username Modal",
    description: "Modal for setting GitHub username",
    url: "#",
    icon: IconUser,
    category: "component",
    keywords: ["modal", "username", "github", "user"],
  },
  {
    id: "repo-table",
    title: "Repo Table",
    description: "Table component for repositories",
    url: "#",
    icon: IconBrandGithub,
    category: "component",
    keywords: ["repo", "repository", "table", "github"],
  },
  {
    id: "search-github-user",
    title: "Search GitHub User",
    description: "Component for searching GitHub users",
    url: "#",
    icon: IconSearch,
    category: "component",
    keywords: ["search", "github", "user", "find"],
  },
  {
    id: "section-cards",
    title: "Section Cards",
    description: "Card component for sections",
    url: "#",
    icon: IconFileCode,
    category: "component",
    keywords: ["card", "section", "ui"],
  },
  {
    id: "stress-analyzer",
    title: "Stress Analyzer",
    description: "Component for analyzing stress metrics",
    url: "#",
    icon: IconChartBar,
    category: "component",
    keywords: ["stress", "analyzer", "metrics", "analysis"],
  },
  {
    id: "theme-toggle",
    title: "Theme Toggle",
    description: "Toggle between light and dark themes",
    url: "#",
    icon: IconPalette,
    category: "component",
    keywords: ["theme", "dark", "light", "toggle", "mode"],
  },
];

// Transform search items to Algolia-compatible format for better search
const algoliaItems = searchItems.map((item) => ({
  objectID: item.id,
  title: item.title,
  description: item.description || "",
  url: item.url,
  category: item.category,
  keywords: item.keywords || [],
  // Combine all searchable text
  _searchableText: [
    item.title,
    item.description || "",
    ...(item.keywords || []),
  ]
    .join(" ")
    .toLowerCase(),
}));

// Function to search using Algolia-inspired ranking algorithm
// This implements Algolia's search principles: typo tolerance, ranking, and relevance
function searchWithAlgolia(query: string): SearchItem[] {
  if (!query.trim()) {
    return searchItems;
  }

  const lowerQuery = query.toLowerCase().trim();
  const queryWords = lowerQuery.split(/\s+/).filter(Boolean);

  // Algolia-inspired scoring system
  const scoredItems = algoliaItems.map((algoliaItem) => {
    const item = searchItems.find((si) => si.id === algoliaItem.objectID)!;
    let score = 0;

    // Exact title match (highest priority)
    if (item.title.toLowerCase() === lowerQuery) {
      score += 1000;
    }
    // Title starts with query
    else if (item.title.toLowerCase().startsWith(lowerQuery)) {
      score += 500;
    }
    // Title contains query
    else if (item.title.toLowerCase().includes(lowerQuery)) {
      score += 300;
    }
    // Word-by-word matching in title (Algolia-style)
    else {
      const titleWords = item.title.toLowerCase().split(/\s+/);
      const matchingWords = queryWords.filter((qw) =>
        titleWords.some((tw) => tw.includes(qw) || qw.includes(tw))
      );
      score += matchingWords.length * 100;
    }

    // Description matching
    if (item.description) {
      const descLower = item.description.toLowerCase();
      if (descLower.includes(lowerQuery)) {
        score += 50;
      }
      // Word matching in description
      const descWords = descLower.split(/\s+/);
      const matchingDescWords = queryWords.filter((qw) =>
        descWords.some((dw) => dw.includes(qw) || qw.includes(dw))
      );
      score += matchingDescWords.length * 20;
    }

    // Keyword exact matches (high priority)
    const keywordMatches =
      item.keywords?.filter((keyword) => {
        const kwLower = keyword.toLowerCase();
        return (
          kwLower === lowerQuery ||
          kwLower.includes(lowerQuery) ||
          lowerQuery.includes(kwLower) ||
          queryWords.some((qw) => kwLower.includes(qw) || qw.includes(kwLower))
        );
      }).length || 0;
    score += keywordMatches * 150;

    // Category bonus
    if (item.category === "page") {
      score += 10; // Slight preference for pages
    }

    // Typo tolerance: check if query is similar to title/description
    // Simple Levenshtein-like check for single character differences
    const titleLower = item.title.toLowerCase();
    if (
      titleLower.length >= lowerQuery.length - 1 &&
      titleLower.length <= lowerQuery.length + 1
    ) {
      // Check for single character difference (simple typo tolerance)
      let differences = 0;
      const minLen = Math.min(titleLower.length, lowerQuery.length);
      for (let i = 0; i < minLen; i++) {
        if (titleLower[i] !== lowerQuery[i]) differences++;
      }
      if (
        differences <= 1 &&
        Math.abs(titleLower.length - lowerQuery.length) <= 1
      ) {
        score += 200; // Typo tolerance bonus
      }
    }

    return { item, score, algoliaItem };
  });

  // Filter and sort by score (Algolia-style ranking)
  return scoredItems
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      // Primary sort: score (descending)
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Secondary sort: title (alphabetical)
      return a.item.title.localeCompare(b.item.title);
    })
    .map(({ item }) => item);
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLButtonElement>>(new Map());

  // Use Algolia-inspired search with optimized ranking
  const filteredItems = React.useMemo(() => {
    return searchWithAlgolia(query);
  }, [query]);

  // Reset selected index when filtered items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedItem = itemRefs.current.get(selectedIndex);
    if (selectedItem && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (itemTop < containerTop) {
        // Item is above visible area
        container.scrollTo({
          top: itemTop - 8, // Add some padding
          behavior: "smooth",
        });
      } else if (itemBottom > containerBottom) {
        // Item is below visible area
        container.scrollTo({
          top: itemBottom - container.clientHeight + 8, // Add some padding
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K (Mac) or CTRL+K (Windows/Linux) to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // ESC to close
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle navigation
  const handleSelect = (item: SearchItem) => {
    if (item.url && item.url !== "#") {
      navigate(item.url);
    }
    setOpen(false);
    setQuery("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, SearchItem[]> = {
      pages: [],
      components: [],
    };

    filteredItems.forEach((item) => {
      if (item.category === "page") {
        groups.pages.push(item);
      } else {
        groups.components.push(item);
      }
    });

    return groups;
  }, [filteredItems]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-2 sm:max-w-[600px] [&>button]:top-[1.825rem]">
        <DialogDescription className="sr-only">
          Search for pages and components
        </DialogDescription>
        <div className="flex items-center border-b px-4 py-2 pr-12">
          <IconSearch className="mr-3 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and components..."
            className="flex h-12 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div
          ref={scrollContainerRef}
          className="max-h-[400px] overflow-y-auto p-2"
        >
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-2">
              {groupedItems.pages.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Pages
                  </div>
                  {groupedItems.pages.map((item) => {
                    const actualIndex = filteredItems.indexOf(item);
                    const isSelected = actualIndex === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        ref={(el) => {
                          if (el) {
                            itemRefs.current.set(actualIndex, el);
                          } else {
                            itemRefs.current.delete(actualIndex);
                          }
                        }}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {groupedItems.components.length > 0 && (
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Components
                  </div>
                  {groupedItems.components.map((item) => {
                    const actualIndex = filteredItems.indexOf(item);
                    const isSelected = actualIndex === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        ref={(el) => {
                          if (el) {
                            itemRefs.current.set(actualIndex, el);
                          } else {
                            itemRefs.current.delete(actualIndex);
                          }
                        }}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ↑ ↓
              </kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                ↵
              </kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                Esc
              </kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
