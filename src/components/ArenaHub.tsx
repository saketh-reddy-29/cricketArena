import React from 'react';
import { useGameStore, GameState, ArenaTab } from '../stores/useGameStore';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

// Career panels are loaded only when the player opens them. This also keeps
// the default overview from pulling in auction, squad and analytics screens.
const ArenaDashboard = React.lazy(() => import('./ArenaDashboard'));
const ScheduleTab = React.lazy(() => import('./league/ScheduleTab'));
const SeriesTab = React.lazy(() => import('./league/SeriesTab'));
const LeaderboardTab = React.lazy(() => import('./league/LeaderboardTab'));
const QualificationTab = React.lazy(() => import('./league/QualificationTab'));
const SquadPlanner = React.lazy(() => import('./SquadPlanner'));
const AuctionRoom = React.lazy(() => import('./AuctionRoom'));
const PlayerStatsView = React.lazy(() => import('./stats/PlayerStatsView'));
const TeamStatsView = React.lazy(() => import('./stats/TeamStatsView'));
const TopMatchesCarousel = React.lazy(() => import('./TopMatchesCarousel'));
const FieldSetupDashboard = React.lazy(() => import('./FieldSetupDashboard'));
const MatchRecoveryBanner = React.lazy(() => import('./common/MatchRecoveryBanner'));

function PanelLoading() {
  return (
    <div className="grid min-h-[30vh] place-items-center rounded-2xl border border-white/5 bg-[#0B1A2E]/50 p-8">
      <div className="flex items-center gap-3 text-xs font-semibold text-[#9DAEC4]" role="status">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#F5B82E]" />
        Loading career panel
      </div>
    </div>
  );
}

export default function ArenaHub() {
  const {
    selectedFormat,
    activeTab,
    setActiveTab,
    setGameState,
    franchises,
    selectedFranchiseId,
    liveMatchState,
  } = useGameStore();

  const team = franchises.find(franchise => franchise.id === selectedFranchiseId);

  const liveCtx = React.useMemo(() => {
    const ls = liveMatchState ?? {};
    return {
      isSpinner: ls.currentBowlerIsSpin ?? false,
      isLeftHander: ls.strikerIsLeftHand ?? false,
      wickets: ls.wickets ?? 0,
      partnershipRuns: ls.partnershipRuns ?? 0,
      batterId: ls.strikerId ?? undefined,
      batterStyle: ls.strikerStyle ?? undefined,
      highRequiredRate: ls.requiredRate && ls.currentRunRate
        ? ls.requiredRate > ls.currentRunRate + 2
        : false,
      bowlerName: ls.currentBowlerName ?? undefined,
      batterName: ls.strikerName ?? undefined,
    };
  }, [liveMatchState]);

  const isIPL = selectedFormat === 'IPL';
  const isTest = selectedFormat === 'TEST';

  const tabs = React.useMemo((): { id: ArenaTab; label: string; group: 'manage' | 'insights' }[] => {
    const items: { id: ArenaTab; label: string; group: 'manage' | 'insights' }[] = [
      { id: 'OVERVIEW', label: 'Overview', group: 'manage' },
    ];

    if (isIPL) {
      items.push({ id: 'AUCTION', label: 'Auction', group: 'manage' });
    } else {
      items.push({ id: 'SERIES', label: 'Series', group: 'manage' });
    }

    items.push(
      { id: 'SQUAD', label: 'Squad', group: 'manage' },
      { id: 'MATCHES', label: 'Fixtures', group: 'manage' },
      { id: 'TABLE', label: isTest ? 'WTC Table' : 'Standings', group: 'manage' }
    );

    if (!isTest) items.push({ id: 'PLAYOFFS', label: 'Playoffs', group: 'insights' });

    items.push(
      { id: 'PLAYER_STATS', label: 'Player Stats', group: 'insights' },
      { id: 'TEAM_STATS', label: 'Team Stats', group: 'insights' },
      { id: 'FIELD_SETUP', label: 'Field Tactics', group: 'insights' }
    );

    return items;
  }, [isIPL, isTest]);

  React.useEffect(() => {
    if (!tabs.some(tab => tab.id === activeTab)) {
      setActiveTab('OVERVIEW');
    }
  }, [activeTab, tabs, setActiveTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'OVERVIEW':
        return <ArenaDashboard />;
      case 'SQUAD':
        return <SquadPlanner />;
      case 'AUCTION':
        return <AuctionRoom />;
      case 'MATCHES':
        return (
          <div className="mx-auto w-full max-w-[1440px] px-1 py-4 sm:px-4 sm:py-6">
            <ScheduleTab franchises={franchises} />
          </div>
        );
      case 'SERIES':
        return (
          <div className="mx-auto w-full max-w-[1440px] px-1 py-4 sm:px-4 sm:py-6">
            <SeriesTab franchises={franchises} />
          </div>
        );
      case 'PLAYOFFS':
        return <QualificationTab />;
      case 'TABLE':
        return (
          <div className="mx-auto w-full max-w-[1440px] px-1 py-4 sm:px-4 sm:py-6">
            <LeaderboardTab franchises={franchises} />
          </div>
        );
      case 'PLAYER_STATS':
        return <PlayerStatsView />;
      case 'TEAM_STATS':
        return <TeamStatsView />;
      case 'FIELD_SETUP':
        return (
          <FieldSetupDashboard
            currentFormat={selectedFormat as 'T20' | 'ODI' | 'TEST' | 'IPL'}
            teamA={team?.shortName ?? team?.name ?? 'Team A'}
            teamB={String((liveMatchState as any)?.opposingTeamName ?? 'Opponent')}
            currentOver={Number((liveMatchState as any)?.overs ?? 0)}
            currentBall={Number((liveMatchState as any)?.balls ?? 0)}
            fieldSettled={Boolean((liveMatchState as any)?.fieldSettled)}
            liveContext={liveCtx}
          />
        );
      default:
        return <ArenaDashboard />;
    }
  };

  if (!team) return null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-150px)] w-full max-w-[1720px] flex-col text-[#F6F8FC]">
      <section className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-[#102947] via-[#0D1C32] to-[#0B1A2E] shadow-xl">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setGameState(GameState.LANDING)}
              aria-label="Back to home"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#9DAEC4] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#071426]/70 p-2">
                <img src={team.logo} alt={team.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
              </div>
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-blue-300">
                    {selectedFormat || 'Cricket'} career
                  </span>
                  {isIPL && <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">Franchise mode</span>}
                  {!isIPL && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">International mode</span>}
                </div>
                <h1 className="truncate text-lg font-black tracking-tight text-white sm:text-xl">{team.name}</h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="rounded-xl border border-white/10 bg-[#071426]/45 px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#7890AE]">Squad</div>
              <div className="text-sm font-black text-white">{team.squad.length} <span className="text-[10px] font-semibold text-[#9DAEC4]">players</span></div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#071426]/45 px-3 py-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#7890AE]">Remaining purse</div>
              <div className="text-sm font-black text-amber-300">₹{(team.purse / 10000000).toFixed(1)} Cr</div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 px-2 py-2 sm:px-4">
          <nav aria-label="Career sections" className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold transition-colors sm:px-4 sm:text-[11px]',
                    isActive
                      ? 'bg-[#258BFF] text-white shadow-md shadow-blue-500/20'
                      : 'text-[#9DAEC4] hover:bg-white/5 hover:text-white'
                  )}
                >
                  {tab.label}
                  {isActive && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[#F5B82E]" />}
                </button>
              );
            })}
          </nav>
        </div>
      </section>

      <div className="mb-3">
        <React.Suspense fallback={null}>
          <TopMatchesCarousel />
          <MatchRecoveryBanner />
        </React.Suspense>
      </div>

      <main className="min-w-0 flex-1">
        <React.Suspense fallback={<PanelLoading />}>
          {renderContent()}
        </React.Suspense>
      </main>
    </div>
  );
}
