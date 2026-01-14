import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Mesh } from "three";

interface RepoData {
  name: string;
  stars: number;
  forks: number;
  contributors: number;
  inactive: boolean;
  position?: [number, number, number]; // Optional, will be calculated in component
}

interface RepoGalaxyProps {
  repos: RepoData[];
  onRepoClick?: (repoName: string) => void;
  onRepoHover?: (repoName: string | null) => void;
  onResetCameraReady?: (resetFn: () => void) => void;
  selectedRepo?: string | null;
}

// Calculate sphere size based on stars
function getSphereSize(stars: number): number {
  return Math.max(0.2, Math.min(1.5, Math.log10(stars + 1) * 0.5));
}

function RepoSphere({
  repo,
  onClick,
  onHover,
  isSelected = false,
}: {
  repo: RepoData;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  isSelected?: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const size = getSphereSize(repo.stars);
  const opacity = repo.inactive ? 0.4 : 1;

  // If this sphere was selected before but no longer is, close its tooltip/hover state.
  // This ensures selecting another node closes the previous tooltip.
  useEffect(() => {
    if (!isSelected) {
      setTooltipHovered(false);
      setHovered(false);
      onHover?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected]);

  useFrame(() => {
    if (meshRef.current) {
      // Subtle rotation
      meshRef.current.rotation.y += 0.001;
    }
  });

  const handlePointerOver = () => {
    // Don't stop native propagation; OrbitControls also listens to DOM events.
    document.body.style.cursor = "pointer";
    setHovered(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    // Don't stop native propagation; OrbitControls also listens to DOM events.
    document.body.style.cursor = "auto";
    // Only hide if tooltip is not being hovered
    if (!tooltipHovered && !isSelected) {
      setHovered(false);
      onHover?.(false);
    }
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    // Don't stop propagation - let OrbitControls handle drag
    // Only store position to detect if it's a click vs drag
    pointerDownPos.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
    };
    isDragging.current = false;
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    // If pointer moved significantly, it's a drag - don't stop propagation
    if (pointerDownPos.current) {
      const dx = Math.abs(e.nativeEvent.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.nativeEvent.clientY - pointerDownPos.current.y);
      if (dx > 3 || dy > 3) {
        isDragging.current = true;
      }
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    // Trigger click only if it wasn't a drag.
    // IMPORTANT: don't stop native propagation here; otherwise OrbitControls may
    // miss the pointerup and behave like mouse is still pressed.
    if (pointerDownPos.current && !isDragging.current) {
      const dx = Math.abs(e.nativeEvent.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.nativeEvent.clientY - pointerDownPos.current.y);
      if (dx < 5 && dy < 5) {
        onClick?.();
      }
    }
    pointerDownPos.current = null;
    isDragging.current = false;
  };

  const handlePointerMissed = () => {
    // Reset cursor when clicking on empty space
    document.body.style.cursor = "auto";
  };

  const showTooltip = hovered || tooltipHovered;
  const showTooltipPinned = showTooltip || isSelected;

  return (
    <group position={repo.position}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerMissed={handlePointerMissed}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={
            isSelected
              ? "#60a5fa"
              : repo.inactive
              ? "#666"
              : hovered
              ? "#818cf8"
              : "#4f46e5"
          }
          emissive={
            isSelected
              ? "#3b82f6"
              : repo.inactive
              ? "#000"
              : hovered
              ? "#6366f1"
              : "#312e81"
          }
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.2}
          transparent
          opacity={opacity}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>

      {/* Selection outline ring */}
      {isSelected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => e.stopPropagation()}
          onPointerOver={(e) => e.stopPropagation()}
        >
          <ringGeometry args={[size + 0.2, size + 0.3, 32]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.8}
            side={2} // DoubleSide
          />
        </mesh>
      )}

      {/* Hover outline ring */}
      {hovered && !isSelected && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => e.stopPropagation()}
          onPointerOver={(e) => e.stopPropagation()}
        >
          <ringGeometry args={[size + 0.15, size + 0.25, 32]} />
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.6}
            side={2} // DoubleSide
          />
        </mesh>
      )}

      {/* Tooltip - 2D fixed position, always facing camera */}
      {showTooltipPinned && (
        <Html
          position={[size + 0.3, size + 0.3, 0]}
          distanceFactor={10}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
          transform={false}
          occlude={false}
          center
          sprite
        >
          <div
            className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 whitespace-nowrap z-50"
            style={{
              transform: "translate(-50%, -100%)",
              marginTop: "-4px",
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setTooltipHovered(true);
              setHovered(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setTooltipHovered(false);
              // If selected, keep tooltip visible even when mouse leaves it
              if (!isSelected) {
                setHovered(false);
                onHover?.(false);
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="font-semibold text-indigo-400">{repo.name}</div>
            <div className="text-gray-400 mt-1">
              ⭐ {repo.stars} | 🍴 {repo.forks} | 👥 {repo.contributors}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Deterministic hash function to generate consistent pseudo-random values
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Convert hash to 0-1 range
function hashToFloat(hash: number): number {
  return (hash % 10000) / 10000;
}

export function RepoGalaxy({
  repos,
  onRepoClick,
  onRepoHover,
  onResetCameraReady,
  selectedRepo,
}: RepoGalaxyProps) {
  // Distribute repos in 3D space using spherical distribution - centered around origin
  const distributedRepos = useMemo(() => {
    if (repos.length === 0) return [];

    // Much smaller radius range for centered distribution
    const baseRadius = 3;
    const radiusVariation = 2;

    return repos.map((repo, index) => {
      // Spherical distribution
      const phi = Math.acos(-1 + (2 * index) / repos.length);
      const theta = Math.sqrt(repos.length * Math.PI) * phi;

      // Use deterministic hash based on repo name
      const hash = hashString(repo.name);
      const randomValue = hashToFloat(hash);
      // Smaller radius for centered distribution
      const radius = baseRadius + randomValue * radiusVariation;

      // Position around origin (0, 0, 0) - centered
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      return {
        ...repo,
        position: [x, y, z] as [number, number, number],
      };
    });
  }, [repos]);

  const { camera } = useThree();

  const resetCamera = useCallback(() => {
    // Kamerayı tam ortaya konumlandır
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
    // Only reset camera on initial load or when repos change
    // Don't include camera in dependencies - OrbitControls updates it constantly
    if (repos.length > 0) {
      resetCamera();
    }
    // Expose reset function to parent (but don't call it)
    onResetCameraReady?.(resetCamera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos.length]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.4} />

      {distributedRepos.map((repo) => (
        <RepoSphere
          key={repo.name}
          repo={repo}
          onClick={() => onRepoClick?.(repo.name)}
          onHover={(hovered) => onRepoHover?.(hovered ? repo.name : null)}
          isSelected={selectedRepo === repo.name}
        />
      ))}
    </>
  );
}
