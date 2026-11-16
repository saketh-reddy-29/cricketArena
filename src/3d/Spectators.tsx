import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface TierSpec { rb: number; rt: number; y0: number; h: number; rows: number }

const BODY_COLORS = ['#1b4fc0', '#d98e12', '#d8dbe6', '#b02a30', '#2a8fb8', '#c9b018', '#5b3aa8', '#17804b', '#d96a16', '#232b4a', '#e8e8f0', '#8a1f6a'];
const SKIN = ['#e0a98a', '#c68863', '#8a5a3c', '#5a3a26', '#f1c9a8'];

function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/**
 * Individual 3D spectators (instanced) seated on the stand slopes. Each one bobs a little; `energy`
 * (0..1) makes the whole crowd jump - driven by fours, sixes and wickets.
 */
export function Spectators({ tiers, energy = 0.2 }: { tiers: TierSpec[]; energy?: number }) {
  const body = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  const uniforms = useRef({ uTime: { value: 0 }, uEnergy: { value: energy } });

  const placements = useMemo(() => {
    const r = rng(99);
    const list: { x: number; y: number; z: number; bc: THREE.Color; hc: THREE.Color; s: number }[] = [];
    tiers.forEach((t, ti) => {
      const circ = 2 * Math.PI * ((t.rb + t.rt) / 2);
      const per = Math.floor(circ / 0.95);
      for (let k = 0; k < t.rows; k++) {
        const f = (k + 0.6) / t.rows;
        const rad = t.rb + (t.rt - t.rb) * f - 0.1;
        const y = t.y0 + t.h * f;
        const off = r() * Math.PI * 2;
        for (let i = 0; i < per; i++) {
          if (i % 48 > 44) continue;                       // aisles
          if (r() < 0.07) continue;                        // empty seats
          const a = off + (i / per) * Math.PI * 2 + (r() - 0.5) * 0.004;
          list.push({
            x: Math.sin(a) * rad, y, z: Math.cos(a) * rad,
            bc: new THREE.Color(BODY_COLORS[Math.floor(r() * BODY_COLORS.length)]).multiplyScalar(0.8 + r() * 0.3),
            hc: new THREE.Color(SKIN[Math.floor(r() * SKIN.length)]),
            s: 0.9 + r() * 0.22,
          });
        }
      }
      void ti;
    });
    return list;
  }, [tiers]);

  useEffect(() => {
    const o = new THREE.Object3D();
    placements.forEach((p, i) => {
      o.position.set(p.x, p.y, p.z); o.scale.setScalar(p.s); o.rotation.set(0, 0, 0); o.updateMatrix();
      body.current?.setMatrixAt(i, o.matrix); head.current?.setMatrixAt(i, o.matrix);
      body.current?.setColorAt(i, p.bc); head.current?.setColorAt(i, p.hc);
    });
    [body.current, head.current].forEach((m) => { if (m) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } });
  }, [placements]);

  const patch = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uTime = uniforms.current.uTime;
    shader.uniforms.uEnergy = uniforms.current.uEnergy;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uEnergy;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
        transformed.y += abs(sin(uTime * (3.0 + 5.0 * uEnergy) + ph)) * (0.03 + 0.30 * uEnergy);`);
  };

  useFrame((_, dt) => {
    uniforms.current.uTime.value += dt;
    uniforms.current.uEnergy.value += (energy - uniforms.current.uEnergy.value) * Math.min(1, dt * 3);
    const probe = (globalThis as { __arenaProbe?: { energy?: number[] } }).__arenaProbe;
    if (probe?.energy) probe.energy.push(uniforms.current.uEnergy.value);
  });

  return (
    <group>
      <instancedMesh ref={body} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, placements.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.26, 0.3, 0.7, 6]} />
        <meshStandardMaterial roughness={0.9} emissive="#ffffff" emissiveIntensity={0.06} onBeforeCompile={patch} customProgramCacheKey={() => 'crowdBody'} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, placements.length]} frustumCulled={false} position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.17, 6, 5]} />
        <meshStandardMaterial roughness={0.8} onBeforeCompile={patch} customProgramCacheKey={() => 'crowdHead'} />
      </instancedMesh>
    </group>
  );
}

export default Spectators;
