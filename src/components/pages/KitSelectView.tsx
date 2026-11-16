import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Shirt } from 'lucide-react';
import { CharacterInstance } from '../../characters/CharacterInstance';
import { COUNTRY_KITS, KIT_TEAM_NAMES, KitFormat, KitVariant, jerseyNameFor, resolveKit } from '../../characters/teamKits';
import { useGameStore, GameState } from '../../stores/useGameStore';
import { heightScale as heightScaleOf } from '../../characters/playerAppearance';

const PADDED = '/models/cricket-arena/cartoon_sports_character_3d_model.glb';
const LIGHT = '/models/cricket-arena/cartoon_character_3d_model.glb';

/** Team selection screen: browse every team, see its Test / ODI / T20 kits, and inspect the real 3D player. */
export default function KitSelectView() {
  const setGameState = useGameStore((s) => s.setGameState);
  const [team, setTeam] = useState('India');
  const [format, setFormat] = useState<KitFormat>('ODI');
  const [variant, setVariant] = useState<KitVariant>('home');
  const [number, setNumber] = useState(18);
  const [helmet, setHelmet] = useState(true);
  const [bat, setBat] = useState(true);
  const [padded, setPadded] = useState(true);
  const [tab, setTab] = useState<'INTL' | 'LEAGUE'>('INTL');
  const [heightCm, setHeightCm] = useState(182);

  const intl = useMemo(() => KIT_TEAM_NAMES.filter((n) => COUNTRY_KITS.some((c) => c.name === n)), []);
  const league = useMemo(() => KIT_TEAM_NAMES.filter((n) => !COUNTRY_KITS.some((c) => c.name === n)), []);
  const kit = resolveKit(team, format, variant);
  const swatch = (f: KitFormat) => resolveKit(team, f, variant).slots;
  const flag = COUNTRY_KITS.find((c) => c.name === team)?.flag;
  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${on ? 'bg-[#258BFF]/25 border-[#258BFF]/60 text-white' : 'bg-[#0B1B30] border-white/10 text-[#9DAEC4] hover:text-white'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5" data-testid="kit-select">
      <div className="rounded-2xl bg-[#10233D] border border-white/10 p-4 space-y-3 max-h-[78vh] overflow-y-auto">
        <div className="flex items-center gap-2 text-sm font-black"><Shirt className="w-4 h-4 text-[#258BFF]" /> Teams &amp; Kits</div>
        <div className="flex gap-2">
          <button type="button" className={chip(tab === 'INTL')} onClick={() => setTab('INTL')}>International</button>
          <button type="button" className={chip(tab === 'LEAGUE')} onClick={() => setTab('LEAGUE')}>IPL franchises</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(tab === 'INTL' ? intl : league).map((t) => {
            const k = resolveKit(t, 'ODI', 'home');
            const f = COUNTRY_KITS.find((c) => c.name === t)?.flag;
            return (
              <button key={t} type="button" onClick={() => setTeam(t)}
                className={`text-left rounded-xl p-2.5 border transition-colors ${team === t ? 'border-[#258BFF] bg-[#258BFF]/15' : 'border-white/10 bg-[#0B1B30] hover:border-white/30'}`}>
                <div className="text-[11px] font-bold truncate">{f ? `${f} ` : ''}{t}</div>
                <div className="flex gap-1 mt-1.5">
                  {[k.slots.jersey, k.slots.collar, k.slots.accent].map((c, i) => <span key={i} className="h-2.5 flex-1 rounded-sm border border-white/20" style={{ background: c }} />)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-[#10233D] border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div>
            <div className="text-lg font-black">{flag} {kit.teamName} <span className="text-[#9DAEC4] text-xs font-bold ml-1">{format === 'TEST' ? 'Test' : format} kit - {variant}</span></div>
            <div className="text-[11px] text-[#9DAEC4]">Drag to rotate, scroll to zoom. The same kit is worn in the 3D match view.</div>
          </div>
          <button type="button" onClick={() => setGameState(GameState.LANDING)} className="text-xs font-bold text-[#9DAEC4] hover:text-white">Back</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          <div className="h-[460px] bg-gradient-to-b from-[#0B1B30] to-[#071426]">
            <Canvas camera={{ position: [0, 1.15, 4.7], fov: 30 }} shadows>
              <ambientLight intensity={0.8} />
              <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
              <directionalLight position={[-4, 3, -3]} intensity={0.9} color="#9ec2ff" />
              <Suspense fallback={null}>
                <group position={[0, -0.1, 0]}>
                  <CharacterInstance modelUrl={padded ? PADDED : LIGHT} position={[0, 0]} yaw={0} action={bat ? 'batStance' : 'idle'} progress={0}
                    hasBat={bat} team={team} format={format} kitVariant={variant} kitRole={helmet ? 'batter' : 'fielder'}
                    jerseyNumber={number} jerseyName={jerseyNameFor(kit.teamName)} heightScale={heightScaleOf(heightCm)} />
                </group>
              </Suspense>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                <circleGeometry args={[1.8, 48]} /><meshStandardMaterial color="#1d6b2e" />
              </mesh>
              <OrbitControls target={[0, 1.0, 0]} enablePan={false} minDistance={1.8} maxDistance={7} autoRotate autoRotateSpeed={1.1} />
            </Canvas>
          </div>
          <div className="p-4 space-y-4 text-[11px]">
            <div className="space-y-1.5">
              <div className="text-[#9DAEC4] font-bold uppercase tracking-wider text-[10px]">Format</div>
              <div className="flex gap-2">{(['TEST', 'ODI', 'T20'] as KitFormat[]).map((f) => <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)}>{f === 'TEST' ? 'Test' : f}</button>)}</div>
            </div>
            <div className="space-y-1.5">
              <div className="text-[#9DAEC4] font-bold uppercase tracking-wider text-[10px]">Strip</div>
              <div className="flex gap-2">{(['home', 'away'] as KitVariant[]).map((v) => <button key={v} type="button" className={chip(variant === v)} onClick={() => setVariant(v)}>{v === 'home' ? 'Home' : 'Away'}</button>)}</div>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-[#9DAEC4] font-bold uppercase tracking-wider text-[10px] w-14">Number</span>
              <input type="number" min={1} max={99} value={number} onChange={(e) => setNumber(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="w-16 bg-[#0B1B30] border border-white/10 rounded-lg px-2 py-1 text-xs" />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[#9DAEC4] font-bold uppercase tracking-wider text-[10px] w-14">Height</span>
              <input type="range" min={160} max={200} value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="flex-1" aria-label="Player height" />
              <span className="w-12 text-right">{heightCm} cm</span>
            </label>
            <div className="space-y-1.5">
              <div className="text-[#9DAEC4] font-bold uppercase tracking-wider text-[10px]">Equipment</div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" className={chip(helmet)} onClick={() => setHelmet(!helmet)}>Helmet</button>
                <button type="button" className={chip(bat)} onClick={() => setBat(!bat)}>Bat</button>
                <button type="button" className={chip(padded)} onClick={() => setPadded(!padded)}>Pads &amp; gloves</button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[#9DAEC4] font-bold uppercase tracking-wider text-[10px]">All three kits</div>
              {(['TEST', 'ODI', 'T20'] as KitFormat[]).map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-9 text-[#9DAEC4]">{f === 'TEST' ? 'Test' : f}</span>
                  <div className="flex gap-1 flex-1">{[swatch(f).jersey, swatch(f).sleeves, swatch(f).collar, swatch(f).pants, swatch(f).helmet].map((c, i) => <span key={i} className="h-3.5 flex-1 rounded-sm border border-white/20" style={{ background: c }} />)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
