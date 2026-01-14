// Insight Engine - generates human-readable insights from analytics data

import type { BusFactorResult } from "./busFactor";
import type { HealthScoreResult } from "./healthScore";

export interface Insight {
  type: "warning" | "success" | "info" | "error";
  message: string;
  emoji: string;
}

/**
 * Generate insights from analytics data
 */
export function generateInsights(
  busFactors: BusFactorResult[],
  globalBusFactor: BusFactorResult | null,
  healthScores: HealthScoreResult[],
  globalHealthScore: HealthScoreResult | null,
  inactiveRepos: number,
  totalRepos: number
): Insight[] {
  const insights: Insight[] = [];

  // Bus factor insights
  if (globalBusFactor) {
    const highRiskRepos = busFactors.filter((bf) => bf.risk === "HIGH").length;
    if (highRiskRepos > 0) {
      insights.push({
        type: "warning",
        emoji: "⚠️",
        message: `${highRiskRepos} ${highRiskRepos === 1 ? "repository has" : "repositories have"} a bus factor risk (over 60% commits from single contributor)`,
      });
    }

    if (globalBusFactor.risk === "LOW" && busFactors.length > 0) {
      insights.push({
        type: "success",
        emoji: "✅",
        message: "Good contributor distribution across repositories",
      });
    }
  }

  // Health score insights
  if (globalHealthScore) {
    if (globalHealthScore.grade === "EXCELLENT") {
      insights.push({
        type: "success",
        emoji: "🚀",
        message: "Pull requests are merged quickly (healthy workflow)",
      });
    } else if (globalHealthScore.grade === "POOR") {
      insights.push({
        type: "error",
        emoji: "🔴",
        message: "Repository health needs attention - low issue resolution and PR merge rates",
      });
    }

    if (globalHealthScore.metrics.avgMergeTimeHours > 0 && globalHealthScore.metrics.avgMergeTimeHours < 48) {
      insights.push({
        type: "success",
        emoji: "⚡",
        message: `Average PR merge time is ${Math.round(globalHealthScore.metrics.avgMergeTimeHours)} hours (excellent)`,
      });
    } else if (globalHealthScore.metrics.avgMergeTimeHours > 168) {
      insights.push({
        type: "warning",
        emoji: "🐌",
        message: `Average PR merge time is ${Math.round(globalHealthScore.metrics.avgMergeTimeHours / 24)} days (could be improved)`,
      });
    }
  }

  // Activity insights
  if (inactiveRepos > 0) {
    const inactivePercentage = Math.round((inactiveRepos / totalRepos) * 100);
    if (inactivePercentage > 50) {
      insights.push({
        type: "warning",
        emoji: "💤",
        message: `${inactivePercentage}% of repositories are inactive (no commits in last 3 months)`,
      });
    } else {
      insights.push({
        type: "info",
        emoji: "📊",
        message: `${inactiveRepos} ${inactiveRepos === 1 ? "repository is" : "repositories are"} inactive`,
      });
    }
  }

  // Overall activity insight
  const activeRepos = totalRepos - inactiveRepos;
  if (activeRepos > 0 && activeRepos / totalRepos > 0.7) {
    insights.push({
      type: "success",
      emoji: "✨",
      message: "Most repositories show active development",
    });
  }

  // Default insight if no specific insights
  if (insights.length === 0) {
    insights.push({
      type: "info",
      emoji: "📈",
      message: "Analytics data loaded successfully",
    });
  }

  return insights;
}
