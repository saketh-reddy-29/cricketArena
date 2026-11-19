import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

/** The match renderer intentionally exposes only the two requested ground views. */
export type CameraViewMode = 'ORBIT' | 'DRONE';

export const CAMERA_LABELS: Record<CameraViewMode, string> = {
  ORBIT: 'Orbit View',
  DRONE: 'Drone View',
};

export const EA_CAM_POS: [number, number, number] = [2.0, 3.8, 18.0];
export const EA_CAM_FOV = 52;

export interface CameraSystemProps {
  mode?: CameraViewMode;
  ballPos?: [number, number, number];
  strikerPos?: [number, number];
  bowlerPos?: [number, number];
  isBallTravelling?: boolean;
  focus?: [number, number] | null;
}

export function CameraSystem({
  mode = 'ORBIT',
  ballPos = [0, 0.18, 0],
  isBallTravelling = false,
}: CameraSystemProps) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.0, 0));
  const droneAngle = useRef(Math.PI * 0.85);
  const clock = useRef(0);
  const tmpPos = useRef(new THREE.Vector3());
  const tmpLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (mode !== 'DRONE') return;
    clock.current += delta;
    droneAngle.current += delta * 0.075;
    const angle = droneAngle.current;
    const radius = 64;
    const height = 38;
    const position = tmpPos.current.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    const target = tmpLook.current.set(0, 1.0, 0);
    if (isBallTravelling) {
      target.set(ballPos[0] * 0.35, Math.max(0.5, ballPos[1] * 0.2), ballPos[2] * 0.35);
    }
    const easing = Math.min(1, delta * 2.8);
    camera.position.lerp(position, easing);
    look.current.lerp(target, easing);
    camera.lookAt(look.current);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={EA_CAM_POS} fov={EA_CAM_FOV} near={0.1} far={900} />
      {mode === 'ORBIT' && (
        <OrbitControls
          makeDefault
          target={[0, 1.0, 0]}
          minDistance={20}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2.02}
          minPolarAngle={0.12}
          enablePan
          enableDamping
          dampingFactor={0.08}
        />
      )}
    </>
  );
}

export default CameraSystem;
