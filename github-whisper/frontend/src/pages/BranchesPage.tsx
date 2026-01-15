import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconGitBranch,
  IconAlertCircle,
  IconSearch,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconCircleCheck,
  IconClock,
  IconX,
  IconBan,
  type Icon,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getStoredUsername } from "@/components/github-username-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
    date?: string;
  };
  protected: boolean;
}

interface PRUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface PRInfo {
  author: PRUser | null;
  reviewers: PRUser[];
}

interface BranchMetrics {
  daysSinceLastCommit: number;
  hasOpenPR: boolean;
  commitsAhead: number;
  commitsBehind: number;
  status: "active" | "aging" | "abandoned" | "zombie";
  prInfo?: PRInfo;
}

interface BranchWithMetrics extends GitHubBranch {
  metrics: BranchMetrics;
}

interface RepoBranch {
  repo: string;
  repoUrl: string;
  defaultBranch: string;
  branches: BranchWithMetrics[];
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

// Fetch user repositories
async function fetchUserRepos(
  username: string
): Promise<Array<{ name: string; full_name: string; html_url: string }>> {
  const repos: Array<{ name: string; full_name: string; html_url: string }> =
    [];
  let page = 1;
  const perPage = 30;

  while (page <= 2) {
    try {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`,
        { headers: getGitHubHeaders() }
      );
      if (!response.ok) break;
      const data = await response.json();
      if (data.length === 0) break;
      repos.push(
        ...data.map(
          (repo: { name: string; full_name: string; html_url: string }) => ({
            name: repo.name,
            full_name: repo.full_name,
            html_url: repo.html_url,
          })
        )
      );
      page++;
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.warn("Error fetching repos:", error);
      break;
    }
  }
  return repos;
}

// Fetch repository default branch
async function fetchDefaultBranch(
  owner: string,
  repo: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers: getGitHubHeaders() }
    );
    if (!response.ok) return "main";
    const data = await response.json();
    return data.default_branch || "main";
  } catch {
    return "main";
  }
}

// Fetch branch commit details
async function fetchBranchCommit(
  owner: string,
  repo: string,
  sha: string
): Promise<{ date: string } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      { headers: getGitHubHeaders() }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return { date: data.commit.committer.date };
  } catch {
    return null;
  }
}

// Get PR info (author and reviewers) for a branch
async function getBranchPRInfo(
  owner: string,
  repo: string,
  branchName: string
): Promise<PRInfo> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?head=${owner}:${branchName}&state=open&per_page=1`,
      { headers: getGitHubHeaders() }
    );
    if (!response.ok) {
      return { author: null, reviewers: [] };
    }
    const data = await response.json();
    if (data.length === 0) {
      return { author: null, reviewers: [] };
    }

    const pr = data[0];
    const author: PRUser = {
      login: pr.user.login,
      avatar_url: pr.user.avatar_url,
      html_url: pr.user.html_url,
    };

    // Fetch reviewers
    let reviewers: PRUser[] = [];
    try {
      const reviewersResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/requested_reviewers`,
        { headers: getGitHubHeaders() }
      );
      if (reviewersResponse.ok) {
        const reviewersData = await reviewersResponse.json();
        reviewers = (reviewersData.users || []).map(
          (user: { login: string; avatar_url: string; html_url: string }) => ({
            login: user.login,
            avatar_url: user.avatar_url,
            html_url: user.html_url,
          })
        );
      }
    } catch {
      // Ignore reviewer fetch errors
    }

    return { author, reviewers };
  } catch {
    return { author: null, reviewers: [] };
  }
}

// Get commit difference between branches
async function getCommitDifference(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<{ ahead: number; behind: number }> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/compare/${base}...${head}`,
      { headers: getGitHubHeaders() }
    );
    if (!response.ok) return { ahead: 0, behind: 0 };
    const data = await response.json();
    return {
      ahead: data.ahead_by || 0,
      behind: data.behind_by || 0,
    };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

// Calculate branch status
function calculateBranchStatus(
  daysSinceLastCommit: number,
  hasOpenPR: boolean
): "active" | "aging" | "abandoned" | "zombie" {
  const sixMonthsAgo = 180; // ~6 months in days

  if (daysSinceLastCommit >= sixMonthsAgo && !hasOpenPR) {
    return "zombie";
  } else if (daysSinceLastCommit >= 90) {
    return "abandoned";
  } else if (daysSinceLastCommit >= 30) {
    return "aging";
  } else {
    return "active";
  }
}

// Fetch branches for a repository with metrics
async function fetchRepoBranchesWithMetrics(
  owner: string,
  repo: string,
  defaultBranch: string
): Promise<BranchWithMetrics[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
      { headers: getGitHubHeaders() }
    );

    if (response.status === 403) {
      const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining === "0") {
        throw new Error("API rate limit exceeded");
      }
    }

    if (!response.ok) {
      return [];
    }

    const branches: GitHubBranch[] = await response.json();
    const branchesWithMetrics: BranchWithMetrics[] = [];

    // Process branches in batches to avoid rate limits
    for (const branch of branches.slice(0, 30)) {
      // Limit to 30 branches per repo
      if (branch.name === defaultBranch) continue; // Skip default branch

      try {
        // Fetch commit date
        const commitDetails = await fetchBranchCommit(
          owner,
          repo,
          branch.commit.sha
        );
        const commitDate = commitDetails?.date || new Date().toISOString();

        // Calculate days since last commit
        const daysSinceLastCommit = Math.floor(
          (Date.now() - new Date(commitDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Get PR info (author and reviewers)
        const prInfo = await getBranchPRInfo(owner, repo, branch.name);
        const hasOpenPR = prInfo.author !== null;

        // Get commit difference
        const { ahead, behind } = await getCommitDifference(
          owner,
          repo,
          defaultBranch,
          branch.name
        );

        // Calculate status
        const status = calculateBranchStatus(daysSinceLastCommit, hasOpenPR);

        branchesWithMetrics.push({
          ...branch,
          commit: {
            ...branch.commit,
            date: commitDate,
          },
          metrics: {
            daysSinceLastCommit,
            hasOpenPR,
            commitsAhead: ahead,
            commitsBehind: behind,
            status,
            prInfo,
          },
        });

        // Rate limit protection
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(
          `Failed to fetch metrics for branch ${branch.name}:`,
          error
        );
        // Add branch with default metrics
        const commitDate = new Date().toISOString();
        const daysSinceLastCommit = 0;
        branchesWithMetrics.push({
          ...branch,
          commit: {
            ...branch.commit,
            date: commitDate,
          },
          metrics: {
            daysSinceLastCommit,
            hasOpenPR: false,
            commitsAhead: 0,
            commitsBehind: 0,
            status: "active" as const,
          },
        });
      }
    }

    return branchesWithMetrics;
  } catch (error) {
    console.warn(`Failed to fetch branches for ${owner}/${repo}:`, error);
    return [];
  }
}

// Fetch all branches for user's repositories
async function fetchUserBranches(username: string): Promise<RepoBranch[]> {
  const repos = await fetchUserRepos(username);
  const repoBranches: RepoBranch[] = [];

  // Limit to top 10 most recently updated repos for performance (reduced due to additional API calls)
  const topRepos = repos.slice(0, 10);

  for (const repo of topRepos) {
    try {
      const [owner] = repo.full_name.split("/");
      const defaultBranch = await fetchDefaultBranch(owner, repo.name);
      const branches = await fetchRepoBranchesWithMetrics(
        owner,
        repo.name,
        defaultBranch
      );

      if (branches.length > 0) {
        repoBranches.push({
          repo: repo.name,
          repoUrl: repo.html_url,
          defaultBranch,
          branches: branches,
        });
      }

      // Rate limit protection
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Error fetching branches for ${repo.name}:`, error);
    }
  }

  return repoBranches;
}

// Highlight search term in text
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || searchTerm.length < 3) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span
        key={index}
        className="bg-yellow-400 dark:bg-yellow-600 text-foreground font-medium"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

// Get status icon and color
function getStatusDisplay(status: BranchMetrics["status"]): {
  icon: Icon;
  label: string;
  color: string;
} {
  switch (status) {
    case "active":
      return {
        icon: IconCircleCheck,
        label: "Active",
        color: "text-emerald-500",
      };
    case "aging":
      return { icon: IconClock, label: "Aging", color: "text-amber-500" };
    case "abandoned":
      return { icon: IconX, label: "Abandoned", color: "text-rose-500" };
    case "zombie":
      return { icon: IconBan, label: "Zombie", color: "text-slate-500" };
    default:
      return {
        icon: IconCircleCheck,
        label: "Active",
        color: "text-emerald-500",
      };
  }
}

// Filter branches based on search term
function filterBranches(
  repoBranches: RepoBranch[],
  searchTerm: string
): RepoBranch[] {
  if (!searchTerm || searchTerm.length < 3) {
    return repoBranches;
  }

  const lowerSearch = searchTerm.toLowerCase();
  return repoBranches
    .map((repoBranch) => {
      const matchingBranches = repoBranch.branches.filter(
        (branch) =>
          branch.name.toLowerCase().includes(lowerSearch) ||
          branch.commit.sha.toLowerCase().includes(lowerSearch)
      );
      return matchingBranches.length > 0
        ? { ...repoBranch, branches: matchingBranches }
        : null;
    })
    .filter((repo): repo is RepoBranch => repo !== null);
}

export function BranchesPage() {
  const username = React.useMemo(() => getStoredUsername(), []);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [expandedRepos, setExpandedRepos] = React.useState<Set<string>>(
    new Set()
  );

  // Debounce search input (3 characters minimum)
  React.useEffect(() => {
    if (searchTerm.length < 3) {
      setDebouncedSearch("");
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: repoBranches,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["userBranches", username],
    queryFn: () => fetchUserBranches(username || ""),
    enabled: !!username && username.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Auto-expand repos when search is active
  React.useEffect(() => {
    if (debouncedSearch && repoBranches) {
      const filtered = filterBranches(repoBranches, debouncedSearch);
      const newExpanded = new Set(expandedRepos);
      filtered.forEach((repo) => {
        newExpanded.add(repo.repo);
      });
      setExpandedRepos(newExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, repoBranches]);

  const filteredBranches = React.useMemo(() => {
    if (!repoBranches) return [];
    return filterBranches(repoBranches, debouncedSearch);
  }, [repoBranches, debouncedSearch]);

  const totalBranches =
    repoBranches?.reduce((sum, repo) => sum + repo.branches.length, 0) || 0;
  const filteredTotalBranches =
    filteredBranches.reduce((sum, repo) => sum + repo.branches.length, 0) || 0;

  const toggleRepo = (repoName: string) => {
    setExpandedRepos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(repoName)) {
        newSet.delete(repoName);
      } else {
        newSet.add(repoName);
      }
      return newSet;
    });
  };

  if (!username) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <IconGitBranch className="size-32 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">Branches</CardTitle>
            <CardDescription>
              Please set your GitHub username to view branches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Go to Account settings to set your GitHub username.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <IconAlertCircle className="size-32 text-destructive mb-4" />
            <CardTitle className="text-2xl text-destructive">Error</CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "Failed to fetch branches"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!repoBranches || repoBranches.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <IconGitBranch className="size-32 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">Branches</CardTitle>
            <CardDescription>No branches found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              No branches found for {username}'s repositories.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayBranches = debouncedSearch
    ? filteredBranches
    : repoBranches || [];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <IconGitBranch className="size-6" />
                Branches
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                All branches across {username}'s repositories
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {debouncedSearch
                ? `${filteredTotalBranches} / ${totalBranches}`
                : totalBranches}{" "}
              {totalBranches === 1 ? "branch" : "branches"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search branches (min 3 characters)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {debouncedSearch && (
              <p className="mt-2 text-sm text-muted-foreground">
                Found {filteredBranches.length} repository
                {filteredBranches.length === 1 ? "" : "ies"} with matching
                branches
              </p>
            )}
          </div>
          <div className="space-y-6">
            {displayBranches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {debouncedSearch
                  ? "No branches found matching your search"
                  : "No branches found"}
              </div>
            ) : (
              displayBranches.map((repoBranch) => {
                const isExpanded = expandedRepos.has(repoBranch.repo);
                return (
                  <div key={repoBranch.repo} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRepo(repoBranch.repo)}
                        className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                      >
                        {isExpanded ? (
                          <IconChevronDown className="size-4" />
                        ) : (
                          <IconChevronRight className="size-4" />
                        )}
                        <h3 className="text-lg font-semibold text-foreground">
                          {highlightText(repoBranch.repo, debouncedSearch)}
                        </h3>
                      </button>
                      <a
                        href={repoBranch.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Open ${repoBranch.repo} in new tab`}
                      >
                        <IconExternalLink className="size-4" />
                      </a>
                      <Badge variant="outline">
                        {repoBranch.branches.length}{" "}
                        {repoBranch.branches.length === 1
                          ? "branch"
                          : "branches"}
                      </Badge>
                    </div>
                    {isExpanded && (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Branch Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Days Since Commit</TableHead>
                              <TableHead>Open PR</TableHead>
                              <TableHead>PR Author</TableHead>
                              <TableHead>Reviewers</TableHead>
                              <TableHead>
                                vs {repoBranch.defaultBranch}
                              </TableHead>
                              <TableHead>Commit SHA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {repoBranch.branches.map((branch) => {
                              // Safety check for metrics
                              if (!branch.metrics || !branch.metrics.status) {
                                return (
                                  <TableRow key={branch.name}>
                                    <TableCell
                                      colSpan={6}
                                      className="text-center text-muted-foreground"
                                    >
                                      Loading metrics...
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              const statusDisplay = getStatusDisplay(
                                branch.metrics.status
                              );
                              const StatusIcon = statusDisplay.icon;
                              return (
                                <TableRow key={branch.name}>
                                  <TableCell
                                    className="font-mono font-medium max-w-[200px] min-w-[200px]"
                                    title={branch.name}
                                  >
                                    <div className="truncate">
                                      {highlightText(
                                        branch.name,
                                        debouncedSearch
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <StatusIcon
                                        className={`size-4 ${statusDisplay.color}`}
                                      />
                                      <Badge
                                        variant="outline"
                                        className={statusDisplay.color}
                                      >
                                        {statusDisplay.label}
                                      </Badge>
                                      {branch.protected && (
                                        <Badge
                                          variant="default"
                                          className="bg-yellow-500 text-xs"
                                        >
                                          Protected
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {branch.metrics.daysSinceLastCommit}{" "}
                                      {branch.metrics.daysSinceLastCommit === 1
                                        ? "day"
                                        : "days"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {branch.metrics.hasOpenPR ? (
                                      <Badge
                                        variant="default"
                                        className="bg-emerald-500 hover:bg-emerald-600"
                                      >
                                        Yes
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">No</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {branch.metrics.prInfo?.author ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <a
                                            href={
                                              branch.metrics.prInfo.author
                                                .html_url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block"
                                          >
                                            <Avatar className="size-6 cursor-pointer hover:opacity-80 transition-opacity">
                                              <AvatarImage
                                                src={
                                                  branch.metrics.prInfo.author
                                                    .avatar_url
                                                }
                                                alt={
                                                  branch.metrics.prInfo.author
                                                    .login
                                                }
                                              />
                                              <AvatarFallback className="text-xs">
                                                {branch.metrics.prInfo.author.login[0].toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </a>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>
                                            {branch.metrics.prInfo.author.login}
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {branch.metrics.prInfo?.reviewers &&
                                    branch.metrics.prInfo.reviewers.length >
                                      0 ? (
                                      <div className="flex items-center gap-1">
                                        {branch.metrics.prInfo.reviewers.map(
                                          (reviewer) => (
                                            <Tooltip key={reviewer.login}>
                                              <TooltipTrigger asChild>
                                                <a
                                                  href={reviewer.html_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-block"
                                                >
                                                  <Avatar className="size-6 cursor-pointer hover:opacity-80 transition-opacity">
                                                    <AvatarImage
                                                      src={reviewer.avatar_url}
                                                      alt={reviewer.login}
                                                    />
                                                    <AvatarFallback className="text-xs">
                                                      {reviewer.login[0].toUpperCase()}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                </a>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>{reviewer.login}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        -
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1 text-xs">
                                      {branch.metrics.commitsAhead > 0 && (
                                        <span className="text-emerald-500 dark:text-emerald-400">
                                          +{branch.metrics.commitsAhead} ahead
                                        </span>
                                      )}
                                      {branch.metrics.commitsBehind > 0 && (
                                        <span className="text-rose-500 dark:text-rose-400">
                                          -{branch.metrics.commitsBehind} behind
                                        </span>
                                      )}
                                      {branch.metrics.commitsAhead === 0 &&
                                        branch.metrics.commitsBehind === 0 && (
                                          <span className="text-muted-foreground">
                                            Synced
                                          </span>
                                        )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm text-muted-foreground">
                                    <a
                                      href={branch.commit.url.replace(
                                        "api.github.com/repos",
                                        "github.com"
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      {highlightText(
                                        branch.commit.sha.substring(0, 7),
                                        debouncedSearch
                                      )}
                                    </a>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
