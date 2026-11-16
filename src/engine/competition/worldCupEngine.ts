/**
 * World Cup engine (pure, no store access): groups -> points table (points, wins, NRR) -> semi-finals -> final.
 *
 *  - 4-5 teams : one group, the top four play the semi-finals (1v4, 2v3)
 *  - 6-16 teams: two groups (snake-seeded from the order given), top two of each go through (A1vB2, B1vA2)
 *  - A tied / no-result knockout is decided in favour of the higher group seed.
 * Fixtures are ordinary store Fixtures, so they are played / simulated by the same match engine as every other mode.
 */
import { Fixture, InningsData, MatchStatus, MatchFormat } from '../../types/match';
import { inferFixtureResult } from './seriesEngine';

export type WorldCupFormat = 'T20' | 'ODI';

export interface WorldCupConfig {
  id: string;
  name: string;
  format: WorldCupFormat;
  teamIds: string[];
  /** group letter -> team ids (in seed order) */
  groups: Record<string, string[]>;
  createdAt: number;
}

export interface WorldCupRow {
  teamId: string; group: string;
  played: number; won: number; lost: number; tied: number; noResult: number;
  points: number; nrr: number;
  runsScored: number; oversFaced: number; runsConceded: number; oversBowled: number;
  form: Array<'W' | 'L' | 'T'>;
}
export type WorldCupStatus = { stage: 'GROUP' | 'SEMI_FINAL' | 'FINAL' | 'COMPLETE'; championId?: string };

export const WC_MIN_TEAMS = 4;
export const WC_MAX_TEAMS = 16;
const DAY_MS = 86_400_000;

export function createWorldCupConfig(input: { name?: string; format: WorldCupFormat; teamIds: string[]; id?: string; createdAt?: number }): WorldCupConfig {
  const teamIds = [...new Set(input.teamIds)];
  if (teamIds.length < WC_MIN_TEAMS) throw new Error(`A World Cup needs at least ${WC_MIN_TEAMS} teams.`);
  if (teamIds.length > WC_MAX_TEAMS) throw new Error(`A World Cup can have at most ${WC_MAX_TEAMS} teams.`);
  const groups: Record<string, string[]> = {};
  if (teamIds.length <= 5) {
    groups.A = teamIds;
  } else {
    groups.A = []; groups.B = [];
    // snake seeding: A, B, B, A, A, B, B, A ...
    teamIds.forEach((id, i) => { (Math.floor(i / 1) % 4 === 0 || i % 4 === 3 ? groups.A : groups.B).push(id); });
    // re-balance so the groups differ in size by at most one
    while (groups.A.length - groups.B.length > 1) groups.B.push(groups.A.pop()!);
    while (groups.B.length - groups.A.length > 1) groups.A.push(groups.B.pop()!);
  }
  const createdAt = input.createdAt ?? Date.now();
  return {
    id: input.id ?? `wc_${createdAt}`,
    name: input.name?.trim() || `${input.format} World Cup`,
    format: input.format, teamIds, groups, createdAt,
  };
}

/** Round-robin pairings by the circle method (handles odd team counts with a bye). */
export function roundRobin(ids: string[]): Array<[string, string]> {
  const list: Array<string | null> = [...ids];
  if (list.length % 2) list.push(null);
  const n = list.length; const out: Array<[string, string]> = [];
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a && b) out.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    list.splice(1, 0, list.pop()!);
  }
  return out;
}

const toFormat = (f: WorldCupFormat) => (f === 'ODI' ? MatchFormat.ODI : MatchFormat.T20);

function fixture(cfg: WorldCupConfig, id: string, n: number, t1: string, t2: string, extra: Partial<Fixture>): Fixture {
  const start = cfg.createdAt + n * DAY_MS;
  return {
    id: `${cfg.id}_${id}`, matchNumber: n, day: extra.day ?? n, team1Id: t1, team2Id: t2,
    status: MatchStatus.UPCOMING, fixtureStatus: 'SCHEDULED', format: toFormat(cfg.format),
    startTime: start, endTime: start + (cfg.format === 'ODI' ? 8 : 4) * 3_600_000, tournamentId: cfg.id, ...extra,
  };
}

export function generateGroupFixtures(cfg: WorldCupConfig): Fixture[] {
  const perGroup = Object.entries(cfg.groups).map(([g, ids]) => ({ g, games: roundRobin(ids) }));
  const out: Fixture[] = []; let n = 1;
  const rounds = Math.max(...perGroup.map((x) => x.games.length));
  // A match-day is one round of each group: the store only lets the current match-day's fixtures be simulated.
  const perRound = (ids: string[]) => Math.max(1, Math.floor(ids.length / 2));
  for (let i = 0; i < rounds; i++) {                       // interleave the groups so the schedule alternates
    for (const { g, games } of perGroup) {
      if (!games[i]) continue;
      const day = Math.floor(i / perRound(cfg.groups[g])) + 1;
      out.push(fixture(cfg, `g${g}${i + 1}`, n++, games[i][0], games[i][1], { stage: 'GROUP', group: g, day }));
    }
  }
  return out;
}

const oversOf = (i: InningsData) => i.overs + i.balls / 6;

export function computeGroupTables(cfg: WorldCupConfig, fixtures: Fixture[]): Record<string, WorldCupRow[]> {
  const rows: Record<string, WorldCupRow> = {};
  for (const [g, ids] of Object.entries(cfg.groups)) for (const id of ids) {
    rows[id] = { teamId: id, group: g, played: 0, won: 0, lost: 0, tied: 0, noResult: 0, points: 0, nrr: 0, runsScored: 0, oversFaced: 0, runsConceded: 0, oversBowled: 0, form: [] };
  }
  for (const f of fixtures) {
    if (f.tournamentId !== cfg.id || f.stage !== 'GROUP' || f.status !== MatchStatus.COMPLETED) continue;
    const a = rows[f.team1Id], b = rows[f.team2Id];
    if (!a || !b) continue;
    const { result, winnerId } = inferFixtureResult(f);
    const inn = f.scorecard?.innings ?? [];
    const sum = (team: string, fn: (i: InningsData) => number) => inn.filter((i) => i.battingTeamId === team).reduce((s, i) => s + fn(i), 0);
    a.played++; b.played++;
    if (result === 'WIN' && winnerId && rows[winnerId]) {
      const w = rows[winnerId], l = winnerId === f.team1Id ? b : a;
      w.won++; w.points += 2; w.form.push('W'); l.lost++; l.form.push('L');
    } else if (result === 'TIE') {
      a.tied++; b.tied++; a.points++; b.points++; a.form.push('T'); b.form.push('T');
    } else { a.noResult++; b.noResult++; a.points++; b.points++; }       // draw / no result: a point each
    if (result !== 'NO_RESULT') {
      a.runsScored += sum(f.team1Id, (i) => i.runs); a.oversFaced += sum(f.team1Id, oversOf);
      a.runsConceded += sum(f.team2Id, (i) => i.runs); a.oversBowled += sum(f.team2Id, oversOf);
      b.runsScored += sum(f.team2Id, (i) => i.runs); b.oversFaced += sum(f.team2Id, oversOf);
      b.runsConceded += sum(f.team1Id, (i) => i.runs); b.oversBowled += sum(f.team1Id, oversOf);
    }
  }
  const tables: Record<string, WorldCupRow[]> = {};
  for (const g of Object.keys(cfg.groups)) {
    tables[g] = cfg.groups[g].map((id) => {
      const r = rows[id];
      const nrr = r.oversFaced > 0 && r.oversBowled > 0 ? Math.round((r.runsScored / r.oversFaced - r.runsConceded / r.oversBowled) * 1000) / 1000 : 0;
      return { ...r, nrr, form: r.form.slice(-5) };
    }).sort((x, y) => y.points - x.points || y.won - x.won || y.nrr - x.nrr || cfg.teamIds.indexOf(x.teamId) - cfg.teamIds.indexOf(y.teamId));
  }
  return tables;
}

export function isGroupStageComplete(cfg: WorldCupConfig, fixtures: Fixture[]): boolean {
  const group = fixtures.filter((f) => f.tournamentId === cfg.id && f.stage === 'GROUP');
  const expected = Object.values(cfg.groups).reduce((s, ids) => s + (ids.length * (ids.length - 1)) / 2, 0);
  return group.length === expected && group.every((f) => f.status === MatchStatus.COMPLETED);
}

/** Qualifiers in semi-final order: [SF1 team1, SF1 team2, SF2 team1, SF2 team2]. */
export function semiFinalists(cfg: WorldCupConfig, tables: Record<string, WorldCupRow[]>): string[] {
  if (tables.B) return [tables.A[0].teamId, tables.B[1].teamId, tables.B[0].teamId, tables.A[1].teamId];   // A1 v B2, B1 v A2
  const t = tables.A.map((r) => r.teamId);
  return [t[0], t[3], t[1], t[2]];                                                                           // 1 v 4, 2 v 3
}

/** Seed used to break a tied / no-result knockout: lower = better (group position, then group A first). */
function seedOf(cfg: WorldCupConfig, tables: Record<string, WorldCupRow[]>, teamId: string): number {
  for (const [g, rows] of Object.entries(tables)) {
    const i = rows.findIndex((r) => r.teamId === teamId);
    if (i >= 0) return i * 10 + (g === 'A' ? 0 : 1);
  }
  return 999;
}

export function knockoutWinner(cfg: WorldCupConfig, tables: Record<string, WorldCupRow[]>, f: Fixture): string | undefined {
  if (f.status !== MatchStatus.COMPLETED) return undefined;
  const { result, winnerId } = inferFixtureResult(f);
  if (result === 'WIN' && winnerId) return winnerId;
  return seedOf(cfg, tables, f.team1Id) <= seedOf(cfg, tables, f.team2Id) ? f.team1Id : f.team2Id;
}

export function getWorldCupStatus(cfg: WorldCupConfig, fixtures: Fixture[]): WorldCupStatus {
  const mine = fixtures.filter((f) => f.tournamentId === cfg.id);
  const final = mine.find((f) => f.stage === 'FINAL');
  const tables = computeGroupTables(cfg, mine);
  if (final?.status === MatchStatus.COMPLETED) return { stage: 'COMPLETE', championId: knockoutWinner(cfg, tables, final) };
  if (final) return { stage: 'FINAL' };
  if (mine.some((f) => f.stage === 'SEMI_FINAL')) return { stage: 'SEMI_FINAL' };
  return { stage: 'GROUP' };
}

/** Fixtures that must be added next (semi-finals once the groups are done, the final once both semis are). */
export function nextWorldCupFixtures(cfg: WorldCupConfig, fixtures: Fixture[]): Fixture[] {
  const mine = fixtures.filter((f) => f.tournamentId === cfg.id);
  const tables = computeGroupTables(cfg, mine);
  const semis = mine.filter((f) => f.stage === 'SEMI_FINAL');
  const n = Math.max(0, ...mine.map((f) => f.matchNumber)) + 1;
  const nextDay = Math.max(0, ...mine.map((f) => f.day ?? 0)) + 1;
  if (semis.length === 0) {
    if (!isGroupStageComplete(cfg, mine)) return [];
    const [a, b, c, d] = semiFinalists(cfg, tables);
    return [
      fixture(cfg, 'sf1', n, a, b, { day: nextDay, stage: 'SEMI_FINAL', isPlayoff: true, playoffType: 'Semi-Final' }),
      fixture(cfg, 'sf2', n + 1, c, d, { day: nextDay, stage: 'SEMI_FINAL', isPlayoff: true, playoffType: 'Semi-Final' }),
    ];
  }
  if (mine.some((f) => f.stage === 'FINAL')) return [];
  if (semis.length === 2 && semis.every((s) => s.status === MatchStatus.COMPLETED)) {
    const w1 = knockoutWinner(cfg, tables, semis[0])!, w2 = knockoutWinner(cfg, tables, semis[1])!;
    return [fixture(cfg, 'final', n, w1, w2, { day: nextDay, stage: 'FINAL', isPlayoff: true, playoffType: 'Final' })];
  }
  return [];
}
