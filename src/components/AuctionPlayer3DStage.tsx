import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { CharacterInstance } from '../characters/CharacterInstance';
import { heightCmFor, heightScale } from '../characters/playerAppearance';
import { jerseyNameFor, jerseyNumberFor } from '../characters/teamKits';
import PerformanceGovernor from '../3d/PerformanceGovernor';
import { Player } from '../types/common';

const LIGHT_MODEL = '/models/cricket-arena/cartoon_character_3d_model.glb';

// Start downloading the auction model as soon as this screen's chunk is loaded.
useGLTF.preload(LIGHT_MODEL);

function LoadingPlayer() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow={false}>
        <cylinderGeometry args={[0.24, 0.3, 0.9, 12]} />
        <meshStandardMaterial color="#8ba6c9" roughness={0.85} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 1.34, 0]} castShadow={false}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color="#c6d4e8" roughness={0.8} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export default function AuctionPlayer3DStage({
  player,
  team,
}: {
  player: Player;
  team: string;
}) {
  const playerHeight = heightScale(heightCmFor(player.name, player.role));

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Canvas
        frameloop="demand"
        dpr={[0.8, 1.15]}
        camera={{ position: [0, 1.25, 4.0], fov: 32 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <PerformanceGovernor targetFPS={30} />
        <color attach="background" args={['#0b1730']} />
        <hemisphereLight args={['#e4efff', '#263a58', 1.35]} />
        <ambientLight intensity={0.45} color="#ffffff" />
        <directionalLight position={[2.8, 4.5, 3.5]} intensity={2.0} color="#fff2d4" />
        <directionalLight position={[-3, 2.6, -2.5]} intensity={1.1} color="#7db8ff" />
        <pointLight position={[0, 2.8, 1.8]} intensity={1.8} color="#ffd36a" distance={5} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.075, 0]}>
          <circleGeometry args={[1.18, 48]} />
          <meshStandardMaterial color="#173d78" metalness={0.45} roughness={0.38} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
          <torusGeometry args={[1.08, 0.035, 8, 64]} />
          <meshBasicMaterial color="#f5bd42" toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
          <circleGeometry args={[1.5, 48]} />
          <meshBasicMaterial color="#091226" />
        </mesh>

        <Suspense fallback={<LoadingPlayer />}>
          <CharacterInstance
            modelUrl={LIGHT_MODEL}
            position={[0, 0]}
            yaw={Math.PI / 2}
            action="idle"
            progress={0}
            heightScale={playerHeight}
            team={team || 'India'}
            format="T20"
            kitRole="fielder"
            jerseyNumber={jerseyNumberFor(player.name)}
            jerseyName={jerseyNameFor(player.name)}
            updateFps={12}
            trackBall={false}
            castShadow={false}
          />
        </Suspense>

        <OrbitControls
          target={[0, 0.92, 0]}
          enableRotate={false}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#071426] via-[#071426]/45 to-transparent" />
    </div>
  );
}
