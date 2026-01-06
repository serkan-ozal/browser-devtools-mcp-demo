import * as React from "react";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconMessageCircle,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import {
  getStoredUser,
  type StoredGitHubUser,
} from "@/components/github-username-modal";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeView?: "dashboard" | "chat";
  onChatClick?: () => void;
  onDashboardClick?: () => void;
  currentPath?: string;
  onAccountClick?: () => void;
}

// Default user data (will be overridden by stored user if available)
const getDefaultUser = () => ({
  name: "",
  email: "",
  avatar: "",
});

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
      key: "dashboard",
    },
    {
      title: "Branches",
      url: "/branches",
      icon: IconListDetails,
      key: "branches",
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
      key: "analytics",
    },
    {
      title: "Projects",
      url: "/projects",
      icon: IconFolder,
      key: "projects",
    },
    {
      title: "Team",
      url: "/team",
      icon: IconUsers,
      key: "team",
    },
    {
      title: "Chat",
      url: "#",
      icon: IconMessageCircle,
      key: "chat",
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({
  activeView = "dashboard",
  onChatClick,
  onDashboardClick,
  onAccountClick,
  ...props
}: AppSidebarProps) {
  const [userData, setUserData] = React.useState<StoredGitHubUser | null>(null);

  // Load user data from localStorage
  React.useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUserData(storedUser);
    }
  }, []);

  // Listen for storage changes to update user data
  React.useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUserData(storedUser);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener("githubUserUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("githubUserUpdated", handleStorageChange);
    };
  }, []);

  const user = userData || getDefaultUser();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <img
                  src="/favicon.svg"
                  alt="GitHub Analytics Logo"
                  className="!size-5 shrink-0"
                />
                <span className="text-base font-semibold">
                  GitHub Analytics
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          activeView={activeView}
          onChatClick={onChatClick}
          onDashboardClick={onDashboardClick}
        />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {user.name ? (
          <NavUser user={user} onAccountClick={onAccountClick} />
        ) : (
          <div className="px-2 py-2">
            <div className="text-xs text-muted-foreground text-center">
              Search for a GitHub user to see profile
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
