import React, { useState } from 'react';
import {
  Home, Radio, Play, Trophy, Calendar, Video, User, Gavel,
  BarChart3, Award, BookmarkCheck, Save, Settings, Shield, Target, Shirt,
  Menu, X, ChevronDown,
} from 'lucide-react';
import { useGameStore, GameState } from '../../stores/useGameStore';
import { resolveTeamLogoUrl } from '../../lib/teamLogos';
import { cn } from '../../lib/utils';

const SettingsModal = React.lazy(() => import('./SettingsModal'));
const GoogleAccountModal = React.lazy(() => import('../auth/GoogleAccountModal'));

export type NavItemKey =
  | 'home' | 'career' | 'play_now' | 'tournaments' | 'fixtures'
  | 'kits' | 'world_cup' | 'practice' | 'live_matches' | 'teams'
  | 'players' | 'auction' | 'statistics' | 'records' | 'achievements'
  | 'save_load' | 'settings';

type NavItem = {
  key: NavItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel?: string;
};

const PRIMARY_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'career', label: 'Career', icon: Radio },
  { key: 'play_now', label: 'Play Match', shortLabel: 'Play', icon: Play },
  { key: 'live_matches', label: 'Live Match', shortLabel: 'Live', icon: Video },
];

const MORE_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Competitions',
    items: [
      { key: 'tournaments', label: 'Tournaments', icon: Trophy },
      { key: 'fixtures', label: 'Fixtures & Results', icon: Calendar },
      { key: 'world_cup', label: 'World Cup', icon: Trophy },
      { key: 'practice', label: 'Practice Nets', icon: Target },
    ],
  },
  {
    title: 'Team Management',
    items: [
      { key: 'teams', label: 'Teams', icon: Shield },
      { key: 'players', label: 'Players', icon: User },
      { key: 'auction', label: 'Player Auction', icon: Gavel },
      { key: 'kits', label: 'Kit Studio', icon: Shirt },
    ],
  },
  {
    title: 'Stats & Records',
    items: [
      { key: 'statistics', label: 'Statistics', icon: BarChart3 },
      { key: 'records', label: 'Records', icon: BookmarkCheck },
      { key: 'achievements', label: 'Achievements', icon: Award },
    ],
  },
  {
    title: 'Account',
    items: [
      { key: 'save_load', label: 'Save & Load', icon: Save },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

const MORE_ITEMS = MORE_GROUPS.flatMap(group => group.items);

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
  const [moreOpen, setMoreOpen] = useState(false);

  const team = franchises.find(franchise => franchise.id === selectedFranchiseId);
  const isMatchLive = Boolean(liveMatchState && currentMatchId);

  const getActiveNavKey = (): NavItemKey => {
    if (gameState === GameState.LANDING) return 'home';
    if (
      gameState === GameState.TEAM_SELECTION ||
      gameState === GameState.BOARD_SELECTION ||
      gameState === GameState.PLAYING_XI_BUILDER ||
      gameState === GameState.PRE_MATCH
    ) return 'play_now';
    if (gameState === GameState.MATCH_SIMULATION || gameState === GameState.MATCH_RESULT) return 'live_matches';
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
  const activeInMore = MORE_ITEMS.some(item => item.key === activeKey);

  const handleNavClick = (key: NavItemKey) => {
    setMoreOpen(false);

    switch (key) {
      case 'home':
      case 'tournaments':
        setGameState(GameState.LANDING);
        break;
      case 'career':
        setGameState(GameState.ARENA_HUB);
        setActiveTab('OVERVIEW');
        break;
      case 'play_now': {
        if (liveMatchState && currentMatchId) {
          setGameState(GameState.MATCH_SIMULATION);
          break;
        }
        const nextMatch = fixtures.find(
          fixture =>
            (fixture.team1Id === selectedFranchiseId || fixture.team2Id === selectedFranchiseId) &&
            fixture.status !== 'COMPLETED'
        );
        if (nextMatch) {
          useGameStore.getState().setCurrentMatch(nextMatch.id);
          setGameState(GameState.PRE_MATCH);
        } else if (!selectedFranchiseId) {
          setGameState(GameState.LANDING);
        } else {
          setGameState(GameState.ARENA_HUB);
          setActiveTab('MATCHES');
        }
        break;
      }
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

  const renderNavItem = (item: NavItem, compact = false, menuItem = false) => {
    const Icon = item.icon;
    const isActive = activeKey === item.key;

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleNavClick(item.key)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex shrink-0 items-center rounded-xl font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]',
          compact
            ? 'min-w-0 flex-col justify-center gap-1 px-1 py-2 text-[9px]'
            : menuItem ? 'w-full justify-start gap-2 px-3 py-2 text-[11px]' : 'gap-2 px-3 py-2 text-[11px]',
          isActive
            ? 'bg-gradient-to-r from-[#258BFF] to-[#13A875] text-white shadow-md shadow-blue-500/20'
            : 'text-[#9DAEC4] hover:bg-white/5 hover:text-white'
        )}
      >
        <Icon className={cn(compact ? 'h-4 w-4' : 'h-4 w-4', isActive ? 'text-white' : 'text-[#9DAEC4]')} />
        <span className={compact ? 'max-w-full truncate' : 'whitespace-nowrap'}>{compact ? (item.shortLabel || item.label) : item.label}</span>
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
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 sm:px-4 lg:px-6">
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
                <span className="whitespace-nowrap text-sm font-black tracking-tight text-white transition-colors group-hover:text-blue-400 sm:text-base">CRICKET ARENA</span>
                <span className="rounded border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-black text-[#258BFF]">PRO</span>
              </span>
              <span className="hidden text-[10px] font-medium tracking-wide text-[#9DAEC4] sm:block">AAA Sports Simulation &amp; Management</span>
            </span>
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            {team ? (
              <button
                type="button"
                onClick={() => handleNavClick('career')}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#10233D] px-3 py-1.5 text-left transition-colors hover:border-blue-500/50"
              >
                <img src={resolveTeamLogoUrl(team.shortName, team.logo)} alt={team.name} width={24} height={24} loading="lazy" decoding="async" className="h-6 w-6 object-contain" />
                <span>
                  <span className="block text-[10px] font-bold uppercase leading-none text-[#9DAEC4]">{selectedFormat || 'IPL'} Career</span>
                  <span className="block text-xs font-black leading-tight text-white">{team.name}</span>
                </span>
                <span className="ml-2 border-l border-white/10 pl-2 text-right">
                  <span className="block text-[9px] leading-none text-[#9DAEC4]">Purse</span>
                  <span className="block text-xs font-black text-[#F5B82E]">₹{(team.purse / 10000000).toFixed(1)}Cr</span>
                </span>
              </button>
            ) : (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#9DAEC4]">No career selected</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isMatchLive && (
              <button
                type="button"
                onClick={() => handleNavClick('live_matches')}
                className="hidden items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-300 transition-colors hover:bg-red-500/25 sm:flex"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                Resume live match
              </button>
            )}
            {authUser ? (
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                aria-label="Open account and cloud save"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-white/15"
              >
                <img src={authUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.name)}`} alt="" width={20} height={20} loading="lazy" decoding="async" className="h-5 w-5 rounded-full object-cover" />
                <span className="hidden max-w-[100px] truncate font-bold sm:inline">{authUser.name}</span>
              </button>
            ) : (
              <button type="button" onClick={() => setShowGoogleModal(true)} className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-[#9DAEC4] transition-colors hover:bg-white/10 hover:text-white">Sign In</button>
            )}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings and cloud save"
              title="Settings & Cloud Save"
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#9DAEC4] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav aria-label="Main navigation" className="relative mx-auto hidden max-w-[1720px] items-center justify-between gap-2 px-4 py-2 md:flex lg:px-6">
          <div className="flex min-w-0 items-center gap-1.5">
            {PRIMARY_ITEMS.map(item => renderNavItem(item))}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen(open => !open)}
              aria-expanded={moreOpen}
              aria-controls="arena-more-menu"
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]',
                moreOpen || activeInMore
                  ? 'border-blue-400/40 bg-blue-500/15 text-white'
                  : 'border-white/10 bg-white/5 text-[#9DAEC4] hover:bg-white/10 hover:text-white'
              )}
            >
              {moreOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              More
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', moreOpen && 'rotate-180')} />
            </button>
            {moreOpen && (
              <div id="arena-more-menu" className="absolute right-0 top-[calc(100%+0.65rem)] z-[60] grid w-[min(760px,calc(100vw-2rem))] grid-cols-4 gap-3 rounded-2xl border border-white/10 bg-[#0B1A2E] p-4 shadow-2xl">
                {MORE_GROUPS.map(group => (
                  <div key={group.title} className="min-w-0">
                    <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#6F89A8]">{group.title}</div>
                    <div className="space-y-1">
                      {group.items.map(item => renderNavItem(item, false, true))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#071426]/95 px-2 pt-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden">
        <nav aria-label="Mobile game navigation" className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {PRIMARY_ITEMS.filter(item => item.key !== 'fixtures').map(item => renderNavItem(item, true))}
          <button
            type="button"
            onClick={() => setMoreOpen(open => !open)}
            aria-expanded={moreOpen}
            aria-controls="arena-mobile-more-menu"
            className={cn(
              'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold transition-colors',
              moreOpen || activeInMore ? 'bg-blue-500/15 text-white' : 'text-[#9DAEC4] hover:bg-white/5 hover:text-white'
            )}
          >
            {moreOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>More</span>
          </button>
        </nav>
      </div>

      {moreOpen && (
        <div
          id="arena-mobile-more-menu"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[80] grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0B1A2E] p-4 shadow-2xl md:hidden"
        >
          {MORE_GROUPS.map(group => (
            <section key={group.title} className="min-w-0">
              <h2 className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#6F89A8]">{group.title}</h2>
              <div className="space-y-1">
                {group.items.map(item => renderNavItem(item, false, true))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
