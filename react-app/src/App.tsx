import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  GitHubUsernameModal,
  getStoredUsername,
  getStoredUser,
} from "@/components/github-username-modal";

export default function App() {
  const [activeView, setActiveView] = React.useState<"dashboard" | "chat">(
    "dashboard"
  );
  const [chatOpen, setChatOpen] = React.useState(false);
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleChatClick = () => {
    setActiveView("chat");
    setChatOpen(true);
  };

  const handleDashboardClick = () => {
    setActiveView("dashboard");
    setChatOpen(false);
    navigate("/");
  };

  // Check for saved username on mount and load user data if needed
  React.useEffect(() => {
    const stored = getStoredUsername();
    if (!stored) {
      setShowUsernameModal(true);
    } else {
      // If username exists but user data doesn't, fetch it
      const storedUser = getStoredUser();
      if (!storedUser) {
        // User data will be loaded when modal saves username
        // For now, just show modal to let user confirm
        setShowUsernameModal(true);
      }
    }
  }, []);

  // Update activeView based on current route
  React.useEffect(() => {
    if (location.pathname === "/") {
      setActiveView("dashboard");
    } else if (
      location.pathname === "/branches" ||
      location.pathname === "/analytics" ||
      location.pathname === "/projects" ||
      location.pathname === "/team"
    ) {
      setActiveView("dashboard");
      setChatOpen(false);
    }
  }, [location.pathname]);

  const handleAccountClick = () => {
    setShowUsernameModal(true);
  };

  const handleSaveUsername = () => {
    setShowUsernameModal(false);
    // Reload the page to update the dashboard with new username
    // Username and user data are already saved in localStorage by the modal component
    window.location.reload();
  };

  const handleSkipUsername = () => {
    setShowUsernameModal(false);
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        activeView={activeView}
        onChatClick={handleChatClick}
        onDashboardClick={handleDashboardClick}
        currentPath={location.pathname}
        onAccountClick={handleAccountClick}
      />
      <SidebarInset>
        <SiteHeader />
        <Outlet
          context={{
            activeView,
            onViewChange: setActiveView,
            chatOpen,
            onChatOpenChange: setChatOpen,
          }}
        />
      </SidebarInset>
      <GitHubUsernameModal
        open={showUsernameModal}
        onOpenChange={setShowUsernameModal}
        onSave={handleSaveUsername}
        onSkip={handleSkipUsername}
      />
    </SidebarProvider>
  );
}
