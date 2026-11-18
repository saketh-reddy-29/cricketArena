import React from 'react';
import {
  Trophy, Zap, Globe, Shield, Play, Sparkles, ChevronRight,
  CalendarDays, Users, Target, ArrowUpRight, Clock3, Radio,
} from 'lucide-react';
import { useGameStore, GameState, ArenaFormat } from '../stores/useGameStore';
import { useArenaStore } from '../stores/useArenaStore';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const MatchRecoveryBanner = React.lazy(() => import('./common/MatchRecoveryBanner'));

const FORMATS = [
  {
    id: 'IPL' as ArenaFormat,
    title: 'IPL Franchise',
    subtitle: 'Build a dynasty',
    icon: Zap,
    theme: 'blue',
    description: 'Own a franchise, run the mega auction, manage your purse and assemble a title-winning squad.',
    details: ['Mega auction', 'Purse & squad strategy', 'Full league season'],
    accent: 'from-blue-500/20 via-blue-500/5 to-transparent',
    iconStyle: 'bg-blue-500/15 text-blue-300 ring-blue-400/20',
    labelStyle: 'text-blue-300',
  },
  {
    id: 'T20' as ArenaFormat,
    title: 'T20 Internationals',
    subtitle: 'Play at full throttle',
    icon: Trophy,
    theme: 'emerald',
    description: 'Lead a national team through explosive short-format cricket and high-pressure finishes.',
    details: ['20-over matches', 'National squad selection', 'World Cup pathway'],
    accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    iconStyle: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
    labelStyle: 'text-emerald-300',
  },
  {
    id: 'ODI' as ArenaFormat,
    title: 'ODI Internationals',
    subtitle: 'Master the long game',
    icon: Globe,
    theme: 'sky',
    description: 'Balance batting depth, bowling plans and fielding restrictions across a 50-over contest.',
    details: ['50-over matches', '15-player squad', 'Series & standings'],
    accent: 'from-sky-500/20 via-sky-500/5 to-transparent',
    iconStyle: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
    labelStyle: 'text-sky-300',
  },
  {
    id: 'TEST' as ArenaFormat,
    title: 'Test Cricket',
    subtitle: 'Earn every session',
    icon: Shield,
    theme: 'rose',
    description: 'Plan for five days of cricket with patient batting, bowling rotations and changing conditions.',
    details: ['Five-day matches', 'Four-innings format', 'Series championship'],
    accent: 'from-rose-500/20 via-rose-500/5 to-transparent',
    iconStyle: 'bg-rose-500/15 text-rose-300 ring-rose-400/20',
    labelStyle: 'text-rose-300',
  },
];

export default function LandingPage() {
  const { setGameState, setFormat, resetGame, selectedFranchiseId } = useGameStore();
  const { arenas, loadArena } = useArenaStore();

  const handleSelectFormat = (format: ArenaFormat) => {
    resetGame();
    setFormat(format);
    setGameState(GameState.TEAM_SELECTION);
  };

  const handleLoadArena = (arena: (typeof arenas)[number]) => {
    loadArena(arena.id);
    setFormat(arena.format);
    if (arena.status === 'AUCTION') {
      useGameStore.getState().setActiveTab('AUCTION');
    }
    setGameState(GameState.ARENA_HUB);
  };

  if (selectedFranchiseId) {
    return (
      <React.Suspense fallback={<div className="min-h-[35vh]" />}>
        <HomePage />
      </React.Suspense>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-7 pb-8 sm:space-y-9">
      <React.Suspense fallback={null}>
        <MatchRecoveryBanner />
      </React.Suspense>

      <section className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0A1A2D] shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(37,139,255,0.22),transparent_45%),radial-gradient(ellipse_at_10%_100%,rgba(19,168,117,0.12),transparent_40%)]" />
        <div className="pointer-events-none absolute -right-20 top-10 hidden h-80 w-80 rounded-full border border-white/[0.04] lg:block" />
        <div className="pointer-events-none absolute -right-5 top-25 hidden h-52 w-52 rounded-full border border-white/[0.05] lg:block" />

        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-10">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Your cricket universe starts here
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl">
              TAKE THE FIELD.
              <span className="mt-1 block gold-gradient-text">OWN THE GAME.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[#A8B9CF] sm:text-base">
              Build your squad, make the calls from the dugout and experience every delivery in your own cricket world.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#game-modes"
                className="inline-flex items-center gap-2 rounded-xl bg-[#258BFF] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]"
              >
                Choose game mode <ChevronRight className="h-4 w-4" />
              </a>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#839AB7]">
                <Radio className="h-4 w-4 text-emerald-400" />
                3D match-day experience
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="col-span-2 rounded-2xl border border-white/10 bg-[#071426]/65 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7890AE]">Your journey</div>
                  <div className="mt-1 text-base font-black text-white sm:text-lg">From the first pick to the final ball</div>
                </div>
                <Trophy className="h-7 w-7 shrink-0 text-amber-300" />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  { number: '01', label: 'Format' },
                  { number: '02', label: 'Team' },
                  { number: '03', label: 'Squad' },
                  { number: '04', label: 'Play' },
                ].map((step, index) => (
                  <div key={step.number} className="relative min-w-0">
                    <div className="mb-2 flex items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-[9px] font-black text-blue-200">{step.number}</span>
                      {index < 3 && <span className="ml-1 h-px flex-1 bg-white/10" />}
                    </div>
                    <div className="truncate text-[10px] font-bold text-[#A8B9CF]">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#071426]/65 p-4">
              <Users className="mb-3 h-5 w-5 text-blue-300" />
              <div className="text-xl font-black text-white">11</div>
              <div className="mt-0.5 text-[10px] font-semibold text-[#839AB7]">Players on the field</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#071426]/65 p-4">
              <Target className="mb-3 h-5 w-5 text-emerald-300" />
              <div className="text-xl font-black text-white">Every ball</div>
              <div className="mt-0.5 text-[10px] font-semibold text-[#839AB7]">Tactics &amp; match flow</div>
            </div>
          </div>
        </div>
      </section>

      {arenas.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">Pick up where you left off</div>
              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Continue your career</h2>
            </div>
            <div className="text-[10px] font-semibold text-[#7890AE]">{arenas.length} saved {arenas.length === 1 ? 'career' : 'careers'}</div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {arenas.map(arena => (
              <button
                key={arena.id}
                type="button"
                onClick={() => handleLoadArena(arena)}
                className="group flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-[#0D1C32]/90 p-4 text-left transition-colors hover:border-emerald-400/40 hover:bg-[#10233D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#071426] text-amber-300">
                  <Trophy className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-300">{arena.format}</span>
                    <span className="h-1 w-1 rounded-full bg-[#55708F]" />
                    <span className="truncate text-[9px] font-semibold text-[#7890AE]">{arena.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="truncate text-sm font-black text-white">{arena.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-[#839AB7]">
                    <Clock3 className="h-3 w-3" />
                    Updated {new Date(arena.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#7890AE] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-300" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section id="game-modes" className="scroll-mt-32 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-300">Choose your challenge</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Select a game mode</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-[#839AB7] sm:text-sm">Every format has its own squad rules, strategy and path to the title.</p>
          </div>
          <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#7890AE] sm:inline-flex">
            <CalendarDays className="h-4 w-4" />
            Choose once. Build your season.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {FORMATS.map((format, index) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => handleSelectFormat(format.id)}
                className="group relative flex min-h-[270px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1C32] p-5 text-left shadow-lg transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[#10233D] hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B82E]"
              >
                <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70', format.accent)} />
                <div className="relative flex h-full flex-col">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl ring-1', format.iconStyle)}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-lg border border-white/10 bg-[#071426]/55 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#A8B9CF]">
                      0{index + 1}
                    </span>
                  </div>

                  <div className={cn('text-[9px] font-black uppercase tracking-[0.16em]', format.labelStyle)}>{format.subtitle}</div>
                  <h3 className="mt-1 text-lg font-black tracking-tight text-white">{format.title}</h3>
                  <p className="mt-2 flex-1 text-[11px] leading-5 text-[#A1B4CB]">{format.description}</p>

                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                    {format.details.map(detail => (
                      <div key={detail} className="flex items-center gap-2 text-[10px] font-semibold text-[#C3D0DF]">
                        <span className={cn('h-1.5 w-1.5 rounded-full', format.theme === 'blue' ? 'bg-blue-400' : format.theme === 'emerald' ? 'bg-emerald-400' : format.theme === 'sky' ? 'bg-sky-400' : 'bg-rose-400')} />
                        {detail}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">Enter mode</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors group-hover:bg-[#258BFF]">
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
