// Bus Factor Donut - 3D donut chart showing bus factor risk

import { useMemo } from "react";

interface BusFactorDonutProps {
  risk: "LOW" | "MEDIUM" | "HIGH";
  topContributorRatio: number;
  size?: number;
}

export function BusFactorDonut({
  risk,
  topContributorRatio,
  size = 2,
}: BusFactorDonutProps) {
  const color = useMemo(() => {
    switch (risk) {
      case "HIGH":
        return "#ef4444"; // red
      case "MEDIUM":
        return "#f59e0b"; // orange
      case "LOW":
        return "#10b981"; // green
      default:
        return "#6b7280";
    }
  }, [risk]);

  // Create donut geometry
  const segments = 64;
  const innerRadius = size * 0.6;
  const outerRadius = size;
  const radius = (innerRadius + outerRadius) / 2;
  const tubeRadius = (outerRadius - innerRadius) / 2;

  return (
    <group>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />

      {/* Outer ring (full circle) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, tubeRadius, 16, segments]} />
        <meshStandardMaterial
          color="#374151"
          emissive="#1f2937"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Risk indicator (colored segment) - simplified version */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, tubeRadius, 16, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={topContributorRatio}
        />
      </mesh>

      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[innerRadius * 0.8, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
