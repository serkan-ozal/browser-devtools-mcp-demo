// Health Score Gauge - D3.js Speedometer/Gauge showing repository health

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface HealthGaugeProps {
  score: number; // 0-100
  grade: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  size?: number;
}

export function HealthGauge({
  score,
  grade,
  size = 200,
}: HealthGaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = size;
    const height = size;
    const radius = Math.min(width, height) / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;

    const color = (() => {
      switch (grade) {
        case "EXCELLENT":
          return "#10b981";
        case "GOOD":
          return "#3b82f6";
        case "FAIR":
          return "#f59e0b";
        case "POOR":
          return "#ef4444";
        default:
          return "#6b7280";
      }
    })();

    // Gauge configuration (semi-circle)
    const startAngle = -Math.PI;
    const endAngle = 0;
    const angleRange = endAngle - startAngle;

    // Convert score (0-100) to angle
    const scoreAngle = startAngle + (score / 100) * angleRange;

    // Create container
    const g = svg
      .append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    // Arc generator for background
    const backgroundArc = d3
      .arc<d3.DefaultArcObject>()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    // Arc generator for score
    const scoreArc = d3
      .arc<d3.DefaultArcObject>()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(scoreAngle);

    // Draw background arc
    g.append("path")
      .datum({ startAngle, endAngle })
      .attr("d", backgroundArc)
      .attr("fill", "#374151")
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2);

    // Draw score arc with gradient
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "gauge-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.8);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", color).attr("stop-opacity", 0.4);

    const scorePath = g
      .append("path")
      .datum({ startAngle, endAngle: scoreAngle })
      .attr("d", scoreArc)
      .attr("fill", "url(#gauge-gradient)")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .style("opacity", 0);

    // Animate score arc
    scorePath
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .style("opacity", 1)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate(d.startAngle, d.endAngle);
        return function (t) {
          d.endAngle = interpolate(t);
          return scoreArc(d) || "";
        };
      });

    // Draw tick marks
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const angle = startAngle + (i / ticks) * angleRange;
      const tickValue = (i / ticks) * 100;
      const tickLength = i % (ticks / 2) === 0 ? 10 : 5;
      const tickRadius = radius - tickLength;

      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * tickRadius;
      const y2 = Math.sin(angle) * tickRadius;

      g.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", "#6b7280")
        .attr("stroke-width", 1);

      // Tick labels
      if (i % (ticks / 2) === 0) {
        const labelRadius = radius - 20;
        g.append("text")
          .attr("x", Math.cos(angle) * labelRadius)
          .attr("y", Math.sin(angle) * labelRadius)
          .attr("text-anchor", "middle")
          .attr("dy", "0.35em")
          .attr("fill", "#9ca3af")
          .style("font-size", "10px")
          .text(tickValue);
      }
    }

    // Needle
    const needleLength = radius * 0.8;
    const needle = g
      .append("g")
      .attr("class", "needle")
      .style("opacity", 0);

    needle
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", -needleLength)
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round");

    // Needle tip
    needle
      .append("circle")
      .attr("cx", 0)
      .attr("cy", -needleLength)
      .attr("r", 4)
      .attr("fill", color);

    // Center hub
    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 8)
      .attr("fill", "#1f2937")
      .attr("stroke", color)
      .attr("stroke-width", 2);

    // Animate needle
    needle
      .transition()
      .delay(1500)
      .duration(800)
      .ease(d3.easeElasticOut)
      .style("opacity", 1)
      .attr("transform", `rotate(${(scoreAngle * 180) / Math.PI})`);

    // Score text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", radius * 0.4)
      .attr("fill", color)
      .style("font-size", "32px")
      .style("font-weight", "bold")
      .text(score)
      .style("opacity", 0)
      .transition()
      .delay(1500)
      .duration(500)
      .style("opacity", 1);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", radius * 0.4 + 25)
      .attr("fill", "#9ca3af")
      .style("font-size", "14px")
      .text(grade)
      .style("opacity", 0)
      .transition()
      .delay(1500)
      .duration(500)
      .style("opacity", 1);
  }, [score, grade, size]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      style={{ background: "transparent" }}
    />
  );
}
