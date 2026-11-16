import { describe, expect, it } from 'vitest';
import { addToNetStats, batterResponse, buildNetDelivery, emptyNetStats, resolveNetBall, seededRng, SHOTS, ShotKey, Length } from '../engine/practice/practiceEngine';

const ball = (shot: ShotKey, length: Length, seed: number) => ({ id: `n${seed}`, ballNumber: 1, shot, line: 'MIDDLE' as const, length, pace: 'FAST' as const, rng: seededRng(seed), strikerName: 'A', nonStrikerName: 'B', bowlerName: 'C' });

describe('practice (nets) engine', () => {
  it('is deterministic for a given seed', () => {
    const a = buildNetDelivery(ball('COVER_DRIVE', 'FULL', 5)); const b = buildNetDelivery(ball('COVER_DRIVE', 'FULL', 5));
    expect(a.delivery.resultType).toBe(b.delivery.resultType); expect(a.delivery.ballPath.target).toEqual(b.delivery.ballPath.target);
  });

  it('shots that suit the length score far more than ones that do not', () => {
    const avg = (shot: ShotKey, length: Length) => { let r = 0; for (let s = 1; s <= 400; s++) r += resolveNetBall({ shot, line: 'MIDDLE', length, pace: 'FAST', rng: seededRng(s) }).runs; return r / 400; };
    expect(avg('STRAIGHT_DRIVE', 'FULL')).toBeGreaterThan(avg('STRAIGHT_DRIVE', 'SHORT') * 2);
    expect(avg('PULL', 'SHORT')).toBeGreaterThan(avg('PULL', 'YORKER') * 3);
  });

  it('defending a good ball scores nothing; a mistimed big hit can be caught', () => {
    for (let s = 1; s <= 200; s++) expect(resolveNetBall({ shot: 'DEFEND', line: 'MIDDLE', length: 'GOOD', pace: 'FAST', rng: seededRng(s) }).runs).toBe(0);
    let caught = 0; for (let s = 1; s <= 600; s++) { const o = resolveNetBall({ shot: 'LOFTED', line: 'MIDDLE', length: 'SHORT', pace: 'FAST', rng: seededRng(s) }); if (o.kind === 'WICKET' && o.wicketType === 'Caught') caught++; }
    expect(caught).toBeGreaterThan(0);
  });

  it('the delivery is consistent: runs, result type, wicket flags and an on-field target', () => {
    for (const s of SHOTS) for (let seed = 1; seed <= 40; seed++) {
      const { delivery: d, outcome: o } = buildNetDelivery(ball(s.key, 'GOOD', seed));
      expect(d.totalRuns).toBe(o.kind === 'RUNS' ? o.runs : 0);
      expect(d.wicket).toBe(o.kind === 'WICKET');
      if (d.wicket) expect(d.resultType).toBe('WICKET');
      if (d.totalRuns === 4) expect(d.resultType).toBe('FOUR');
      if (d.totalRuns === 6) expect(d.resultType).toBe('SIX');
      expect(Number.isFinite(d.ballPath.target.x) && Number.isFinite(d.ballPath.target.y)).toBe(true);
      if (d.totalRuns >= 4) expect(Math.hypot(d.ballPath.target.x - 300, d.ballPath.target.y - 300)).toBeGreaterThan(250);   // beyond the rope
      expect(d.shotType).toBe(s.shotType);
    }
  });

  it('batter AI picks sensible shots for the bowler\'s length', () => {
    const r = seededRng(1);
    expect(batterResponse('SHORT', 'MIDDLE', 'FAST', r)).toBe('PULL');
    expect(batterResponse('FULL', 'OFF', 'FAST', r)).toBe('COVER_DRIVE');
    expect(batterResponse('FULL', 'LEG', 'FAST', r)).toBe('ON_DRIVE');
    expect(batterResponse('FULL', 'MIDDLE', 'FAST', r)).toBe('STRAIGHT_DRIVE');
  });

  it('session stats add up', () => {
    let st = emptyNetStats();
    for (let seed = 1; seed <= 60; seed++) st = addToNetStats(st, buildNetDelivery(ball('COVER_DRIVE', 'FULL', seed)).outcome);
    expect(st.balls).toBe(60); expect(st.runs).toBeGreaterThanOrEqual(st.fours * 4 + st.sixes * 6);
    expect(st.dots + st.wickets).toBeLessThanOrEqual(60);
  });
});
