import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarDays, CheckCircle2, RefreshCw, Shield, Users, Wallet } from 'lucide-react';
import { useGameStore } from '../stores/useGameStore';
import { validateIplRetention } from '../engine/competition/franchiseLifecycle';

function isCompleteFixture(fixture: any): boolean {
  return Boolean(fixture.finalized) || fixture.status === 'COMPLETED' || fixture.status === 'ABANDONED'
    || fixture.fixtureStatus === 'COMPLETED' || fixture.fixtureStatus === 'ABANDONED';
}

export default function FranchiseOffseason() {
  const {
    franchises, players, selectedFranchiseId, fixtures, seasonNumber, seasonYear,
    releasePlayerForOffseason, tradePlayerForOffseason, startNextSeason, auctionPool,
  } = useGameStore();
  const ownTeam = franchises.find((team) => team.id === selectedFranchiseId) || null;
  const [releaseId, setReleaseId] = useState('');
  const [tradeTeamId, setTradeTeamId] = useState('');
  const [tradeOutId, setTradeOutId] = useState('');
  const [tradeInId, setTradeInId] = useState('');
  const [retainedIds, setRetainedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const seasonComplete = fixtures.length > 0 && fixtures.every(isCompleteFixture);
  const megaAuctionDue = seasonNumber > 0 && seasonNumber % 4 === 0;
  const otherTeams = franchises.filter((team) => team.id !== selectedFranchiseId);
  const opponent = franchises.find((team) => team.id === tradeTeamId) || null;
  const ownPlayers = useMemo(() => (ownTeam?.squad || []).map((id) => players.find((player) => player.id === id)).filter(Boolean), [ownTeam, players]);
  const incomingPlayers = useMemo(() => (opponent?.squad || []).map((id) => players.find((player) => player.id === id)).filter(Boolean), [opponent, players]);
  const retainedPlayers = retainedIds.map((id) => players.find((player) => player.id === id)).filter(Boolean);
  const retentionCheck = validateIplRetention(players, retainedIds);

  const selectDefaultRetention = () => {
    if (!ownTeam) return;
    const ranked = ownTeam.squad.map((id) => players.find((player) => player.id === id)).filter((player): player is NonNullable<typeof player> => Boolean(player)).sort((a, b) => b.rating - a.rating);
    const capped = ranked.filter((player) => player.isCapped !== false).slice(0, 5).map((player) => player.id);
    const uncapped = ranked.filter((player) => player.isCapped === false).slice(0, 1).map((player) => player.id);
    setRetainedIds([...capped, ...uncapped]);
  };

  const toggleRetained = (playerId: string) => {
    setRetainedIds((current) => current.includes(playerId)
      ? current.filter((id) => id !== playerId)
      : current.length < 6 ? [...current, playerId] : current);
  };

  const handleRelease = () => {
    if (!releaseId) return;
    const result = releasePlayerForOffseason(releaseId);
    setNotice(result.ok ? 'Player released and added to the next auction pool.' : result.reason || 'Could not release this player.');
    if (result.ok) setReleaseId('');
  };

  const handleTrade = () => {
    if (!tradeTeamId || !tradeOutId || !tradeInId) return;
    const result = tradePlayerForOffseason(tradeTeamId, tradeOutId, tradeInId);
    setNotice(result.ok ? 'Trade completed: the two players have exchanged franchises.' : result.reason || 'Trade could not be completed.');
    if (result.ok) { setTradeOutId(''); setTradeInId(''); }
  };

  const handleNextSeason = () => {
    if (megaAuctionDue && !retentionCheck.ok) {
      setNotice(retentionCheck.reason || 'Review your retention list.');
      return;
    }
    const result = startNextSeason(megaAuctionDue ? retainedIds : undefined);
    setNotice(result.ok
      ? (result.megaAuction ? 'Four-season cycle complete. The mega auction is now open.' : 'Your squad carries forward into the next season.')
      : result.reason || 'The next season could not be started.');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#102846] via-[#0b1d34] to-[#071426] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
              <CalendarDays className="h-4 w-4" /> Franchise management
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Off-season & squad planning</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Keep your core together, release players who no longer fit and negotiate direct player-for-player trades before the next campaign.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Career season</div>
            <div className="text-3xl font-black text-white">{seasonYear}</div>
            <div className="text-xs text-slate-300">Season {seasonNumber} · Cycle {((seasonNumber - 1) % 4) + 1}/4</div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">My franchise</div>
            <div className="mt-1 text-lg font-black text-white">{ownTeam?.shortName || 'Select a team'}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Squad size</div>
            <div className="mt-1 text-lg font-black text-white">{ownTeam?.squad.length || 0}/25 players</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Season status</div>
            <div className={`mt-1 text-lg font-black ${seasonComplete ? 'text-emerald-300' : 'text-amber-200'}`}>{seasonComplete ? 'Complete' : 'In progress'}</div>
          </div>
        </div>
      </section>

      {!seasonComplete && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
          <Shield className="mt-0.5 h-5 w-5 shrink-0" />
          <div>Releases, trades and season rollover unlock after every league and playoff fixture is marked complete. {fixtures.length === 0 ? 'The season schedule has not been generated yet.' : `${fixtures.filter((fixture) => !isCompleteFixture(fixture)).length} fixtures remain.`}</div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-300" />
            <h2 className="text-lg font-black text-white">Release a player</h2>
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-400">Release one player from your roster. They become available in the next auction round.</p>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Player to release</label>
          <select value={releaseId} onChange={(event) => setReleaseId(event.target.value)} disabled={!seasonComplete || !ownPlayers.length} className="w-full rounded-xl border border-white/10 bg-[#071426] px-3 py-3 text-sm text-white outline-none">
            <option value="">Select a squad player</option>
            {ownPlayers.map((player: any) => <option key={player.id} value={player.id}>{player.name} · {player.role}</option>)}
          </select>
          <button type="button" disabled={!seasonComplete || !releaseId} onClick={handleRelease} className="mt-3 w-full rounded-xl bg-rose-500/15 px-4 py-3 text-sm font-black text-rose-200 ring-1 ring-rose-400/30 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40">Release player to auction pool</button>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b1b30] p-5">
          <div className="mb-4 flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-black text-white">One-for-one trade</h2>
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-400">Choose one player from your squad and one from another franchise. Both players switch teams immediately.</p>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Trade with franchise</label>
          <select value={tradeTeamId} onChange={(event) => { setTradeTeamId(event.target.value); setTradeInId(''); }} disabled={!seasonComplete} className="mb-3 w-full rounded-xl border border-white/10 bg-[#071426] px-3 py-3 text-sm text-white outline-none">
            <option value="">Select another team</option>
            {otherTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Your player</label>
              <select value={tradeOutId} onChange={(event) => setTradeOutId(event.target.value)} disabled={!seasonComplete || !ownPlayers.length} className="w-full rounded-xl border border-white/10 bg-[#071426] px-3 py-3 text-sm text-white outline-none">
                <option value="">Select outgoing</option>
                {ownPlayers.map((player: any) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Incoming player</label>
              <select value={tradeInId} onChange={(event) => setTradeInId(event.target.value)} disabled={!seasonComplete || !opponent} className="w-full rounded-xl border border-white/10 bg-[#071426] px-3 py-3 text-sm text-white outline-none">
                <option value="">Select incoming</option>
                {incomingPlayers.map((player: any) => <option key={player.id} value={player.id}>{player.name}</option>)}
              </select>
            </div>
          </div>
          <button type="button" disabled={!seasonComplete || !tradeTeamId || !tradeOutId || !tradeInId} onClick={handleTrade} className="mt-3 w-full rounded-xl bg-sky-500/15 px-4 py-3 text-sm font-black text-sky-200 ring-1 ring-sky-400/30 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-40">Confirm player exchange</button>
        </section>
      </div>

      {megaAuctionDue && (
        <section className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">Four-season milestone</div>
              <h2 className="mt-1 text-xl font-black text-white">Mega auction retentions</h2>
              <p className="mt-1 text-xs text-slate-300">Choose up to six players to keep. IPL-style limits: max five capped and max two uncapped players.</p>
            </div>
            <button type="button" onClick={selectDefaultRetention} disabled={!seasonComplete} className="rounded-xl border border-amber-300/30 px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-300/10 disabled:opacity-40">Suggest strongest six</button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
            <span className="rounded-lg bg-white/5 px-2.5 py-1">Selected: {retainedIds.length}/6</span>
            <span className="rounded-lg bg-white/5 px-2.5 py-1">Capped: {retainedPlayers.filter((player: any) => player.isCapped !== false).length}/5</span>
            <span className="rounded-lg bg-white/5 px-2.5 py-1">Uncapped: {retainedPlayers.filter((player: any) => player.isCapped === false).length}/2</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ownPlayers.map((player: any) => {
              const checked = retainedIds.includes(player.id);
              return <label key={player.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs ${checked ? 'border-amber-300/50 bg-amber-300/10 text-white' : 'border-white/10 bg-black/10 text-slate-300'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleRetained(player.id)} disabled={!seasonComplete || (!checked && retainedIds.length >= 6)} />
                <span className="min-w-0 flex-1 truncate font-bold">{player.name}</span>
                <span className="text-[9px] text-slate-400">{player.isCapped === false ? 'Uncapped' : 'Capped'}</span>
              </label>;
            })}
          </div>
          {!retentionCheck.ok && <div className="mt-3 text-xs font-bold text-rose-300">{retentionCheck.reason}</div>}
        </section>
      )}

      {notice && <div className="rounded-xl border border-white/10 bg-[#10233D] px-4 py-3 text-sm text-slate-200">{notice}</div>}

      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0b1b30] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">{megaAuctionDue ? 'Begin the mega auction' : 'Continue your franchise'}</h2>
          <p className="mt-1 text-xs text-slate-400">{megaAuctionDue ? 'Unretained players from all teams will enter the auction pool.' : 'Your current squad remains intact. Released and unsold players enter the mini-auction pool.'}</p>
          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500"><Wallet className="h-3.5 w-3.5" /> Next auction pool: {auctionPool.length} players currently listed</div>
        </div>
        <button type="button" onClick={handleNextSeason} disabled={!seasonComplete || (megaAuctionDue && (!retainedIds.length || !retentionCheck.ok))} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-500 px-5 py-3 text-sm font-black text-[#071426] shadow-lg shadow-amber-500/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40">
          {megaAuctionDue ? <RefreshCw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          Start {seasonYear + 1} season
        </button>
      </section>
    </div>
  );
}
