import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconSearch,
  IconLoader,
  IconBrandTwitter,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardAction, CardFooter } from "@/components/ui/card";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { RepoTable } from "@/components/repo-table";

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
}

interface GitHubUserSearchResult {
  login: string;
  avatar_url: string;
  type: string;
}

interface GitHubSearchResponse {
  items: GitHubUserSearchResult[];
  total_count: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  html_url: string;
  private: boolean;
}

interface CommitActivityWeek {
  week: number;
  days: number[];
  total: number;
}

interface MonthlyCommitData {
  month: string;
  date: string;
  commits: number;
}

interface PunchCardData {
  day: number;
  hour: number;
  commits: number;
}

interface CodingTimeStats {
  nightCommits: number;
  dayCommits: number;
  nightPercentage: number;
  dayPercentage: number;
  coderType: "Night Coder" | "Daily Coder";
}

interface LanguageStats {
  language: string;
  bytes: number;
  percentage: number;
}

// GitHub API token helper
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

async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const response = await fetch(`https://api.github.com/users/${username}`, {
    headers: getGitHubHeaders(),
  });
  if (!response.ok) {
    throw new Error("User not found");
  }
  return response.json();
}

async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 30; // Daha az repo çek

  while (true) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
      {
        headers: getGitHubHeaders(),
      }
    );

    // Rate limit kontrolü
    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
    }

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const data: GitHubRepo[] = await response.json();
    if (data.length === 0) break;
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
    // Rate limit koruması için maksimum 2 sayfa (60 repo)
    if (page > 2) break;

    // Sayfa aralarında bekleme
    if (page <= 2) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return repos;
}

async function fetchTopRepos(username: string): Promise<GitHubRepo[]> {
  const repos = await fetchUserRepos(username);
  // En güncel 20 repo'yu döndür (pushed_at'e göre sırala)
  return repos
    .filter((repo) => !repo.private)
    .sort(
      (a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
    )
    .slice(0, 20);
}

async function fetchRepoPunchCard(
  owner: string,
  repo: string
): Promise<PunchCardData[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/stats/punch_card`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    if (rateLimitRemaining === "0") {
      throw new Error("API rate limit exceeded");
    }
  }

  if (!response.ok) {
    if (response.status === 202) {
      return [];
    }
    return [];
  }

  const data: number[][] = await response.json();
  return data.map(([day, hour, commits]) => ({
    day,
    hour,
    commits,
  }));
}

async function fetchRepoLanguages(
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/languages`,
    {
      headers: getGitHubHeaders(),
    }
  );

  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    if (rateLimitRemaining === "0") {
      throw new Error("API rate limit exceeded");
    }
  }

  if (!response.ok) {
    return {};
  }

  return response.json();
}

async function fetchUserTopLanguages(
  username: string
): Promise<LanguageStats[]> {
  try {
    const repos = await fetchUserRepos(username);
    const publicRepos = repos.filter((repo) => !repo.private).slice(0, 20);

    const languageBytes: Record<string, number> = {};

    for (const repo of publicRepos) {
      try {
        const languages = await fetchRepoLanguages(username, repo.name);

        Object.entries(languages).forEach(([language, bytes]) => {
          if (languageBytes[language]) {
            languageBytes[language] += bytes;
          } else {
            languageBytes[language] = bytes;
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.warn(`Failed to fetch languages for ${repo.name}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    const totalBytes = Object.values(languageBytes).reduce(
      (sum, bytes) => sum + bytes,
      0
    );

    const languageStats: LanguageStats[] = Object.entries(languageBytes)
      .map(([language, bytes]) => ({
        language,
        bytes,
        percentage: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 3)
      .map((stat) => ({
        ...stat,
        percentage: Math.round(stat.percentage * 10) / 10,
      }));

    return languageStats;
  } catch (error) {
    console.error("Error fetching language stats:", error);
    return [];
  }
}

async function fetchUserCodingTimeStats(
  username: string
): Promise<CodingTimeStats> {
  try {
    const repos = await fetchUserRepos(username);
    const publicRepos = repos.filter((repo) => !repo.private).slice(0, 10);

    let totalNightCommits = 0;
    let totalDayCommits = 0;

    for (const repo of publicRepos) {
      try {
        const punchCard = await fetchRepoPunchCard(username, repo.name);

        punchCard.forEach(({ hour, commits }) => {
          // Gece: 22:00-03:00 (22, 23, 0, 1, 2, 3)
          // Gündüz: 04:00-21:00 (4-21)
          if (hour >= 22 || hour <= 3) {
            totalNightCommits += commits;
          } else {
            totalDayCommits += commits;
          }
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Failed to fetch punch card for ${repo.name}:`, error);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    const totalCommits = totalNightCommits + totalDayCommits;
    const nightPercentage =
      totalCommits > 0 ? (totalNightCommits / totalCommits) * 100 : 0;
    const dayPercentage =
      totalCommits > 0 ? (totalDayCommits / totalCommits) * 100 : 0;

    return {
      nightCommits: totalNightCommits,
      dayCommits: totalDayCommits,
      nightPercentage: Math.round(nightPercentage * 10) / 10,
      dayPercentage: Math.round(dayPercentage * 10) / 10,
      coderType:
        nightPercentage > dayPercentage ? "Night Coder" : "Daily Coder",
    };
  } catch (error) {
    console.error("Error fetching coding time stats:", error);
    return {
      nightCommits: 0,
      dayCommits: 0,
      nightPercentage: 0,
      dayPercentage: 0,
      coderType: "Daily Coder",
    };
  }
}

async function fetchRepoCommitActivity(
  owner: string,
  repo: string
): Promise<CommitActivityWeek[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`,
    {
      headers: getGitHubHeaders(),
    }
  );

  // Rate limit kontrolü
  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    if (rateLimitRemaining === "0") {
      throw new Error("API rate limit exceeded");
    }
  }

  if (!response.ok) {
    // 202 Accepted means stats are being calculated, return empty
    if (response.status === 202) {
      return [];
    }
    return [];
  }
  return response.json();
}

async function fetchUserMonthlyCommits(
  username: string
): Promise<MonthlyCommitData[]> {
  try {
    const repos = await fetchUserRepos(username);

    const monthlyCommits: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      monthlyCommits[monthKey] = 0;
    }

    const reposToProcess = repos.slice(0, 10);

    // Her repo için commit activity'yi çek
    for (let i = 0; i < reposToProcess.length; i++) {
      const repo = reposToProcess[i];
      try {
        const activity = await fetchRepoCommitActivity(username, repo.name);

        if (activity && activity.length > 0) {
          activity.forEach((week) => {
            const weekDate = new Date(week.week * 1000);
            const monthKey = weekDate.toISOString().slice(0, 7);

            if (monthKey in monthlyCommits) {
              monthlyCommits[monthKey] += week.total;
            }
          });
        }

        // Rate limit koruması için her API çağrısı arasında bekleme
        // İlk çağrıdan sonra daha uzun bekleme
        if (i < reposToProcess.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // Rate limit hatası ise dur
        if (error instanceof Error && error.message.includes("rate limit")) {
          console.warn("Rate limit reached, stopping data fetch");
          break;
        }
        // Diğer hatalarda devam et
        console.warn(`Failed to fetch activity for ${repo.name}:`, error);
        // Hata durumunda da bekleme yap
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const chartData: MonthlyCommitData[] = Object.entries(monthlyCommits)
      .map(([month, commits]) => {
        const [year, monthNum] = month.split("-");
        const date = new Date(
          parseInt(year),
          parseInt(monthNum) - 1,
          15
        ).toISOString();
        return {
          month,
          date,
          commits,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  } catch (error) {
    console.error("Error fetching commit data:", error);
    return [];
  }
}

async function searchGitHubUsers(
  query: string
): Promise<GitHubUserSearchResult[]> {
  const response = await fetch(
    `https://api.github.com/search/users?q=${encodeURIComponent(
      query
    )}&per_page=5`,
    {
      headers: getGitHubHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error("Search failed");
  }
  const data: GitHubSearchResponse = await response.json();
  return data.items;
}

export function SearchGithubUser() {
  const [username, setUsername] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(username);
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  // Search for user suggestions
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["githubUserSuggestions", debouncedSearch],
    queryFn: () => searchGitHubUsers(debouncedSearch),
    enabled: debouncedSearch.length > 2 && showSuggestions,
    retry: false,
  });

  // Fetch selected user details
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["githubUser", searchQuery],
    queryFn: () => fetchGitHubUser(searchQuery),
    enabled: searchQuery.length > 0,
    retry: false,
  });

  // Fetch user commit data
  const {
    data: commitData,
    isLoading: isLoadingCommits,
    isError: isCommitError,
    error: commitError,
  } = useQuery({
    queryKey: ["githubUserCommits", searchQuery],
    queryFn: () => fetchUserMonthlyCommits(searchQuery),
    enabled: searchQuery.length > 0 && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top repos
  const { data: topRepos, isLoading: isLoadingRepos } = useQuery({
    queryKey: ["githubUserTopRepos", searchQuery],
    queryFn: () => fetchTopRepos(searchQuery),
    enabled: searchQuery.length > 0 && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch coding time stats
  const { data: codingStats, isLoading: isLoadingCodingStats } = useQuery({
    queryKey: ["githubUserCodingStats", searchQuery],
    queryFn: () => fetchUserCodingTimeStats(searchQuery),
    enabled: searchQuery.length > 0 && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch top languages
  const { data: topLanguages, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ["githubUserTopLanguages", searchQuery],
    queryFn: () => fetchUserTopLanguages(searchQuery),
    enabled: searchQuery.length > 0 && !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setSearchQuery(username.trim());
      setShowSuggestions(false);
    }
  };

  const handleSelectUser = (selectedUsername: string) => {
    setUsername(selectedUsername);
    setSearchQuery(selectedUsername);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (username.length > 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <CardTitle>Search GitHub User</CardTitle>
          <CardDescription>
            Enter a GitHub username to view their profile and dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch} className="relative flex gap-2 px-6 pb-6">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter GitHub username..."
              value={username}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className="flex-1"
            />
            {showSuggestions && debouncedSearch.length > 2 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-lg"
              >
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center gap-2 p-4">
                    <IconLoader className="animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Searching...
                    </span>
                  </div>
                ) : suggestions && suggestions.length > 0 ? (
                  <div className="max-h-60 overflow-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.login}
                        type="button"
                        onClick={() => handleSelectUser(suggestion.login)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                      >
                        <Avatar className="size-8">
                          <AvatarImage
                            src={suggestion.avatar_url}
                            alt={suggestion.login}
                          />
                          <AvatarFallback>
                            {suggestion.login[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {suggestion.login}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {suggestion.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : debouncedSearch.length > 2 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <Button type="submit" disabled={isLoading || !username.trim()}>
            {isLoading ? (
              <>
                <IconLoader className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <IconSearch />
                Search
              </>
            )}
          </Button>
        </form>
      </Card>

      {isError && (
        <Card className="mx-4 lg:mx-6">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Failed to fetch user"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {isLoading ? (
        <Card className="mx-4 lg:mx-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </Card>
      ) : (
        user && (
          <>
            <Card className="mx-4 lg:mx-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="size-20">
                    <AvatarImage src={user.avatar_url} alt={user.login} />
                    <AvatarFallback>
                      {user.login[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {user.name || user.login}
                    </CardTitle>
                    <CardDescription className="text-base">
                      @{user.login}
                    </CardDescription>
                    {user.bio && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {user.bio}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {user.location && (
                        <Badge variant="outline">{user.location}</Badge>
                      )}
                      {user.company && (
                        <Badge variant="outline">{user.company}</Badge>
                      )}
                      {user.blog && (
                        <Badge variant="outline" asChild>
                          <a
                            href={user.blog}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Website
                          </a>
                        </Badge>
                      )}
                      <Badge variant="outline" asChild>
                        <a
                          href={`https://twitter.com/${user.login}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <IconBrandTwitter className="size-3" />
                          Twitter
                        </a>
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="grid grid-cols-1 gap-4 px-6 pb-6 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    Repositories
                  </span>
                  <span className="text-2xl font-semibold">
                    {user.public_repos}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    Followers
                  </span>
                  <span className="text-2xl font-semibold">
                    {user.followers}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    Following
                  </span>
                  <span className="text-2xl font-semibold">
                    {user.following}
                  </span>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              {/* GitHub Stats Cards */}
              {codingStats && (
                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                  <Card className="@container/card">
                    <CardHeader>
                      <CardDescription>Coder Type</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {isLoadingCodingStats ? (
                          <Skeleton className="h-8 w-32" />
                        ) : (
                          codingStats.coderType
                        )}
                      </CardTitle>
                      <CardAction>
                        {!isLoadingCodingStats && (
                          <Badge variant="outline">
                            {codingStats.coderType === "Night Coder" ? (
                              <IconMoon className="size-4" />
                            ) : (
                              <IconSun className="size-4" />
                            )}
                            {codingStats.coderType === "Night Coder"
                              ? codingStats.nightPercentage
                              : codingStats.dayPercentage}
                            %
                          </Badge>
                        )}
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      {isLoadingCodingStats ? (
                        <>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </>
                      ) : (
                        <>
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            {codingStats.coderType === "Night Coder"
                              ? "Most active during night"
                              : "Most active during day"}
                            {codingStats.coderType === "Night Coder" ? (
                              <IconMoon className="size-4" />
                            ) : (
                              <IconSun className="size-4" />
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            {codingStats.nightCommits + codingStats.dayCommits}{" "}
                            total commits analyzed
                          </div>
                        </>
                      )}
                    </CardFooter>
                  </Card>

                  <Card className="@container/card">
                    <CardHeader>
                      <CardDescription>Night Coding</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {isLoadingCodingStats ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          `${codingStats.nightPercentage}%`
                        )}
                      </CardTitle>
                      <CardAction>
                        {!isLoadingCodingStats && (
                          <Badge variant="outline">
                            <IconMoon className="size-4" />
                            {codingStats.nightCommits} commits
                          </Badge>
                        )}
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      {isLoadingCodingStats ? (
                        <>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </>
                      ) : (
                        <>
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            Commits between 22:00-03:00{" "}
                            <IconMoon className="size-4" />
                          </div>
                          <div className="text-muted-foreground">
                            Night owl coding sessions
                          </div>
                        </>
                      )}
                    </CardFooter>
                  </Card>

                  <Card className="@container/card">
                    <CardHeader>
                      <CardDescription>Day Coding</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {isLoadingCodingStats ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          `${codingStats.dayPercentage}%`
                        )}
                      </CardTitle>
                      <CardAction>
                        {!isLoadingCodingStats && (
                          <Badge variant="outline">
                            <IconSun className="size-4" />
                            {codingStats.dayCommits} commits
                          </Badge>
                        )}
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      {isLoadingCodingStats ? (
                        <>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </>
                      ) : (
                        <>
                          <div className="line-clamp-1 flex gap-2 font-medium">
                            Commits between 04:00-21:00{" "}
                            <IconSun className="size-4" />
                          </div>
                          <div className="text-muted-foreground">
                            Daytime coding productivity
                          </div>
                        </>
                      )}
                    </CardFooter>
                  </Card>

                  {topLanguages && topLanguages.length > 0 && (
                    <Card className="@container/card">
                      <CardHeader>
                        <CardDescription>Top Language</CardDescription>
                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                          {isLoadingLanguages ? (
                            <Skeleton className="h-8 w-24" />
                          ) : (
                            topLanguages[0]?.language || "-"
                          )}
                        </CardTitle>
                        <CardAction>
                          {!isLoadingLanguages && topLanguages[0] && (
                            <Badge variant="outline">
                              {topLanguages[0].percentage}%
                            </Badge>
                          )}
                        </CardAction>
                      </CardHeader>
                      <CardFooter className="flex-col items-start gap-1.5 text-sm">
                        {isLoadingLanguages ? (
                          <>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </>
                        ) : (
                          <>
                            <div className="line-clamp-1 flex gap-2 font-medium">
                              Most used programming language
                            </div>
                            <div className="text-muted-foreground">
                              {topLanguages[0]?.bytes.toLocaleString()} bytes
                              across repos
                            </div>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  )}
                </div>
              )}

              {isCommitError && (
                <Card className="mx-4 lg:mx-6">
                  <CardHeader>
                    <CardTitle className="text-destructive text-lg">
                      Commit Data Unavailable
                    </CardTitle>
                    <CardDescription>
                      {commitError instanceof Error &&
                      commitError.message.includes("rate limit")
                        ? "GitHub API rate limit exceeded. Please wait a few minutes and try again. Authenticated requests get a higher rate limit."
                        : "Unable to fetch commit data. This may be due to API rate limits or the user having no public repositories."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive
                  commitData={commitData || []}
                  isLoading={isLoadingCommits}
                />
              </div>

              <Card className="mx-4 lg:mx-6">
                <CardHeader>
                  <CardTitle>Top 20 Recent Repositories</CardTitle>
                  <CardDescription>
                    Most recently updated public repositories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RepoTable data={topRepos || []} isLoading={isLoadingRepos} />
                </CardContent>
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
