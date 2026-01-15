// Custom hook for fetching and aggregating GitHub data

import { useState, useEffect } from "react";
import * as githubApi from "@/api/github";
import * as busFactor from "@/analytics/busFactor";
import * as commitStats from "@/analytics/commitStats";
import * as healthScore from "@/analytics/healthScore";
import type {
  GitHubUser,
  GitHubRepo,
  Contributor,
  CommitActivity,
  Issue,
  PullRequest,
} from "@/api/github";

export interface AnalyticsData {
  user: GitHubUser | null;
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;

  // Aggregated analytics
  busFactors: Map<string, busFactor.BusFactorResult>;
  globalBusFactor: busFactor.BusFactorResult | null;
  commitTimeline: commitStats.CommitTimelineData[];
  healthScores: Map<string, healthScore.HealthScoreResult>;
  globalHealthScore: healthScore.HealthScoreResult | null;

  // Activity scores
  activityScores: Map<string, number>;
  inactiveRepos: Set<string>;
}

export function useGithubData(username: string | null): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>({
    user: null,
    repos: [],
    loading: false,
    error: null,
    busFactors: new Map(),
    globalBusFactor: null,
    commitTimeline: [],
    healthScores: new Map(),
    globalHealthScore: null,
    activityScores: new Map(),
    inactiveRepos: new Set(),
  });

  useEffect(() => {
    if (!username) {
      setData((prev) => ({
        ...prev,
        user: null,
        repos: [],
        loading: false,
      }));
      return;
    }

    async function fetchAllData() {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Fetch user and repos
        const [user, repos] = await Promise.all([
          githubApi.fetchUser(username),
          githubApi.fetchUserRepos(username),
        ]);

        // Filter out private repos (we only analyze public ones)
        const publicRepos = repos.filter((repo) => !repo.private);

        setData((prev) => ({
          ...prev,
          user,
          repos: publicRepos,
        }));

        // Fetch detailed data for each repo (with rate limiting)
        const repoDataPromises = publicRepos.map(async (repo) => {
          const [owner, repoName] = repo.full_name.split("/");

          try {
            const [
              contributors,
              commitActivity,
              issues,
              pullRequests,
            ] = await Promise.all([
              githubApi.fetchContributors(owner, repoName),
              githubApi.fetchCommitActivity(owner, repoName),
              githubApi.fetchIssues(owner, repoName),
              githubApi.fetchPullRequests(owner, repoName),
            ]);

            return {
              repo,
              contributors,
              commitActivity,
              issues,
              pullRequests,
            };
          } catch (error) {
            console.warn(`Failed to fetch data for ${repo.full_name}:`, error);
            return {
              repo,
              contributors: [],
              commitActivity: [],
              issues: [],
              pullRequests: [],
            };
          }
        });

        // Process in batches to avoid rate limits
        const batchSize = 5;
        const allRepoData = [];

        for (let i = 0; i < repoDataPromises.length; i += batchSize) {
          const batch = repoDataPromises.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch);
          allRepoData.push(...batchResults);

          // Small delay between batches
          if (i + batchSize < repoDataPromises.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Calculate analytics
        const busFactors = new Map<string, busFactor.BusFactorResult>();
        const healthScores = new Map<string, healthScore.HealthScoreResult>();
        const activityScores = new Map<string, number>();
        const inactiveRepos = new Set<string>();
        const commitTimelineData: Array<{
          repoName: string;
          activities: CommitActivity[];
        }> = [];

        allRepoData.forEach(({ repo, contributors, commitActivity, issues, pullRequests }) => {
          // Bus factor
          const bf = busFactor.calculateBusFactor(contributors);
          busFactors.set(repo.full_name, bf);

          // Health score
          const hs = healthScore.calculateHealthScore(issues, pullRequests);
          healthScores.set(repo.full_name, hs);

          // Activity score
          const activity = commitStats.calculateActivityScore(commitActivity);
          activityScores.set(repo.full_name, activity);

          // Inactive check
          if (commitStats.isInactive(commitActivity)) {
            inactiveRepos.add(repo.full_name);
          }

          // Commit timeline
          commitTimelineData.push({
            repoName: repo.full_name,
            activities: commitActivity,
          });
        });

        // Global calculations
        const globalBusFactor = busFactor.calculateGlobalBusFactor(
          Array.from(busFactors.values())
        );

        const globalHealthScore = healthScore.calculateAverageHealthScore(
          Array.from(healthScores.values())
        );

        const commitTimeline = commitStats.aggregateCommitActivity(
          commitTimelineData
        );

        setData((prev) => ({
          ...prev,
          busFactors,
          globalBusFactor,
          commitTimeline,
          healthScores,
          globalHealthScore,
          activityScores,
          inactiveRepos,
          loading: false,
        }));
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
        setData((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        }));
      }
    }

    fetchAllData();
  }, [username]);

  return data;
}
