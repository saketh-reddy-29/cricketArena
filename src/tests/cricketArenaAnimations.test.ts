import { describe, expect, it } from 'vitest';
import { CRICKET_ARENA_ACTIONS, getCricketArenaPose } from '../lib/cricketArenaAnimations';

describe('cricket arena rigged actions', () => {
  it('produces complete finite poses for every migrated action across its timeline', () => {
    CRICKET_ARENA_ACTIONS.forEach((action) => {
      [0, 0.25, 0.5, 0.75, 1].forEach((progress) => {
        const pose = getCricketArenaPose(action, progress, 1.2);
        expect(Object.values(pose).every(Number.isFinite), `${action} at ${progress}`).toBe(true);
      });
    });
  });

  it('keeps the original shot selection distinct for sweeps and lofted shots', () => {
    expect(getCricketArenaPose('reverseSweep', 0.5, 0).ba).toBeLessThan(0);
    expect(getCricketArenaPose('lofted', 0.5, 0).by).toBeGreaterThan(1);
  });
});


describe('live auction character poses', () => {
  it('keeps seated bidders, raised bidders and the auctioneer distinct and finite', () => {
    const seated = getCricketArenaPose('auctionSit', 1, 1.2);
    const bidding = getCricketArenaPose('auctionBid', 1, 1.2);
    const auctioneer = getCricketArenaPose('auctioneerCall', 1, 1.2);

    expect(seated.crouch).toBeGreaterThan(0.3);
    expect(bidding.crouch).toBeGreaterThan(0.3);
    expect(bidding.rhy).toBeGreaterThan(seated.rhy);
    expect(auctioneer.rhy).toBeGreaterThan(1.5);
    expect(Object.values(seated).every(Number.isFinite)).toBe(true);
    expect(Object.values(bidding).every(Number.isFinite)).toBe(true);
    expect(Object.values(auctioneer).every(Number.isFinite)).toBe(true);
  });
});

import { GAITS, gaitCycleLength, gaitForSpeed } from '../lib/cricketArenaAnimations';

describe('ground-locked gait', () => {
  (['walk', 'jog', 'sprint'] as const).forEach((gait) => {
    it(`${gait}: the stance foot is stationary relative to the ground`, () => {
      const g = GAITS[gait];
      const len = gaitCycleLength(gait); // metres the body travels per cycle
      const action = gait === 'sprint' ? 'sprint' : gait;
      const d = 0.002;
      // Sample the stance phase of the left foot (cycle fraction 0..duty).
      for (let u = 0.02; u < g.duty - 0.02; u += 0.03) {
        const a = getCricketArenaPose(action, 0, 0, false, 0, u).lfx;
        const b = getCricketArenaPose(action, 0, 0, false, 0, u + d).lfx;
        const footRelative = b - a; // foot moves backwards under the body
        const bodyTravel = d * len;
        expect(Math.abs(footRelative + bodyTravel), `${gait} u=${u.toFixed(2)}`).toBeLessThan(1e-6);
      }
    });
  });

  it('swings the arms against the legs (left hand forward as the left foot goes back)', () => {
    const p = getCricketArenaPose('jog', 0, 0, false, 0, 0.0); // left foot at its furthest forward
    expect(p.lfx).toBeGreaterThan(0.2);
    expect(p.lhx).toBeLessThan(p.rhx);
  });

  it('is continuous across cycle boundaries', () => {
    (['walk', 'jog', 'sprint'] as const).forEach((gait) => {
      const a = getCricketArenaPose(gait, 0, 0, false, 0, 0.9999);
      const b = getCricketArenaPose(gait, 0, 0, false, 0, 1.0001);
      (['lfx', 'rfx', 'lfy', 'rfy', 'lhx', 'rhx', 'crouch', 'tw'] as const).forEach((k) => {
        expect(Math.abs((a[k] ?? 0) - (b[k] ?? 0)), `${gait}.${k}`).toBeLessThan(0.01);
      });
    });
  });

  it('chooses gait from speed with hysteresis', () => {
    expect(gaitForSpeed(1.0, null)).toBe('walk');
    expect(gaitForSpeed(3.0, null)).toBe('jog');
    expect(gaitForSpeed(7.0, null)).toBe('sprint');
    expect(gaitForSpeed(2.0, 'walk')).toBe('walk');
    expect(gaitForSpeed(2.0, 'jog')).toBe('jog'); // does not flicker back to walk right at the threshold
  });
});

describe('bowling action', () => {
  const jump = (a: ReturnType<typeof getCricketArenaPose>, b: ReturnType<typeof getCricketArenaPose>) =>
    Math.max(...(['lean', 'crouch', 'tw', 'lhx', 'lhy', 'rhx', 'rhy', 'lfx', 'rfx'] as const).map((k) => Math.abs(a[k] - b[k])));

  ['bowl_fast', 'bowl_spin'].forEach((action) => {
    [0.44, 0.58, 0.78].forEach((edge) => {
      it(`${action} has no pop at phase boundary ${edge}`, () => {
        const a = getCricketArenaPose(action as 'bowl_fast', edge - 0.0005, 1);
        const b = getCricketArenaPose(action as 'bowl_fast', edge + 0.0005, 1);
        expect(jump(a, b)).toBeLessThan(0.12);
      });
    });
  });

  it('brings the bowling arm over the top at release and opens the chest', () => {
    const coil = getCricketArenaPose('bowl_fast', 0.59, 1);
    const release = getCricketArenaPose('bowl_fast', 0.68, 1);
    expect(release.rhy).toBeGreaterThan(2.0);
    expect(coil.tw).toBeLessThan(-0.3);
    expect(release.tw).toBeGreaterThan(coil.tw + 0.4);
  });

  it('mirrors the whole action for a left-arm bowler', () => {
    const r = getCricketArenaPose('bowl_fast', 0.68, 1, false);
    const l = getCricketArenaPose('bowl_fast', 0.68, 1, true);
    expect(l.lhy).toBeCloseTo(r.rhy, 5);
    expect(l.rhy).toBeCloseTo(r.lhy, 5);
    expect(l.tw).toBeCloseTo(-r.tw, 5);
  });
});

describe('idle behaviour is alive and varied', () => {
  it('different players adopt different resting hand positions', () => {
    const habits = new Set([0.05, 0.4, 0.8].map((s) => {
      const p = getCricketArenaPose('fielderWait', 0, 3, false, s);
      return `${p.lhx.toFixed(1)}/${p.lhy.toFixed(1)}`;
    }));
    expect(habits.size).toBe(3);
  });

  it('keeps moving over time (no frozen pose)', () => {
    (['fielderWait', 'fielderReady', 'stand', 'nonStrikerWait', 'nonStrikerBackUp', 'keeperReady'] as const).forEach((a) => {
      const p0 = getCricketArenaPose(a, 0, 0, false, 0.3);
      const p1 = getCricketArenaPose(a, 0, 2.2, false, 0.3);
      const moved = (Object.keys(p0) as (keyof typeof p0)[]).some((k) => Math.abs(p0[k] - p1[k]) > 1e-3);
      expect(moved, a).toBe(true);
    });
  });

  it('is ready (crouched, hands low) as opposed to waiting (upright)', () => {
    const wait = getCricketArenaPose('fielderWait', 0, 1, false, 0.05);
    const ready = getCricketArenaPose('fielderReady', 0, 1, false, 0.05);
    expect(ready.crouch).toBeGreaterThan(wait.crouch + 0.1);
    expect(ready.lean).toBeGreaterThan(wait.lean + 0.1);
  });

  it('umpires and the non-striker stand upright', () => {
    expect(getCricketArenaPose('stand', 0, 1).crouch).toBeLessThan(0.05);
    expect(getCricketArenaPose('nonStrikerWait', 0, 1).crouch).toBeLessThan(0.06);
  });
});

describe('batting rotation', () => {
  it('rotates hips/shoulders through a pull and mirrors it for left-handers', () => {
    const contactR = getCricketArenaPose('pull', 0.48, 0, false);
    const contactL = getCricketArenaPose('pull', 0.48, 0, true);
    expect(contactR.tw).toBeGreaterThan(0.3);
    expect(contactL.tw).toBeCloseTo(-contactR.tw, 5);
  });

  it('every shot coils on the backlift then unwinds', () => {
    ['coverDrive', 'straightDrive', 'pull', 'sweep', 'flick', 'lateCut'].forEach((a) => {
      const back = getCricketArenaPose(a as 'pull', 0.24, 0);
      const contact = getCricketArenaPose(a as 'pull', 0.48, 0);
      expect(contact.tw, a).toBeGreaterThan(back.tw);
    });
  });
});

describe('left-handed batter is a true mirror image', () => {
  it('turns the body the other way and makes the right hand the top hand', () => {
    const r = getCricketArenaPose('batIdle', 0, 0, false);
    const l = getCricketArenaPose('batIdle', 0, 0, true);
    expect(r.yw).toBe(1);
    expect(l.yw).toBe(-1);
    expect(r.mir ?? 0).toBe(0);
    expect(l.mir).toBe(1);
  });

  it('swaps the leading foot and the foot lift', () => {
    const r = getCricketArenaPose('coverDrive', 0.24, 0, false);
    const l = getCricketArenaPose('coverDrive', 0.24, 0, true);
    expect(l.lfx).toBeCloseTo(r.rfx, 6);
    expect(l.rfx).toBeCloseTo(r.lfx, 6);
    expect(l.lfy).toBeCloseTo(r.rfy, 6);
    expect(l.rfy).toBeCloseTo(r.lfy, 6);
  });

  it('does not touch non-batting actions', () => {
    const l = getCricketArenaPose('fielderReady', 0, 1, true, 0.2);
    expect(l.yw).toBe(0);
    expect(l.mir ?? 0).toBe(0);
  });
});
