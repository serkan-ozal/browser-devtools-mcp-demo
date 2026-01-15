import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { IconSearch } from "@tabler/icons-react";
import { useLocation } from "react-router-dom";

interface SiteHeaderProps {
  onAccountClick?: () => void;
}

function getPageTitle(pathname: string): string {
  const routeMap: Record<string, string> = {
    "/": "Dashboard",
    "/branches": "Branches",
    "/analytics": "Analytics",
    "/projects": "Projects",
    "/organizations": "Organizations",
    "/team": "Team",
  };

  return routeMap[pathname] || "GithubWhisper";
}

export function SiteHeader({ onAccountClick }: SiteHeaderProps) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: navigator.platform.toLowerCase().includes("mac")
                  ? false
                  : true,
                metaKey: navigator.platform.toLowerCase().includes("mac")
                  ? true
                  : false,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <IconSearch className="size-4 shrink-0" />
            <span className="hidden lg:inline">Search</span>
            <kbd className="pointer-events-none hidden lg:inline-flex h-5 select-none items-center justify-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              {navigator.platform.toLowerCase().includes("mac") ? (
                <>
                  <span className="text-xs">⌘</span>K
                </>
              ) : (
                <>
                  <span className="text-xs">Ctrl</span>+K
                </>
              )}
            </kbd>
          </Button>
          <ThemeToggle />
          {onAccountClick && (
            <Button variant="ghost" size="sm" onClick={onAccountClick}>
              Account
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
