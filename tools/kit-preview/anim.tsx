/**
 * Animation test bench (headless-friendly).
 *   film mode : ?mode=film&a=bowl_fast&n=8&from=0&to=1&cam=side     -> filmstrip of one action across its timeline
 *   move mode : ?mode=move&a=sprint&v=5.5&auto=1                      -> character travels at v m/s; logs foot slip
 * Only the public CharacterInstance API is used, so the same bench runs against older commits.
 */
import React, { Suspense, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterInstance } from '../../src/characters/CharacterInstance';

const q = new URLSearchParams(location.search);
const mode = q.get('mode') || 'film';
const action = (q.get('a') || 'idle') as any;
const n = parseInt(q.get('n') || '8');
const from = parseFloat(q.get('from') || '0');
const to = parseFloat(q.get('to') || '1');
const cam = q.get('cam') || 'side';
const left = q.get('left') === '1';
const bat = q.get('bat') === '1';
const yawDeg = parseFloat(q.get('yaw') || '90');
const speed = parseFloat(q.get('v') || '5.5');
const auto = q.get('auto') === '1';
const clockT = parseFloat(q.get('clock') || '1.3');
const MODEL = q.get('model') === 'light'
  ? '/models/cricket-arena/cartoon_character_3d_model.glb'
  : '/models/cricket-arena/cartoon_sports_character_3d_model.glb';
const W = mode === 'film' ? 1800 : 640, H = mode === 'film' ? 560 : 360;

(window as any).__log = '';
const log = (s: string) => { (window as any).__log += s + '\n'; };

function Rig() {
  const { camera } = useThree();
  useFrame(() => {
    const c = camera as THREE.PerspectiveCamera;
    if (mode === 'film') {
      const spacing = 1.55, span = (n - 1) * spacing;
      const dist = Math.max(8, span * 0.95 + 3);
      if (cam === 'front') c.position.set(0, 1.2, -dist); else if (cam === 'top') c.position.set(0, dist, 0.01); else c.position.set(0, 1.15, dist);
      c.lookAt(0, cam === 'top' ? 0 : 0.95, 0);
      c.fov = parseFloat(q.get('fov') || '30'); c.updateProjectionMatrix();
    }
  });
  return null;
}

const STEP = 1 / 50; // simulated 50 Hz: deterministic, independent of how slowly software WebGL renders
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Waits for the GLB to load, then steps the R3F loop manually. */
function useDriver(onFrame: (i: number, t: number) => void, steps: number, t0 = 0) {
  const advance = useThree((s) => s.advance);
  const scene = useThree((s) => s.scene);
  React.useEffect(() => {
    let dead = false;
    (async () => {
      const hasSkin = () => { let c = 0; scene.traverse((o: any) => { if (o.isSkinnedMesh) c++; }); return c; };
      let guard = 0;
      while (!dead && hasSkin() < (mode === 'film' ? n : 1) && guard++ < 600) { advance(0); await sleep(100); }
      for (let i = 0; i <= steps && !dead; i++) {
        const t = t0 + i * STEP;
        onFrame(i, t);
        await sleep(0); // let React commit the new props
        advance(t);
      }
      (window as any).__done = true;
    })();
    return () => { dead = true; };
  }, []);
}

function Film() {
  const spacing = 1.55;
  const prog = (i: number) => (n === 1 ? from : from + ((to - from) * i) / (n - 1));
  const { scene } = useThree();
  useDriver((i) => {
    if (i !== 30 || q.get('probe') !== '1') return;
    const out: Record<string, number[]> = {};
    scene.traverse((o: any) => {
      if (o.isBone && /^(Left|Right)_(Foot|Shoulder|Arm|UpperArm|Hand)$/.test(o.name) && !out[o.name]) out[o.name] = o.getWorldPosition(new THREE.Vector3()).toArray().map((v) => +v.toFixed(3));
    });
    log('PROBE ' + JSON.stringify(out));
  }, 30, clockT);
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <CharacterInstance
          key={i}
          modelUrl={MODEL}
          position={[(i - (n - 1) / 2) * spacing, 0]}
          yaw={(yawDeg * Math.PI) / 180}
          action={action}
          progress={prog(i)}
          hasBat={bat}
          isLeftHanded={left}
          updateFps={60}
          trackBall={false}
          idleSeed={(i * 0.37) % 1}
        />
      ))}
    </>
  );
}

function Move() {
  const [x, setX] = useState(-6);
  const { scene } = useThree();
  const rec = useRef<any[]>([]);
  const feet = useRef<{ L: THREE.Object3D | null; R: THREE.Object3D | null }>({ L: null, R: null });
  const TOTAL = Math.round(6 / STEP);
  useDriver((i, t) => {
    const sim = i * STEP;
    flushSync(() => setX(-6 + speed * sim));
    if (!feet.current.L) {
      feet.current.L = scene.getObjectByName('Left_Foot') || null;
      feet.current.R = scene.getObjectByName('Right_Foot') || null;
    }
    if (feet.current.L && i > 0) {
      const a = new THREE.Vector3(), b = new THREE.Vector3();
      feet.current.L.getWorldPosition(a); feet.current.R!.getWorldPosition(b);
      rec.current.push({ t: sim, L: a.toArray(), R: b.toArray() });
    }
    if (i === TOTAL) {
      const r = rec.current.filter((e) => e.t > 2.0);
      const floorY = Math.min(...r.map((e) => Math.min(e.L[1], e.R[1])));
      // Support foot = the lower foot. It should be stationary on the ground while the body moves over it.
      const slips: number[] = [];
      let airborne = 0, switches = 0, lift = 0;
      for (let k = 1; k < r.length; k++) {
        const dt = r[k].t - r[k - 1].t; if (dt <= 0) continue;
        const s0 = r[k - 1].L[1] <= r[k - 1].R[1] ? 'L' : 'R';
        const s1 = r[k].L[1] <= r[k].R[1] ? 'L' : 'R';
        const low = Math.min(r[k].L[1], r[k].R[1]) - floorY;
        if (low > 0.05) airborne++;
        lift = Math.max(lift, Math.max(r[k].L[1], r[k].R[1]) - floorY);
        if (s0 !== s1 || low > 0.05) { switches++; continue; } // skip foot switches and true flight
        slips.push(Math.hypot(r[k][s1][0] - r[k - 1][s1][0], r[k][s1][2] - r[k - 1][s1][2]) / dt);
      }
      slips.sort((p, q2) => p - q2);
      const mean = slips.reduce((s2, v) => s2 + v, 0) / Math.max(1, slips.length);
      const out = { action, v: speed, auto, frames: r.length, airbornePct: +((airborne / r.length) * 100).toFixed(0), footLiftMax: +lift.toFixed(2), slipMean: +mean.toFixed(2), slipP95: +(slips[Math.floor(slips.length * 0.95)] || 0).toFixed(2), slipPctOfBodySpeed: +((mean / speed) * 100).toFixed(0) };
      log('RESULT ' + JSON.stringify(out));
    }
  }, TOTAL);
  // @ts-ignore: autoLocomotion / smoothMotion only exist on newer builds
  return <CharacterInstance modelUrl={MODEL} position={[x, 0]} yaw={Math.PI / 2} action={action} progress={0} hasBat={bat} updateFps={60} trackBall={false} smoothMotion={auto} autoLocomotion={auto} />;
}

function Scene() {
  const { camera } = useThree();
  if (mode === 'move') { camera.position.set(0, 1.4, 9); camera.lookAt(0, 0.9, 0); }
  else {
    const spacing = 1.55, span = (n - 1) * spacing, dist = Math.max(8, span * 0.95 + 3);
    const c = camera as THREE.PerspectiveCamera;
    if (cam === 'front') c.position.set(0, 1.2, -dist); else if (cam === 'top') c.position.set(0, dist, 0.01); else c.position.set(0, 1.15, dist);
    c.lookAt(0, cam === 'top' ? 0 : 0.95, 0); c.fov = parseFloat(q.get('fov') || '30'); c.updateProjectionMatrix();
  }
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#2f7d3a" /></mesh>
      <gridHelper args={[80, 80, '#1d4d24', '#245a2b']} position={[0, 0.002, 0]} />
      <Suspense fallback={null}>{mode === 'move' ? <Move /> : <Film />}</Suspense>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <div style={{ width: W, height: H }}>
    <Canvas camera={{ fov: 30, position: [0, 1.2, 12] }} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={1} frameloop="never">
      <color attach="background" args={['#0b1220']} />
      <Scene />
    </Canvas>
  </div>
);
