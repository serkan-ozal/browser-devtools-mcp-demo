import { useOutletContext } from "react-router-dom";
import { SearchGithubUser } from "@/components/search-github-user";
import { getStoredUsername } from "@/components/github-username-modal";
import * as React from "react";

interface DashboardPageContext {
  activeView?: "dashboard" | "chat";
  onViewChange?: (view: "dashboard" | "chat") => void;
  chatOpen?: boolean;
  onChatOpenChange?: (open: boolean) => void;
}

export function DashboardPage() {
  const context = useOutletContext<DashboardPageContext>();
  const { activeView, onViewChange, chatOpen, onChatOpenChange } = context || {};
  const [savedUsername, setSavedUsername] = React.useState<string | null>(null);

  // Check for saved username on mount
  React.useEffect(() => {
    const stored = getStoredUsername();
    if (stored) {
      setSavedUsername(stored);
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <SearchGithubUser
              activeView={activeView}
              onViewChange={onViewChange}
              chatOpen={chatOpen}
              onChatOpenChange={onChatOpenChange}
              initialUsername={savedUsername || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

