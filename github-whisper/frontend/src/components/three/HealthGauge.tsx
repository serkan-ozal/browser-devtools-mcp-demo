// Health Score Gauge - 3D speedometer showing repository health

import { useMemo } from "react";

interface HealthGaugeProps {
  score: number; // 0-100
  grade: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  size?: number;
}

export function HealthGauge({
  score,
  grade,
  size = 2,
}: HealthGaugeProps) {
  const color = useMemo(() => {
    switch (grade) {
      case "EXCELLENT":
        return "#10b981"; // green
      case "GOOD":
        return "#3b82f6"; // blue
      case "FAIR":
        return "#f59e0b"; // orange
      case "POOR":
        return "#ef4444"; // red
      default:
        return "#6b7280";
    }
  }, [grade]);

  // Convert score (0-100) to angle (0 to 180 degrees for half circle)
  const angle = (score / 100) * Math.PI; // 0 to π radians

  return (
    <group>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />

      {/* Base gauge ring (full circle) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.7, size * 0.15, 16, 64]} />
        <meshStandardMaterial
          color="#374151"
          emissive="#1f2937"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Score indicator (colored segment) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 0.7, size * 0.15, 16, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={score / 100}
        />
      </mesh>

      {/* Needle */}
      <mesh
        rotation={[0, 0, Math.PI + angle]}
        position={[0, 0, 0]}
      >
        <boxGeometry args={[size * 0.6, 0.05, 0.05]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Center hub */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}
