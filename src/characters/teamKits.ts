/**
 * Centralised national / franchise kit configuration for the 3D players.
 *
 * Every kit is expressed through the same slots the zone-recolour shader understands
 * (src/lib/cricketArenaColors.js): jersey, sleeves, collar, pants, socks, shoes, accent,
 * gloves, pads + helmet / grille / bat parts. Skin, hair and face are never part of a kit.
 *
 * resolveKit(team, format, variant) -> the colours for one team in one format.
 * New countries are added by appending one entry to COUNTRY_KITS.
 */

export type KitFormat = 'TEST' | 'ODI' | 'T20';
export type KitVariant = 'home' | 'away';
export type KitRole = 'batter' | 'keeper' | 'fielder' | 'umpire';

export interface KitSlots {
  jersey: string;
  sleeves: string;
  collar: string;
  pants: string;
  socks: string;
  shoes: string;
  accent: string;
  gloves: string;
  pads: string;
  helmet: string;
  grille: string;
  batHandle: string;
  batGrip: string;
  batBlade: string;
}

export interface CountryKit {
  id: string;
  name: string;
  flag: string;
  aliases: string[];
  /** Identity colours */
  primary: string;
  secondary: string;
  accent: string;
  /** ODI trouser colour (defaults to primary) */
  trousers?: string;
  /** T20 sleeve colour-block (defaults to secondary) */
  t20Sleeves?: string;
  /** T20 collar (defaults to accent) */
  t20Collar?: string;
  /** Colour of the white-ball shoes (defaults to white) */
  shoes?: string;
  /** Test-whites trim (defaults to primary) */
  testTrim?: string;
}

export interface ResolvedKit {
  teamId: string;
  teamName: string;
  flag: string;
  format: KitFormat;
  variant: KitVariant;
  /** Team identity colours (for UI accents, home colours) */
  identity: { primary: string; secondary: string; accent: string };
  slots: KitSlots;
}

const WHITE = '#f4f4f1';
const SILVER = '#c9ced6';
const SKIN = '#dca98a';

export const COUNTRY_KITS: CountryKit[] = [
  { id: 'IND', name: 'India', flag: '🇮🇳', aliases: ['INDIA', 'IND', 'TEAM INDIA'],
    primary: '#1e56c8', secondary: '#0b2a66', accent: '#ff9933', trousers: '#1e56c8', t20Sleeves: '#0b2a66', t20Collar: '#ff9933' },
  { id: 'AUS', name: 'Australia', flag: '🇦🇺', aliases: ['AUSTRALIA', 'AUS'],
    primary: '#f2b705', secondary: '#0b5d2a', accent: '#ffffff', trousers: '#0b5d2a', t20Sleeves: '#0b5d2a', t20Collar: '#0b5d2a' },
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', aliases: ['ENGLAND', 'ENG'],
    primary: '#0b1f55', secondary: '#2563c9', accent: '#c8102e', trousers: '#0b1f55', t20Sleeves: '#2563c9', t20Collar: '#c8102e' },
  { id: 'PAK', name: 'Pakistan', flag: '🇵🇰', aliases: ['PAKISTAN', 'PAK'],
    primary: '#0a5c2b', secondary: '#19b36b', accent: '#ffffff', trousers: '#0a5c2b', t20Sleeves: '#19b36b', t20Collar: '#ffffff' },
  { id: 'SA', name: 'South Africa', flag: '🇿🇦', aliases: ['SOUTH AFRICA', 'SA', 'RSA'],
    primary: '#0b6b3a', secondary: '#ffc20e', accent: '#ffffff', trousers: '#0b6b3a', t20Sleeves: '#ffc20e', t20Collar: '#ffc20e' },
  { id: 'NZ', name: 'New Zealand', flag: '🇳🇿', aliases: ['NEW ZEALAND', 'NZ', 'BLACKCAPS'],
    primary: '#111214', secondary: '#3a3d42', accent: '#e6e8ec', trousers: '#111214', t20Sleeves: '#3a3d42', t20Collar: '#e6e8ec', shoes: '#e6e8ec' },
  { id: 'SL', name: 'Sri Lanka', flag: '🇱🇰', aliases: ['SRI LANKA', 'SL', 'SRILANKA'],
    primary: '#1e56c8', secondary: '#0b2a66', accent: '#ffc20e', trousers: '#0b2a66', t20Sleeves: '#ffc20e', t20Collar: '#ffc20e' },
  { id: 'BAN', name: 'Bangladesh', flag: '🇧🇩', aliases: ['BANGLADESH', 'BAN'],
    primary: '#0b6b3a', secondary: '#c8102e', accent: '#ffffff', trousers: '#0b6b3a', t20Sleeves: '#c8102e', t20Collar: '#c8102e' },
  { id: 'WI', name: 'West Indies', flag: '🏝️', aliases: ['WEST INDIES', 'WI', 'WINDIES'],
    primary: '#6d0f1f', secondary: '#3b1260', accent: '#f5b800', trousers: '#2a0a12', t20Sleeves: '#3b1260', t20Collar: '#f5b800' },
  { id: 'AFG', name: 'Afghanistan', flag: '🇦🇫', aliases: ['AFGHANISTAN', 'AFG'],
    primary: '#1e5fd0', secondary: '#c8102e', accent: '#ffffff', trousers: '#1e5fd0', t20Sleeves: '#0b8a3f', t20Collar: '#c8102e' },
  { id: 'ZIM', name: 'Zimbabwe', flag: '🇿🇼', aliases: ['ZIMBABWE', 'ZIM'],
    primary: '#d42a2a', secondary: '#0b8a3f', accent: '#ffd23f', trousers: '#1a1a1a', t20Sleeves: '#0b8a3f', t20Collar: '#ffd23f' },
  { id: 'IRE', name: 'Ireland', flag: '🇮🇪', aliases: ['IRELAND', 'IRE'],
    primary: '#0b8a3f', secondary: '#ffffff', accent: '#ff8200', trousers: '#0b8a3f', t20Sleeves: '#ffffff', t20Collar: '#ff8200' },
  { id: 'NED', name: 'Netherlands', flag: '🇳🇱', aliases: ['NETHERLANDS', 'NED', 'HOLLAND'],
    primary: '#ff6a00', secondary: '#0b1f55', accent: '#ffffff', trousers: '#0b1f55', t20Sleeves: '#0b1f55', t20Collar: '#ffffff' },
  { id: 'NEP', name: 'Nepal', flag: '🇳🇵', aliases: ['NEPAL', 'NEP'],
    primary: '#b3122a', secondary: '#1e56c8', accent: '#ffffff', trousers: '#b3122a', t20Sleeves: '#1e56c8', t20Collar: '#ffffff' },
  // Kits built from the national flag colours for the remaining playable countries
  { id: 'SCO', name: 'Scotland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', aliases: ['SCOTLAND', 'SCO'],
    primary: '#0a3a8c', secondary: '#ffffff', accent: '#ffffff', trousers: '#0a3a8c', t20Sleeves: '#ffffff', t20Collar: '#ffffff' },
  { id: 'NAM', name: 'Namibia', flag: '🇳🇦', aliases: ['NAMIBIA', 'NAM'],
    primary: '#1d4fb5', secondary: '#c8102e', accent: '#2fa84f', trousers: '#1d4fb5', t20Sleeves: '#c8102e', t20Collar: '#2fa84f' },
];

/** Franchise (IPL-style) palettes so league matches keep distinct, coordinated kits. */
const FRANCHISE_KITS: Array<{ keys: string[]; primary: string; secondary: string; accent: string }> = [
  { keys: ['MUMBAI INDIANS', 'MI'], primary: '#1e56c8', secondary: '#0b2a66', accent: '#d4af37' },
  { keys: ['CHENNAI SUPER KINGS', 'CSK'], primary: '#f2c200', secondary: '#1b3a8a', accent: '#ffffff' },
  { keys: ['ROYAL CHALLENGERS', 'RCB'], primary: '#c8102e', secondary: '#111111', accent: '#d4af37' },
  { keys: ['KOLKATA KNIGHT RIDERS', 'KKR'], primary: '#4b2e83', secondary: '#2a1650', accent: '#d4af37' },
  { keys: ['DELHI CAPITALS', 'DC'], primary: '#1b57c8', secondary: '#c8102e', accent: '#ffffff' },
  { keys: ['PUNJAB KINGS', 'PBKS'], primary: '#d42a2a', secondary: '#8f1d1d', accent: '#e6e8ec' },
  { keys: ['RAJASTHAN ROYALS', 'RR'], primary: '#e8449a', secondary: '#1b3a8a', accent: '#ffffff' },
  { keys: ['SUNRISERS HYDERABAD', 'SRH'], primary: '#f26a1b', secondary: '#111111', accent: '#ffffff' },
  { keys: ['GUJARAT TITANS', 'GT'], primary: '#1b2a4f', secondary: '#0e1830', accent: '#c9a24a' },
  { keys: ['LUCKNOW SUPER GIANTS', 'LSG'], primary: '#19a7c9', secondary: '#0b3a66', accent: '#f2c200' },
];

const norm = (s: string | undefined | null) => String(s ?? '').trim().toUpperCase().replace(/\s+/g, ' ');

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

function findCountry(name: string): CountryKit | undefined {
  const n = norm(name);
  return COUNTRY_KITS.find((k) => k.aliases.includes(n) || norm(k.name) === n);
}

function countryFor(name: string): CountryKit {
  const found = findCountry(name);
  if (found) return found;
  const fr = FRANCHISE_KITS.find((f) => f.keys.some((k) => norm(name) === k || norm(name).includes(k) && k.length > 3));
  if (fr) {
    return { id: norm(name), name, flag: '', aliases: [], primary: fr.primary, secondary: fr.secondary, accent: fr.accent,
      trousers: fr.secondary, t20Sleeves: fr.secondary, t20Collar: fr.accent };
  }
  // Unknown team: deterministic palette from the name so it is stable and distinct
  const h = hashHue(norm(name) || 'TEAM');
  const primary = hslToHex(h, 0.7, 0.42);
  const secondary = hslToHex((h + 200) % 360, 0.6, 0.2);
  const accent = hslToHex((h + 40) % 360, 0.9, 0.62);
  return { id: norm(name) || 'TEAM', name: name || 'Team', flag: '', aliases: [], primary, secondary, accent,
    trousers: secondary, t20Sleeves: secondary, t20Collar: accent };
}

/** Normalise any format string used by the game ('IPL' is a T20 league). */
export function toKitFormat(format?: string | null): KitFormat {
  const f = norm(format);
  if (f === 'TEST') return 'TEST';
  if (f === 'ODI') return 'ODI';
  return 'T20';
}

/**
 * Build the slot colours for a team. This is the single place that decides what each
 * format looks like:
 *  - TEST: traditional whites, team-coloured collar/trim and helmet
 *  - ODI : the country's colours, collar in the secondary colour
 *  - T20 : stronger colour-blocking - contrasting sleeves, collar and trim
 */
export function resolveKit(team: string, format?: string | null, variant: KitVariant = 'home'): ResolvedKit {
  const c = countryFor(team);
  const fmt = toKitFormat(format);
  const away = variant === 'away';
  // Away strip: swap to the secondary colour, unless primary and secondary are close in colour
  // (two blues, black/charcoal ...) - then the accent becomes the away shirt so the strip really differs.
  const awayJersey = colourDistance(c.primary, c.secondary) < 150 ? c.accent : c.secondary;
  const primary = away ? awayJersey : c.primary;
  const secondary = away ? c.primary : c.secondary;
  const accent = away ? (awayJersey === c.accent ? c.secondary : c.accent) : c.accent;
  const trousers = away ? c.secondary : c.trousers ?? c.primary;

  const common = { grille: SILVER, batHandle: '#222222', batGrip: accent, batBlade: '#d9a55a' };
  let slots: KitSlots;

  if (fmt === 'TEST') {
    const trim = away ? c.secondary : c.testTrim ?? c.primary;
    slots = {
      jersey: WHITE, sleeves: WHITE, collar: trim, pants: WHITE, socks: WHITE, shoes: WHITE,
      accent: trim, gloves: WHITE, pads: WHITE, helmet: trim, ...common,
    };
  } else if (fmt === 'ODI') {
    slots = {
      jersey: primary, sleeves: primary, collar: secondary, pants: trousers, socks: secondary, shoes: c.shoes ?? WHITE,
      accent, gloves: accent, pads: WHITE, helmet: primary, ...common,
    };
  } else {
    slots = {
      jersey: primary, sleeves: away ? c.primary : c.t20Sleeves ?? secondary, collar: away ? accent : c.t20Collar ?? accent,
      pants: trousers, socks: secondary, shoes: c.shoes ?? WHITE, accent, gloves: accent, pads: WHITE,
      helmet: secondary, ...common,
    };
  }

  return {
    teamId: c.id, teamName: c.name, flag: c.flag, format: fmt, variant,
    identity: { primary: c.primary, secondary: c.secondary, accent: c.accent },
    slots,
  };
}

/** Per-role adjustments: bare hands on the model without gloves, keeper gloves/pads. */
export function applyRole(kit: ResolvedKit, role: KitRole, hasPadsModel: boolean): { slots: KitSlots; helmet: boolean } {
  const slots = { ...kit.slots };

  // The umpire is an official, not a member of either playing side. Keep the
  // same model/rig but override every visible clothing zone with a neutral
  // white shirt, dark trousers and white shoes in every match format.
  if (role === 'umpire') {
    Object.assign(slots, {
      jersey: WHITE,
      sleeves: WHITE,
      collar: '#172033',
      pants: '#111827',
      socks: '#111827',
      shoes: '#f8fafc',
      accent: '#172033',
      gloves: hasPadsModel ? WHITE : SKIN,
      pads: WHITE,
      helmet: WHITE,
      grille: SILVER,
    });
    return { slots, helmet: false };
  }

  if (!hasPadsModel) slots.gloves = SKIN; // 'cartoon_character' has bare hands
  if (role === 'keeper' && kit.format === 'TEST') slots.gloves = WHITE;
  return { slots, helmet: role === 'batter' || role === 'keeper' };
}

// ---------- colour helpers used to keep both sides readable on screen ----------
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Perceptual-ish distance between two hex colours (0 = identical, ~441 = black/white). */
export function colourDistance(a: string, b: string): number {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/**
 * Decide the kit variants for a fixture so two teams never wear near-identical shirts
 * (e.g. India vs Sri Lanka, Pakistan vs Bangladesh). Batting side keeps home colours.
 */
export function pickVariants(teamA: string, teamB: string, format?: string | null): { batting: KitVariant; bowling: KitVariant } {
  const a = resolveKit(teamA, format, 'home').slots.jersey;
  const b = resolveKit(teamB, format, 'home').slots.jersey;
  if (colourDistance(a, b) >= 110) return { batting: 'home', bowling: 'home' };
  const bAway = resolveKit(teamB, format, 'away').slots.jersey;
  if (colourDistance(a, bAway) >= 110) return { batting: 'home', bowling: 'away' };
  return { batting: 'home', bowling: 'away' };
}

export const SKIN_TONE = SKIN;

/** Stable jersey number (1-99) derived from the player's name - the match data carries no shirt numbers. */
export function jerseyNumberFor(name: string | undefined): number {
  const n = String(name ?? '');
  let h = 7;
  for (let i = 0; i < n.length; i++) h = (h * 33 + n.charCodeAt(i)) >>> 0;
  return (h % 99) + 1;
}

/** Surname in capitals for the back of the shirt. */
export function jerseyNameFor(name: string | undefined): string {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  return (parts.length ? parts[parts.length - 1] : '').toUpperCase().slice(0, 12);
}

/** Every team the kit system knows by name (countries first, then franchises) - used by the kit preview. */
export const KIT_TEAM_NAMES: string[] = [
  ...COUNTRY_KITS.map((k) => k.name),
  ...FRANCHISE_KITS.map((f) => f.keys[0].split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')),
];
