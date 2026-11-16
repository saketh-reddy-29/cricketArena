import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { CharacterInstance } from '../characters/CharacterInstance';
import { COUNTRY_KITS, KIT_TEAM_NAMES, KitFormat, KitVariant, jerseyNameFor, resolveKit } from '../characters/teamKits';

const PADDED = '/models/cricket-arena/cartoon_sports_character_3d_model.glb';
const LIGHT = '/models/cricket-arena/cartoon_character_3d_model.glb';

/** Player preview: the real GLB player in any team kit, with rotate / zoom, format, number and equipment controls. */
export default function KitPreviewPanel({ initialTeam = 'India', onClose }: { initialTeam?: string; onClose: () => void }) {
  const [team, setTeam] = useState(initialTeam);
  const [format, setFormat] = useState<KitFormat>('T20');
  const [variant, setVariant] = useState<KitVariant>('home');
  const [number, setNumber] = useState(18);
  const [helmet, setHelmet] = useState(true);
  const [bat, setBat] = useState(true);
  const [padded, setPadded] = useState(true);
  const kit = resolveKit(team, format, variant);
  const flag = COUNTRY_KITS.find((c) => c.name === team)?.flag ?? '';

  const btn = (on: boolean) =>
    `px-2 py-1 rounded-md text-[10px] font-bold border ${on ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-100' : 'bg-slate-900/70 border-white/10 text-slate-300 hover:text-white'}`;

  return (
    <div className="absolute left-3 top-14 z-30 w-[300px] rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-md shadow-2xl text-white overflow-hidden" data-testid="kit-preview">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="text-[11px] font-black tracking-wide">PLAYER PREVIEW {flag}</div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-xs" aria-label="Close preview">✕</button>
      </div>
      <div className="h-[230px] bg-gradient-to-b from-slate-900 to-slate-950">
        <Canvas camera={{ position: [0, 1.25, 3.3], fov: 30 }} shadows>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
          <directionalLight position={[-4, 3, -3]} intensity={0.9} color="#9ec2ff" />
          <Suspense fallback={null}>
            <group position={[0, -0.1, 0]}>
              <CharacterInstance
                modelUrl={padded ? PADDED : LIGHT}
                position={[0, 0]}
                yaw={0}
                action={bat ? 'batStance' : 'idle'}
                progress={0}
                hasBat={bat}
                team={team}
                format={format}
                kitVariant={variant}
                kitRole={helmet ? 'batter' : 'fielder'}
                jerseyNumber={number}
                jerseyName={jerseyNameFor(kit.teamName)}
              />
            </group>
          </Suspense>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
            <circleGeometry args={[1.6, 48]} />
            <meshStandardMaterial color="#1d6b2e" />
          </mesh>
          <OrbitControls target={[0, 1.0, 0]} enablePan={false} minDistance={1.8} maxDistance={7} autoRotate autoRotateSpeed={1.2} />
        </Canvas>
      </div>
      <div className="p-3 space-y-2 text-[10px]">
        <label className="flex items-center gap-2">
          <span className="w-12 text-slate-400">Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-md px-1.5 py-1 text-[11px]">
            {KIT_TEAM_NAMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="w-12 text-slate-400">Format</span>
          {(['TEST', 'ODI', 'T20'] as KitFormat[]).map((f) => (
            <button key={f} type="button" className={btn(format === f)} onClick={() => setFormat(f)}>{f === 'TEST' ? 'Test' : f}</button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-12 text-slate-400">Strip</span>
          {(['home', 'away'] as KitVariant[]).map((v) => (
            <button key={v} type="button" className={btn(variant === v)} onClick={() => setVariant(v)}>{v === 'home' ? 'Home' : 'Away'}</button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <span className="w-12 text-slate-400">Number</span>
          <input type="number" min={1} max={99} value={number}
            onChange={(e) => setNumber(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
            className="w-16 bg-slate-900 border border-white/10 rounded-md px-1.5 py-1 text-[11px]" />
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="w-12 text-slate-400">Gear</span>
          <button type="button" className={btn(helmet)} onClick={() => setHelmet(!helmet)}>Helmet</button>
          <button type="button" className={btn(bat)} onClick={() => setBat(!bat)}>Bat</button>
          <button type="button" className={btn(padded)} onClick={() => setPadded(!padded)}>Pads &amp; gloves</button>
        </div>
        <div className="flex gap-1 pt-1" title="Kit colours">
          {[kit.slots.jersey, kit.slots.sleeves, kit.slots.collar, kit.slots.pants, kit.slots.accent, kit.slots.helmet].map((c, i) => (
            <span key={i} className="h-3.5 flex-1 rounded-sm border border-white/20" style={{ background: c }} />
          ))}
        </div>
        <div className="text-slate-500">Drag to rotate - scroll to zoom</div>
      </div>
    </div>
  );
}
