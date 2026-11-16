import { describe, expect, it } from 'vitest';
import {
  computeGroupTables, createWorldCupConfig, generateGroupFixtures, getWorldCupStatus, isGroupStageComplete,
  nextWorldCupFixtures, roundRobin, semiFinalists, WorldCupConfig,
} from '../engine/competition/worldCupEngine';
import { Fixture, MatchStatus } from '../types/match';

const T8 = ['IND', 'AUS', 'ENG', 'PAK', 'SA', 'NZ', 'SL', 'BAN'];

/** Complete a fixture: lower index in `order` wins by a margin; scores feed NRR. */
function play(f: Fixture, order: string[], winnerOverride?: string | 'TIE'): Fixture {
  const t1Wins = winnerOverride ? winnerOverride === f.team1Id : order.indexOf(f.team1Id) < order.indexOf(f.team2Id);
  const winner = winnerOverride === 'TIE' ? 'TIE' : t1Wins ? f.team1Id : f.team2Id;
  const loser = winner === f.team1Id ? f.team2Id : f.team1Id;
  return {
    ...f, status: MatchStatus.COMPLETED,
    scorecard: {
      winnerId: winner,
      innings: winner === 'TIE'
        ? [{ battingTeamId: f.team1Id, runs: 150, overs: 20, balls: 0 }, { battingTeamId: f.team2Id, runs: 150, overs: 20, balls: 0 }]
        : [{ battingTeamId: winner, runs: 180, overs: 20, balls: 0 }, { battingTeamId: loser, runs: 150, overs: 20, balls: 0 }],
    },
  } as unknown as Fixture;
}
const playAll = (fs: Fixture[], order: string[]) => fs.map((f) => (f.status === MatchStatus.COMPLETED ? f : play(f, order)));

describe('World Cup engine', () => {
  it('validates the number of teams', () => {
    expect(() => createWorldCupConfig({ format: 'T20', teamIds: ['A', 'B', 'C'] })).toThrow();
    expect(() => createWorldCupConfig({ format: 'T20', teamIds: Array.from({ length: 17 }, (_, i) => `T${i}`) })).toThrow();
  });

  it('splits 8 teams into two balanced groups, 4-5 teams into one', () => {
    const c = createWorldCupConfig({ format: 'T20', teamIds: T8, createdAt: 1 });
    expect(Object.keys(c.groups)).toEqual(['A', 'B']);
    expect(c.groups.A.length).toBe(4); expect(c.groups.B.length).toBe(4);
    expect([...c.groups.A, ...c.groups.B].sort()).toEqual([...T8].sort());
    expect(Object.keys(createWorldCupConfig({ format: 'ODI', teamIds: T8.slice(0, 5) }).groups)).toEqual(['A']);
    const odd = createWorldCupConfig({ format: 'T20', teamIds: T8.slice(0, 7) });
    expect(Math.abs(odd.groups.A.length - odd.groups.B.length)).toBeLessThanOrEqual(1);
  });

  it('round robin: every pair meets exactly once', () => {
    for (const n of [4, 5, 6]) {
      const ids = T8.slice(0, n); const games = roundRobin(ids);
      expect(games.length).toBe((n * (n - 1)) / 2);
      const keys = new Set(games.map(([a, b]) => [a, b].sort().join('-')));
      expect(keys.size).toBe(games.length);
    }
  });

  it('group fixtures: right count, unique ids, tagged with stage and group', () => {
    const c = createWorldCupConfig({ format: 'T20', teamIds: T8, createdAt: 1 });
    const fx = generateGroupFixtures(c);
    expect(fx.length).toBe(12);
    expect(new Set(fx.map((f) => f.id)).size).toBe(12);
    expect(fx.every((f) => f.stage === 'GROUP' && (f.group === 'A' || f.group === 'B') && f.tournamentId === c.id)).toBe(true);
  });

  it('schedules match-days: a round of each group shares a day, semis and the final come after', () => {
    const c = createWorldCupConfig({ format: 'T20', teamIds: T8, createdAt: 1 });
    let fx = generateGroupFixtures(c);
    expect([...new Set(fx.map((f) => f.day))]).toEqual([1, 2, 3]);             // 3 rounds, 4 matches per day (2 groups x 2)
    expect(fx.filter((f) => f.day === 1).length).toBe(4);
    fx = playAll(fx, T8);
    const semis = nextWorldCupFixtures(c, fx);
    expect(semis.every((s) => s.day === 4)).toBe(true);
    fx = playAll([...fx, ...semis], T8);
    expect(nextWorldCupFixtures(c, fx)[0].day).toBe(5);
  });

  it('plays a whole World Cup: groups -> semi-finals -> final -> champion', () => {
    const c = createWorldCupConfig({ format: 'T20', teamIds: T8, createdAt: 1 });
    let fx = generateGroupFixtures(c);
    expect(getWorldCupStatus(c, fx).stage).toBe('GROUP');
    expect(nextWorldCupFixtures(c, fx)).toEqual([]);                       // semis not available yet
    fx = playAll(fx, T8);                                                  // IND strongest ... BAN weakest
    expect(isGroupStageComplete(c, fx)).toBe(true);

    const tables = computeGroupTables(c, fx);
    for (const g of ['A', 'B']) {
      expect(tables[g].map((r) => r.points)).toEqual([...tables[g].map((r) => r.points)].sort((a, b) => b - a));
      expect(tables[g][0].won).toBe(3); expect(tables[g][0].points).toBe(6);
      expect(tables[g][0].nrr).toBeGreaterThan(0);
    }
    const semis = nextWorldCupFixtures(c, fx);
    expect(semis.length).toBe(2); expect(semis.every((s) => s.stage === 'SEMI_FINAL' && s.playoffType === 'Semi-Final')).toBe(true);
    const [a1, b2, b1, a2] = semiFinalists(c, tables);
    expect([semis[0].team1Id, semis[0].team2Id]).toEqual([a1, b2]);
    expect([semis[1].team1Id, semis[1].team2Id]).toEqual([b1, a2]);
    // the 4 qualifiers are the top two of each group
    expect(new Set([a1, a2, b1, b2])).toEqual(new Set([...tables.A.slice(0, 2), ...tables.B.slice(0, 2)].map((r) => r.teamId)));

    fx = [...fx, ...semis];
    expect(getWorldCupStatus(c, fx).stage).toBe('SEMI_FINAL');
    expect(nextWorldCupFixtures(c, fx)).toEqual([]);                       // final waits for BOTH semis
    fx = fx.map((f) => (f.stage === 'SEMI_FINAL' && f.id === semis[0].id ? play(f, T8) : f));
    expect(nextWorldCupFixtures(c, fx)).toEqual([]);
    fx = playAll(fx, T8);
    const fin = nextWorldCupFixtures(c, fx);
    expect(fin.length).toBe(1); expect(fin[0].stage).toBe('FINAL'); expect(fin[0].playoffType).toBe('Final');
    fx = [...fx, ...fin];
    expect(getWorldCupStatus(c, fx).stage).toBe('FINAL');
    expect(nextWorldCupFixtures(c, fx)).toEqual([]);                       // never adds a second final
    fx = playAll(fx, T8);
    const st = getWorldCupStatus(c, fx);
    expect(st.stage).toBe('COMPLETE'); expect(st.championId).toBe('IND');
  });

  it('single group of 4: top four play 1v4 and 2v3', () => {
    const c = createWorldCupConfig({ format: 'ODI', teamIds: ['IND', 'AUS', 'ENG', 'PAK'], createdAt: 1 });
    const fx = playAll(generateGroupFixtures(c), ['IND', 'AUS', 'ENG', 'PAK']);
    const semis = nextWorldCupFixtures(c, fx);
    expect([semis[0].team1Id, semis[0].team2Id]).toEqual(['IND', 'PAK']);
    expect([semis[1].team1Id, semis[1].team2Id]).toEqual(['AUS', 'ENG']);
  });

  it('a tied knockout goes to the higher group seed; NRR separates teams level on points', () => {
    const c = createWorldCupConfig({ format: 'T20', teamIds: T8, createdAt: 1 });
    let fx = playAll(generateGroupFixtures(c), T8);
    fx = [...fx, ...nextWorldCupFixtures(c, fx)];
    fx = fx.map((f) => (f.stage === 'SEMI_FINAL' ? play(f, T8, 'TIE') : f));
    const fin = nextWorldCupFixtures(c, fx);
    expect(fin.length).toBe(1);
    const tables = computeGroupTables(c, fx);
    const [a1, , b1] = semiFinalists(c, tables);
    expect([fin[0].team1Id, fin[0].team2Id].sort()).toEqual([a1, b1].sort());   // the two group winners advance

    // two teams on equal points: the better NRR ranks first
    const c2 = createWorldCupConfig({ format: 'T20', teamIds: ['X', 'Y', 'Z', 'W'], createdAt: 1 });
    const g = generateGroupFixtures(c2);
    const res = g.map((f) => {
      const r = play(f, ['X', 'Y', 'Z', 'W']);
      return r;
    });
    const t = computeGroupTables(c2, res).A;
    expect(t.map((r) => r.teamId)).toEqual(['X', 'Y', 'Z', 'W']);
  });
});
