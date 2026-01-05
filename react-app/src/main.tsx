import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { DashboardPage } from "./pages/DashboardPage";
import { LifecyclePage } from "./pages/LifecyclePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { TeamPage } from "./pages/TeamPage";

const queryClient = new QueryClient();

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
        path: "lifecycle",
        element: <LifecyclePage />,
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
