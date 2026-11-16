import React from 'react';

/** Floodlight tower positions (shared with Stadium so lamps and light sources agree). */
export const TOWER_ANGLES_DEG = [35, 90, 145, 215, 270, 325];
export const TOWER_RADIUS = 128;
export const TOWER_HEIGHT = 62;

export function towerPosition(deg: number): [number, number, number] {
  const a = (deg * Math.PI) / 180;
  return [Math.sin(a) * TOWER_RADIUS, TOWER_HEIGHT, Math.cos(a) * TOWER_RADIUS];
}

export function Lighting({ night = true }: { night?: boolean }) {
  if (!night) {
    // Day match: one strong sun (with shadows) + bright sky fill, floodlights off
    return (
      <>
        <hemisphereLight args={['#dff0ff', '#4b7a3a', 1.15]} />
        <ambientLight intensity={0.55} color="#fff6e8" />
        <directionalLight
          position={[60, 90, 40]} intensity={2.6} color="#fff3d6" castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} shadow-normalBias={0.04}
          shadow-camera-near={20} shadow-camera-far={260}
          shadow-camera-left={-34} shadow-camera-right={34} shadow-camera-top={34} shadow-camera-bottom={-34}
        />
      </>
    );
  }
  const k = 1;
  return (
    <>
      <hemisphereLight args={[night ? '#b8ceff' : '#cfe6ff', '#254a2a', night ? 0.42 : 1.1]} />
      <ambientLight intensity={night ? 0.24 : 0.5} color="#d9e6ff" />

      {/* Two shadow-casting floodlight banks (opposite corners of the ground) */}
      {[towerPosition(35), towerPosition(215)].map((p, i) => (
        <directionalLight
          key={i}
          position={p}
          intensity={1.35 * k}
          color="#fff7e6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0004}
          shadow-normalBias={0.04}
          shadow-camera-near={20}
          shadow-camera-far={260}
          shadow-camera-left={-34}
          shadow-camera-right={34}
          shadow-camera-top={34}
          shadow-camera-bottom={-34}
        />
      ))}
      {/* Remaining towers fill the ground without shadows (keeps it fast) */}
      {[towerPosition(90), towerPosition(145), towerPosition(270), towerPosition(325)].map((p, i) => (
        <directionalLight key={`f${i}`} position={p} intensity={0.5 * k} color="#f2f7ff" />
      ))}

      {/* Rim lights for crisp character silhouettes */}
      <pointLight position={[0, 8, -14]} intensity={17} color="#a9d8ff" distance={34} decay={1.6} />
      <pointLight position={[0, 8, 14]} intensity={17} color="#ffe8c2" distance={34} decay={1.6} />
    </>
  );
}

export default Lighting;
