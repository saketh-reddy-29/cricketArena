import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BOUNDARY_M, OUTFIELD_M, PITCH_HALF } from './worldScale';
import { TOWER_ANGLES_DEG, towerPosition } from './Lighting';
import { Spectators } from './Spectators';

export interface StadiumScoreboardData {
  battingTeamName: string;
  bowlingTeamName: string;
  score: { runs: number; wickets: number; overs: number; balls: number };
  target?: number;
  strikerName?: string;
  strikerRuns?: number;
  strikerBalls?: number;
  nonStrikerName?: string;
  nonStrikerRuns?: number;
  nonStrikerBalls?: number;
  bowlerName?: string;
  bowlerWickets?: number;
  bowlerRuns?: number;
  bowlerOvers?: number;
  bowlerBalls?: number;
  recentEvent?: string | null;
  /** Team colours for the boards (defaults to blue / gold) */
  battingColor?: string;
  bowlingColor?: string;
}

/* ------------------------------------------------------------------ procedural textures */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function makeGrass(): THREE.CanvasTexture {
  const S = 2048; // covers +-OUTFIELD_M
  const [c, g] = canvas(S, S);
  const ppm = S / (OUTFIELD_M * 2);
  g.fillStyle = '#2a8433'; g.fillRect(0, 0, S, S);
  const stripe = 5 * ppm;                       // 5 m mowing stripes parallel to the pitch
  for (let x = 0, i = 0; x < S; x += stripe, i++) {
    g.fillStyle = i % 2 ? 'rgba(130,210,90,0.20)' : 'rgba(10,70,25,0.16)';
    g.fillRect(x, 0, stripe, S);
  }
  const r = rng(7);
  for (let i = 0; i < 26000; i++) {             // grass noise
    g.fillStyle = `rgba(${r() > 0.5 ? '200,255,150' : '10,60,20'},${0.03 + r() * 0.05})`;
    g.fillRect(r() * S, r() * S, 2 + r() * 3, 2 + r() * 4);
  }
  // 30-yard circle (dashed)
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 4; g.setLineDash([16, 14]);
  g.beginPath(); g.arc(S / 2, S / 2, 27.4 * ppm, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function makePitch(): THREE.CanvasTexture {
  const W = 256, H = 1024;
  const [c, g] = canvas(W, H);
  const grad = g.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#b99763'); grad.addColorStop(0.5, '#d2b37d'); grad.addColorStop(1, '#b99763');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  const r = rng(3);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? '120,85,50' : '240,215,170'},${0.05 + r() * 0.10})`;
    g.fillRect(r() * W, r() * H, 1 + r() * 4, 1 + r() * 6);
  }
  // wear patches at both ends (good length / footmarks)
  for (const yy of [H * 0.2, H * 0.8]) {
    const rg = g.createRadialGradient(W / 2, yy, 4, W / 2, yy, 70);
    rg.addColorStop(0, 'rgba(110,80,45,0.35)'); rg.addColorStop(1, 'rgba(110,80,45,0)');
    g.fillStyle = rg; g.fillRect(0, yy - 80, W, 160);
  }
  // creases (real dimensions): width 3.05 m, length 20.12 m
  const mx = (m: number) => (m / 3.05) * W;
  const my = (m: number) => (m / 20.12) * H;
  g.strokeStyle = '#f5f5f0'; g.lineWidth = 3;
  for (const end of [0, 1]) {
    const dir = end === 0 ? 1 : -1; const base = end === 0 ? 0 : H;
    const bowl = base + dir * my(0.0);              // stump line is at the very end
    const pop = base + dir * my(1.22);
    g.beginPath(); g.moveTo(0, pop); g.lineTo(W, pop); g.stroke();              // popping crease
    g.beginPath(); g.moveTo(mx(1.525 - 1.32), bowl); g.lineTo(mx(1.525 - 1.32), pop + dir * my(1.0)); g.stroke(); // return creases
    g.beginPath(); g.moveTo(mx(1.525 + 1.32), bowl); g.lineTo(mx(1.525 + 1.32), pop + dir * my(1.0)); g.stroke();
    g.beginPath(); g.moveTo(mx(1.525 - 1.32), bowl + dir * 2); g.lineTo(mx(1.525 + 1.32), bowl + dir * 2); g.stroke();  // bowling crease
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function makeCrowd(seed: number): THREE.CanvasTexture {
  const [c, g] = canvas(2048, 256);
  g.fillStyle = '#10182a'; g.fillRect(0, 0, 2048, 256);
  const r = rng(seed);
  const pal = ['#1b4fc0', '#d98e12', '#c9ccd8', '#b02a30', '#2a8fb8', '#c9b018', '#5b3aa8', '#17804b', '#d96a16', '#101a3a', '#101a3a', '#1a2548', '#1a2548'];
  for (let row = 0; row < 26; row++) {
    const y = 6 + row * 9.6;
    for (let x = 0; x < 2048; x += 6 + r() * 3) {
      const col = pal[Math.floor(r() * pal.length)];
      g.fillStyle = col; g.beginPath(); g.arc(x, y + 3, 3.4, 0, Math.PI * 2); g.fill();           // body
      g.fillStyle = r() > 0.5 ? '#e0a98a' : '#8a5a3c'; g.beginPath(); g.arc(x, y - 2, 2.2, 0, Math.PI * 2); g.fill(); // head
    }
  }
  g.fillStyle = 'rgba(0,0,10,0.28)';   // row shadows
  for (let row = 0; row < 26; row++) g.fillRect(0, 12 + row * 9.6, 2048, 2);
  // soften: spectators should read as a crowd, not as noise
  const [c2, g2] = canvas(2048, 256);
  g2.filter = 'blur(1.1px) saturate(0.85) brightness(0.92)';
  g2.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c2);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}

function makeLedBoard(): THREE.CanvasTexture {
  const [c, g] = canvas(2048, 64);
  const cols = ['#0a1f78', '#1b37c8', '#0b2a8f', '#7a1fa8', '#d6261f', '#0e7d92'];
  const w = 256;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = cols[i % cols.length]; g.fillRect(i * w, 0, w, 64);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = 'italic 900 30px Arial, sans-serif'; g.textAlign = 'center';
    g.fillText('CRICKET ARENA', i * w + w / 2, 42);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(i * w, 0, 3, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(10, 1); t.anisotropy = 8;
  return t;
}

function makeSky(day = false): THREE.CanvasTexture {
  const [c, g] = canvas(32, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  if (day) { gr.addColorStop(0, '#2f78c8'); gr.addColorStop(0.55, '#6fb0ea'); gr.addColorStop(0.9, '#c4e2fa'); gr.addColorStop(1, '#e8f3fc'); }
  else { gr.addColorStop(0, '#020615'); gr.addColorStop(0.55, '#0a1a4a'); gr.addColorStop(0.85, '#1c3a7a'); gr.addColorStop(1, '#2c4f92'); }
  g.fillStyle = gr; g.fillRect(0, 0, 32, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeLamps(): THREE.CanvasTexture {
  const [c, g] = canvas(256, 128);
  g.fillStyle = '#d9e6ff'; g.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) {
    const rg = g.createRadialGradient(10 + x * 21, 11 + y * 21, 1, 10 + x * 21, 11 + y * 21, 10);
    rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, '#b8d0ff');
    g.fillStyle = rg; g.beginPath(); g.arc(10 + x * 21, 11 + y * 21, 9, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ------------------------------------------------------------------ boards */
const code = (n: string) => {
  const m: Record<string, string> = { INDIA: 'IND', AUSTRALIA: 'AUS', ENGLAND: 'ENG', PAKISTAN: 'PAK', 'SOUTH AFRICA': 'SA', 'NEW ZEALAND': 'NZ', 'SRI LANKA': 'SL', BANGLADESH: 'BAN', 'WEST INDIES': 'WI', AFGHANISTAN: 'AFG', ZIMBABWE: 'ZIM', IRELAND: 'IRE', NETHERLANDS: 'NED', NEPAL: 'NEP' };
  const u = (n || '').toUpperCase();
  return m[u] || u.split(' ').map((w) => w[0]).join('').slice(0, 3) || 'TEAM';
};

function drawSide(g: CanvasRenderingContext2D, d: StadiumScoreboardData | undefined, which: 'bat' | 'bowl') {
  const W = 1024, H = 512;
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#06143a'; g.fillRect(0, 0, W, H);
  g.fillStyle = which === 'bat' ? (d?.battingColor || '#1e56c8') : (d?.bowlingColor || '#f2b705');
  g.fillRect(0, 0, W, 14); g.fillRect(0, H - 14, W, 14);
  g.fillStyle = '#ffffff'; g.textAlign = 'left';
  const name = which === 'bat' ? d?.battingTeamName : d?.bowlingTeamName;
  g.font = '900 150px Arial Black, Impact, sans-serif';
  g.fillText(code(name || ''), 60, 175);
  g.font = 'bold 40px Arial, sans-serif'; g.fillStyle = '#9ec2ff';
  g.fillText((name || '').toUpperCase(), 64, 232);
  g.fillStyle = '#ffffff';
  if (which === 'bat') {
    const s = d?.score;
    g.font = '900 150px Arial Black, Impact, sans-serif'; g.textAlign = 'right';
    g.fillText(`${s?.runs ?? 0}/${s?.wickets ?? 0}`, W - 50, 175);
    g.textAlign = 'left'; g.font = 'bold 56px Arial, sans-serif';
    g.fillText('OVERS', 64, 330); g.fillText('RUN RATE', 64, 430);
    g.textAlign = 'right';
    const balls = (s?.overs ?? 0) * 6 + (s?.balls ?? 0);
    g.fillText(`${s?.overs ?? 0}.${s?.balls ?? 0}`, W - 50, 330);
    g.fillText(balls > 0 ? ((s!.runs * 6) / balls).toFixed(2) : '-', W - 50, 430);
  } else {
    g.textAlign = 'left'; g.font = 'bold 60px Arial, sans-serif';
    if (d?.target && d.target > 0) {
      g.fillText('TARGET', 64, 340);
      g.textAlign = 'right'; g.fillStyle = '#ffd23f'; g.font = '900 120px Arial Black, Impact, sans-serif';
      g.fillText(String(d.target), W - 50, 360);
      const need = d.target - (d.score?.runs ?? 0);
      g.textAlign = 'left'; g.fillStyle = '#ffffff'; g.font = 'bold 44px Arial, sans-serif';
      g.fillText(need > 0 ? `NEED ${need} TO WIN` : 'TARGET REACHED', 64, 450);
    } else {
      g.fillText('FIRST INNINGS', 64, 340);
      g.font = 'bold 44px Arial, sans-serif'; g.fillStyle = '#9ec2ff';
      g.fillText('BOWLING', 64, 410);
    }
  }
}

function drawCentre(g: CanvasRenderingContext2D, d: StadiumScoreboardData | undefined) {
  const W = 1024, H = 512;
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, '#0a1a8a'); gr.addColorStop(1, '#2b46d8');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = -H; i < W; i += 70) { g.beginPath(); g.moveTo(i, H); g.lineTo(i + 120, 0); g.lineTo(i + 150, 0); g.lineTo(i + 30, H); g.fill(); }
  g.fillStyle = '#ffffff'; g.textAlign = 'center';
  g.font = 'italic 900 120px Arial Black, Impact, sans-serif';
  g.fillText('CRICKET', W / 2, 150); g.fillText('ARENA', W / 2, 270);
  g.fillStyle = '#ffd23f'; g.fillRect(W / 2 - 220, 292, 440, 8);
  const ev = d?.recentEvent;
  g.fillStyle = ev ? '#ffd23f' : '#cfe0ff'; g.font = 'bold 54px Arial, sans-serif';
  g.fillText(ev ? ev.toUpperCase() : `${code(d?.battingTeamName || '')} v ${code(d?.bowlingTeamName || '')}`, W / 2, 380);
  if (d?.score) {
    g.fillStyle = '#ffffff'; g.font = 'bold 56px Arial, sans-serif';
    g.fillText(`${d.score.runs}/${d.score.wickets}  (${d.score.overs}.${d.score.balls} ov)`, W / 2, 462);
  }
}

/* ------------------------------------------------------------------ component */
function Stumps({ z, hit, refs }: { z: number; hit?: boolean; refs?: React.MutableRefObject<{ g: THREE.Group | null; bails: THREE.Mesh[] }> }) {
  const bail = (x: number, i: number) => (
    <mesh key={i} position={[x, 0.725, 0]} rotation={[0, 0, Math.PI / 2]} castShadow
      ref={(m) => { if (m && refs) refs.current.bails[i] = m; }}>
      <cylinderGeometry args={[0.008, 0.008, 0.11, 8]} />
      <meshStandardMaterial color="#f7e7b0" roughness={0.5} />
    </mesh>
  );
  return (
    <group position={[0, 0, z]} ref={(g) => { if (refs) refs.current.g = g; }}>
      {[-0.1143, 0, 0.1143].map((x, i) => (
        <mesh key={i} position={[x, 0.3555, 0]} castShadow>
          <cylinderGeometry args={[0.0175, 0.0175, 0.711, 10]} />
          <meshStandardMaterial color="#e9d9a8" roughness={0.55} emissive="#3a2f10" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {bail(-0.057, 0)}{bail(0.057, 1)}
    </group>
  );
}

export function Stadium({ scoreboardData, stumpHit = false, isDay = false, crowdEnergy = 0.2 }: { scoreboardData?: StadiumScoreboardData; stumpHit?: boolean; isDay?: boolean; crowdEnergy?: number }) {
  const grass = useMemo(makeGrass, []);
  const pitch = useMemo(makePitch, []);
  const crowdA = useMemo(() => makeCrowd(11), []);
  const crowdB = useMemo(() => makeCrowd(23), []);
  const crowdC = useMemo(() => makeCrowd(37), []);
  const led = useMemo(makeLedBoard, []);
  const skyNight = useMemo(() => makeSky(false), []);
  const skyDay = useMemo(() => makeSky(true), []);
  const sky = isDay ? skyDay : skyNight;
  const lamps = useMemo(makeLamps, []);

  const boards = useMemo(() => {
    const mk = () => { const [c, g] = canvas(1024, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, g, t }; };
    return { centre: mk(), left: mk(), right: mk() };
  }, []);
  useEffect(() => {
    drawCentre(boards.centre.g, scoreboardData); boards.centre.t.needsUpdate = true;
    drawSide(boards.left.g, scoreboardData, 'bat'); boards.left.t.needsUpdate = true;
    drawSide(boards.right.g, scoreboardData, 'bowl'); boards.right.t.needsUpdate = true;
  }, [scoreboardData, boards]);

  const strikerRefs = useRef<{ g: THREE.Group | null; bails: THREE.Mesh[] }>({ g: null, bails: [] });
  const hitT = useRef(0);
  useFrame((_, dt) => {
    led.offset.x = (led.offset.x + dt * 0.03) % 1;           // scrolling LED boards
    const s = strikerRefs.current;
    if (stumpHit) hitT.current = Math.min(1.5, hitT.current + dt); else hitT.current = 0;
    const t = hitT.current;
    if (s.g) s.g.rotation.x = stumpHit ? -Math.min(1.1, t * 3) : 0;
    s.bails.forEach((b, i) => {
      if (!b) return;
      b.position.y = stumpHit ? 0.725 + Math.sin(Math.min(t, 0.9) * 3.4) * 0.5 : 0.725;
      b.position.z = stumpHit ? -t * 1.6 : 0;
      b.rotation.x = stumpHit ? t * 14 * (i ? 1 : -1) : 0;
    });
  });

  // 6 floodlight towers
  const towers = TOWER_ANGLES_DEG.map((d) => ({ d, p: towerPosition(d) }));
  const tierMat = (map: THREE.Texture, rep: number, ry = 3) => { map.repeat.set(rep, ry); };
  tierMat(crowdA, 3, 2); tierMat(crowdB, 3, 2); tierMat(crowdC, 4, 2);

  const roofLights = useMemo(() => Array.from({ length: 240 }, (_, i) => i), []);
  const supports = useMemo(() => Array.from({ length: 36 }, (_, i) => i), []);

  const TIERS = [
    { rb: 74, rt: 88, y0: 0, h: 13, map: crowdA },
    { rb: 91, rt: 103, y0: 15, h: 13, map: crowdB },
    { rb: 106, rt: 121, y0: 31, h: 17, map: crowdC },
  ];

  return (
    <group>
      <fog attach="fog" args={isDay ? ['#b9d9f2', 220, 560] : ['#0b1a45', 150, 420]} />
      {/* night sky dome */}
      <mesh><sphereGeometry args={[520, 32, 24]} /><meshBasicMaterial map={sky} side={THREE.BackSide} fog={false} /></mesh>

      {/* outfield */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[OUTFIELD_M, 128]} />
        <meshStandardMaterial map={grass} roughness={0.95} />
      </mesh>
      {/* pitch + square */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <planeGeometry args={[12, 26]} />
        <meshStandardMaterial color="#3aa043" roughness={0.95} transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[3.05, 20.12]} />
        <meshStandardMaterial map={pitch} roughness={0.9} />
      </mesh>

      {/* wickets: +z = striker's end (animated), -z = bowler's end */}
      <Stumps z={PITCH_HALF} hit={stumpHit} refs={strikerRefs} />
      <Stumps z={-PITCH_HALF} />

      {/* umpire at the bowler's end (simple figure, not a player) */}
      <group position={[1.1, 0, -PITCH_HALF - 1.6]}>
        <mesh position={[0, 0.85, 0]} castShadow><cylinderGeometry args={[0.2, 0.24, 1.2, 12]} /><meshStandardMaterial color="#f4f4f4" roughness={0.7} /></mesh>
        <mesh position={[0, 1.62, 0]} castShadow><sphereGeometry args={[0.17, 14, 12]} /><meshStandardMaterial color="#d9a47c" /></mesh>
        <mesh position={[0, 1.78, 0]}><cylinderGeometry args={[0.2, 0.2, 0.06, 14]} /><meshStandardMaterial color="#f4f4f4" /></mesh>
        <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.17, 0.17, 0.5, 10]} /><meshStandardMaterial color="#2b2f3a" /></mesh>
      </group>

      {/* boundary rope + LED board ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.09, 0]}>
        <torusGeometry args={[BOUNDARY_M, 0.09, 8, 220]} />
        <meshStandardMaterial color="#ffffff" emissive="#9aa6c0" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[BOUNDARY_M + 3.2, BOUNDARY_M + 3.2, 1.1, 160, 1, true]} />
        <meshBasicMaterial map={led} side={THREE.BackSide} toneMapped={false} />
      </mesh>

      {/* seating tiers with crowd */}
      {TIERS.map((t, i) => (
        <group key={i}>
          <mesh position={[0, t.y0 + t.h / 2, 0]}>
            <cylinderGeometry args={[t.rt, t.rb, t.h, 160, 1, true]} />
            <meshStandardMaterial map={t.map} emissiveMap={t.map} emissive="#ffffff" emissiveIntensity={isDay ? 0.08 : 0.42} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          {/* concourse walkway under each tier */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, t.y0 + 0.05, 0]}>
            <ringGeometry args={[t.rb - 1.5, t.rb + 0.1, 160]} />
            <meshStandardMaterial color="#222c46" roughness={0.8} />
          </mesh>
          <mesh position={[0, t.y0 + 1.1, 0]}>
            <cylinderGeometry args={[t.rb + 0.1, t.rb + 0.1, 0.18, 160, 1, true]} />
            <meshStandardMaterial color="#c7d2ee" emissive="#3a4a80" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
      {/* individual 3D spectators on the two lower tiers (the upper tier is the textured backdrop) */}
      <Spectators tiers={[{ rb: 74, rt: 88, y0: 0, h: 13, rows: 8 }, { rb: 91, rt: 103, y0: 15, h: 13, rows: 8 }]} energy={crowdEnergy} />

      {/* outer rim wall */}
      <mesh position={[0, 24, 0]}>
        <cylinderGeometry args={[123, 123, 48, 160, 1, true]} />
        <meshStandardMaterial color="#0d1630" side={THREE.BackSide} roughness={1} />
      </mesh>

      {/* roof canopy + light strips */}
      <mesh position={[0, 52, 0]}>
        <cylinderGeometry args={[138, 106, 9, 160, 1, true]} />
        <meshStandardMaterial color="#1b2646" metalness={0.5} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 47.6, 0]}>
        <torusGeometry args={[107, 0.6, 8, 200]} />
        <meshBasicMaterial color={isDay ? '#9aa3b8' : '#ffffff'} toneMapped={false} />
      </mesh>
      <instancedMesh args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, roofLights.length]}
        ref={(m) => {
          if (!m) return;
          const o = new THREE.Object3D();
          roofLights.forEach((i) => {
            const a = (i / roofLights.length) * Math.PI * 2;
            const r = 108 + (i % 2) * 6;
            o.position.set(Math.sin(a) * r, 47.2 + (i % 2) * 2, Math.cos(a) * r);
            o.updateMatrix(); m.setMatrixAt(i, o.matrix);
          });
          m.instanceMatrix.needsUpdate = true;
        }}>
        <boxGeometry args={[1.2, 0.7, 1.2]} />
        <meshBasicMaterial color={isDay ? '#8e97ad' : '#fff6d8'} toneMapped={false} />
      </instancedMesh>
      {supports.map((i) => {
        const a = (i / supports.length) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 114, 24, Math.cos(a) * 114]} rotation={[0, a, 0]}>
            <boxGeometry args={[1.4, 48, 1.4]} />
            <meshStandardMaterial color="#3a4468" metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}

      {/* giant LED screen (far end, over the stands) + side scoreboards */}
      <group position={[0, 36, -96]}>
        <mesh position={[0, 0, -0.6]}><boxGeometry args={[40, 17, 1]} /><meshStandardMaterial color="#0a0f20" /></mesh>
        <mesh><planeGeometry args={[38, 15.4]} /><meshBasicMaterial map={boards.centre.t} toneMapped={false} /></mesh>
      </group>
      {[{ x: -62, ry: 0.62, t: boards.left.t }, { x: 62, ry: -0.62, t: boards.right.t }].map((b, i) => (
        <group key={i} position={[b.x, 33, -80]} rotation={[0, b.ry, 0]}>
          <mesh position={[0, 0, -0.5]}><boxGeometry args={[25, 13, 1]} /><meshStandardMaterial color="#0a0f20" /></mesh>
          <mesh><planeGeometry args={[24, 12]} /><meshBasicMaterial map={b.t} toneMapped={false} /></mesh>
        </group>
      ))}

      {/* sight screens */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 4, s * (BOUNDARY_M - 1)]}>
          <mesh><boxGeometry args={[16, 8, 0.4]} /><meshStandardMaterial color="#f2f4f8" roughness={0.8} /></mesh>
          <mesh position={[-6, -4.4, 0]}><boxGeometry args={[0.3, 1, 0.3]} /><meshStandardMaterial color="#555" /></mesh>
          <mesh position={[6, -4.4, 0]}><boxGeometry args={[0.3, 1, 0.3]} /><meshStandardMaterial color="#555" /></mesh>
        </group>
      ))}

      {/* team dugouts */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (BOUNDARY_M - 4), 0, 6]} rotation={[0, -s * Math.PI / 2, 0]}>
          <mesh position={[0, 2.4, 0]}><boxGeometry args={[11, 0.25, 3.4]} /><meshStandardMaterial color="#1c2a55" metalness={0.3} /></mesh>
          <mesh position={[0, 0.5, -0.9]}><boxGeometry args={[10, 0.5, 0.8]} /><meshStandardMaterial color="#c7cfe6" /></mesh>
        </group>
      ))}

      {/* floodlight towers */}
      {towers.map(({ d, p }) => (
        <group key={d} position={[p[0], 0, p[2]]} rotation={[0, (d * Math.PI) / 180 + Math.PI, 0]}>
          <mesh position={[0, p[1] / 2, 0]}><cylinderGeometry args={[1.0, 1.9, p[1], 10]} /><meshStandardMaterial color="#59637f" metalness={0.6} roughness={0.5} /></mesh>
          <group position={[0, p[1] + 3, 0]} rotation={[0.38, 0, 0]}>
            <mesh><boxGeometry args={[19, 12, 1.2]} /><meshStandardMaterial color="#20283f" /></mesh>
            <mesh position={[0, 0, 0.7]}><planeGeometry args={[18, 11]} /><meshBasicMaterial map={lamps} color={isDay ? '#7d879c' : '#ffffff'} toneMapped={false} /></mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

export default Stadium;
