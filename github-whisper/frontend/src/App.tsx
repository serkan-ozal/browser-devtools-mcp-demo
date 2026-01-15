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
import { CommandMenu } from "@/components/command-menu";
import { GitHubChatbot } from "@/components/github-chatbot";
import { fetchUser } from "@/api/github";

interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  location: string | null;
  blog: string | null;
  company: string | null;
  created_at: string;
  email: string | null;
}

export default function App() {
  const [activeView, setActiveView] = React.useState<"dashboard" | "chat">(
    "dashboard"
  );
  const [chatOpen, setChatOpen] = React.useState(false);
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);
  const [chatUser, setChatUser] = React.useState<GitHubUser | null>(null);
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
      } else {
        // Fetch full user data for chat
        fetchUser(stored)
          .then((user) => setChatUser(user))
          .catch((error) => {
            console.error("Failed to fetch user data for chat:", error);
          });
      }
    }
  }, []);

  // Listen for user updates
  React.useEffect(() => {
    const handleUserUpdate = () => {
      const stored = getStoredUsername();
      if (stored) {
        fetchUser(stored)
          .then((user) => setChatUser(user))
          .catch((error) => {
            console.error("Failed to fetch user data for chat:", error);
          });
      } else {
        setChatUser(null);
      }
    };

    window.addEventListener("githubUserUpdated", handleUserUpdate);
    return () => {
      window.removeEventListener("githubUserUpdated", handleUserUpdate);
    };
  }, []);

  // Update activeView based on current route
  React.useEffect(() => {
    if (location.pathname === "/") {
      setActiveView("dashboard");
    } else if (
      location.pathname === "/branches" ||
      location.pathname === "/analytics" ||
      location.pathname === "/projects" ||
      location.pathname === "/organizations" ||
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
    <SidebarProvider>
      <AppSidebar
        activeView={activeView}
        onChatClick={handleChatClick}
        onDashboardClick={handleDashboardClick}
        currentPath={location.pathname}
        onAccountClick={handleAccountClick}
      />
      <SidebarInset>
        <SiteHeader onAccountClick={handleAccountClick} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet
            context={{
              activeView,
              onViewChange: setActiveView,
              chatOpen,
              onChatOpenChange: setChatOpen,
            }}
          />
        </div>
      </SidebarInset>
      <GitHubUsernameModal
        open={showUsernameModal}
        onOpenChange={setShowUsernameModal}
        onSave={handleSaveUsername}
        onSkip={handleSkipUsername}
      />
      <CommandMenu />
      <GitHubChatbot
        user={chatUser}
        open={chatOpen}
        onOpenChange={(open) => {
          setChatOpen(open);
          if (!open) {
            setActiveView("dashboard");
          }
        }}
      />
    </SidebarProvider>
  );
}
