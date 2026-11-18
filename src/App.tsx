import React from 'react';
import { useGameStore, GameState } from './stores/useGameStore';
import GlobalAppHeader from './components/common/GlobalAppHeader';

// Keep the application shell small: each destination is downloaded only when
// the player opens it. In particular, the 3D match renderer and auction room
// no longer inflate the first dashboard request.
const LandingPage = React.lazy(() => import('./components/LandingPage'));
const AuctionRoom = React.lazy(() => import('./components/AuctionRoom'));
const LiveMatchCenter = React.lazy(() => import('./components/LiveMatchCenter'));
const PlayersView = React.lazy(() => import('./components/PlayersView'));
const TeamsView = React.lazy(() => import('./components/TeamsView'));
const PreMatch = React.lazy(() => import('./components/PreMatch'));
const MatchResultView = React.lazy(() => import('./components/MatchResultView'));
const TeamSelection = React.lazy(() => import('./components/TeamSelection'));
const BoardSelection = React.lazy(() => import('./components/BoardSelection'));
const ArenaHub = React.lazy(() => import('./components/ArenaHub'));
const PlayingXIBuilder = React.lazy(() => import('./components/PlayingXIBuilder'));
const PlayerProfileModal = React.lazy(() => import('./components/PlayerProfileModal'));
const StatisticsView = React.lazy(() => import('./components/pages/StatisticsView'));
const RecordsView = React.lazy(() => import('./components/pages/RecordsView'));
const AchievementsView = React.lazy(() => import('./components/pages/AchievementsView'));
const FixturesView = React.lazy(() => import('./components/pages/FixturesView'));
const KitSelectView = React.lazy(() => import('./components/pages/KitSelectView'));
const WorldCupView = React.lazy(() => import('./components/pages/WorldCupView'));
const PracticeView = React.lazy(() => import('./components/pages/PracticeView'));

function PageLoading() {
  return (
    <div
      className="grid min-h-[42vh] place-items-center px-6 py-12"
      role="status"
      aria-live="polite"
      aria-label="Loading Cricket Arena"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-[#F5B82E]" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9DAEC4]">
          Preparing your arena
        </span>
      </div>
    </div>
  );
}

const ROUTE_STATES = [
  GameState.LANDING,
  GameState.TEAM_SELECTION,
  GameState.BOARD_SELECTION,
  GameState.ARENA_HUB,
  GameState.PLAYING_XI_BUILDER,
  GameState.PRE_MATCH,
  GameState.MATCH_SIMULATION,
  GameState.MATCH_RESULT,
  GameState.AUCTION,
  GameState.PLAYERS,
  GameState.TEAMS,
  GameState.STATISTICS,
  GameState.RECORDS,
  GameState.ACHIEVEMENTS,
  GameState.FIXTURES,
  GameState.KIT_LAB,
  GameState.WORLD_CUP,
  GameState.PRACTICE,
];

export default function App() {
  const { gameState, viewedPlayerId, setViewedPlayer, players, franchises } = useGameStore();

  const viewedPlayer = viewedPlayerId ? players.find(player => player.id === viewedPlayerId) : null;
  const viewedPlayerFranchise = viewedPlayer
    ? franchises.find(franchise => franchise.squad.includes(viewedPlayer.id))?.id
    : undefined;

  // The live match owns the entire viewport; the shared header is intentionally hidden.
  const isFullScreenMatch = gameState === GameState.MATCH_SIMULATION;

  return (
    <div className="arena-app-shell min-h-screen bg-[#071426] text-[#F6F8FC] font-sans bg-stadium-pattern flex flex-col selection:bg-[#258BFF] selection:text-white">
      {viewedPlayer && (
        <React.Suspense fallback={null}>
          <PlayerProfileModal
            player={viewedPlayer}
            franchiseId={viewedPlayerFranchise}
            onClose={() => setViewedPlayer(null)}
          />
        </React.Suspense>
      )}

      {!isFullScreenMatch && <GlobalAppHeader />}

      <main className="arena-app-main flex-1 min-w-0 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-28 sm:pt-6 md:pb-6">
        <React.Suspense fallback={<PageLoading />}>
          {gameState === GameState.LANDING && <LandingPage />}
          {gameState === GameState.TEAM_SELECTION && <TeamSelection />}
          {gameState === GameState.BOARD_SELECTION && <BoardSelection />}
          {gameState === GameState.ARENA_HUB && <ArenaHub />}
          {gameState === GameState.PLAYING_XI_BUILDER && <PlayingXIBuilder />}
          {gameState === GameState.PRE_MATCH && <PreMatch />}
          {gameState === GameState.MATCH_SIMULATION && <LiveMatchCenter />}
          {gameState === GameState.MATCH_RESULT && <MatchResultView />}
          {gameState === GameState.AUCTION && <AuctionRoom />}
          {gameState === GameState.PLAYERS && <PlayersView />}
          {gameState === GameState.TEAMS && <TeamsView />}
          {gameState === GameState.STATISTICS && <StatisticsView />}
          {gameState === GameState.RECORDS && <RecordsView />}
          {gameState === GameState.ACHIEVEMENTS && <AchievementsView />}
          {gameState === GameState.FIXTURES && <FixturesView />}
          {gameState === GameState.KIT_LAB && <KitSelectView />}
          {gameState === GameState.WORLD_CUP && <WorldCupView />}
          {gameState === GameState.PRACTICE && <PracticeView />}

          {!ROUTE_STATES.includes(gameState) && (
            <div className="flex min-h-[60vh] items-center justify-center text-white">
              <div className="max-w-md rounded-3xl border border-white/10 bg-[#10233D] p-8 text-center">
                <h1 className="mb-2 text-2xl font-black text-white">Cricket Arena Pavilion</h1>
                <p className="mb-6 text-xs text-[#9DAEC4]">
                  Return to the main tournament hub to continue your career.
                </p>
                <button
                  type="button"
                  onClick={() => useGameStore.getState().setGameState(GameState.LANDING)}
                  className="rounded-xl bg-[#258BFF] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Back to Pavilion
                </button>
              </div>
            </div>
          )}
        </React.Suspense>
      </main>
    </div>
  );
}
