// Commit Statistics - aggregates commit activity across repositories

import type { CommitActivity } from "@/api/github";

export interface CommitTimelineData {
  week: number; // Unix timestamp
  totalCommits: number;
  repoCount: number;
  repos: Array<{
    repoName: string;
    commits: number;
  }>;
}

/**
 * Aggregate commit activity across all repositories
 * Returns timeline data for 3D visualization
 */
export function aggregateCommitActivity(
  repoCommitData: Array<{
    repoName: string;
    activities: CommitActivity[];
  }>
): CommitTimelineData[] {
  // Create a map of week -> total commits
  const weekMap = new Map<number, CommitTimelineData>();

  repoCommitData.forEach(({ repoName, activities }) => {
    activities.forEach((activity) => {
      const week = activity.week * 1000; // Convert to milliseconds

      if (!weekMap.has(week)) {
        weekMap.set(week, {
          week,
          totalCommits: 0,
          repoCount: 0,
          repos: [],
        });
      }

      const weekData = weekMap.get(week)!;
      weekData.totalCommits += activity.total;
      weekData.repos.push({
        repoName,
        commits: activity.total,
      });
      weekData.repoCount = weekData.repos.length;
    });
  });

  // Convert to array and sort by week
  const timeline = Array.from(weekMap.values()).sort(
    (a, b) => a.week - b.week
  );

  return timeline;
}

/**
 * Calculate repository activity score (0-100)
 * Based on recent commit frequency
 */
export function calculateActivityScore(
  activities: CommitActivity[],
  weeksToConsider = 12
): number {
  if (activities.length === 0) return 0;

  // Get last N weeks
  const recentActivities = activities
    .slice(-weeksToConsider)
    .filter((a) => a.total > 0);

  if (recentActivities.length === 0) return 0;

  const totalCommits = recentActivities.reduce(
    (sum, a) => sum + a.total,
    0
  );
  const avgCommitsPerWeek = totalCommits / recentActivities.length;

  // Normalize: 100 commits/week = 100 score, 0 commits = 0 score
  // Using logarithmic scale for better distribution
  const score = Math.min(100, Math.log10(avgCommitsPerWeek + 1) * 20);

  return Math.round(score);
}

/**
 * Check if repository is inactive (no commits in last 3 months)
 */
export function isInactive(activities: CommitActivity[]): boolean {
  if (activities.length === 0) return true;

  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recentActivities = activities.filter(
    (a) => a.week * 1000 >= threeMonthsAgo && a.total > 0
  );

  return recentActivities.length === 0;
}
