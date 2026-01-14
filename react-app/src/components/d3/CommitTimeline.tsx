// Commit Timeline - D3.js Multi-Line Chart with Area
// X → time (weeks), Y → total commits, Multiple lines → repositories

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface CommitData {
  week: number;
  totalCommits: number;
  repoName: string;
}

interface CommitTimelineProps {
  timeline: CommitData[];
  repos: string[];
}

export function CommitTimeline({ timeline, repos }: CommitTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!svgRef.current || timeline.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Throttle function for mousemove
    let lastMouseMoveTime = 0;
    const throttleDelay = 50; // 50ms throttle

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Group data by repository and sample data for performance
    const dataByRepo = d3.group(timeline, (d) => d.repoName);
    const repoData = Array.from(dataByRepo.entries()).map(([repo, data]) => {
      const sorted = data
        .map((d) => ({
          date: new Date(d.week),
          commits: d.totalCommits,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Sample data if too many points (max 100 points per repo)
      let sampled = sorted;
      if (sorted.length > 100) {
        const step = sorted.length / 100;
        sampled = [];
        for (let i = 0; i < sorted.length; i += step) {
          sampled.push(sorted[Math.floor(i)]);
        }
      }
      
      return {
        repo,
        values: sampled,
      };
    });

    // Scales
    const xExtent = d3.extent(timeline, (d) => new Date(d.week).getTime()) as [
      number,
      number
    ];
    const xScale = d3
      .scaleTime()
      .domain(xExtent)
      .range([0, innerWidth])
      .nice();

    const maxCommits = d3.max(timeline, (d) => d.totalCommits) || 1;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxCommits])
      .range([innerHeight, 0])
      .nice();

    // Color scale for repositories
    const colorScale = d3
      .scaleOrdinal(d3.schemeCategory10)
      .domain(repoData.map((d) => d.repo));

    // Line generator
    const line = d3
      .line<{ date: Date; commits: number }>()
      .x((d) => xScale(d.date.getTime()))
      .y((d) => yScale(d.commits))
      .curve(d3.curveMonotoneX);

    // Area generator
    const area = d3
      .area<{ date: Date; commits: number }>()
      .x((d) => xScale(d.date.getTime()))
      .y0(innerHeight)
      .y1((d) => yScale(d.commits))
      .curve(d3.curveMonotoneX);

    // Create container
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "commit-tooltip")
      .style("position", "absolute")
      .style("padding", "10px 14px")
      .style("background", "rgba(0, 0, 0, 0.95)")
      .style("border", "1px solid #374151")
      .style("border-radius", "8px")
      .style("color", "#e5e7eb")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.5)")
      .style("min-width", "200px");

    // Track visibility state for each repo
    const visibility = new Map<string, boolean>();
    repoData.forEach(({ repo }) => visibility.set(repo, true));

    // Add gradient definitions
    const defs = svg.append("defs");
    repoData.forEach(({ repo }, i) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      const color = colorScale(repo) as string;
      gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.6);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.1);
    });

    // Draw areas (behind lines) - only for visible repos, no animation
    repoData.forEach(({ repo, values }, i) => {
      g.append("path")
        .datum(values)
        .attr("class", `area-${repo.replace(/[^a-zA-Z0-9]/g, "-")}`)
        .attr("data-repo", repo)
        .attr("fill", `url(#gradient-${i})`)
        .attr("d", area)
        .style("opacity", 0.8);
    });

    // Draw lines - no animation for performance
    repoData.forEach(({ repo, values }) => {
      g.append("path")
        .datum(values)
        .attr("class", `line-${repo.replace(/[^a-zA-Z0-9]/g, "-")}`)
        .attr("data-repo", repo)
        .attr("fill", "none")
        .attr("stroke", colorScale(repo) as string)
        .attr("stroke-width", 2)
        .attr("d", line)
        .style("opacity", 0.8);
    });

    // Create vertical line for hover indicator (initially hidden)
    const hoverLine = g
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", "#60a5fa")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Create dots container (will be populated on hover)
    const dotsContainer = g.append("g").attr("class", "dots-container");

    // Function to toggle repo visibility - no transition for performance
    const toggleRepo = (repo: string) => {
      const isVisible = visibility.get(repo) ?? true;
      const newVisibility = !isVisible;
      visibility.set(repo, newVisibility);

      const selector = repo.replace(/[^a-zA-Z0-9]/g, "-");
      const opacity = newVisibility ? 0.8 : 0;

      // Toggle line and area - immediate update
      g.selectAll(`.line-${selector}, .area-${selector}`)
        .style("opacity", opacity);

      // Update legend
      g.selectAll(`.legend-item-${selector}`)
        .style("opacity", newVisibility ? 1 : 0.3);
      
      // Toggle checkmark
      g.selectAll(`.checkmark-${selector}`)
        .style("opacity", newVisibility ? 1 : 0);
    };

    // Binary search for finding closest point (much faster)
    const findClosestPoint = (values: Array<{ date: Date; commits: number }>, targetDate: Date) => {
      let left = 0;
      let right = values.length - 1;
      
      while (right - left > 1) {
        const mid = Math.floor((left + right) / 2);
        if (values[mid].date.getTime() < targetDate.getTime()) {
          left = mid;
        } else {
          right = mid;
        }
      }
      
      const leftDist = Math.abs(values[left].date.getTime() - targetDate.getTime());
      const rightDist = Math.abs(values[right].date.getTime() - targetDate.getTime());
      return leftDist < rightDist ? values[left] : values[right];
    };

    // Add invisible overlay for mouse tracking with throttling
    const overlay = g
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mousemove", function (event) {
        const now = Date.now();
        if (now - lastMouseMoveTime < throttleDelay) return;
        lastMouseMoveTime = now;

        // Cancel previous RAF
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          // Get mouse position relative to the g group (accounts for margins)
          const [mouseX] = d3.pointer(event, g.node() as any);
          const date = xScale.invert(mouseX);
          
          // Use mouseX directly for line position - exact mouse position
          const xPos = Math.max(0, Math.min(innerWidth, mouseX));

          // Show vertical line at exact mouse position (no offset)
          hoverLine
            .attr("x1", xPos)
            .attr("x2", xPos)
            .style("opacity", 1);

          // Find closest data points using binary search
          // Only for visible repos
          const closestData: Array<{
            repo: string;
            date: Date;
            commits: number;
            x: number;
            y: number;
          }> = [];

          repoData.forEach(({ repo, values }) => {
            // Skip if repo is hidden
            if (!visibility.get(repo) || values.length === 0) return;
            const closest = findClosestPoint(values, date);
            closestData.push({
              repo,
              date: closest.date,
              commits: closest.commits,
              x: xScale(closest.date.getTime()),
              y: yScale(closest.commits),
            });
          });

          // Sort by commits and show top repos
          closestData.sort((a, b) => b.commits - a.commits);
          const topData = closestData.slice(0, 6); // Show max 6 repos

          // Dim other repos (reduce opacity) - but respect visibility state
          repoData.forEach(({ repo }) => {
            const selector = repo.replace(/[^a-zA-Z0-9]/g, "-");
            const isVisible = visibility.get(repo) ?? true;
            
            // If repo is hidden, keep it hidden (opacity 0)
            if (!isVisible) {
              g.selectAll(`.line-${selector}, .area-${selector}`)
                .style("opacity", 0);
              return;
            }
            
            const isHighlighted = topData.some((d) => d.repo === repo);
            const opacity = isHighlighted ? 1 : 0.15; // Dim non-highlighted repos
            
            g.selectAll(`.line-${selector}, .area-${selector}`)
              .style("opacity", opacity);
          });

          // Show dots only for highlighted AND visible repos
          dotsContainer.selectAll("*").remove();
          topData.forEach((d) => {
            // Only show dot if repo is visible
            if (!visibility.get(d.repo)) return;
            
            dotsContainer
              .append("circle")
              .attr("cx", d.x)
              .attr("cy", d.y)
              .attr("r", 4)
              .attr("fill", colorScale(d.repo) as string)
              .attr("stroke", "#fff")
              .attr("stroke-width", 2)
              .style("opacity", 1);
          });

          if (topData.length > 0) {
            const tooltipContent = `
              <div style="font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid #374151; padding-bottom: 6px;">
                ${d3.timeFormat("%B %d, %Y")(topData[0].date)}
              </div>
              ${topData
                .map(
                  (d) => `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 10px; height: 10px; background: ${colorScale(
                      d.repo
                    )}; border-radius: 2px;"></div>
                    <span style="color: #9ca3af; font-size: 11px;">${d.repo.split("/").pop() || d.repo}</span>
                  </div>
                  <span style="font-weight: 600; color: ${colorScale(d.repo)};">${d.commits} commits</span>
                </div>
              `
                )
                .join("")}
            `;

            tooltip
              .html(tooltipContent)
              .style("opacity", 1)
              .style("left", `${event.pageX + 15}px`)
              .style("top", `${event.pageY - 10}px`);
          }
        });
      })
      .on("mouseout", () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        
        // Hide vertical line
        hoverLine.style("opacity", 0);
        
        // Remove dots
        dotsContainer.selectAll("*").remove();
        
        // Restore all repos to normal opacity
        repoData.forEach(({ repo }) => {
          const selector = repo.replace(/[^a-zA-Z0-9]/g, "-");
          const isVisible = visibility.get(repo) ?? true;
          g.selectAll(`.line-${selector}, .area-${selector}`)
            .style("opacity", isVisible ? 0.8 : 0);
        });
        
        tooltip.style("opacity", 0);
      });

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat("%b %Y"));
    g.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#9ca3af")
      .style("font-size", "11px");

    // Y axis
    const yAxis = d3.axisLeft(yScale).ticks(6);
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#9ca3af")
      .style("font-size", "11px");

    // Axis styling
    g.selectAll(".domain, .tick line")
      .attr("stroke", "#374151")
      .attr("stroke-width", 1);

    // Add grid lines
    g.selectAll(".grid-line")
      .data(yScale.ticks(6))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    // Legend with toggle functionality
    const legend = g
      .append("g")
      .attr("transform", `translate(${innerWidth - 200}, 10)`);

    repoData.slice(0, 15).forEach(({ repo }, i) => {
      const selector = repo.replace(/[^a-zA-Z0-9]/g, "-");
      const legendItem = legend
        .append("g")
        .attr("class", `legend-item-${selector}`)
        .attr("transform", `translate(0, ${i * 20})`)
        .style("cursor", "pointer")
        .on("click", function (event) {
          event.stopPropagation();
          toggleRepo(repo);
        })
        .on("mouseover", function () {
          if (visibility.get(repo)) {
            d3.select(this).style("opacity", 0.8);
            // Highlight corresponding line - immediate update
            const repoSelector = repo.replace(/[^a-zA-Z0-9]/g, "-");
            g.selectAll(`.line-${repoSelector}`)
              .style("stroke-width", 3)
              .style("opacity", 1);
          }
        })
        .on("mouseout", function () {
          if (visibility.get(repo)) {
            d3.select(this).style("opacity", 1);
            const repoSelector = repo.replace(/[^a-zA-Z0-9]/g, "-");
            g.selectAll(`.line-${repoSelector}`)
              .style("stroke-width", 2)
              .style("opacity", 0.8);
          }
        });

      // Checkbox indicator
      legendItem
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "transparent")
        .attr("stroke", colorScale(repo) as string)
        .attr("stroke-width", 2)
        .attr("rx", 2);

      // Checkmark for visible repos (initially visible)
      const checkmark = legendItem
        .append("path")
        .attr("class", `checkmark-${selector}`)
        .attr("d", "M 3 6 L 5 8 L 9 4")
        .attr("stroke", colorScale(repo) as string)
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("stroke-linecap", "round")
        .attr("stroke-linejoin", "round")
        .style("opacity", 1);

      // Color indicator
      legendItem
        .append("rect")
        .attr("x", 18)
        .attr("y", 2)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", colorScale(repo) as string)
        .attr("rx", 2);

      // Repo name
      legendItem
        .append("text")
        .attr("x", 34)
        .attr("y", 10)
        .text(repo.split("/").pop() || repo)
        .attr("fill", "#e5e7eb")
        .style("font-size", "11px")
        .style("user-select", "none");
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      tooltip.remove();
    };
  }, [timeline, repos]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{ background: "#0a0a0a" }}
    />
  );
}
