// Commit Timeline - 3D bars showing commit activity over time
// X → time (weeks), Y → total commits, Z → repository

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";

interface CommitData {
  week: number;
  totalCommits: number;
  repoName: string;
}

interface CommitTimelineProps {
  timeline: CommitData[];
  repos: string[];
}

function CommitBar({
  position,
  height,
  color,
}: {
  position: [number, number, number];
  height: number;
  color: string;
}) {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Subtle animation
      meshRef.current.scale.y = height;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.8, height, 0.8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

export function CommitTimeline({ timeline, repos }: CommitTimelineProps) {
  // Normalize data for visualization
  const maxCommits = useMemo(
    () => Math.max(...timeline.map((d) => d.totalCommits), 1),
    [timeline]
  );

  const repoIndexMap = useMemo(
    () => new Map(repos.map((repo, i) => [repo, i])),
    [repos]
  );

  const bars = useMemo(() => {
    return timeline.map((data, index) => {
      const normalizedHeight = (data.totalCommits / maxCommits) * 5;
      const zIndex = repoIndexMap.get(data.repoName) || 0;
      const x = (index / timeline.length) * 20 - 10; // Spread across X axis
      const z = (zIndex / repos.length) * 10 - 5; // Spread across Z axis
      const y = normalizedHeight / 2; // Height from ground

      // Color based on commit count
      const intensity = data.totalCommits / maxCommits;
      const color = `hsl(${120 + intensity * 60}, 70%, 50%)`;

      return {
        position: [x, y, z] as [number, number, number],
        height: normalizedHeight,
        color,
        commits: data.totalCommits,
      };
    });
  }, [timeline, maxCommits, repoIndexMap, repos.length]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} />

      {bars.map((bar, index) => (
        <CommitBar
          key={index}
          position={bar.position}
          height={bar.height}
          color={bar.color}
        />
      ))}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[25, 15]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.3} />
      </mesh>
    </>
  );
}
