import React, { useCallback, useRef, useState } from 'react';
import { Target } from 'lucide-react';
import CricketActionVisualizer from '../CricketActionVisualizer';
import { KIT_TEAM_NAMES } from '../../characters/teamKits';
import {
  addToNetStats, batterResponse, buildNetDelivery, emptyNetStats, Length, Line, Pace, SHOTS, ShotKey, seededRng,
} from '../../engine/practice/practiceEngine';
import type { DeliveryResult } from '../../types/delivery';

const P = (id: string, name: string, role: string) => ({ id, name, role, nationality: 'Indian', rating: 80, basePrice: 1 } as never);
const striker = P('net_striker', 'Net Batter', 'Batsman'); const nonStriker = P('net_nonstriker', 'Partner', 'Batsman'); const bowler = P('net_bowler', 'Net Bowler', 'Bowler');
const LENGTHS: Length[] = ['YORKER', 'FULL', 'GOOD', 'SHORT'];
const LINES: Line[] = ['OFF', 'MIDDLE', 'LEG'];
const PACES: Pace[] = ['FAST', 'MEDIUM', 'SPIN'];

/** Net practice: bat against a bowling machine, or bowl at a batter. Nothing here touches any competition. */
export default function PracticeView() {
  const [mode, setMode] = useState<'BAT' | 'BOWL'>('BAT');
  const [team, setTeam] = useState('India');
  const [format, setFormat] = useState<'TEST' | 'ODI' | 'T20'>('T20');
  const [length, setLength] = useState<Length>('GOOD');
  const [line, setLine] = useState<Line>('MIDDLE');
  const [pace, setPace] = useState<Pace>('FAST');
  const [randomBall, setRandomBall] = useState(true);
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState(emptyNetStats());
  const [log, setLog] = useState<string[]>([]);
  const counter = useRef(0);

  const bowlTo = useCallback((shot: ShotKey | null) => {
    if (busy) return;
    const rng = seededRng((Date.now() + counter.current * 7919) >>> 0);
    const l = mode === 'BAT' && randomBall ? LENGTHS[Math.floor(rng() * 4)] : length;
    const ln = mode === 'BAT' && randomBall ? LINES[Math.floor(rng() * 3)] : line;
    const pc = mode === 'BAT' && randomBall ? PACES[Math.floor(rng() * 3)] : pace;
    const chosen = shot ?? batterResponse(l, ln, pc, rng);
    counter.current += 1;
    const { delivery: d, outcome } = buildNetDelivery({
      id: `net_${counter.current}`, ballNumber: counter.current, shot: chosen, line: ln, length: l, pace: pc, rng,
      strikerName: 'Net Batter', nonStrikerName: 'Partner', bowlerName: 'Net Bowler',
    });
    setBusy(true); setDelivery(d); setStats((s) => addToNetStats(s, outcome)); setLog((x) => [d.commentary, ...x].slice(0, 8));
  }, [busy, mode, randomBall, length, line, pace]);

  const chip = (on: boolean) => `px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${on ? 'bg-[#258BFF]/25 border-[#258BFF]/60 text-white' : 'bg-[#0B1B30] border-white/10 text-[#9DAEC4] hover:text-white'}`;
  const sr = stats.balls ? ((stats.runs / stats.balls) * 100).toFixed(1) : '-';

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-5" data-testid="practice">
      <div className="rounded-2xl bg-[#10233D] border border-white/10 p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-black"><Target className="w-4 h-4 text-[#258BFF]" /> Net Practice</div>
        <div className="flex gap-2"><button type="button" className={chip(mode === 'BAT')} onClick={() => setMode('BAT')}>Batting nets</button><button type="button" className={chip(mode === 'BOWL')} onClick={() => setMode('BOWL')}>Bowling nets</button></div>
        <div className="flex gap-2 items-center text-[11px]">
          <select value={team} onChange={(e) => setTeam(e.target.value)} className="flex-1 bg-[#0B1B30] border border-white/10 rounded-lg px-2 py-1.5">{KIT_TEAM_NAMES.map((t) => <option key={t}>{t}</option>)}</select>
          {(['TEST', 'ODI', 'T20'] as const).map((f) => <button key={f} type="button" className={chip(format === f)} onClick={() => setFormat(f)}>{f === 'TEST' ? 'Test' : f}</button>)}
        </div>

        {mode === 'BAT' ? (
          <>
            <label className="flex items-center gap-2 text-[11px] text-[#9DAEC4]"><input type="checkbox" checked={randomBall} onChange={(e) => setRandomBall(e.target.checked)} /> Machine bowls random balls</label>
            {!randomBall && <BallPicker length={length} line={line} pace={pace} setLength={setLength} setLine={setLine} setPace={setPace} chip={chip} />}
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#9DAEC4]">Pick your shot</div>
            <div className="grid grid-cols-2 gap-2">
              {SHOTS.map((s) => <button key={s.key} type="button" disabled={busy} onClick={() => bowlTo(s.key)} className={`${chip(false)} disabled:opacity-40`}>{s.label}</button>)}
            </div>
          </>
        ) : (
          <>
            <BallPicker length={length} line={line} pace={pace} setLength={setLength} setLine={setLine} setPace={setPace} chip={chip} />
            <button type="button" disabled={busy} onClick={() => bowlTo(null)} className="w-full px-4 py-2 rounded-xl bg-[#258BFF] text-white text-xs font-black uppercase tracking-wider disabled:opacity-40">Bowl</button>
          </>
        )}

        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
          {[['Balls', stats.balls], ['Runs', stats.runs], ['SR', sr], ['Wkts', stats.wickets], ['4s', stats.fours], ['6s', stats.sixes], ['Dots', stats.dots]].map(([k, v]) => (
            <div key={String(k)} className="rounded-lg bg-[#0B1B30] border border-white/10 py-1.5"><div className="font-black text-sm">{v}</div><div className="text-[#9DAEC4] text-[10px]">{k}</div></div>
          ))}
          <button type="button" className="rounded-lg border border-white/10 text-[#9DAEC4] text-[10px] hover:text-white" onClick={() => { setStats(emptyNetStats()); setLog([]); }}>Reset</button>
        </div>
        <ul className="space-y-1 text-[11px] text-[#9DAEC4]">{log.map((l, i) => <li key={i} className={i === 0 ? 'text-white' : ''}>{l}</li>)}</ul>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-white/10 min-h-[640px] bg-[#071426]">
        {delivery ? (
          <CricketActionVisualizer
            striker={striker} nonStriker={nonStriker} bowler={bowler}
            deliveryResult={delivery}
            lifecycle={'BALL_READY' as never}
            onPlaybackComplete={() => setBusy(false)}
            format={format as never}
            battingTeamName={team} bowlingTeamName={mode === 'BAT' ? 'Bowling machine' : 'Net Bowlers'}
            score={{ runs: stats.runs, wickets: stats.wickets, overs: Math.floor(stats.balls / 6), balls: stats.balls % 6 }}
            hideTopHeader hideSideAndBottomPanels
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#9DAEC4]">{mode === 'BAT' ? 'Pick a shot to face the first ball.' : 'Choose your line and length, then bowl.'}</div>
        )}
      </div>
    </div>
  );
}

function BallPicker(p: { length: Length; line: Line; pace: Pace; setLength: (l: Length) => void; setLine: (l: Line) => void; setPace: (x: Pace) => void; chip: (on: boolean) => string }) {
  const row = <T extends string>(label: string, items: T[], val: T, set: (v: T) => void) => (
    <div className="flex items-center gap-2"><span className="w-12 text-[10px] uppercase font-bold tracking-wider text-[#9DAEC4]">{label}</span>
      <div className="flex gap-1.5 flex-wrap">{items.map((i) => <button key={i} type="button" className={p.chip(val === i)} onClick={() => set(i)}>{i[0] + i.slice(1).toLowerCase()}</button>)}</div></div>
  );
  return <div className="space-y-2">{row('Length', LENGTHS, p.length, p.setLength)}{row('Line', LINES, p.line, p.setLine)}{row('Pace', PACES, p.pace, p.setPace)}</div>;
}
