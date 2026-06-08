'use client';

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';

type TubeColor = 'rose' | 'sky' | 'amber' | 'emerald';
type Tube = TubeColor[];
type DragState = {
  sourceIndex: number;
  pointerX: number;
  pointerY: number;
};
type PourState = {
  sourceIndex: number;
  targetIndex: number;
  color: TubeColor;
  amount: number;
  progress: number;
};

const WORLD_X = [-4.35, -2.61, -0.87, 0.87, 2.61, 4.35];
const STAGE_WIDTH = 740;
const STAGE_HEIGHT = 380;
const SLOT_HEIGHT = 0.48;
const TUBE_RADIUS = 0.34;

const COLOR_MAP: Record<TubeColor, string> = {
  rose: '#ef5da8',
  sky: '#32b6ef',
  amber: '#ffac2f',
  emerald: '#29c39a',
};

function getDisplayTubes(tubes: Tube[], pour: PourState | null) {
  if (!pour) {
    return tubes.map((tube) => tube.map((color) => ({ color, fill: 1 })));
  }

  return tubes.map((tube, index) => {
    const segments = tube.map((color) => ({ color, fill: 1 }));

    if (index === pour.sourceIndex) {
      for (let moved = 0; moved < pour.amount; moved += 1) {
        const segment = segments[segments.length - 1 - moved];
        if (segment) {
          segment.fill = Math.max(0.08, 1 - pour.progress);
        }
      }
    }

    if (index === pour.targetIndex) {
      for (let moved = 0; moved < pour.amount; moved += 1) {
        segments.push({ color: pour.color, fill: Math.max(0.08, pour.progress) });
      }
    }

    return segments;
  });
}

export function LiquidSortScene({
  tubes,
  dragState,
  hoverTarget,
  pourState,
}: {
  tubes: Tube[];
  dragState: DragState | null;
  hoverTarget: number | null;
  pourState: PourState | null;
}) {
  const displayTubes = useMemo(() => getDisplayTubes(tubes, pourState), [tubes, pourState]);

  return (
    <Canvas orthographic camera={{ position: [0, 0, 12], zoom: 72 }}>
      <color attach="background" args={['#eef7ff']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 8]} intensity={1.4} />
      <pointLight position={[-4, 3, 5]} intensity={0.45} color="#d8f1ff" />

      <mesh position={[0, -0.1, -1]}>
        <boxGeometry args={[11.5, 5.2, 0.4]} />
        <meshStandardMaterial color="#edf6ff" transparent opacity={0.98} />
      </mesh>

      {displayTubes.map((tube, index) => {
        const isDragging = dragState?.sourceIndex === index;
        const isPouring = pourState?.sourceIndex === index;
        const progress = pourState?.progress || 0;
        const baseX = WORLD_X[index];
        const dragX = dragState ? ((dragState.pointerX / STAGE_WIDTH) - 0.5) * 12 : baseX;
        const dragY = dragState ? -((dragState.pointerY / STAGE_HEIGHT) - 0.5) * 7 + 0.3 : 0;
        const targetX = pourState ? WORLD_X[pourState.targetIndex] - 0.55 : baseX;
        const x = isDragging ? dragX : isPouring ? baseX + (targetX - baseX) * Math.min(progress, 0.75) : baseX;
        const y = isDragging ? dragY : isPouring ? 1.2 * Math.sin(progress * Math.PI) + 0.5 : 0;
        const rotation = isDragging ? -0.14 : isPouring ? -0.62 * Math.sin(Math.min(progress, 0.9) * Math.PI) : 0;
        const emphasize = hoverTarget === index && dragState && dragState.sourceIndex !== index;

        return (
          <group key={index} position={[x, y, 0]} rotation={[0, 0, rotation]}>
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 3.95, 48, 1, true]} />
              <meshPhysicalMaterial color="#ffffff" metalness={0.04} roughness={0.08} transmission={0.72} transparent opacity={0.34} thickness={0.65} />
            </mesh>
            <mesh position={[0, 1.91, 0]}>
              <torusGeometry args={[0.53, 0.07, 16, 80]} />
              <meshStandardMaterial color={emphasize ? '#7dd3fc' : '#ffffff'} metalness={0.14} roughness={0.22} />
            </mesh>
            <mesh position={[0, -2.06, 0]}>
              <cylinderGeometry args={[0.56, 0.56, 0.1, 48]} />
              <meshStandardMaterial color="#ffffff" metalness={0.08} roughness={0.18} />
            </mesh>

            {tube.map((segment, segmentIndex) => (
              <group key={`${index}-${segmentIndex}-${segment.color}-${segment.fill}`} position={[0, -1.78 + segmentIndex * SLOT_HEIGHT + segment.fill * SLOT_HEIGHT * 0.5, 0]}>
                <mesh>
                  <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, Math.max(0.08, SLOT_HEIGHT * segment.fill), 32]} />
                  <meshStandardMaterial color={COLOR_MAP[segment.color]} roughness={0.2} metalness={0.04} emissive={COLOR_MAP[segment.color]} emissiveIntensity={0.12} />
                </mesh>
              </group>
            ))}

            <mesh position={[0, 0.98, 0.02]}>
              <planeGeometry args={[0.68, 3.25]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.16} />
            </mesh>
          </group>
        );
      })}
    </Canvas>
  );
}
