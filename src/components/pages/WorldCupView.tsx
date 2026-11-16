import React, { useMemo, useState } from 'react';
import { Trophy, Play, FastForward, Eye, ChevronRight } from 'lucide-react';
import { useGameStore, GameState } from '../../stores/useGameStore';
import { Fixture, MatchStatus } from '../../types/match';
import {
  computeGroupTables, getWorldCupStatus, nextWorldCupFixtures, knockoutWinner, WC_MAX_TEAMS, WC_MIN_TEAMS, WorldCupFormat,
} from '../../engine/competition/worldCupEngine';

const STAGE_LABEL: Record<string, string> = { GROUP: 'Group stage', SEMI_FINAL: 'Semi-finals', FINAL: 'Final' };

/** World Cup mode: pick teams, play (or sim) the groups, then the semi-finals and the final. */
export default function WorldCupView() {
  const { franchises, fixtures, worldCupConfig, createWorldCup, advanceWorldCup, clearWorldCup, setCurrentMatch, setGameState, autoSimulateMatch, selectedFranchiseId } = useGameStore();
  const [format, setFormat] = useState<WorldCupFormat>('T20');
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>(() => franchises.slice(0, 8).map((f) => f.id));
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const teamName = (id: string) => franchises.find((f) => f.id === id)?.shortName || franchises.find((f) => f.id === id)?.name || id;
  const mine = useMemo(() => (worldCupConfig ? fixtures.filter((f) => f.tournamentId === worldCupConfig.id) : []), [fixtures, worldCupConfig]);
  const tables = useMemo(() => (worldCupConfig ? computeGroupTables(worldCupConfig, mine) : {}), [worldCupConfig, mine]);
  const status = worldCupConfig ? getWorldCupStatus(worldCupConfig, mine) : null;
  const canAdvance = worldCupConfig ? nextWorldCupFixtures(worldCupConfig, mine).length > 0 : false;

  const card = 'rounded-2xl bg-[#10233D] border border-white/10 p-5';
  const btn = 'px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 bg-[#0B1B30] hover:border-white/30 transition-colors';

  if (!worldCupConfig) {
    const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < WC_MAX_TEAMS ? [...p, id] : p));
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className={card}>
          <h2 className="text-lg font-black flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> Create a World Cup</h2>
          <p className="text-xs text-[#9DAEC4] mt-1">Pick {WC_MIN_TEAMS}-{WC_MAX_TEAMS} teams. 4-5 teams play one group; 6+ are split into two groups. The top four reach the semi-finals, then the final.</p>
        </div>
        <div className={`${card} space-y-4`}>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9DAEC4] w-16">Format</span>
            {(['T20', 'ODI'] as WorldCupFormat[]).map((f) => <button key={f} type="button" onClick={() => setFormat(f)} className={`${btn} ${format === f ? 'border-[#258BFF] bg-[#258BFF]/20' : ''}`}>{f}</button>)}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name (optional)" className="ml-4 flex-1 bg-[#0B1B30] border border-white/10 rounded-lg px-3 py-1.5 text-xs" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#9DAEC4] mb-2">Teams ({picked.length} selected)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {franchises.map((f) => (
                <button key={f.id} type="button" onClick={() => toggle(f.id)}
                  className={`text-left rounded-xl px-3 py-2 text-xs font-bold border ${picked.includes(f.id) ? 'border-[#258BFF] bg-[#258BFF]/15' : 'border-white/10 bg-[#0B1B30] text-[#9DAEC4]'}`}>{f.shortName || f.name}</button>
              ))}
            </div>
          </div>
          {error && <div className="text-xs text-red-300">{error}</div>}
          <button type="button" className="px-5 py-2 rounded-xl bg-[#258BFF] text-white text-xs font-black uppercase tracking-wider disabled:opacity-40"
            disabled={picked.length < WC_MIN_TEAMS}
            onClick={() => { try { setError(null); createWorldCup({ name: name.trim() || undefined, format, teamIds: picked }); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create the World Cup'); } }}>
            Create World Cup
          </button>
        </div>
      </div>
    );
  }

  const renderFixture = (f: Fixture) => {
    const done = f.status === MatchStatus.COMPLETED;
    const user = selectedFranchiseId && (f.team1Id === selectedFranchiseId || f.team2Id === selectedFranchiseId);
    return (
      <div key={f.id} className="flex items-center justify-between rounded-xl bg-[#0B1B30] border border-white/10 px-3 py-2 text-xs">
        <div className="font-bold">{teamName(f.team1Id)} <span className="text-[#9DAEC4] font-normal">v</span> {teamName(f.team2Id)}
          {f.group && <span className="ml-2 text-[10px] text-[#9DAEC4]">Group {f.group}</span>}
          {done && f.scorecard?.margin && <span className="ml-2 text-emerald-300 font-semibold">{f.scorecard.margin}</span>}
        </div>
        {done ? (
          <button type="button" className={btn} onClick={() => { setCurrentMatch(f.id); setGameState(GameState.MATCH_SIMULATION); }}><Eye className="inline w-3 h-3 mr-1" />Scorecard</button>
        ) : user ? (
          <button type="button" className={`${btn} bg-[#258BFF] border-[#258BFF]`} onClick={() => { setCurrentMatch(f.id); setGameState(GameState.PRE_MATCH); }}><Play className="inline w-3 h-3 mr-1" />Play</button>
        ) : (
          <button type="button" className={btn} onClick={() => autoSimulateMatch(f.id)}><FastForward className="inline w-3 h-3 mr-1" />Auto sim</button>
        )}
      </div>
    );
  };

  // The store only lets the current match-day's fixtures run and releases the next day on a later tick, so
  // simulate asynchronously: run what is playable, yield, repeat until the stage is done or nothing can run.
  // The user's own fixture is skipped (it must be played), which ends the loop.
  const simStage = async (stage: string) => {
    if (simulating) return;
    setSimulating(true);
    const pending = () => useGameStore.getState().fixtures
      .filter((f) => f.tournamentId === worldCupConfig.id && f.stage === stage && f.status !== MatchStatus.COMPLETED)
      .sort((a, b) => (a.day ?? 0) - (b.day ?? 0) || a.matchNumber - b.matchNumber);
    let stalls = 0;
    for (let guard = 0; guard < 200 && pending().length && stalls < 4; guard++) {
      const before = pending().length;
      for (const f of pending()) useGameStore.getState().autoSimulateMatch(f.id);
      await new Promise((r) => setTimeout(r, 40));
      stalls = pending().length < before ? 0 : stalls + 1;
    }
    setSimulating(false);
  };

  return (
    <div className="space-y-5">
      <div className={`${card} flex items-center justify-between`}>
        <div>
          <h2 className="text-lg font-black flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-400" /> {worldCupConfig.name}</h2>
          <p className="text-xs text-[#9DAEC4] mt-1">
            {status?.stage === 'COMPLETE' ? <span className="text-amber-300 font-bold">Champions: {teamName(status.championId!)}</span> : `Now: ${STAGE_LABEL[status?.stage ?? 'GROUP']}`}
          </p>
        </div>
        <div className="flex gap-2">
          {canAdvance && <button type="button" className={`${btn} bg-emerald-600/30 border-emerald-400/50`} onClick={() => advanceWorldCup()}>Advance to next stage <ChevronRight className="inline w-3 h-3" /></button>}
          <button type="button" className={btn} onClick={clearWorldCup}>Reset</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {Object.entries(tables).map(([g, rows]) => (
          <div key={g} className={card}>
            <div className="text-xs font-black mb-2 uppercase tracking-wider text-[#9DAEC4]">Group {g}</div>
            <table className="w-full text-xs">
              <thead><tr className="text-[#9DAEC4] text-left"><th className="py-1">#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th><th>Pts</th><th>NRR</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.teamId} className={`border-t border-white/5 ${i < (worldCupConfig.groups.B ? 2 : 4) ? 'text-white' : 'text-[#9DAEC4]'}`}>
                    <td className="py-1.5">{i + 1}</td><td className="font-bold">{teamName(r.teamId)}</td><td>{r.played}</td><td>{r.won}</td><td>{r.lost}</td><td>{r.tied}</td>
                    <td className="font-black">{r.points}</td><td>{r.nrr > 0 ? '+' : ''}{r.nrr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {(['GROUP', 'SEMI_FINAL', 'FINAL'] as const).map((stage) => {
        const list = mine.filter((f) => f.stage === stage);
        if (!list.length) return null;
        return (
          <div key={stage} className={`${card} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase tracking-wider text-[#9DAEC4]">{STAGE_LABEL[stage]}</div>
              {list.some((f) => f.status !== MatchStatus.COMPLETED) && <button type="button" className={btn} onClick={() => simStage(stage)} disabled={simulating}><FastForward className="inline w-3 h-3 mr-1" />{simulating ? 'Simulating...' : 'Auto sim stage'}</button>}
            </div>
            <div className="grid md:grid-cols-2 gap-2">{list.map(renderFixture)}</div>
            {stage === 'FINAL' && list[0].status === MatchStatus.COMPLETED && (
              <div className="text-sm font-black text-amber-300">Winner: {teamName(knockoutWinner(worldCupConfig, tables, list[0]) || '')}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
