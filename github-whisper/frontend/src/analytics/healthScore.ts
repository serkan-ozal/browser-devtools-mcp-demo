import type { Issue, PullRequest } from "@/api/github";

export interface HealthScoreResult {
  score: number; // 0-100
  grade: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  breakdown: {
    issueResolution: number; // 0-40
    prMergeRate: number; // 0-40
    prSpeed: number; // 0-20
  };
  metrics: {
    totalIssues: number;
    closedIssues: number;
    totalPRs: number;
    mergedPRs: number;
    avgMergeTimeHours: number;
  };
}

/**
 * According to the following formula:
 * - Issue Resolution: (Closed Issues / Total Issues) * 40
 * - PR Merge Rate: (Merged PRs / Total PRs) * 40
 * - PR Speed: (Avg PR Merge Time < 48h ? 20 : 0)
 */

export function calculateHealthScore(
  issues: Issue[],
  pullRequests: PullRequest[]
): HealthScoreResult {
  // Separate issues from PRs (PRs appear in issues endpoint)
  const realIssues = issues.filter((issue) => !issue.pull_request);
  const prs = pullRequests;

  const totalIssues = realIssues.length;
  const closedIssues = realIssues.filter((i) => i.state === "closed").length;

  const totalPRs = prs.length;
  const mergedPRs = prs.filter((pr) => pr.merged).length;

  // Calculate average PR merge time
  const mergedPRsWithTime = prs.filter(
    (pr) => pr.merged && pr.merged_at && pr.created_at
  );

  let avgMergeTimeHours = 0;
  if (mergedPRsWithTime.length > 0) {
    const totalMergeTime = mergedPRsWithTime.reduce((sum, pr) => {
      const created = new Date(pr.created_at).getTime();
      const merged = new Date(pr.merged_at!).getTime();
      return sum + (merged - created);
    }, 0);

    avgMergeTimeHours =
      totalMergeTime / mergedPRsWithTime.length / (1000 * 60 * 60);
  }

  // Calculate components
  const issueResolution =
    totalIssues > 0 ? (closedIssues / totalIssues) * 40 : 40;
  const prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 40 : 40;
  const prSpeed = avgMergeTimeHours > 0 && avgMergeTimeHours < 48 ? 20 : 0;

  const score = Math.round(issueResolution + prMergeRate + prSpeed);

  // Determine grade
  let grade: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  if (score >= 80) {
    grade = "EXCELLENT";
  } else if (score >= 60) {
    grade = "GOOD";
  } else if (score >= 40) {
    grade = "FAIR";
  } else {
    grade = "POOR";
  }

  return {
    score,
    grade,
    breakdown: {
      issueResolution: Math.round(issueResolution),
      prMergeRate: Math.round(prMergeRate),
      prSpeed,
    },
    metrics: {
      totalIssues,
      closedIssues,
      totalPRs,
      mergedPRs,
      avgMergeTimeHours: Math.round(avgMergeTimeHours * 10) / 10,
    },
  };
}

export function calculateAverageHealthScore(
  healthScores: HealthScoreResult[]
): HealthScoreResult {
  if (healthScores.length === 0) {
    return {
      score: 0,
      grade: "POOR",
      breakdown: {
        issueResolution: 0,
        prMergeRate: 0,
        prSpeed: 0,
      },
      metrics: {
        totalIssues: 0,
        closedIssues: 0,
        totalPRs: 0,
        mergedPRs: 0,
        avgMergeTimeHours: 0,
      },
    };
  }

  const avgScore =
    healthScores.reduce((sum, hs) => sum + hs.score, 0) / healthScores.length;

  const avgBreakdown = {
    issueResolution:
      healthScores.reduce((sum, hs) => sum + hs.breakdown.issueResolution, 0) /
      healthScores.length,
    prMergeRate:
      healthScores.reduce((sum, hs) => sum + hs.breakdown.prMergeRate, 0) /
      healthScores.length,
    prSpeed:
      healthScores.reduce((sum, hs) => sum + hs.breakdown.prSpeed, 0) /
      healthScores.length,
  };

  const totalMetrics = healthScores.reduce(
    (acc, hs) => ({
      totalIssues: acc.totalIssues + hs.metrics.totalIssues,
      closedIssues: acc.closedIssues + hs.metrics.closedIssues,
      totalPRs: acc.totalPRs + hs.metrics.totalPRs,
      mergedPRs: acc.mergedPRs + hs.metrics.mergedPRs,
      avgMergeTimeHours: acc.avgMergeTimeHours + hs.metrics.avgMergeTimeHours,
    }),
    {
      totalIssues: 0,
      closedIssues: 0,
      totalPRs: 0,
      mergedPRs: 0,
      avgMergeTimeHours: 0,
    }
  );

  let grade: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  if (avgScore >= 80) {
    grade = "EXCELLENT";
  } else if (avgScore >= 60) {
    grade = "GOOD";
  } else if (avgScore >= 40) {
    grade = "FAIR";
  } else {
    grade = "POOR";
  }

  return {
    score: Math.round(avgScore),
    grade,
    breakdown: {
      issueResolution: Math.round(avgBreakdown.issueResolution),
      prMergeRate: Math.round(avgBreakdown.prMergeRate),
      prSpeed: Math.round(avgBreakdown.prSpeed),
    },
    metrics: {
      totalIssues: totalMetrics.totalIssues,
      closedIssues: totalMetrics.closedIssues,
      totalPRs: totalMetrics.totalPRs,
      mergedPRs: totalMetrics.mergedPRs,
      avgMergeTimeHours:
        Math.round(
          (totalMetrics.avgMergeTimeHours / healthScores.length) * 10
        ) / 10,
    },
  };
}
