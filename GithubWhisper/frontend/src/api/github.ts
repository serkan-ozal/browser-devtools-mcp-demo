// GitHub API layer - handles all GitHub REST API v3 calls

const GITHUB_API_BASE = "https://api.github.com";

// Helper function to get GitHub headers with token
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

// Rate limit handling - wait if needed
async function handleRateLimit(response: Response): Promise<void> {
  const remaining = response.headers.get("X-RateLimit-Remaining");
  const resetTime = response.headers.get("X-RateLimit-Reset");

  if (remaining === "0" && resetTime) {
    const waitTime = parseInt(resetTime) * 1000 - Date.now();
    if (waitTime > 0) {
      console.warn(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// Fetch with retry logic
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, { headers: getGitHubHeaders() });

    if (response.status === 403) {
      await handleRateLimit(response);
      continue;
    }

    if (response.ok) {
      return response;
    }

    if (response.status === 404) {
      throw new Error("Resource not found");
    }

    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

// Types
export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  default_branch: string;
  private: boolean;
  html_url: string;
  parent?: {
    full_name: string;
  } | null;
  source?: {
    full_name: string;
  } | null;
}

export interface Contributor {
  login: string;
  contributions: number;
  avatar_url: string;
}

export interface CommitActivity {
  week: number;
  total: number;
  days: number[];
}

export interface Issue {
  id: number;
  number: number;
  state: "open" | "closed";
  created_at: string;
  closed_at: string | null;
  pull_request?: {
    merged_at: string | null;
  };
}

export interface PullRequest {
  id: number;
  number: number;
  state: "open" | "closed";
  merged: boolean;
  created_at: string;
  closed_at: string | null;
  merged_at: string | null;
}

export interface Languages {
  [language: string]: number;
}

export interface Commit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
    committer: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  parents: Array<{
    sha: string;
  }>;
}

// API Functions

/**
 * Fetch user information
 */
export async function fetchUser(username: string): Promise<GitHubUser> {
  const response = await fetchWithRetry(`${GITHUB_API_BASE}/users/${username}`);
  return response.json();
}

/**
 * Fetch all repositories for a user (paginated)
 */
export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetchWithRetry(
      `${GITHUB_API_BASE}/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`
    );

    const data: GitHubRepo[] = await response.json();

    if (data.length === 0) break;

    repos.push(...data);
    page++;

    // GitHub API limit
    if (data.length < perPage) break;
  }

  return repos;
}

/**
 * Fetch repository details
 */
export async function fetchRepo(
  owner: string,
  repo: string
): Promise<GitHubRepo> {
  const response = await fetchWithRetry(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}`
  );
  return response.json();
}

/**
 * Fetch contributors for a repository
 */
export async function fetchContributors(
  owner: string,
  repo: string
): Promise<Contributor[]> {
  try {
    const response = await fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors`
    );
    return response.json();
  } catch (error) {
    console.warn(`Failed to fetch contributors for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Fetch commit activity (last year, weekly)
 */
export async function fetchCommitActivity(
  owner: string,
  repo: string
): Promise<CommitActivity[]> {
  try {
    const response = await fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/commit_activity`
    );

    // GitHub stats endpoints can return 202 (accepted but not ready)
    if (response.status === 202) {
      // Wait and retry once
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const retryResponse = await fetchWithRetry(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/stats/commit_activity`
      );
      if (retryResponse.status === 202) {
        return [];
      }
      return retryResponse.json();
    }

    return response.json();
  } catch (error) {
    console.warn(
      `Failed to fetch commit activity for ${owner}/${repo}:`,
      error
    );
    return [];
  }
}

/**
 * Fetch all issues (including PRs)
 */
export async function fetchIssues(
  owner: string,
  repo: string
): Promise<Issue[]> {
  try {
    const issues: Issue[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetchWithRetry(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=all&page=${page}&per_page=${perPage}`
      );

      const data: Issue[] = await response.json();

      if (data.length === 0) break;

      issues.push(...data);
      page++;

      if (data.length < perPage) break;
    }

    return issues;
  } catch (error) {
    console.warn(`Failed to fetch issues for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Fetch pull requests
 */
export async function fetchPullRequests(
  owner: string,
  repo: string
): Promise<PullRequest[]> {
  try {
    const prs: PullRequest[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetchWithRetry(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=all&page=${page}&per_page=${perPage}`
      );

      const data: PullRequest[] = await response.json();

      if (data.length === 0) break;

      prs.push(...data);
      page++;

      if (data.length < perPage) break;
    }

    return prs;
  } catch (error) {
    console.warn(`Failed to fetch PRs for ${owner}/${repo}:`, error);
    return [];
  }
}

/**
 * Fetch repository languages
 */
export async function fetchLanguages(
  owner: string,
  repo: string
): Promise<Languages> {
  try {
    const response = await fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`
    );
    return response.json();
  } catch (error) {
    console.warn(`Failed to fetch languages for ${owner}/${repo}:`, error);
    return {};
  }
}

/**
 * Fetch commits for a repository (limited to recent commits for performance)
 */
export async function fetchCommits(
  owner: string,
  repo: string,
  limit = 50
): Promise<Commit[]> {
  try {
    const response = await fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${limit}&sort=committer-date`
    );
    return response.json();
  } catch (error) {
    console.warn(`Failed to fetch commits for ${owner}/${repo}:`, error);
    return [];
  }
}
