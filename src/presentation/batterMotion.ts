/**
 * Pure maths for batter movement between the wickets and after a wicket.
 * World axes: +z = striker's end, -z = bowler's end (see src/3d/worldScale.ts).
 */
export type TransitionKind = 'WICKET' | 'RUNS';
export interface BatterTransition { kind: TransitionKind; progress: number; runs: number }

export type BatterAction = 'sprintBat' | 'jog' | 'defeat' | 'batIdle' | 'idle';

/** Pavilion gate side of the ground where dismissed batters leave and new batters enter. */
export const PAVILION_EXIT: [number, number] = [-28, 6];

/** How long (ms) the batter movement lasts at a given playback multiplier (1 = normal). */
export function transitionDurationMs(kind: TransitionKind, runs: number, speedMult: number): number {
  const r = Math.min(3, Math.max(1, runs));
  return (kind === 'WICKET' ? 6500 : 2300 * r + 500) / Math.max(0.1, speedMult);
}

/** Playback speed setting (0 skip, 1, 1.5, 2.5 ...) -> time multiplier. 0 means no movement phase. */
export function speedToMultiplier(speed: number): number {
  return speed === 1 ? 1 : speed === 1.5 ? 1.4 : 2.2;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const tri = (x: number) => { const m = x % 2; return m <= 1 ? m : 2 - m; };

export interface BatterMotion {
  sPos: [number, number]; sYaw: number; sAct: BatterAction; sVisible: boolean;
  nPos: [number, number]; nYaw: number; nAct: BatterAction;
  incoming: { pos: [number, number]; yaw: number; action: BatterAction } | null;
}

export function computeBatterMotion(
  tr: BatterTransition | null | undefined,
  strikerWorld: [number, number],
  nonStrikerWorld: [number, number],
  baseStrikerAction: BatterAction = 'batIdle',
  baseNonStrikerAction: BatterAction = 'idle'
): BatterMotion {
  const m: BatterMotion = {
    sPos: strikerWorld, sYaw: Math.PI, sAct: baseStrikerAction, sVisible: true,   // striker faces the bowler (-z)
    nPos: nonStrikerWorld, nYaw: 0, nAct: baseNonStrikerAction,                  // non-striker faces +z
    incoming: null,
  };
  if (!tr) return m;

  if (tr.kind === 'RUNS') {
    const x = clamp01(tr.progress) * tr.runs;
    const f = tri(x);
    m.sPos = [lerp(strikerWorld[0], nonStrikerWorld[0], f), lerp(strikerWorld[1], nonStrikerWorld[1], f)];
    m.nPos = [lerp(nonStrikerWorld[0], strikerWorld[0], f), lerp(nonStrikerWorld[1], strikerWorld[1], f)];
    const leg = Math.min(tr.runs - 1, Math.floor(x));
    const towardBowler = leg % 2 === 0;
    m.sYaw = towardBowler ? Math.PI : 0;
    m.nYaw = towardBowler ? 0 : Math.PI;
    m.sAct = 'sprintBat';
    m.nAct = 'sprintBat';
  } else {
    const t = clamp01(tr.progress);
    const p1 = clamp01(t / 0.88);
    m.sPos = [lerp(strikerWorld[0], PAVILION_EXIT[0], p1), lerp(strikerWorld[1], PAVILION_EXIT[1], p1)];
    m.sYaw = Math.atan2(PAVILION_EXIT[0] - strikerWorld[0], PAVILION_EXIT[1] - strikerWorld[1]);
    m.sAct = t < 0.1 ? 'defeat' : 'jog';
    m.sVisible = t < 0.93;
    if (t > 0.1) {
      const p2 = clamp01((t - 0.1) / 0.9);
      const e = p2 * p2 * (3 - 2 * p2);
      m.incoming = {
        pos: [lerp(PAVILION_EXIT[0], strikerWorld[0], e), lerp(PAVILION_EXIT[1], strikerWorld[1], e)],
        yaw: p2 < 1 ? Math.atan2(strikerWorld[0] - PAVILION_EXIT[0], strikerWorld[1] - PAVILION_EXIT[1]) : Math.PI,
        action: p2 < 1 ? 'jog' : 'batIdle',
      };
    }
  }
  return m;
}
