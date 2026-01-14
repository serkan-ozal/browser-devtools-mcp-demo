// GitHub 3D Analytics Dashboard - Main Analytics Page

import { useState, useMemo, useEffect, useRef } from "react";
import { getStoredUsername } from "@/components/github-username-modal";
import { useGithubData } from "@/hooks/useGithubData";
import { generateInsights } from "@/analytics/insights";
import { RepoGalaxy as ThreeRepoGalaxy } from "@/components/three/RepoGalaxy";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CommitTimeline } from "@/components/d3/CommitTimeline";
import { BusFactorDonut } from "@/components/d3/BusFactorDonut";
import { HealthGauge } from "@/components/d3/HealthGauge";
import { CommitTree } from "@/components/d3/CommitTree";
import * as githubApi from "@/api/github";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { IconInfoCircle, IconX, IconLoader } from "@tabler/icons-react";

type ViewMode = "galaxy" | "timeline" | "overview";

export function AnalyticsPage() {
  const [username] = useState<string | null>(() => getStoredUsername());
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [commitTreeData, setCommitTreeData] = useState<githubApi.Commit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);

  const data = useGithubData(username);

  // Fetch commits when repo is selected
  useEffect(() => {
    if (!selectedRepo) {
      setCommitTreeData([]);
      return;
    }

    const fetchCommits = async () => {
      setLoadingCommits(true);
      try {
        const [owner, repo] = selectedRepo.split("/");
        const commits = await githubApi.fetchCommits(owner, repo, 30);
        setCommitTreeData(commits);
      } catch (error) {
        console.error("Failed to fetch commits:", error);
        setCommitTreeData([]);
      } finally {
        setLoadingCommits(false);
      }
    };

    fetchCommits();
  }, [selectedRepo]);

  // Generate insights
  const insights = useMemo(() => {
    if (!data.globalBusFactor || !data.globalHealthScore) return [];

    return generateInsights(
      Array.from(data.busFactors.values()),
      data.globalBusFactor,
      Array.from(data.healthScores.values()),
      data.globalHealthScore,
      data.inactiveRepos.size,
      data.repos.length
    );
  }, [
    data.busFactors,
    data.globalBusFactor,
    data.healthScores,
    data.globalHealthScore,
    data.inactiveRepos.size,
    data.repos.length,
  ]);

  // Prepare repo data for galaxy visualization
  const repoGalaxyData = useMemo(() => {
    return data.repos.map((repo) => ({
      name: repo.full_name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      contributors: data.busFactors.get(repo.full_name)?.totalContributors || 0,
      inactive: data.inactiveRepos.has(repo.full_name),
      parent: repo.parent?.full_name || repo.source?.full_name || null,
      language: repo.language || null,
    }));
  }, [data.repos, data.busFactors, data.inactiveRepos]);

  // Prepare commit timeline data
  const commitTimelineData = useMemo(() => {
    return data.commitTimeline.flatMap((week) =>
      week.repos.map((repo) => ({
        week: week.week,
        totalCommits: repo.commits,
        repoName: repo.repoName,
      }))
    );
  }, [data.commitTimeline]);

  // Get top 10 repos by last commit date (most recently committed)
  const top10Repos = useMemo(() => {
    // Find the last commit week for each repo
    const lastCommitWeek = new Map<string, number>();
    commitTimelineData.forEach((d) => {
      const current = lastCommitWeek.get(d.repoName);
      // Store the maximum (most recent) week for each repo
      if (!current || d.week > current) {
        lastCommitWeek.set(d.repoName, d.week);
      }
    });

    // Sort by last commit week (most recent first) and get top 10
    const sorted = Array.from(lastCommitWeek.entries())
      .sort((a, b) => b[1] - a[1]) // Sort descending (most recent first)
      .slice(0, 10)
      .map(([repoName]) => repoName);

    return new Set(sorted);
  }, [commitTimelineData]);

  // Filter timeline data to only include top 10 repos
  const filteredCommitTimelineData = useMemo(() => {
    return commitTimelineData.filter((d) => top10Repos.has(d.repoName));
  }, [commitTimelineData, top10Repos]);

  const uniqueRepos = useMemo(
    () =>
      Array.from(new Set(filteredCommitTimelineData.map((d) => d.repoName))),
    [filteredCommitTimelineData]
  );

  if (!username) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <IconInfoCircle className="size-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">GitHub Analytics</CardTitle>
            <CardDescription>
              Please set your GitHub username to view analytics
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (data.loading) {
    return (
      <div className="flex flex-1 flex-col p-4 lg:p-6 gap-4">
        <div className="flex items-center gap-2">
          <IconLoader className="size-5 animate-spin" />
          <h2 className="text-2xl font-bold">Loading Analytics...</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <IconX className="size-16 text-destructive mb-4" />
            <CardTitle className="text-2xl">Error</CardTitle>
            <CardDescription>{data.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (data.repos.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <IconInfoCircle className="size-16 text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">No Repositories</CardTitle>
            <CardDescription>
              This user has no public repositories to analyze
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Analytics</h1>
          <p className="text-muted-foreground">
            {data.user?.name || username} • {data.repos.length} repositories
          </p>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, index) => (
            <Card key={index} className="border-l-4 border-l-current">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{insight.emoji}</span>
                  <p className="text-sm flex-1">{insight.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Visualization Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="galaxy">Repository Galaxy</TabsTrigger>
          <TabsTrigger value="timeline">Commit Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Global Bus Factor */}
            {data.globalBusFactor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Bus Factor Risk
                  </CardTitle>
                  <CardDescription>Global analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center">
                    <BusFactorDonut
                      risk={data.globalBusFactor.risk}
                      topContributorRatio={
                        data.globalBusFactor.topContributorRatio
                      }
                      size={180}
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Level</span>
                      <Badge
                        variant={
                          data.globalBusFactor.risk === "HIGH"
                            ? "destructive"
                            : data.globalBusFactor.risk === "MEDIUM"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {data.globalBusFactor.risk}
                      </Badge>
                    </div>
                    <Progress value={data.globalBusFactor.score} />
                    <p className="text-xs text-muted-foreground">
                      Score: {data.globalBusFactor.score.toFixed(2)}/100
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Global Health Score */}
            {data.globalHealthScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Health Score
                  </CardTitle>
                  <CardDescription>Repository health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center">
                    <HealthGauge
                      score={data.globalHealthScore.score}
                      grade={data.globalHealthScore.grade}
                      size={180}
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Grade</span>
                      <Badge
                        variant={
                          data.globalHealthScore.grade === "EXCELLENT"
                            ? "default"
                            : data.globalHealthScore.grade === "GOOD"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {data.globalHealthScore.grade}
                      </Badge>
                    </div>
                    <Progress value={data.globalHealthScore.score} />
                    <p className="text-xs text-muted-foreground">
                      {data.globalHealthScore.score}/100
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.repos.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {data.repos.length - data.inactiveRepos.size} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Stars
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data.repos.reduce((sum, r) => sum + r.stargazers_count, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across all repos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Repository List */}
          <Card>
            <CardHeader>
              <CardTitle>Repositories</CardTitle>
              <CardDescription>
                Click on a repository to see detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {data.repos.map((repo) => {
                  const bf = data.busFactors.get(repo.full_name);
                  const hs = data.healthScores.get(repo.full_name);
                  const activity = data.activityScores.get(repo.full_name) || 0;
                  const inactive = data.inactiveRepos.has(repo.full_name);

                  return (
                    <Card
                      key={repo.id}
                      className={`cursor-pointer transition-all ${
                        selectedRepo === repo.full_name
                          ? "ring-2 ring-primary"
                          : ""
                      } ${inactive ? "opacity-60" : ""}`}
                      onClick={() => setSelectedRepo(repo.full_name)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {repo.name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {repo.description || "No description"}
                            </p>
                          </div>
                          {inactive && (
                            <Badge variant="outline" className="ml-2">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs">
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                          {bf && (
                            <span
                              className={
                                bf.risk === "HIGH"
                                  ? "text-destructive"
                                  : bf.risk === "MEDIUM"
                                  ? "text-orange-500"
                                  : "text-green-500"
                              }
                            >
                              Bus: {bf.risk}
                            </span>
                          )}
                          {hs && (
                            <span
                              className={
                                hs.grade === "EXCELLENT" || hs.grade === "GOOD"
                                  ? "text-green-500"
                                  : "text-orange-500"
                              }
                            >
                              Health: {hs.score}
                            </span>
                          )}
                        </div>
                        <Progress value={activity} className="mt-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Galaxy Tab */}
        <TabsContent value="galaxy">
          <Card>
            <CardHeader>
              <CardTitle>Repository Galaxy</CardTitle>
              <CardDescription>
                Each sphere represents a repository. Size = stars, orbiting dots
                = forks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[700px] w-auto rounded-lg bg-black relative">
                {/* Legend */}
                <div className="absolute top-4 left-4 z-50 rounded-lg border border-white/10 bg-black/70 backdrop-blur px-3 py-2 text-xs text-white">
                  <div className="font-semibold mb-1">Gösterim</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "#040f73" }}
                      />
                      <span>Repositories (Active)</span>
                      <span className="text-white/60">
                        • Size = Stars Count
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "#60a5fa" }}
                      />
                      <span>Selected Repository</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: "#666" }}
                      />
                      <span>Inactive repo</span>
                    </div>
                  </div>
                </div>
                <Canvas
                  camera={{ position: [0, 0, 14], fov: 50 }}
                  gl={{ antialias: true }}
                  dpr={[1, 2]}
                >
                  <OrbitControls
                    ref={orbitControlsRef}
                    enableDamping
                    dampingFactor={0.05}
                    minDistance={5}
                    maxDistance={30}
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                  />
                  <ThreeRepoGalaxy
                    repos={repoGalaxyData}
                    onRepoClick={setSelectedRepo}
                    onRepoHover={() => {
                      // Hover handling - can be used for tooltips or other UI feedback
                      // Currently just for internal state management
                    }}
                    selectedRepo={selectedRepo}
                    onResetCameraReady={(resetFn) => {
                      // Store reset function with controls ref
                      (
                        window as { resetThreeCamera?: () => void }
                      ).resetThreeCamera = () => {
                        resetFn();
                        // Also reset OrbitControls
                        if (orbitControlsRef.current) {
                          orbitControlsRef.current.target.set(0, 0, 0);
                          orbitControlsRef.current.update();
                        }
                      };
                    }}
                  />
                </Canvas>
                {/* Control Buttons */}
                <div className="absolute bottom-4 right-4 flex gap-2 z-50">
                  <button
                    onClick={() => {
                      const resetFn = (
                        window as { resetThreeCamera?: () => void }
                      ).resetThreeCamera;
                      if (resetFn) {
                        resetFn();
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Center
                  </button>
                  {selectedRepo && (
                    <button
                      onClick={() => setSelectedRepo(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commit Tree Card - shown when repo is selected */}
          {selectedRepo && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Commit Tree</CardTitle>
                    <CardDescription>
                      Radial tree visualization of commit history for{" "}
                      {selectedRepo}
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setSelectedRepo(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCommits ? (
                  <div className="h-[500px] flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <IconLoader className="size-5 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        Loading commits...
                      </span>
                    </div>
                  </div>
                ) : commitTreeData.length > 0 ? (
                  <div className="h-[500px] w-full rounded-lg overflow-hidden bg-black">
                    <CommitTree
                      commits={commitTreeData}
                      repoName={selectedRepo}
                    />
                  </div>
                ) : (
                  <div className="h-[500px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      No commits found for this repository
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Commit Activity Timeline</CardTitle>
              <CardDescription>
                3D bars showing commit activity over time (X = time, Y =
                commits, Z = repository)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] w-full rounded-lg overflow-hidden bg-black">
                <CommitTimeline
                  timeline={filteredCommitTimelineData}
                  repos={uniqueRepos}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
