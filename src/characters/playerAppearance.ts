/**
 * Per-player appearance derived from the player's own data: batting hand, bowling arm / style and height.
 * The match data has no height field, so height is a stable value derived from the name (and role) - the same
 * player is always the same height. All scaling is uniform, so the GLB proportions are never distorted.
 */
export type BowlingKind = 'FAST' | 'MEDIUM' | 'SPIN';

export const MODEL_NOMINAL_CM = 182;   // the supplied GLB reads as a 182 cm adult at scale 1

export function isLeftHandedBat(style?: string | null): boolean {
  return /left/i.test(style ?? '') && !/right/i.test(style ?? '');
}

/** 'Right-arm fast', 'Left-arm orthodox', 'Right-arm off break', 'Legbreak googly', 'Medium' ... */
export function bowlingKindOf(style?: string | null): { kind: BowlingKind; leftArm: boolean } {
  const s = (style ?? '').toLowerCase();
  const leftArm = /left/.test(s) && !/right/.test(s);
  if (/spin|orthodox|break|googly|chinaman|leg ?spin|off ?spin|slow/.test(s)) return { kind: 'SPIN', leftArm };
  if (/medium|seam|swing|military/.test(s)) return { kind: 'MEDIUM', leftArm };
  return { kind: 'FAST', leftArm };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Height in cm: 168-196, fast bowlers tend taller, keepers / spinners a little shorter. */
export function heightCmFor(name?: string | null, role?: string | null, bowling?: BowlingKind): number {
  const base = 168 + (hash(String(name ?? 'player')) % 25);              // 168..192
  const bias = bowling === 'FAST' ? 4 : bowling === 'SPIN' ? -1 : 0;
  const r = /keeper/i.test(role ?? '') ? -3 : 0;
  return Math.max(160, Math.min(200, base + bias + r));
}

export const heightScale = (cm: number): number => cm / MODEL_NOMINAL_CM;
