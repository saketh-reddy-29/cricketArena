import { describe, expect, it, vi } from 'vitest';
import { PlaybackGate } from '../presentation/PlaybackGate';
import { computeBatterMotion, PAVILION_EXIT, speedToMultiplier, transitionDurationMs } from '../presentation/batterMotion';

describe('PlaybackGate (next ball waits for every visual action)', () => {
  it('releases when only the ball return was outstanding', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.arm(); expect(rel).not.toHaveBeenCalled();
    expect(g.done('retrieval')).toBe(true); expect(rel).toHaveBeenCalledTimes(1);
  });

  it('waits for batter movement when it finishes AFTER the ball return', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.arm(); g.hold('transition');
    g.done('retrieval'); expect(rel).not.toHaveBeenCalled();
    expect(g.holds).toEqual(['transition']);
    g.done('transition'); expect(rel).toHaveBeenCalledTimes(1);
  });

  it('waits for the ball return when batter movement finishes FIRST', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.arm(); g.hold('transition');
    g.done('transition'); expect(rel).not.toHaveBeenCalled();
    g.done('retrieval'); expect(rel).toHaveBeenCalledTimes(1);
  });

  it('fires exactly once even if holds are completed twice', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.arm(); g.hold('transition');
    g.done('retrieval'); g.done('transition'); g.done('transition'); g.done('retrieval');
    expect(rel).toHaveBeenCalledTimes(1);
  });

  it('never releases a delivery that was not armed (replays)', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.hold('transition'); expect(g.done('transition')).toBe(false); expect(g.done('retrieval')).toBe(false);
    expect(rel).not.toHaveBeenCalled();
  });

  it('a cancelled movement does not release by itself; skip releases once via release()', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.arm(); g.hold('transition'); g.drop('transition');
    expect(rel).not.toHaveBeenCalled();
    g.release(); expect(rel).toHaveBeenCalledTimes(1);
    expect(g.done('retrieval')).toBe(false); expect(rel).toHaveBeenCalledTimes(1);
  });

  it('re-arming for the next delivery starts clean', () => {
    const rel = vi.fn(); const g = new PlaybackGate(rel);
    g.arm(); g.hold('transition'); g.done('retrieval');   // ball 1 stuck on movement
    g.arm();                                              // ball 2 armed: previous holds forgotten
    expect(g.holds).toEqual(['retrieval']);
    g.done('retrieval'); expect(rel).toHaveBeenCalledTimes(1);
  });
});

describe('batter motion (running between the wickets, walk-off / walk-in)', () => {
  const S: [number, number] = [0, 8.84];    // striker's crease
  const N: [number, number] = [0, -8.04];   // non-striker's end
  const near = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6;

  it('1 run: the batters swap ends; 2 runs: they finish where they started', () => {
    const one = computeBatterMotion({ kind: 'RUNS', progress: 1, runs: 1 }, S, N);
    expect(near(one.sPos, N)).toBe(true); expect(near(one.nPos, S)).toBe(true);
    const two = computeBatterMotion({ kind: 'RUNS', progress: 1, runs: 2 }, S, N);
    expect(near(two.sPos, S)).toBe(true); expect(near(two.nPos, N)).toBe(true);
    const three = computeBatterMotion({ kind: 'RUNS', progress: 1, runs: 3 }, S, N);
    expect(near(three.sPos, N)).toBe(true);
  });

  it('runs are continuous (no teleporting) and the two batters are never in the same place except crossing', () => {
    let prev = computeBatterMotion({ kind: 'RUNS', progress: 0, runs: 3 }, S, N).sPos;
    let maxStep = 0;
    for (let i = 1; i <= 300; i++) {
      const m = computeBatterMotion({ kind: 'RUNS', progress: i / 300, runs: 3 }, S, N);
      maxStep = Math.max(maxStep, Math.hypot(m.sPos[0] - prev[0], m.sPos[1] - prev[1]));
      prev = m.sPos;
    }
    expect(maxStep).toBeLessThan(0.4);   // 3 legs x 16.9 m / 300 frames ~ 0.17 m per step
  });

  it('faces the direction of travel and alternates on each leg', () => {
    const a = computeBatterMotion({ kind: 'RUNS', progress: 0.1, runs: 2 }, S, N);   // first leg: striker runs toward -z
    const b = computeBatterMotion({ kind: 'RUNS', progress: 0.9, runs: 2 }, S, N);   // second leg: back toward +z
    expect(a.sYaw).toBeCloseTo(Math.PI); expect(b.sYaw).toBeCloseTo(0);
    expect(a.nYaw).toBeCloseTo(0); expect(b.nYaw).toBeCloseTo(Math.PI);
    expect(a.sAct).toBe('sprintBat');
  });

  it('wicket: dismissed batter walks to the pavilion and disappears; the new batter arrives at the crease', () => {
    const start = computeBatterMotion({ kind: 'WICKET', progress: 0, runs: 0 }, S, N);
    expect(start.sAct).toBe('defeat'); expect(start.sVisible).toBe(true); expect(start.incoming).toBeNull();
    const mid = computeBatterMotion({ kind: 'WICKET', progress: 0.5, runs: 0 }, S, N);
    expect(mid.sAct).toBe('jog'); expect(mid.sPos[0]).toBeLessThan(-5); expect(mid.incoming).not.toBeNull();
    const end = computeBatterMotion({ kind: 'WICKET', progress: 1, runs: 0 }, S, N);
    expect(end.sVisible).toBe(false);
    expect(near(end.incoming!.pos, S)).toBe(true);
    expect(end.incoming!.action).toBe('batIdle');
    expect(end.incoming!.yaw).toBeCloseTo(Math.PI);   // new batter takes guard facing the bowler
    expect(PAVILION_EXIT[0]).toBeLessThan(0);
  });

  it('no transition leaves the striker and non-striker exactly where the engine put them', () => {
    const m = computeBatterMotion(null, S, N, 'batIdle', 'idle');
    expect(m.sPos).toEqual(S); expect(m.nPos).toEqual(N); expect(m.incoming).toBeNull();
  });

  it('durations: wicket 6.5 s, runs 2.8 / 5.1 / 7.4 s at normal speed (realistic ~6 m/s running), faster at higher speed', () => {
    expect(transitionDurationMs('WICKET', 0, 1)).toBe(6500);
    expect(transitionDurationMs('RUNS', 1, 1)).toBe(2800);
    expect(transitionDurationMs('RUNS', 2, 1)).toBe(5100);
    expect(transitionDurationMs('RUNS', 3, 1)).toBe(7400);
    expect(transitionDurationMs('RUNS', 3, speedToMultiplier(2.5))).toBeLessThan(3500);
  });
});
