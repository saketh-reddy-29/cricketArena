import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface BallVisualProps {
  position: [number, number, number];
  visible: boolean;
  scale?: number;
  spinVelocity?: number;
  isHitFlash?: boolean;
  /** spin axis tilt (rad about the travel axis) and rate (rad/s): fast = upright seam backspin, spin = tilted axis, faster */
  spinTilt?: number;
  /** 0..1 squash when the ball is on the pitch */
  squash?: number;
  /** world position the ball is drawn towards (the bat blade), and how strongly (0..1) */
  attractTo?: React.MutableRefObject<THREE.Vector3 | null>;
  attract?: number;
}

export function BallVisual({
  position,
  visible,
  scale = 1.0,
  spinVelocity = 8.0,
  isHitFlash = false,
  spinTilt = 0,
  squash = 0,
  attractTo,
  attract = 0,
}: BallVisualProps) {
  const ballGroupRef = useRef<THREE.Group>(null);
  const flashMeshRef = useRef<THREE.Mesh>(null);
  const axis = useRef(new THREE.Vector3(1, 0, 0));

  useFrame((_, delta) => {
    if (ballGroupRef.current && visible) {
      ballGroupRef.current.position.set(position[0], position[1], position[2]);
      // Bat contact: draw the ball onto the bat blade so contact is visible, then release it along its path
      if (attract > 0 && attractTo?.current) ballGroupRef.current.position.lerp(attractTo.current, Math.min(1, attract));
      const probe = (globalThis as { __arenaProbe?: { rec?: unknown[] } }).__arenaProbe;
      if (probe?.rec) probe.rec.push({ t: performance.now(), raw: position, drawn: ballGroupRef.current.position.toArray(), bat: attractTo?.current?.toArray() ?? null, attract });
      // Spin about an axis perpendicular to travel (seam stays visible), tilted for spinners
      axis.current.set(Math.cos(spinTilt), 0, Math.sin(spinTilt)).normalize();
      ballGroupRef.current.rotateOnAxis(axis.current, delta * spinVelocity);
      ballGroupRef.current.scale.set(0.16 * scale * (1 + 0.1 * squash), 0.16 * scale * (1 - 0.2 * squash), 0.16 * scale * (1 + 0.1 * squash));
    }

    if (flashMeshRef.current) {
      if (isHitFlash) {
        flashMeshRef.current.visible = true;
        (flashMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
        flashMeshRef.current.scale.setScalar(2.2);
      } else if (flashMeshRef.current.visible) {
        const mat = flashMeshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity *= 0.75;
        if (mat.opacity < 0.05) flashMeshRef.current.visible = false;
      }
    }
  });

  // Authentic white stitched seam geometry
  const seamGeometry = useMemo(() => new THREE.TorusGeometry(0.102, 0.008, 8, 32), []);

  if (!visible) return null;

  return (
    <group ref={ballGroupRef} scale={0.16 * scale}>
      {/* Red leather cricket ball sphere */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.1, 24, 20]} />
        <meshStandardMaterial
          color="#b91c1c"
          roughness={0.3}
          metalness={0.15}
          emissive="#3b0707"
        />
      </mesh>

      {/* White seam ring */}
      <mesh geometry={seamGeometry} rotation={[0, Math.PI / 2, 0]}>
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Bat contact impact flash */}
      <mesh ref={flashMeshRef} visible={false}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default BallVisual;
