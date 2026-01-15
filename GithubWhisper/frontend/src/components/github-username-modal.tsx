import * as React from "react";
import { IconBrandGithub } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Helper function to get GitHub headers
function getGitHubHeaders(): HeadersInit {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

// Fetch GitHub user data
async function fetchGitHubUserData(username: string): Promise<StoredGitHubUser | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders(),
    });
    if (!response.ok) {
      return null;
    }
    const user = await response.json();
    const email = user.email || `${user.login}@users.noreply.github.com`;
    return {
      name: user.name || user.login,
      email: email,
      avatar: user.avatar_url,
      login: user.login,
    };
  } catch (error) {
    console.error("Error fetching GitHub user:", error);
    return null;
  }
}

interface GitHubUsernameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (username?: string) => void;
  onSkip: () => void;
}

const STORAGE_KEY = "github_username";
const STORAGE_USER_KEY = "github_user_data";

export interface StoredGitHubUser {
  name: string;
  email: string;
  avatar: string;
  login: string;
}

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function saveUsername(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, username);
}

export function clearUsername(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function getStoredUser(): StoredGitHubUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveUser(user: StoredGitHubUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

export function GitHubUsernameModal({
  open,
  onOpenChange,
  onSave,
  onSkip,
}: GitHubUsernameModalProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Load current username when modal opens
  React.useEffect(() => {
    if (open) {
      const currentUsername = getStoredUsername();
      if (currentUsername) {
        setInputValue(currentUsername);
      } else {
        setInputValue("");
      }
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = inputValue.trim();

    if (!username) {
      setError("Please enter a GitHub username");
      return;
    }

    // Basic validation - GitHub usernames are alphanumeric with hyphens and underscores
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(username)) {
      setError("Please enter a valid GitHub username");
      return;
    }

    setError("");
    setIsLoading(true);
    
    try {
      // Save username first
      saveUsername(username);
      
      // Fetch and save user data
      const userData = await fetchGitHubUserData(username);
      if (userData) {
        saveUser(userData);
        // Dispatch event to update sidebar
        window.dispatchEvent(new Event("githubUserUpdated"));
      } else {
        setError("Failed to fetch user data. Please try again.");
        setIsLoading(false);
        return;
      }
      
      onSave();
      setInputValue("");
      onOpenChange(false);
    } catch (error) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setInputValue("");
    setError("");
    onSkip();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <IconBrandGithub className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {getStoredUsername() ? "Update GitHub Username" : "Welcome to GitHub Analytics"}
              </DialogTitle>
              <DialogDescription>
                {getStoredUsername()
                  ? "Update your GitHub username to change the dashboard"
                  : "Enter your GitHub username to get started"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">GitHub Username</Label>
              <Input
                id="username"
                placeholder="octocat"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleSkip();
                  }
                }}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your username will be saved locally and used to load your dashboard automatically.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isLoading}
            >
              Skip
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Save & Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

