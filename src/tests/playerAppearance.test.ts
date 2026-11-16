import { describe, expect, it } from 'vitest';
import { bowlingKindOf, heightCmFor, heightScale, isLeftHandedBat } from '../characters/playerAppearance';

describe('player appearance', () => {
  it('reads handedness from the batting style', () => {
    expect(isLeftHandedBat('Left-hand bat')).toBe(true);
    expect(isLeftHandedBat('Right-hand bat')).toBe(false);
    expect(isLeftHandedBat(undefined)).toBe(false);
  });
  it('maps bowling styles to fast / medium / spin and the bowling arm', () => {
    expect(bowlingKindOf('Right-arm fast')).toEqual({ kind: 'FAST', leftArm: false });
    expect(bowlingKindOf('Left-arm fast-medium')).toMatchObject({ leftArm: true });
    expect(bowlingKindOf('Right-arm medium')).toEqual({ kind: 'MEDIUM', leftArm: false });
    expect(bowlingKindOf('Left-arm orthodox')).toEqual({ kind: 'SPIN', leftArm: true });
    expect(bowlingKindOf('Right-arm off break').kind).toBe('SPIN');
    expect(bowlingKindOf('Legbreak googly').kind).toBe('SPIN');
    expect(bowlingKindOf(undefined).kind).toBe('FAST');
  });
  it('height is stable per player, in a realistic range, and scaling is uniform and modest', () => {
    expect(heightCmFor('Virat Kohli', 'Batsman')).toBe(heightCmFor('Virat Kohli', 'Batsman'));
    const hs = new Set<number>();
    for (let i = 0; i < 300; i++) { const h = heightCmFor(`Player ${i}`, 'Batsman'); expect(h).toBeGreaterThanOrEqual(160); expect(h).toBeLessThanOrEqual(200); hs.add(h); }
    expect(hs.size).toBeGreaterThan(15);                                       // real variety
    expect(heightScale(182)).toBeCloseTo(1, 5);
    expect(heightScale(200)).toBeLessThan(1.11); expect(heightScale(160)).toBeGreaterThan(0.87);
    expect(heightCmFor('X', 'Bowler', 'FAST')).toBeGreaterThan(heightCmFor('X', 'Bowler', 'SPIN'));
  });
});
