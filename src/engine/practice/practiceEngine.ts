/**
 * Net-practice engine (pure). Produces DeliveryResult objects that the normal 3D action pipeline plays, but
 * with NO match scoring, no fixtures and no effect on any competition.
 *
 *  BATTING nets: the machine bowls (line / length / pace picked or random), the player chooses the shot.
 *  BOWLING nets: the player chooses line / length / pace, a simple batter AI responds.
 * Outcomes depend on how well the shot suits the ball (timing roll) - deterministic for a given rng.
 */
import type { DeliveryResult, DeliveryResultType } from '../../types/delivery';

export type Line = 'OFF' | 'MIDDLE' | 'LEG';
export type Length = 'YORKER' | 'FULL' | 'GOOD' | 'SHORT';
export type Pace = 'FAST' | 'MEDIUM' | 'SPIN';
export type ShotKey = 'DEFEND' | 'STRAIGHT_DRIVE' | 'COVER_DRIVE' | 'ON_DRIVE' | 'PULL' | 'CUT' | 'SWEEP' | 'FLICK' | 'LOFTED';

export const SHOTS: { key: ShotKey; label: string; shotType: string }[] = [
  { key: 'DEFEND', label: 'Defend', shotType: 'Forward Defence' },
  { key: 'STRAIGHT_DRIVE', label: 'Straight drive', shotType: 'Straight Drive' },
  { key: 'COVER_DRIVE', label: 'Cover drive', shotType: 'Cover Drive' },
  { key: 'ON_DRIVE', label: 'On drive', shotType: 'On Drive' },
  { key: 'PULL', label: 'Pull', shotType: 'Pull' },
  { key: 'CUT', label: 'Square cut', shotType: 'Square Cut' },
  { key: 'SWEEP', label: 'Sweep', shotType: 'Sweep' },
  { key: 'FLICK', label: 'Flick', shotType: 'Flick' },
  { key: 'LOFTED', label: 'Lofted', shotType: 'Lofted Drive' },
];

/** Direction the ball is hit in the 2D field map (x, y); y+ = down the ground toward the bowler. Right-hander. */
const DIR: Record<ShotKey, [number, number]> = {
  DEFEND: [0.05, 0.4], STRAIGHT_DRIVE: [0, 1], COVER_DRIVE: [-0.75, 0.66], ON_DRIVE: [0.55, 0.83],
  PULL: [0.95, 0.15], CUT: [-1, -0.1], SWEEP: [0.9, -0.3], FLICK: [0.8, -0.55], LOFTED: [0.15, 1],
};

/** How well a shot suits each length (1 = ideal, 0 = very poor). */
const SUIT: Record<ShotKey, Record<Length, number>> = {
  DEFEND: { YORKER: 0.9, FULL: 0.9, GOOD: 0.85, SHORT: 0.6 },
  STRAIGHT_DRIVE: { YORKER: 0.25, FULL: 1, GOOD: 0.65, SHORT: 0.2 },
  COVER_DRIVE: { YORKER: 0.2, FULL: 1, GOOD: 0.6, SHORT: 0.2 },
  ON_DRIVE: { YORKER: 0.25, FULL: 0.95, GOOD: 0.6, SHORT: 0.2 },
  PULL: { YORKER: 0.05, FULL: 0.1, GOOD: 0.35, SHORT: 1 },
  CUT: { YORKER: 0.05, FULL: 0.2, GOOD: 0.4, SHORT: 1 },
  SWEEP: { YORKER: 0.1, FULL: 0.5, GOOD: 0.85, SHORT: 0.3 },
  FLICK: { YORKER: 0.3, FULL: 0.8, GOOD: 0.75, SHORT: 0.3 },
  LOFTED: { YORKER: 0.15, FULL: 0.9, GOOD: 0.55, SHORT: 0.3 },
};
/** Flicks / on-drives / pulls want leg-side lines; cuts / cover drives want off-side lines. */
const lineFit = (shot: ShotKey, line: Line): number => {
  const leg = shot === 'FLICK' || shot === 'ON_DRIVE' || shot === 'SWEEP' || shot === 'PULL';
  const off = shot === 'CUT' || shot === 'COVER_DRIVE';
  if (leg) return line === 'LEG' ? 1 : line === 'MIDDLE' ? 0.85 : 0.55;
  if (off) return line === 'OFF' ? 1 : line === 'MIDDLE' ? 0.85 : 0.55;
  return line === 'MIDDLE' ? 1 : 0.85;
};
const POWER: Record<ShotKey, number> = { DEFEND: 0, STRAIGHT_DRIVE: 0.8, COVER_DRIVE: 0.85, ON_DRIVE: 0.8, PULL: 0.9, CUT: 0.85, SWEEP: 0.7, FLICK: 0.7, LOFTED: 1 };

export interface NetBall {
  id: string; ballNumber: number;
  shot: ShotKey; line: Line; length: Length; pace: Pace;
  rng: () => number;
  strikerName: string; nonStrikerName: string; bowlerName: string;
}

const LINE_X: Record<Line, number> = { OFF: 288, MIDDLE: 300, LEG: 312 };
const LEN_BOUNCE_Y: Record<Length, number> = { YORKER: 218, FULL: 250, GOOD: 290, SHORT: 335 };
const STRIKER_Y = 190;
const CENTRE = { x: 300, y: 300 };
const ROPE_PX = 268;

/** Distance along a unit direction from (x0,y0) to just beyond the rope (circle about the centre). */
function distToBeyondRope(x0: number, y0: number, ux: number, uy: number): number {
  const px = x0 - CENTRE.x, py = y0 - CENTRE.y;
  const b = px * ux + py * uy;
  const c = px * px + py * py - (ROPE_PX + 22) * (ROPE_PX + 22);
  return -b + Math.sqrt(Math.max(0, b * b - c));
}

export interface NetOutcome {
  kind: 'MISS' | 'DEFENDED' | 'RUNS' | 'WICKET';
  runs: number;
  wicketType?: 'Bowled' | 'Caught' | 'LBW';
  quality: number;   // 0..1 how well it was middled
}

/** Pure outcome model: how the shot meets the ball. */
export function resolveNetBall(b: Pick<NetBall, 'shot' | 'line' | 'length' | 'pace' | 'rng'>): NetOutcome {
  const fit = SUIT[b.shot][b.length] * lineFit(b.shot, b.line) * (b.pace === 'SPIN' && (b.shot === 'PULL' || b.shot === 'CUT') ? 0.8 : 1);
  const quality = Math.max(0, Math.min(1, fit * 0.75 + b.rng() * 0.35));
  if (b.shot === 'DEFEND') {
    if (quality < 0.28) return { kind: 'WICKET', runs: 0, wicketType: b.length === 'YORKER' ? 'Bowled' : 'LBW', quality };
    return { kind: 'DEFENDED', runs: 0, quality };
  }
  if (quality < 0.22) return { kind: b.rng() < 0.55 ? 'WICKET' : 'MISS', runs: 0, wicketType: b.length === 'FULL' || b.length === 'YORKER' ? 'Bowled' : 'Caught', quality };
  if (quality < 0.38) {
    return b.rng() < 0.35 && POWER[b.shot] >= 0.85
      ? { kind: 'WICKET', runs: 0, wicketType: 'Caught', quality }       // mistimed big hit
      : { kind: 'RUNS', runs: 1, quality };
  }
  const power = POWER[b.shot] * quality;
  const runs = power > 0.72 ? (b.shot === 'LOFTED' || b.shot === 'PULL' ? 6 : 4) : power > 0.5 ? 4 : power > 0.36 ? 2 : 1;
  return { kind: 'RUNS', runs, quality };
}

const RESULT_TYPE: Record<number, DeliveryResultType> = { 0: 'DOT', 1: 'SINGLE', 2: 'TWO', 3: 'THREE', 4: 'FOUR', 6: 'SIX' };

export function buildNetDelivery(b: NetBall): { delivery: DeliveryResult; outcome: NetOutcome } {
  const outcome = resolveNetBall(b);
  const shot = SHOTS.find((s) => s.key === b.shot)!;
  const [dx, dy] = DIR[b.shot];
  const norm = Math.hypot(dx, dy) || 1;
  const ux = dx / norm, uy = dy / norm;
  const dist = outcome.kind === 'RUNS'
    ? (outcome.runs >= 4 ? distToBeyondRope(300, STRIKER_Y, ux, uy) : outcome.runs === 2 ? 120 : 75)
    : outcome.kind === 'WICKET' ? 60 : 30;
  const aerial = outcome.kind === 'WICKET' ? outcome.wicketType === 'Caught' : outcome.runs === 6 || (b.shot === 'LOFTED' && outcome.runs > 0);
  const target = { x: 300 + ux * dist, y: STRIKER_Y + uy * dist };
  if (outcome.kind === 'MISS') { target.x = 300; target.y = STRIKER_Y - 25; }    // beaten: the ball carries through to the keeper
  const runs = outcome.kind === 'RUNS' ? outcome.runs : 0;
  const resultType: DeliveryResultType = outcome.kind === 'WICKET' ? 'WICKET' : RESULT_TYPE[runs] ?? 'DOT';
  const delivery = {
    id: b.id, ballNumber: b.ballNumber, overIndex: Math.floor((b.ballNumber - 1) / 6), ballInOver: ((b.ballNumber - 1) % 6) + 1,
    strikerId: 'net_striker', strikerName: b.strikerName, nonStrikerId: 'net_nonstriker', nonStrikerName: b.nonStrikerName,
    bowlerId: 'net_bowler', bowlerName: b.bowlerName,
    legalBall: true, batterRuns: runs, extraRuns: 0, totalRuns: runs,
    wicket: outcome.kind === 'WICKET', wicketType: outcome.kind === 'WICKET' ? outcome.wicketType : undefined,
    dismissedPlayerId: outcome.kind === 'WICKET' ? 'net_striker' : undefined, dismissedPlayerName: outcome.kind === 'WICKET' ? b.strikerName : undefined,
    shotType: shot.shotType, targetZone: shot.label, resultType,
    commentary: describeNetBall(b, outcome), timestamp: 0, strikeRotated: false, overCompleted: false,
    ballPath: {
      start: { x: 300, y: 410 }, bounce: { x: LINE_X[b.line], y: LEN_BOUNCE_Y[b.length] }, contact: { x: 300, y: STRIKER_Y + 5 }, target,
      isAerial: aerial, apexHeight: aerial ? (outcome.runs === 6 ? 11 : 7) : 0,
    },
  } as unknown as DeliveryResult;
  return { delivery, outcome };
}

export function describeNetBall(b: Pick<NetBall, 'shot' | 'line' | 'length' | 'pace'>, o: NetOutcome): string {
  const shot = SHOTS.find((s) => s.key === b.shot)!.label.toLowerCase();
  const ball = `${b.length.toLowerCase()} ${b.line.toLowerCase()}-stump ${b.pace === 'SPIN' ? 'spinner' : b.pace.toLowerCase() + ' ball'}`;
  if (o.kind === 'WICKET') return `Out! ${o.wicketType} - the ${shot} to a ${ball} did not come off.`;
  if (o.kind === 'MISS') return `Beaten! A ${shot} to a ${ball}, no contact.`;
  if (o.kind === 'DEFENDED') return `Solidly defended: a ${ball}.`;
  return o.runs >= 4 ? `${o.runs}! A well-timed ${shot} to a ${ball}.` : `${o.runs} run${o.runs > 1 ? 's' : ''} - ${shot} to a ${ball}.`;
}

/** Bowling nets: the shot a simple batter AI plays against the ball. */
export function batterResponse(length: Length, line: Line, pace: Pace, rng: () => number): ShotKey {
  if (length === 'YORKER') return rng() < 0.7 ? 'DEFEND' : 'LOFTED';
  if (length === 'SHORT') return line === 'OFF' ? 'CUT' : 'PULL';
  if (length === 'FULL') return line === 'LEG' ? 'ON_DRIVE' : line === 'OFF' ? 'COVER_DRIVE' : 'STRAIGHT_DRIVE';
  if (pace === 'SPIN') return rng() < 0.5 ? 'SWEEP' : 'DEFEND';
  return line === 'LEG' ? 'FLICK' : line === 'OFF' ? (rng() < 0.5 ? 'CUT' : 'DEFEND') : 'DEFEND';
}

export interface NetStats { balls: number; runs: number; fours: number; sixes: number; wickets: number; dots: number }
export const emptyNetStats = (): NetStats => ({ balls: 0, runs: 0, fours: 0, sixes: 0, wickets: 0, dots: 0 });
export function addToNetStats(s: NetStats, o: NetOutcome): NetStats {
  return {
    balls: s.balls + 1, runs: s.runs + o.runs, fours: s.fours + (o.runs === 4 ? 1 : 0), sixes: s.sixes + (o.runs === 6 ? 1 : 0),
    wickets: s.wickets + (o.kind === 'WICKET' ? 1 : 0), dots: s.dots + (o.runs === 0 && o.kind !== 'WICKET' ? 1 : 0),
  };
}

/** Small deterministic RNG (mulberry32) so practice sessions are reproducible in tests. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
