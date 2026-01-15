// Radial Tree - Canvas-based interactive commit tree
// Inspired by ObservableHQ Tree of Life
// Canvas rendering for performance, zoom/pan support

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { Commit } from "@/api/github";

interface CommitNode extends d3.HierarchyNode<CommitData> {
  x?: number;
  y?: number;
}

interface CommitData {
  id: string;
  message: string;
  author: string;
  authorName: string;
  date: Date;
  sha: string;
  url: string;
  committerDate: Date;
  committerName: string;
  children?: CommitData[];
  originalCommit?: Commit; // Store original commit for full data
}

interface CommitTreeProps {
  commits: Commit[];
  repoName: string;
}

export function CommitTree({ commits, repoName }: CommitTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: CommitData | null;
  } | null>(null);
  const tooltipHoveredRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || commits.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    canvas.width = width;
    canvas.height = height;

    // Build tree structure from commits
    const commitMap = new Map<string, CommitData>();
    const rootCommits: CommitData[] = [];

    // Create nodes for all commits
    commits.forEach((commit) => {
      const commitData: CommitData = {
        id: commit.sha.substring(0, 7),
        message: commit.commit.message.split("\n")[0],
        author: commit.author?.login || commit.commit.author.name,
        authorName: commit.commit.author.name,
        date: new Date(commit.commit.author.date),
        committerDate: new Date(commit.commit.committer.date),
        committerName: commit.commit.committer.name,
        sha: commit.sha,
        url: commit.html_url || `https://github.com/${repoName}/commit/${commit.sha}`,
        originalCommit: commit,
      };
      commitMap.set(commit.sha, commitData);
    });

    // Build parent-child relationships
    commits.forEach((commit) => {
      const commitData = commitMap.get(commit.sha)!;
      
      if (commit.parents.length > 0) {
        const parentSha = commit.parents[0].sha;
        const parent = commitMap.get(parentSha);
        
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(commitData);
        } else {
          rootCommits.push(commitData);
        }
      } else {
        rootCommits.push(commitData);
      }
    });

    // If no clear root structure, create linear tree
    if (rootCommits.length === 0 && commits.length > 0) {
      const sortedCommits = Array.from(commitMap.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      
      for (let i = 1; i < sortedCommits.length; i++) {
        if (!sortedCommits[i - 1].children) {
          sortedCommits[i - 1].children = [];
        }
        sortedCommits[i - 1].children!.push(sortedCommits[i]);
      }
      
      if (sortedCommits.length > 0) {
        rootCommits.push(sortedCommits[0]);
      }
    }

    const rootData = rootCommits[0] || Array.from(commitMap.values())[0];
    if (!rootData) return;

    // Create hierarchy
    const root = d3.hierarchy(rootData, (d) => d.children) as CommitNode;

    // Radial tree layout - increased spacing
    const radius = Math.min(width, height) / 2 - 40;
    const tree = d3
      .tree<CommitData>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => {
        // Increase separation - siblings get more space
        if (a.parent === b.parent) {
          return 1.5 / (a.depth || 1);
        }
        return 3 / (a.depth || 1);
      });

    tree(root);

    // Color scale
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([0, root.height || 5]);

    // Zoom and pan state
    let transform = d3.zoomIdentity;
    let hoveredNode: CommitNode | null = null;

    // Zoom behavior
    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        transform = event.transform;
        draw();
      });

    d3.select(canvas).call(zoom as any);

    // Mouse tracking for tooltip
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Transform mouse coordinates to tree space (accounting for zoom/pan)
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Apply inverse transform
      const tx = (x - centerX - transform.x) / transform.k;
      const ty = (y - centerY - transform.y) / transform.k;
      
      // Convert to polar coordinates
      const angle = Math.atan2(ty, tx) + Math.PI / 2; // Adjust for tree orientation
      const r = Math.sqrt(tx * tx + ty * ty);

      // Normalize angle to [0, 2π]
      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

      // Find closest node with better hit detection
      let closest: CommitNode | null = null;
      let minDist = Infinity;
      const hitThreshold = 20 / transform.k; // Scale threshold with zoom

      root.descendants().forEach((node) => {
        const nodeAngle = node.x!;
        const nodeRadius = node.y!;
        
        // Calculate distance in polar coordinates
        const angleDiff = Math.min(
          Math.abs(normalizedAngle - nodeAngle),
          2 * Math.PI - Math.abs(normalizedAngle - nodeAngle)
        );
        const radiusDiff = Math.abs(r - nodeRadius);
        
        // Combined distance metric (angle weighted more)
        const dist = angleDiff * nodeRadius + radiusDiff;
        
        if (dist < minDist && dist < hitThreshold) {
          minDist = dist;
          closest = node;
        }
      });

      hoveredNode = closest;
      if (closest) {
        // Use requestAnimationFrame to ensure state updates properly
        requestAnimationFrame(() => {
          setTooltip({
            x: event.clientX,
            y: event.clientY,
            data: closest!.data,
          });
        });
      } else {
        requestAnimationFrame(() => {
          setTooltip(null);
        });
      }
      draw();
    };

    const handleMouseLeave = () => {
      hoveredNode = null;
      // Only close tooltip if not hovering over tooltip itself
      if (!tooltipHoveredRef.current) {
        setTimeout(() => {
          if (!tooltipHoveredRef.current) {
            setTooltip(null);
          }
        }, 200);
      }
      draw();
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(transform.k, transform.k);
      ctx.translate(transform.x / transform.k, transform.y / transform.k);

      // Draw links
      root.links().forEach((link) => {
        const source = link.source as CommitNode;
        const target = link.target as CommitNode;
        
        const x0 = source.y! * Math.cos(source.x! - Math.PI / 2);
        const y0 = source.y! * Math.sin(source.x! - Math.PI / 2);
        const x1 = target.y! * Math.cos(target.x! - Math.PI / 2);
        const y1 = target.y! * Math.sin(target.x! - Math.PI / 2);

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
      });

      // Draw nodes
      root.descendants().forEach((node) => {
        const x = node.y! * Math.cos(node.x! - Math.PI / 2);
        const y = node.y! * Math.sin(node.x! - Math.PI / 2);
        const isHovered = hoveredNode === node;
        const radius = isHovered ? 6 : 4;

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = colorScale(node.depth);
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.stroke();

        // Label for root and leaf nodes - rotate 180 degrees for readability
        if (!node.children || node.depth === 0) {
          ctx.save();
          ctx.translate(x, y);
          // Rotate text 180 degrees so it's readable (not upside down)
          ctx.rotate(node.x! + Math.PI);
          ctx.textAlign = node.children ? "end" : "start";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#e5e7eb";
          ctx.font = "10px sans-serif";
          ctx.fillText(node.data.id, node.children ? -8 : 8, 0);
          ctx.restore();
        }
      });

      // Center label
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(
        repoName.split("/").pop() || repoName,
        0,
        -radius - 20
      );
      ctx.restore();

      ctx.restore();
    };

    // Initial draw
    draw();

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      canvas.width = newWidth;
      canvas.height = newHeight;
      draw();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, [commits, repoName]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-move"
          style={{ background: "#0a0a0a" }}
        />
      </div>
      {tooltip && tooltip.data && (
        <div
          data-tooltip
          className="fixed z-[9999]"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y - 10}px`,
            transform: "translateY(-100%)",
          }}
          onMouseEnter={(e) => {
            // Keep tooltip open when hovering over it
            e.stopPropagation();
            tooltipHoveredRef.current = true;
          }}
          onMouseLeave={(e) => {
            // Close tooltip when mouse leaves
            e.stopPropagation();
            tooltipHoveredRef.current = false;
            setTooltip(null);
          }}
        >
          <div className="bg-black/95 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[280px] max-w-[400px] pointer-events-auto">
            {/* Commit SHA */}
            <div className="font-mono font-semibold text-sm text-blue-400 mb-3 border-b border-gray-700 pb-2">
              {tooltip.data.sha}
            </div>
            
            {/* Commit Message */}
            <div className="text-sm text-white mb-3 font-medium">
              {tooltip.data.message}
            </div>
            
            {/* Author Info */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Author:</span>
                <span className="text-gray-300 font-medium">
                  {tooltip.data.author}
                </span>
                {tooltip.data.author !== tooltip.data.authorName && (
                  <span className="text-gray-500">
                    ({tooltip.data.authorName})
                  </span>
                )}
              </div>
              
              {/* Author Date */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Authored:</span>
                <span className="text-gray-300">
                  {d3.timeFormat("%B %d, %Y at %I:%M %p")(tooltip.data.date)}
                </span>
              </div>
              
              {/* Committer Info (if different from author) */}
              {tooltip.data.committerName !== tooltip.data.authorName && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Committer:</span>
                    <span className="text-gray-300 font-medium">
                      {tooltip.data.committerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Committed:</span>
                    <span className="text-gray-300">
                      {d3.timeFormat("%B %d, %Y at %I:%M %p")(
                        tooltip.data.committerDate
                      )}
                    </span>
                  </div>
                </>
              )}
              
              {/* Commit URL */}
              <div className="pt-2 border-t border-gray-700 mt-2">
                <a
                  href={tooltip.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
