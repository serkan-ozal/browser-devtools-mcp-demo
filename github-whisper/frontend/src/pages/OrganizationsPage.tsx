import { useQuery } from "@tanstack/react-query";
import { getStoredUsername } from "@/components/github-username-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconBuilding, IconUsers } from "@tabler/icons-react";
import * as React from "react";

interface Organization {
  login: string;
  id: number;
  avatar_url: string;
  description: string | null;
  url: string;
  repos_url: string;
  members_url: string;
}

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

// Fetch organizations
async function fetchOrganizations(username: string): Promise<Organization[]> {
  const response = await fetch(`https://api.github.com/users/${username}/orgs`, {
    headers: getGitHubHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch organizations");
  }
  return response.json();
}

export function OrganizationsPage() {
  const username = React.useMemo(() => getStoredUsername(), []);
  const { data: organizations, isLoading, error } = useQuery<Organization[]>({
    queryKey: ["organizations", username],
    queryFn: () => fetchOrganizations(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!username) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No GitHub Username</CardTitle>
            <CardDescription>
              Please set your GitHub username in the dashboard to view organizations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-muted-foreground">Loading organizations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load organizations. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <p className="text-muted-foreground mt-1">
          Organizations for {username}
        </p>
      </div>

      {!organizations || organizations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Organizations</CardTitle>
            <CardDescription>
              You are not a member of any organizations.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={org.avatar_url} alt={org.login} />
                    <AvatarFallback>
                      <IconBuilding className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{org.login}</CardTitle>
                    {org.description && (
                      <CardDescription className="line-clamp-2 mt-1">
                        {org.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <a
                    href={`https://github.com/${org.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <IconUsers className="h-4 w-4" />
                    View on GitHub
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
