import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function App() {
  const [activeView, setActiveView] = React.useState<"dashboard" | "chat">(
    "dashboard"
  );
  const [chatOpen, setChatOpen] = React.useState(false);
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

  // Update activeView based on current route
  React.useEffect(() => {
    if (location.pathname === "/") {
      setActiveView("dashboard");
    } else if (
      location.pathname === "/lifecycle" ||
      location.pathname === "/analytics" ||
      location.pathname === "/projects" ||
      location.pathname === "/team"
    ) {
      setActiveView("dashboard");
      setChatOpen(false);
    }
  }, [location.pathname]);

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
    </SidebarProvider>
  );
}
