import { describe, expect, it } from 'vitest';
import { computeBatterMotion, PAVILION_EXIT } from '../presentation/batterMotion';

describe('wicket batter transition', () => {
  const striker: [number, number] = [0, 8.84];
  const nonStriker: [number, number] = [0, -8.84];

  it('shows the dismissed batter leaving before the incoming batter appears', () => {
    const leaving = computeBatterMotion(
      { kind: 'WICKET', progress: 0.35, runs: 0 },
      striker,
      nonStriker,
    );
    expect(leaving.sVisible).toBe(true);
    expect(leaving.incoming).toBeNull();
    expect(leaving.sPos[0]).toBeLessThan(0);
  });

  it('starts the replacement entrance only after the outgoing batter reaches the pavilion', () => {
    const entering = computeBatterMotion(
      { kind: 'WICKET', progress: 0.78, runs: 0 },
      striker,
      nonStriker,
    );
    expect(entering.sVisible).toBe(false);
    expect(entering.sPos).toEqual(PAVILION_EXIT);
    expect(entering.incoming).not.toBeNull();
    expect(entering.incoming!.pos[0]).toBeGreaterThan(PAVILION_EXIT[0]);
    expect(entering.incoming!.pos[0]).toBeLessThan(striker[0]);
  });

  it('places the new batter at the striker crease at the end of the transition', () => {
    const complete = computeBatterMotion(
      { kind: 'WICKET', progress: 1, runs: 0 },
      striker,
      nonStriker,
    );
    expect(complete.sVisible).toBe(false);
    expect(complete.incoming?.pos[0]).toBeCloseTo(striker[0]);
    expect(complete.incoming?.pos[1]).toBeCloseTo(striker[1]);
    expect(complete.incoming?.action).toBe('batIdle');
  });
});
