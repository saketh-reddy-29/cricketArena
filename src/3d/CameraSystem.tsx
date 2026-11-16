import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

export type CameraViewMode =
  | 'EA_BATTER'   // behind the striker, raised (reference view)
  | 'BROADCAST'   // high TV angle behind the bowler's arm
  | 'BOWLER_CAM'  // behind the bowler, run-up view
  | 'SIDE_ON'     // side-on batting camera
  | 'ACTION_CAM'  // chases the ball
  | 'DRONE'       // orbiting drone over the whole ground
  | 'ORBIT';      // free orbit (mouse)

export const CAMERA_LABELS: Record<CameraViewMode, string> = {
  EA_BATTER: 'Batter', BROADCAST: 'TV', BOWLER_CAM: 'Bowler', SIDE_ON: 'Side', ACTION_CAM: 'Action', DRONE: 'Drone', ORBIT: 'Orbit',
};

/** Default gameplay camera: behind and above the striker, offset slightly so the keeper never blocks the pitch. */
export const EA_CAM_POS: [number, number, number] = [2.0, 3.8, 18.0];
export const EA_CAM_FOV = 52;

export interface CameraSystemProps {
  mode?: CameraViewMode;
  ballPos?: [number, number, number];
  strikerPos?: [number, number];
  bowlerPos?: [number, number];
  isBallTravelling?: boolean;
  /** World (x,z) the camera should follow, e.g. a batter walking on/off after a wicket */
  focus?: [number, number] | null;
}

export function CameraSystem({
  mode = 'EA_BATTER',
  ballPos = [0, 0.18, 0],
  strikerPos = [0, 8.84],
  bowlerPos = [0, -8.84],
  isBallTravelling = false,
  focus = null,
}: CameraSystemProps) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.15, -10));
  const droneAngle = useRef(Math.PI * 0.85);
  const clock = useRef(0);
  const tmpPos = useRef(new THREE.Vector3());
  const tmpLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (mode === 'ORBIT') return;
    clock.current += delta;
    const k = Math.min(1, delta * 4.5);
    const pos = tmpPos.current;
    const tgt = tmpLook.current;
    let fov = 50;
    let follow = 1;

    switch (mode) {
      case 'EA_BATTER': {
        pos.set(...EA_CAM_POS);
        // Look directly down the pitch towards the bowler's crease and stumps
        tgt.set(0, 1.2, -9.5);
        fov = EA_CAM_FOV;
        if (focus) {
          pos.set(focus[0] * 0.4 + 2.0, 4.2, 18.0 + Math.abs(focus[0]) * 0.12);
          tgt.set(focus[0] * 0.85, 1.1, focus[1] * 0.6);
        } else if (isBallTravelling && ballPos) {
          tgt.set(ballPos[0] * 0.45, Math.max(0.7, ballPos[1] * 0.35), THREE.MathUtils.lerp(-10, ballPos[2], 0.5));
          pos.x = THREE.MathUtils.lerp(pos.x, ballPos[0] * 0.15, 0.35);
        }
        break;
      }
      case 'BROADCAST':
        pos.set(-8.5, 14.5, -30);
        tgt.set(0, 1.15, 5);
        fov = 42;
        if (isBallTravelling && ballPos) {
          tgt.set(ballPos[0] * 0.65, ballPos[1] * 0.45, ballPos[2] * 0.65);
        }
        break;
      case 'BOWLER_CAM':
        pos.set(-1.8, 4.3, -22.5); tgt.set(strikerPos[0], 1.1, strikerPos[1]); fov = 46;
        break;
      case 'SIDE_ON':
        pos.set(30, 3.4, 4); tgt.set(0, 1.1, 2); fov = 42;
        break;
      case 'ACTION_CAM':
        if (ballPos) {
          pos.set(ballPos[0] - 5, ballPos[1] + 3.2, ballPos[2] + 7);
          tgt.set(ballPos[0], ballPos[1], ballPos[2]);
        }
        fov = 55; follow = 1.6;
        break;
      case 'DRONE': {
        // Slow orbit around the whole ground, high enough to see the pitch, field and stands
        droneAngle.current += delta * 0.11;
        const a = droneAngle.current;
        const r = 58 + Math.sin(clock.current * 0.2) * 6;
        const h = 34 + Math.sin(clock.current * 0.35) * 5;
        pos.set(Math.sin(a) * r, h, Math.cos(a) * r);
        tgt.set(0, 1.0, 0);
        if (isBallTravelling && ballPos) tgt.set(ballPos[0] * 0.6, 0.5, ballPos[2] * 0.6);
        fov = 52;
        break;
      }
    }

    camera.position.lerp(pos, Math.min(1, k * follow));
    look.current.lerp(tgt, Math.min(1, k * follow * 1.2));
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * Math.min(1, delta * 3); cam.updateProjectionMatrix(); }
    camera.lookAt(look.current);
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={EA_CAM_POS} fov={EA_CAM_FOV} near={0.1} far={900} />
      {mode === 'ORBIT' && (
        <OrbitControls makeDefault target={[0, 1.0, 0]} minDistance={3} maxDistance={200} maxPolarAngle={Math.PI / 2.02} enablePan />
      )}
    </>
  );
}

export default CameraSystem;
