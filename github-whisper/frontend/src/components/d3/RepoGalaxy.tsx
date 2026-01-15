// Repository Galaxy - D3.js Force-Directed Graph with Bubble Pack
// Stars → size, Forks → connections, Contributors → node strength

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface RepoData {
  name: string;
  stars: number;
  forks: number;
  contributors: number;
  inactive: boolean;
  parent?: string | null; // Parent repo full_name if forked
  language?: string | null; // Primary programming language
}

interface RepoGalaxyProps {
  repos: RepoData[];
  onRepoClick?: (repoName: string) => void;
  onRepoHover?: (repoName: string | null) => void;
}

interface TooltipData {
  x: number;
  y: number;
  data: typeof repos[0];
}

export function RepoGalaxy({ repos, onRepoClick, onRepoHover }: RepoGalaxyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    if (!svgRef.current || repos.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create container first (will be transformed by zoom)
    const container = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString());
      });

    // Initial transform - center the view
    const initialTransform = d3.zoomIdentity
      .translate(centerX, centerY)
      .scale(1);
    
    svg.call(zoom as any).call(zoom.transform as any, initialTransform);

    // Calculate node sizes based on stars
    const maxStars = Math.max(...repos.map((r) => r.stars || 0), 1);
    const minRadius = 8;
    const maxRadius = 40;
    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxStars])
      .range([minRadius, maxRadius]);

    // Prepare nodes - arrange in circular pattern initially
    const nodes = repos.map((repo, index) => {
      // Circular distribution
      const angle = (index / repos.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.2; // Smaller initial radius for tighter cluster
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      return {
        id: repo.name,
        ...repo,
        radius: radiusScale(repo.stars),
        x,
        y,
      };
    });

    // Create links only for real fork relationships
    // Link from child (forked repo) to parent (original repo)
    const links: Array<{ source: typeof nodes[0]; target: typeof nodes[0] }> = [];
    const nodeMap = new Map<string, typeof nodes[0]>();
    
    // Create map for quick lookup
    nodes.forEach((node) => {
      nodeMap.set(node.id, node);
    });
    
    // Create links only if repo has a parent (is a fork)
    nodes.forEach((node) => {
      if (node.parent) {
        const parentNode = nodeMap.get(node.parent);
        if (parentNode) {
          // Link from child (fork) to parent (original)
          links.push({ source: node, target: parentNode });
        }
      }
    });

    // Track selected node
    let selectedNode: typeof nodes[0] | null = null;

    // Create force simulation with more spacing
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance((d: any) => 100 + d.source.forks * 2) // Longer links for more spacing
          .strength(0.2) // Moderate link force
      )
      .force("charge", d3.forceManyBody().strength(-250)) // More repulsion for more spacing
      .force("center", d3.forceCenter(centerX, centerY).strength(0.05)) // Weaker center force
      .force(
        "collision",
        d3.forceCollide().radius((d: any) => d.radius + 15) // More spacing between nodes
      )
      .force(
        "radial",
        d3
          .forceRadial((d: any) => {
            // Keep nodes in a larger circular area
            const maxRadius = Math.min(width, height) * 0.4;
            return maxRadius;
          }, centerX, centerY)
          .strength(0.15) // Moderate radial force
      );

    // Color scale
    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([0, maxStars]);

    // Draw links - açık lacivert renk
    const link = container
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#60a5fa") // Açık lacivert
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.5);


    // Draw nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, typeof nodes[0]>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on("click", (event, d) => {
        event.stopPropagation();
        onRepoClick?.(d.id);
        
        // Deselect previous node
        if (selectedNode) {
          const prevNode = node.filter((n: any) => n.id === selectedNode!.id);
          prevNode.select("circle")
            .attr("stroke-width", 0)
            .attr("stroke", "#fff");
        }
        
        // Select current node
        selectedNode = d;
        const currentNode = d3.select(event.currentTarget);
        currentNode.select("circle")
          .attr("stroke-width", 4)
          .attr("stroke", "#3b82f6"); // Selected color
      })
      .on("mouseover", (event, d) => {
        onRepoHover?.(d.id);
        const currentNode = d3.select(event.currentTarget);
        
        // Only highlight if not selected
        if (selectedNode?.id !== d.id) {
          currentNode.select("circle")
            .attr("stroke-width", 3)
            .attr("stroke", "#60a5fa");
        }
        
        // Get mouse coordinates (handle both native and D3 events)
        const mouseEvent = event.sourceEvent || event;
        const clientX = mouseEvent.clientX ?? mouseEvent.pageX;
        const clientY = mouseEvent.clientY ?? mouseEvent.pageY;
        
        // Show tooltip popup
        requestAnimationFrame(() => {
          setTooltip({
            x: clientX,
            y: clientY,
            data: d,
          });
        });
      })
      .on("mousemove", (event, d) => {
        // Get mouse coordinates (handle both native and D3 events)
        const mouseEvent = event.sourceEvent || event;
        const clientX = mouseEvent.clientX ?? mouseEvent.pageX;
        const clientY = mouseEvent.clientY ?? mouseEvent.pageY;
        
        // Update tooltip position on mouse move
        requestAnimationFrame(() => {
          setTooltip((prev) =>
            prev
              ? {
                  ...prev,
                  x: clientX,
                  y: clientY,
                }
              : null
          );
        });
      })
      .on("mouseout", (event, d) => {
        onRepoHover?.(null);
        const currentNode = d3.select(event.currentTarget);
        
        // Only remove highlight if not selected
        if (selectedNode?.id !== d.id) {
          currentNode.select("circle")
            .attr("stroke-width", 0);
        }
        
        // Hide tooltip
        setTooltip(null);
      });

    // Main circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) =>
        d.inactive ? "#6b7280" : colorScale(d.stars)
      )
      .attr("fill-opacity", (d) => (d.inactive ? 0.3 : 0.8))
      .attr("stroke", (d) => (d.inactive ? "#4b5563" : "#fff"))
      .attr("stroke-width", 0)
      .attr("filter", "url(#glow)");

    // Fork indicators (small circles around main node)
    node.each(function (d) {
      if (d.forks > 0) {
        const forkCount = Math.min(d.forks, 8);
        const forkRadius = d.radius + 15;
        
        for (let i = 0; i < forkCount; i++) {
          const angle = (i / forkCount) * Math.PI * 2;
          const x = Math.cos(angle) * forkRadius;
          const y = Math.sin(angle) * forkRadius;

          d3.select(this)
            .append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 3)
            .attr("fill", "#8b5cf6")
            .attr("opacity", 0.7);
        }
      }
    });


    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Handle click outside to deselect
    svg.on("click", (event) => {
      if (event.target === svg.node()) {
        if (selectedNode) {
          const prevNode = node.filter((n: any) => n.id === selectedNode!.id);
          prevNode.select("circle")
            .attr("stroke-width", 0)
            .attr("stroke", "#fff");
          selectedNode = null;
        }
      }
    });

    return () => {
      simulation.stop();
    };
  }, [repos, onRepoClick, onRepoHover]);

  return (
    <>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ background: "#0a0a0a" }}
      />
      {tooltip && tooltip.data && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y - 10}px`,
            transform: "translateY(-100%)",
          }}
        >
          <div className="bg-black/95 border border-gray-700 rounded-lg p-4 shadow-xl min-w-[280px] max-w-[400px]">
            {/* Repo Name */}
            <div className="font-semibold text-lg text-indigo-400 mb-3 border-b border-gray-700 pb-2">
              {tooltip.data.name}
            </div>
            
            {/* Repo Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⭐</span>
                <span className="text-gray-400">Stars:</span>
                <span className="text-gray-300 font-medium">
                  {tooltip.data.stars.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-purple-400">🍴</span>
                <span className="text-gray-400">Forks:</span>
                <span className="text-gray-300 font-medium">
                  {tooltip.data.forks.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-blue-400">👥</span>
                <span className="text-gray-400">Contributors:</span>
                <span className="text-gray-300 font-medium">
                  {tooltip.data.contributors.toLocaleString()}
                </span>
              </div>
              
              {/* Language */}
              {tooltip.data.language && (
                <div className="flex items-center gap-2">
                  <span className="text-green-400">💻</span>
                  <span className="text-gray-400">Language:</span>
                  <span className="text-gray-300 font-medium">
                    {tooltip.data.language}
                  </span>
                </div>
              )}
              
              {/* Status */}
              <div className="pt-2 border-t border-gray-700 mt-2">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    tooltip.data.inactive
                      ? "bg-gray-700 text-gray-400"
                      : "bg-green-900/30 text-green-400"
                  }`}
                >
                  {tooltip.data.inactive ? "Inactive" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
