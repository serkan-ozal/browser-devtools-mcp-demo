import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconTrendingUp,
  IconTrendingDown,
  IconClock,
  IconFileCode,
  IconMessageCircle,
  IconMoon,
  IconSun,
  IconActivity,
} from "@tabler/icons-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface CommitData {
  sha: string;
  message: string;
  date: string;
  filesCount: number;
  additions: number;
  deletions: number;
  hour: number;
  stressScore: number;
  repo: string;
  url: string;
}

interface StressAnalysis {
  totalCommits: number;
  averageStressScore: number;
  stressTrend: number; // Percentage change
  mostStressedCommits: CommitData[];
  weeklyStress: Array<{
    week: string;
    averageStress: number;
    commitCount: number;
  }>;
  stressByTime: {
    night: number;
    day: number;
  };
  stressByType: {
    messageStress: number;
    fileSpike: number;
    nightAggressive: number;
  };
}

// Stresli kelimeler
const STRESS_KEYWORDS = [
  "fix", "hotfix", "urgent", "asap", "quick", "temp", "hack",
  "workaround", "emergency", "critical", "broken", "crash",
  "panic", "desperate", "rushed", "last minute"
];

async function fetchUserCommits(username: string): Promise<CommitData[]> {
  const commits: CommitData[] = [];
  const repos = await fetchUserRepos(username);
  const publicRepos = repos.filter((repo) => !repo.private).slice(0, 10);

  for (const repo of publicRepos) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/commits?author=${username}&per_page=30&sort=committer-date`,
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

      if (!response.ok) continue;

      const data = await response.json();

      for (const commit of data) {
        const commitDate = new Date(commit.commit.author.date);
        const hour = commitDate.getHours();
        const message = commit.commit.message.toLowerCase();
        
        // Stresli kelime kontrolü
        const stressKeywords = STRESS_KEYWORDS.filter((keyword) =>
          message.includes(keyword)
        );
        const hasMessageStress = stressKeywords.length > 0;

        // Dosya sayısı (eğer files bilgisi varsa)
        const filesCount = commit.files?.length || 0;
        const additions = commit.stats?.additions || 0;
        const deletions = commit.stats?.deletions || 0;

        commits.push({
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message,
          date: commit.commit.author.date,
          filesCount,
          additions,
          deletions,
          hour,
          stressScore: 0, // Hesaplanacak
          repo: repo.name,
          url: commit.html_url,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn(`Failed to fetch commits for ${repo.name}:`, error);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return commits;
}

function calculateStressScore(commits: CommitData[]): CommitData[] {
  if (commits.length === 0) return commits;

  // Ortalama dosya sayısını hesapla
  const avgFiles = commits.reduce((sum, c) => sum + c.filesCount, 0) / commits.length;

  return commits.map((commit) => {
    let stressScore = 0;
    const message = commit.message.toLowerCase();

    // 1. Mesaj stresi (+0.4)
    const hasMessageStress = STRESS_KEYWORDS.some((keyword) =>
      message.includes(keyword)
    );
    if (hasMessageStress) stressScore += 0.4;

    // 2. Dosya spike (+0.35)
    if (commit.filesCount > avgFiles * 2) {
      stressScore += 0.35;
    }

    // 3. Gece agresifliği (+0.25)
    const isNightTime = commit.hour >= 22 || commit.hour < 5;
    if (isNightTime && commit.filesCount > avgFiles) {
      stressScore += 0.25;
    }

    // Max 1.0
    stressScore = Math.min(stressScore, 1.0);

    return { ...commit, stressScore };
  });
}

export async function analyzeUserStress(username: string): Promise<StressAnalysis> {
  const commits = await fetchUserCommits(username);
  const commitsWithStress = calculateStressScore(commits);

  // Haftalık analiz
  const weeklyData: { [key: string]: { stress: number; count: number } } = {};
  const now = new Date();

  commitsWithStress.forEach((commit) => {
    const commitDate = new Date(commit.date);
    const weekStart = new Date(commitDate);
    weekStart.setDate(commitDate.getDate() - commitDate.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { stress: 0, count: 0 };
    }
    weeklyData[weekKey].stress += commit.stressScore;
    weeklyData[weekKey].count += 1;
  });

  const weeklyStress = Object.entries(weeklyData)
    .map(([week, data]) => ({
      week,
      averageStress: data.count > 0 ? data.stress / data.count : 0,
      commitCount: data.count,
    }))
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-8); // Son 8 hafta

  // Trend analizi
  const recentWeeks = weeklyStress.slice(-2);
  const previousWeeks = weeklyStress.slice(-4, -2);
  const recentAvg = recentWeeks.reduce((sum, w) => sum + w.averageStress, 0) / recentWeeks.length;
  const previousAvg = previousWeeks.length > 0
    ? previousWeeks.reduce((sum, w) => sum + w.averageStress, 0) / previousWeeks.length
    : recentAvg;
  const stressTrend = previousAvg > 0
    ? ((recentAvg - previousAvg) / previousAvg) * 100
    : 0;

  // En stresli commitler
  const mostStressedCommits = [...commitsWithStress]
    .sort((a, b) => b.stressScore - a.stressScore)
    .slice(0, 5);

  // Zaman bazlı analiz
  const nightCommits = commitsWithStress.filter(
    (c) => c.hour >= 22 || c.hour < 5
  );
  const dayCommits = commitsWithStress.filter(
    (c) => c.hour >= 5 && c.hour < 22
  );
  const nightAvgStress = nightCommits.length > 0
    ? nightCommits.reduce((sum, c) => sum + c.stressScore, 0) / nightCommits.length
    : 0;
  const dayAvgStress = dayCommits.length > 0
    ? dayCommits.reduce((sum, c) => sum + c.stressScore, 0) / dayCommits.length
    : 0;

  // Stres tipi analizi
  const messageStressCount = commitsWithStress.filter((c) =>
    STRESS_KEYWORDS.some((kw) => c.message.toLowerCase().includes(kw))
  ).length;
  const avgFiles = commitsWithStress.reduce((sum, c) => sum + c.filesCount, 0) / commitsWithStress.length;
  const fileSpikeCount = commitsWithStress.filter(
    (c) => c.filesCount > avgFiles * 2
  ).length;
  const nightAggressiveCount = commitsWithStress.filter(
    (c) => (c.hour >= 22 || c.hour < 5) && c.filesCount > avgFiles
  ).length;

  const totalCommits = commitsWithStress.length;
  const averageStressScore = totalCommits > 0
    ? commitsWithStress.reduce((sum, c) => sum + c.stressScore, 0) / totalCommits
    : 0;

  return {
    totalCommits,
    averageStressScore,
    stressTrend,
    mostStressedCommits,
    weeklyStress,
    stressByTime: {
      night: nightAvgStress,
      day: dayAvgStress,
    },
    stressByType: {
      messageStress: (messageStressCount / totalCommits) * 100,
      fileSpike: (fileSpikeCount / totalCommits) * 100,
      nightAggressive: (nightAggressiveCount / totalCommits) * 100,
    },
  };
}

// Helper functions
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

interface GitHubRepo {
  full_name: string;
  name: string;
  private: boolean;
}

async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
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
      repos.push(...data);
      page++;
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn("Error fetching repos:", error);
      break;
    }
  }
  return repos;
}

interface StressAnalyzerProps {
  username: string;
}

export function StressAnalyzer({ username }: StressAnalyzerProps) {
  const { data: analysis, isLoading, isError } = useQuery({
    queryKey: ["stressAnalysis", username],
    queryFn: () => analyzeUserStress(username),
    enabled: username.length > 0,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !analysis) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <CardTitle className="text-destructive">Stress Analysis Unavailable</CardTitle>
          <CardDescription>
            Unable to fetch commit data for stress analysis. This may be due to API rate limits or insufficient commit history.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stressLevel = analysis.averageStressScore ?? 0;
  const stressLevelLabel =
    stressLevel < 0.3 ? "Low" : stressLevel < 0.6 ? "Moderate" : "High";
  const stressColor =
    stressLevel < 0.3 ? "text-green-600" : stressLevel < 0.6 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-4 mx-4 lg:mx-6">
      {/* Main Stress Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="size-5 text-orange-500" />
                Stress & Panic Code Detection
              </CardTitle>
              <CardDescription>
                Analysis of commit patterns to detect stressful coding sessions
              </CardDescription>
            </div>
            <Badge variant={stressLevel < 0.3 ? "default" : stressLevel < 0.6 ? "secondary" : "destructive"}>
              {stressLevelLabel} Stress
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Stress Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Average Stress Score</span>
              <span className={`text-2xl font-bold ${stressColor}`}>
                {(stressLevel * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={stressLevel * 100} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              Based on {analysis.totalCommits} commits analyzed
            </p>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {(analysis.stressTrend ?? 0) > 0 ? (
                <IconTrendingUp className="size-5 text-red-500" />
              ) : (
                <IconTrendingDown className="size-5 text-green-500" />
              )}
              <div>
                <p className="text-sm font-medium">Stress Trend</p>
                <p className={`text-lg font-bold ${(analysis.stressTrend ?? 0) > 0 ? "text-red-500" : "text-green-500"}`}>
                  {(analysis.stressTrend ?? 0) > 0 ? "+" : ""}
                  {(analysis.stressTrend ?? 0).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {analysis.stressTrend > 0
                    ? "Increased in last 2 weeks"
                    : "Decreased in last 2 weeks"}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Stress Chart */}
          {analysis.weeklyStress && analysis.weeklyStress.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Weekly Stress Trend</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analysis.weeklyStress}>
                  <defs>
                    <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis domain={[0, 1]} />
                  <Tooltip
                    formatter={(value: number) => [((value ?? 0) * 100).toFixed(1) + "%", "Stress Score"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="averageStress"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#stressGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stress Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time-based Stress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <IconClock className="size-4" />
              Stress by Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconMoon className="size-3" />
                    Night (22:00-05:00)
                  </span>
                  <span className="text-sm font-semibold">
                    {((analysis.stressByTime?.night ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(analysis.stressByTime?.night ?? 0) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconSun className="size-3" />
                    Day (05:00-22:00)
                  </span>
                  <span className="text-sm font-semibold">
                    {((analysis.stressByTime?.day ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={(analysis.stressByTime?.day ?? 0) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <IconActivity className="size-4" />
              Stress Indicators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconMessageCircle className="size-3" />
                    Stressful Messages
                  </span>
                  <span className="text-sm font-semibold">
                    {(analysis.stressByType?.messageStress ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={analysis.stressByType?.messageStress ?? 0} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconFileCode className="size-3" />
                    File Spikes
                  </span>
                  <span className="text-sm font-semibold">
                    {(analysis.stressByType?.fileSpike ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={analysis.stressByType?.fileSpike ?? 0} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <IconMoon className="size-3" />
                    Night Aggressive
                  </span>
                  <span className="text-sm font-semibold">
                    {(analysis.stressByType?.nightAggressive ?? 0).toFixed(1)}%
                  </span>
                </div>
                <Progress value={analysis.stressByType?.nightAggressive ?? 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Stressed Commits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Most Stressed Commits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(analysis.mostStressedCommits || []).slice(0, 3).map((commit, idx) => (
                <div
                  key={commit.sha}
                  className="flex items-start justify-between p-2 bg-muted rounded text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{(commit.message || "").split("\n")[0]}</p>
                    <p className="text-muted-foreground text-[10px] mt-1">
                      {commit.repo || "Unknown"} • {((commit.stressScore ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <Badge variant="destructive" className="ml-2 shrink-0">
                    {((commit.stressScore ?? 0) * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              {(analysis.stressTrend ?? 0) > 0 ? (
                <>
                  <span className="text-red-500">⚠️ Warning:</span> Stress levels have increased by{" "}
                  {Math.abs(analysis.stressTrend ?? 0).toFixed(1)}% in the last 2 weeks compared to the previous period.
                </>
              ) : (
                <>
                  <span className="text-green-500">✅ Good news:</span> Stress levels have decreased by{" "}
                  {Math.abs(analysis.stressTrend ?? 0).toFixed(1)}% in the last 2 weeks.
                </>
              )}
            </p>
            <p className="text-muted-foreground">
              The analysis considers commit messages with stress keywords, file count spikes, and late-night coding patterns.
              Higher stress scores may indicate rushed fixes, urgent patches, or work under pressure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

