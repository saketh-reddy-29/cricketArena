import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Globe, Shield, Play, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import { useGameStore, GameState, ArenaFormat } from '../stores/useGameStore';
import { useArenaStore } from '../stores/useArenaStore';
import { cn } from '../lib/utils';
import HomePage from './pages/HomePage';
import MatchRecoveryBanner from './common/MatchRecoveryBanner';

const FORMATS = [
  {
    id: 'IPL' as ArenaFormat,
    title: 'IPL Franchise',
    icon: Zap,
    color: 'from-blue-600 to-indigo-700',
    accentBorder: 'border-blue-500/30',
    description: 'Auction-based squad building. Manage your purse, bid on players, and build a dynasty under overseas player restrictions.',
    features: ['Mega Auction', 'Purse Management', 'Overseas Rules']
  },
  {
    id: 'ODI' as ArenaFormat,
    title: 'ODI Internationals',
    icon: Globe,
    color: 'from-sky-600 to-blue-700',
    accentBorder: 'border-sky-500/30',
    description: 'Lead a National Board. Select a perfectly balanced 15-man squad capable of sustaining 50 overs of intense cricket.',
    features: ['Board Selection', '15-man Squads', '50-Over Balance']
  },
  {
    id: 'T20' as ArenaFormat,
    title: 'T20 Internationals',
    icon: Trophy,
    color: 'from-emerald-600 to-teal-700',
    accentBorder: 'border-emerald-500/30',
    description: 'Fast-paced T20 World Cup mode. Prioritize strike rates, death bowling, and extreme power-hitting.',
    features: ['Board Selection', 'Power Hitters', 'Death Bowling']
  },
  {
    id: 'TEST' as ArenaFormat,
    title: 'Test Matches',
    icon: Shield,
    color: 'from-rose-600 to-red-800',
    accentBorder: 'border-rose-500/30',
    description: 'The ultimate format. Requires immense batting depth, bowling endurance, and specialist roles to survive 5 days.',
    features: ['Board Selection', 'Batting Patience', 'Bowling Endurance']
  }
];

export default function LandingPage() {
  const { setGameState, setFormat, selectedFormat, resetGame, selectedFranchiseId } = useGameStore();
  const { arenas, loadArena } = useArenaStore();

  const handleSelectFormat = (format: ArenaFormat) => {
    resetGame();
    setFormat(format);
    setGameState(GameState.TEAM_SELECTION);
  };

  // If a career is already in progress, show the rich Home experience first with format selection available below
  return (
    <div className="space-y-10">
      {/* If an active team/career is selected, render the Home dashboard */}
      {selectedFranchiseId ? (
        <HomePage />
      ) : (
        /* Otherwise, show the Welcome & Format Selection stage */
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-5xl">
            <MatchRecoveryBanner />
          </div>
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative mb-12 w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(ellipse_at_75%_10%,rgba(37,99,235,.22),transparent_42%),linear-gradient(135deg,#102746_0%,#08182d_58%,#071426_100%)] px-6 py-10 text-center shadow-2xl sm:px-12 sm:py-14"
          >
            <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative mx-auto flex max-w-3xl flex-col items-center">
              <motion.img
                src="/cricket-arena-logo.svg"
                alt="Cricket Arena crest"
                className="mb-5 h-24 w-24 drop-shadow-[0_12px_32px_rgba(234,179,8,.2)] sm:h-28 sm:w-28"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">A new era of franchise cricket</span>
              </div>
              <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Build a dynasty.
                <span className="mt-2 block bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Ball by ball.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-300 sm:text-base">
                Own the auction room. Shape your playing XI. Make the calls that define a franchise — then take your team onto a living 3D cricket ground.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                {['10 IPL franchises','Player auction & trades','Four-season mega auction','Orbit + Drone match views'].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold tracking-wide text-slate-200 sm:text-xs">{item}</span>
                ))}
              </div>
              <div className="mt-8 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Choose your format. Start your story.
              </div>
            </div>
          </motion.section>

          {/* Arenas Saved List */}
          {arenas.length > 0 && (
            <div className="mb-12 w-full max-w-5xl">
              <h2 className="text-sm font-black text-[#9DAEC4] uppercase tracking-wider mb-4 px-1">
                Saved Careers & Arenas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {arenas.map((arena, i) => (
                  <motion.button
                    key={arena.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      loadArena(arena.id);
                      setFormat(arena.format);
                      if (arena.status === 'AUCTION') {
                        useGameStore.getState().setActiveTab('AUCTION');
                        setGameState(GameState.ARENA_HUB);
                      } else {
                        setGameState(GameState.ARENA_HUB);
                      }
                    }}
                    className="glass-card rounded-2xl p-5 text-left flex flex-col justify-between border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-blue-400 tracking-wider uppercase">{arena.format}</span>
                        <span className="text-[10px] text-[#9DAEC4]">{new Date(arena.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-base font-black text-white mb-1">{arena.name}</h3>
                      <p className="text-xs text-[#9DAEC4]">Team: {arena.userTeamId}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-xs font-semibold text-[#9DAEC4]">Status: {arena.status}</span>
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Formats Grid */}
          <div className="w-full max-w-6xl">
            <div className="text-xs font-black text-[#9DAEC4] uppercase tracking-wider mb-4 px-1 text-center sm:text-left">
              Select Competition Format to Begin Career
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {FORMATS.map((format, index) => (
                <motion.button
                  key={format.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectFormat(format.id)}
                  className="glass-card rounded-3xl p-6 text-left border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group shadow-xl"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br text-white shadow-lg",
                    format.color
                  )}>
                    <format.icon className="w-7 h-7" />
                  </div>

                  <h2 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {format.title}
                  </h2>
                  
                  <p className="text-xs text-[#9DAEC4] leading-relaxed font-medium mb-6 flex-1">
                    {format.description}
                  </p>

                  <div className="space-y-2 mt-auto">
                    {format.features.map(feature => (
                      <div key={feature} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-[10px] font-bold text-[#9DAEC4] uppercase tracking-wider">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                      Start Tournament
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#258BFF] group-hover:text-white transition-all">
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
