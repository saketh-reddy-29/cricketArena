import React, { useState } from 'react';
import {
  Home, Radio, Play, Trophy, Calendar, Video, User, Gavel,
  BarChart3, Award, BookmarkCheck, Save, Settings, Shield, Target, Shirt,
  Menu, X,
} from 'lucide-react';
import { useGameStore, GameState } from '../../stores/useGameStore';
import { resolveTeamLogoUrl } from '../../lib/teamLogos';
import { cn } from '../../lib/utils';

// Settings and cloud-save UI are opened rarely; keep them out of the shared
// navigation bundle until the player asks for them.
const SettingsModal = React.lazy(() => import('./SettingsModal'));
const GoogleAccountModal = React.lazy(() => import('../auth/GoogleAccountModal'));

export type NavItemKey =
  | 'home'
  | 'career'
  | 'play_now'
  | 'tournaments'
  | 'fixtures'
  | 'kits'
  | 'world_cup'
  | 'practice'
  | 'live_matches'
  | 'teams'
  | 'players'
  | 'auction'
  | 'statistics'
  | 'records'
  | 'achievements'
  | 'save_load'
  | 'settings';

export default function GlobalAppHeader() {
  const {
    gameState,
    setGameState,
    activeTab,
    setActiveTab,
    selectedFormat,
    selectedFranchiseId,
    franchises,
    fixtures,
    currentMatchId,
    liveMatchState,
    authUser,
  } = useGameStore();

  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const team = franchises.find(franchise => franchise.id === selectedFranchiseId);
  const isMatchLive = Boolean(liveMatchState && currentMatchId);

  const getActiveNavKey = (): NavItemKey => {
    if (gameState === GameState.LANDING) return 'home';
    if (gameState === GameState.PRE_MATCH) return 'play_now';
    if (gameState === GameState.MATCH_SIMULATION) return 'live_matches';
    if (gameState === GameState.AUCTION) return 'auction';
    if (gameState === GameState.PLAYERS) return 'players';
    if (gameState === GameState.TEAMS) return 'teams';
    if (gameState === GameState.STATISTICS) return 'statistics';
    if (gameState === GameState.RECORDS) return 'records';
    if (gameState === GameState.ACHIEVEMENTS) return 'achievements';
    if (gameState === GameState.SETTINGS) return 'settings';
    if (gameState === GameState.FIXTURES) return 'fixtures';
    if (gameState === GameState.KIT_LAB) return 'kits';
    if (gameState === GameState.WORLD_CUP) return 'world_cup';
    if (gameState === GameState.PRACTICE) return 'practice';

    if (gameState === GameState.ARENA_HUB) {
      if (activeTab === 'AUCTION') return 'auction';
      if (activeTab === 'MATCHES') return 'fixtures';
      if (activeTab === 'PLAYER_STATS' || activeTab === 'TEAM_STATS') return 'statistics';
      return 'career';
    }

    return 'home';
  };

  const activeKey = getActiveNavKey();

  const handleNavClick = (key: NavItemKey) => {
    setMobileMenuOpen(false);

    switch (key) {
      case 'home':
        setGameState(GameState.LANDING);
        break;
      case 'career':
        setGameState(GameState.ARENA_HUB);
        setActiveTab('OVERVIEW');
        break;
      case 'play_now': {
        const nextMatch = fixtures.find(
          fixture =>
            (fixture.team1Id === selectedFranchiseId || fixture.team2Id === selectedFranchiseId) &&
            fixture.status !== 'COMPLETED'
        );
        if (nextMatch) {
          useGameStore.getState().setCurrentMatch(nextMatch.id);
          setGameState(GameState.PRE_MATCH);
        } else {
          setGameState(GameState.ARENA_HUB);
          setActiveTab('MATCHES');
        }
        break;
      }
      case 'tournaments':
        setGameState(GameState.LANDING);
        break;
      case 'kits':
        setGameState(GameState.KIT_LAB);
        break;
      case 'world_cup':
        setGameState(GameState.WORLD_CUP);
        break;
      case 'practice':
        setGameState(GameState.PRACTICE);
        break;
      case 'fixtures':
        setGameState(GameState.FIXTURES);
        setActiveTab('MATCHES');
        break;
      case 'live_matches':
        if (currentMatchId) {
          setGameState(GameState.MATCH_SIMULATION);
        } else {
          setGameState(GameState.FIXTURES);
          setActiveTab('MATCHES');
        }
        break;
      case 'teams':
        setGameState(GameState.TEAMS);
        break;
      case 'players':
        setGameState(GameState.PLAYERS);
        break;
      case 'auction':
        setGameState(GameState.AUCTION);
        setActiveTab('AUCTION');
        break;
      case 'statistics':
        setGameState(GameState.STATISTICS);
        break;
      case 'records':
        setGameState(GameState.RECORDS);
        break;
      case 'achievements':
        setGameState(GameState.ACHIEVEMENTS);
        break;
      case 'save_load':
      case 'settings':
        setShowSettings(true);
        break;
    }
  };

  const primaryNavItems: {
    key: NavItemKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'career', label: 'Career', icon: Radio },
    { key: 'play_now', label: 'Play Now', icon: Play },
    { key: 'tournaments', label: 'Tournaments', icon: Trophy },
    { key: 'fixtures', label: 'Fixtures', icon: Calendar },
    { key: 'world_cup', label: 'World Cup', icon: Trophy },
    { key: 'practice', label: 'Practice', icon: Target },
    { key: 'kits', label: 'Kits', icon: Shirt },
    { key: 'live_matches', label: 'Live Matches', icon: Video },
    { key: 'teams', label: 'Teams', icon: Shield },
    { key: 'players', label: 'Players', icon: User },
    { key: 'auction', label: 'Auction', icon: Gavel },
    { key: 'statistics', label: 'Stats', icon: BarChart3 },
    { key: 'records', label: 'Records', icon: BookmarkCheck },
    { key: 'achievements', label: 'Trophies', icon: Award },
    { key: 'save_load', label: 'Save & Load', icon: Save },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavItem = (item: (typeof primaryNavItems)[number], compact = false) => {
    const Icon = item.icon;
    const isActive = activeKey === item.key;
    const mobileLabel =
      item.key === 'play_now' ? 'Play' :
      item.key === 'tournaments' ? 'Events' :
      item.key === 'live_matches' ? 'Live' : item.label;

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleNavClick(item.key)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex shrink-0 items-center justify-center gap-1.5 rounded-xl font-bold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          compact
            ? 'min-w-0 flex-col gap-1 px-1 py-2 text-[9px]'
            : 'px-3 py-2 text-[11px]',
          isActive
            ? 'bg-gradient-to-r from-[#258BFF] to-[#13A875] text-white shadow-md shadow-blue-500/20'
            : 'text-[#9DAEC4] hover:bg-white/5 hover:text-white'
        )}
      >
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-3.5 w-3.5', isActive ? 'text-white' : 'text-[#9DAEC4]')} />
        <span className={compact ? 'max-w-full truncate' : 'whitespace-nowrap'}>
          {compact ? mobileLabel : item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {(showSettings || showGoogleModal) && (
        <React.Suspense fallback={null}>
          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          {showGoogleModal && <GoogleAccountModal onClose={() => setShowGoogleModal(false)} />}
        </React.Suspense>
      )}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071426]/95 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            aria-label="Go to Cricket Arena home"
            className="group flex min-w-0 items-center gap-2.5 text-left sm:gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#258BFF] via-[#13A875] to-[#F5B82E] p-0.5 shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
              <span className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#071426]">
                <Trophy className="h-4 w-4 text-[#F5B82E]" />
              </span>
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="whitespace-nowrap text-sm font-black tracking-tight text-white transition-colors group-hover:text-blue-400 sm:text-base">
                  CRICKET ARENA
                </span>
                <span className="rounded border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-black text-[#258BFF]">
                  PRO
                </span>
              </span>
              <span className="hidden text-[10px] font-medium tracking-wide text-[#9DAEC4] sm:block">
                AAA Sports Simulation &amp; Management
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-3 md:flex">
            {team ? (
              <button
                type="button"
                onClick={() => handleNavClick('career')}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#10233D] px-3 py-1.5 text-left shadow-sm transition-colors hover:border-blue-500/50"
              >
                <img
                  src={resolveTeamLogoUrl(team.shortName, team.logo)}
                  alt={team.name}
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-6 object-contain"
                />
                <span>
                  <span className="block text-[10px] font-bold uppercase leading-none text-[#9DAEC4]">
                    {selectedFormat || 'IPL 2026'} Career
                  </span>
                  <span className="block text-xs font-black leading-tight text-white">{team.name}</span>
                </span>
                <span className="ml-2 border-l border-white/10 pl-2 text-right">
                  <span className="block text-[9px] leading-none text-[#9DAEC4]">Purse</span>
                  <span className="block text-xs font-black text-[#F5B82E]">
                    ₹{(team.purse / 10000000).toFixed(1)}Cr
                  </span>
                </span>
              </button>
            ) : (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[#9DAEC4]">
                No Career Selected
              </span>
            )}

            {isMatchLive && (
              <button
                type="button"
                onClick={() => handleNavClick('live_matches')}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-red-300 transition-colors hover:bg-red-500/30"
              >
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span>Match in Progress</span>
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {authUser ? (
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                aria-label="Open account and cloud save"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white transition-colors hover:bg-white/15"
              >
                <img
                  src={authUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.name)}`}
                  alt=""
                  width={20}
                  height={20}
                  loading="lazy"
                  decoding="async"
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="hidden max-w-[100px] truncate font-bold sm:inline">{authUser.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-[#9DAEC4] transition-colors hover:bg-white/10 hover:text-white"
              >
                Sign In
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings and cloud save"
              title="Settings & Cloud Save"
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#9DAEC4] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav aria-label="Main navigation" className="mx-auto max-w-[1720px] px-2 py-1.5 sm:px-4">
          <div className="hidden items-center gap-1 overflow-x-auto md:flex">
            {primaryNavItems.map(item => renderNavItem(item))}
          </div>

          <div className="grid grid-cols-[repeat(6,minmax(0,1fr))] gap-1 md:hidden">
            {primaryNavItems.slice(0, 5).map(item => renderNavItem(item, true))}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(open => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="arena-mobile-more-nav"
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold uppercase tracking-wide text-[#9DAEC4] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span>{mobileMenuOpen ? 'Close' : 'More'}</span>
            </button>
          </div>

          {mobileMenuOpen && (
            <div
              id="arena-mobile-more-nav"
              className="mt-2 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-[#0D1C32] p-2 md:hidden"
            >
              {primaryNavItems.slice(5).map(item => renderNavItem(item, true))}
            </div>
          )}
        </nav>
      </header>
    </>
  );
}
