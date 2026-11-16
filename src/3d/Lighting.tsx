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
        <hemisphereLight args={['#e6f4ff', '#3d7a3a', 1.35]} />
        <ambientLight intensity={0.75} color="#ffffff" />
        <directionalLight
          position={[55, 95, 35]}
          intensity={3.2}
          color="#fff9ee"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0004}
          shadow-normalBias={0.04}
          shadow-camera-near={20}
          shadow-camera-far={260}
          shadow-camera-left={-34}
          shadow-camera-right={34}
          shadow-camera-top={34}
          shadow-camera-bottom={-34}
        />
        {/* Fill from opposite side to eliminate dark player shadows */}
        <directionalLight position={[-45, 60, -35]} intensity={1.15} color="#dbeeff" />
        {/* Pitch area local ground fill */}
        <pointLight position={[0, 10, 0]} intensity={2.8} color="#fff6e8" distance={45} decay={1.5} />
      </>
    );
  }

  // Night match: powerful 6-tower stadium floodlighting (2500+ lux broadcast atmosphere)
  return (
    <>
      <hemisphereLight args={['#b8d4ff', '#244824', 0.85]} />
      <ambientLight intensity={0.52} color="#cce0ff" />

      {/* Main key floodlight bank (Tower 35) casting sharp stadium shadows */}
      <directionalLight
        position={towerPosition(35)}
        intensity={2.4}
        color="#fffbf0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-near={20}
        shadow-camera-far={260}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
      />
      {/* Secondary key floodlight bank (Tower 215) for cross-illumination */}
      <directionalLight position={towerPosition(215)} intensity={1.65} color="#e6f0ff" />

      {/* Remaining 4 towers provide balanced 360-degree stadium coverage */}
      <directionalLight position={towerPosition(90)} intensity={1.1} color="#f0f5ff" />
      <directionalLight position={towerPosition(145)} intensity={1.1} color="#fff6e8" />
      <directionalLight position={towerPosition(270)} intensity={1.1} color="#eef4ff" />
      <directionalLight position={towerPosition(325)} intensity={1.1} color="#f5f8ff" />

      {/* Crisp character silhouette rim lighting & pitch illumination */}
      <pointLight position={[0, 12, -12]} intensity={22} color="#a5d8ff" distance={38} decay={1.4} />
      <pointLight position={[0, 12, 12]} intensity={22} color="#ffe8c0" distance={38} decay={1.4} />
      <pointLight position={[0, 9, 0]} intensity={14} color="#ffffff" distance={30} decay={1.4} />
    </>
  );
}

export default Lighting;
