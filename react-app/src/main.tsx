import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { DashboardPage } from "./pages/DashboardPage";
import { BranchesPage } from "./pages/BranchesPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { TeamPage } from "./pages/TeamPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";

// Cache key for localStorage
const CACHE_KEY = "github_dashboard_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load cache from localStorage and restore to QueryClient
function restoreCacheFromStorage(queryClient: QueryClient) {
  if (typeof window === "undefined") return;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;

    const parsed = JSON.parse(cached) as Record<
      string,
      { data: unknown; timestamp: number }
    >;
    const now = Date.now();
    const valid: Record<string, { data: unknown; timestamp: number }> = {};

    // Filter out expired entries and restore valid ones
    for (const [key, value] of Object.entries(parsed)) {
      if (value && typeof value === "object" && "timestamp" in value) {
        const age = now - (value.timestamp as number);
        if (age < CACHE_DURATION && "data" in value) {
          valid[key] = value;
          try {
            const queryKey = JSON.parse(key);
            queryClient.setQueryData(queryKey, value.data);
          } catch {
            // Invalid key format, skip
          }
        }
      }
    }

    // Update localStorage with only valid entries
    if (Object.keys(valid).length !== Object.keys(parsed).length) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(valid));
    }
  } catch (error) {
    console.warn("Failed to restore cache from localStorage:", error);
  }
}

// Save cache to localStorage when queries succeed
function setupCachePersistence(queryClient: QueryClient) {
  if (typeof window === "undefined") return;

  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === "updated" && event.query.state.status === "success") {
      try {
        const queryKey = JSON.stringify(event.query.queryKey);
        const cached = localStorage.getItem(CACHE_KEY);
        const parsed = cached ? JSON.parse(cached) : {};

        parsed[queryKey] = {
          data: event.query.state.data,
          timestamp: Date.now(),
        };

        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.warn("Failed to save cache to localStorage:", error);
      }
    }
  });

  return unsubscribe;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_DURATION,
      gcTime: CACHE_DURATION * 2, // Keep in cache for 10 minutes
      retry: false,
    },
  },
});

// Restore cache on mount
restoreCacheFromStorage(queryClient);

// Setup cache persistence
setupCachePersistence(queryClient);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "branches",
        element: <BranchesPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "organizations",
        element: <OrganizationsPage />,
      },
      {
        path: "team",
        element: <TeamPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
