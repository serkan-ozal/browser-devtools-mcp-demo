// Bus Factor Donut - D3.js Donut Chart showing bus factor risk

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface BusFactorDonutProps {
  risk: "LOW" | "MEDIUM" | "HIGH";
  topContributorRatio: number;
  size?: number;
}

export function BusFactorDonut({
  risk,
  topContributorRatio,
  size = 200,
}: BusFactorDonutProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = size;
    const height = size;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.6;

    const color = (() => {
      switch (risk) {
        case "HIGH":
          return "#ef4444";
        case "MEDIUM":
          return "#f59e0b";
        case "LOW":
          return "#10b981";
        default:
          return "#6b7280";
      }
    })();

    // Create pie data
    const pieData = [
      { label: "Top Contributor", value: topContributorRatio },
      { label: "Others", value: 1 - topContributorRatio },
    ];

    // Pie generator
    const pie = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02);

    // Arc generator
    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Create container
    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw arcs
    const arcs = g
      .selectAll(".arc")
      .data(pie(pieData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => (i === 0 ? color : "#374151"))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .style("opacity", (d, i) => (i === 0 ? 1 : 0.3))
      .transition()
      .duration(1000)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t)) || "";
        };
      });

    // Add labels
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .text((d, i) => {
        if (i === 0) {
          return `${Math.round(d.data.value * 100)}%`;
        }
        return "";
      });

    // Center text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", -10)
      .attr("fill", color)
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text(risk);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 15)
      .attr("fill", "#9ca3af")
      .style("font-size", "12px")
      .text("Bus Factor");

    // Add glow effect
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    arcs.select("path").attr("filter", (d, i) => (i === 0 ? "url(#glow)" : null));
  }, [risk, topContributorRatio, size]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      style={{ background: "transparent" }}
    />
  );
}
