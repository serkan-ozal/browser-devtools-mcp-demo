import type { Contributor } from "@/api/github";

export interface BusFactorResult {
  risk: "LOW" | "MEDIUM" | "HIGH";
  topContributorRatio: number;
  topContributor: string;
  totalContributors: number;
  score: number; // 0-100, higher = better
}

/**
 * Calculate bus factor for a single repository
 * Bus factor = risk if top contributor leaves (>60% commits = HIGH RISK)
 */
export function calculateBusFactor(
  contributors: Contributor[]
): BusFactorResult {
  if (contributors.length === 0) {
    return {
      risk: "LOW",
      topContributorRatio: 0,
      topContributor: "",
      totalContributors: 0,
      score: 100,
    };
  }

  const totalContributions = contributors.reduce(
    (sum, c) => sum + c.contributions,
    0
  );

  if (totalContributions === 0) {
    return {
      risk: "LOW",
      topContributorRatio: 0,
      topContributor: "",
      totalContributors: contributors.length,
      score: 100,
    };
  }

  const topContributor = contributors[0];
  const topContributorRatio = topContributor.contributions / totalContributions;

  let risk: "LOW" | "MEDIUM" | "HIGH";
  if (topContributorRatio > 0.6) {
    risk = "HIGH";
  } else if (topContributorRatio > 0.4) {
    risk = "MEDIUM";
  } else {
    risk = "LOW";
  }

  // Score: 100 = perfect distribution, 0 = single contributor
  const score = Math.max(0, 100 - topContributorRatio * 100);

  return {
    risk,
    topContributorRatio,
    topContributor: topContributor.login,
    totalContributors: contributors.length,
    score,
  };
}

/**
 * Calculate global bus factor across all repositories
 */
export function calculateGlobalBusFactor(
  repoBusFactors: BusFactorResult[]
): BusFactorResult {
  if (repoBusFactors.length === 0) {
    return {
      risk: "LOW",
      topContributorRatio: 0,
      topContributor: "",
      totalContributors: 0,
      score: 100,
    };
  }

  const highRiskRepos = repoBusFactors.filter((bf) => bf.risk === "HIGH");
  const mediumRiskRepos = repoBusFactors.filter((bf) => bf.risk === "MEDIUM");

  const avgTopContributorRatio =
    repoBusFactors.reduce((sum, bf) => sum + bf.topContributorRatio, 0) /
    repoBusFactors.length;

  const avgScore =
    repoBusFactors.reduce((sum, bf) => sum + bf.score, 0) /
    repoBusFactors.length;

  let risk: "LOW" | "MEDIUM" | "HIGH";
  if (highRiskRepos.length > repoBusFactors.length * 0.3) {
    risk = "HIGH";
  } else if (
    highRiskRepos.length > 0 ||
    mediumRiskRepos.length > repoBusFactors.length * 0.5
  ) {
    risk = "MEDIUM";
  } else {
    risk = "LOW";
  }

  return {
    risk,
    topContributorRatio: avgTopContributorRatio,
    topContributor: "", // Global doesn't have a single top contributor
    totalContributors: repoBusFactors.reduce(
      (sum, bf) => sum + bf.totalContributors,
      0
    ),
    score: avgScore,
  };
}
