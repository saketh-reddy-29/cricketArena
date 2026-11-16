import { describe, expect, it } from 'vitest';
import { evaluateInterception, FIELD_CENTER, BOUNDARY_RADIUS } from '../engine/fielding/FieldingInterceptionEngine';
import { seededRng } from '../engine/practice/practiceEngine';

/** Random but valid field: keeper behind the stumps, bowler at the crease, nine fielders inside the rope. */
function randomField(rng: () => number) {
  const fs = [{ id: 'keeper', name: 'Keeper', x: 300, y: 150, isWicketkeeper: true }, { id: 'bowler', name: 'Bowler', x: 300, y: 410 }];
  for (let i = 0; i < 9; i++) {
    const a = rng() * Math.PI * 2, r = 60 + rng() * 190;
    fs.push({ id: `f${i}`, name: `F${i}`, x: FIELD_CENTER.x + Math.cos(a) * r, y: FIELD_CENTER.y + Math.sin(a) * r } as never);
  }
  return fs;
}
const path = (rng: () => number, aerial: boolean, beyond: boolean) => {
  const a = rng() * Math.PI * 2, r = beyond ? BOUNDARY_RADIUS + 10 : 40 + rng() * 200;
  return { start: { x: 300, y: 410 }, bounce: { x: 300, y: 300 }, contact: { x: 300, y: 195 }, target: { x: 300 + Math.cos(a) * r, y: 300 + Math.sin(a) * r }, isAerial: aerial };
};

describe('visual outcome never contradicts the match engine', () => {
  it('a Caught wicket is always a catch, a non-wicket is never a catch, 4+ runs is a boundary, Bowled/LBW never reach the field', () => {
    const rng = seededRng(2024);
    for (let i = 0; i < 3000; i++) {
      const aerial = rng() < 0.5;
      const kind = Math.floor(rng() * 6);
      const auth = kind === 0 ? { wicket: true, wicketType: 'Caught', runs: 0 }
        : kind === 1 ? { wicket: true, wicketType: 'Bowled', runs: 0 }
        : kind === 2 ? { wicket: true, wicketType: 'LBW', runs: 0 }
        : kind === 3 ? { wicket: false, runs: rng() < 0.5 ? 4 : 6 }
        : { wicket: false, runs: Math.floor(rng() * 3) };
      const res = evaluateInterception({ ballPath: path(rng, aerial, !auth.wicket && auth.runs >= 4) as never, fielders: randomField(rng) as never, rng, authoritative: auth });
      if (auth.wicket && auth.wicketType === 'Caught') { expect(res.outcome).toBe('CAUGHT'); expect(res.isCatch).toBe(true); expect(res.fielderId).not.toBeNull(); }
      if (!auth.wicket) expect(res.isCatch).toBe(false);
      if (!auth.wicket && auth.runs >= 4) { expect(res.outcome).toBe('BOUNDARY'); expect(res.fielderId).toBeNull(); }
      if (auth.wicket && (auth.wicketType === 'Bowled' || auth.wicketType === 'LBW')) { expect(res.isCatch).toBe(false); expect(res.outcome).not.toBe('BOUNDARY'); }
    }
  });

  it('a six is never shown as a catch even when a fielder stands under it', () => {
    const rng = seededRng(7);
    const p = { start: { x: 300, y: 410 }, bounce: { x: 300, y: 300 }, contact: { x: 300, y: 195 }, target: { x: 300, y: 580 }, isAerial: true };
    const fielders = [{ id: 'under', name: 'Under', x: 300, y: 560 }, { id: 'keeper', name: 'K', x: 300, y: 150, isWicketkeeper: true }];
    for (let i = 0; i < 200; i++) {
      const r = evaluateInterception({ ballPath: p as never, fielders: fielders as never, rng, authoritative: { wicket: false, runs: 6 } });
      expect(r.isCatch).toBe(false); expect(r.outcome).toBe('BOUNDARY');
    }
  });

  it('without a ruling the engine behaves as before (catches are still possible)', () => {
    const rng = seededRng(3);
    const p = { start: { x: 300, y: 410 }, bounce: { x: 300, y: 300 }, contact: { x: 300, y: 195 }, target: { x: 380, y: 300 }, isAerial: true };
    const fielders = [{ id: 'near', name: 'Near', x: 380, y: 300, fieldingRating: 90, catchingRating: 95 }];
    let catches = 0; for (let i = 0; i < 100; i++) if (evaluateInterception({ ballPath: p as never, fielders: fielders as never, rng }).isCatch) catches++;
    expect(catches).toBeGreaterThan(50);
  });

  it('the fielder standing on the ball\'s line takes it, not a distant one', () => {
    const rng = () => 0.99;   // no misfield
    const p = { start: { x: 300, y: 410 }, bounce: { x: 300, y: 300 }, contact: { x: 300, y: 195 }, target: { x: 430, y: 330 }, isAerial: false };
    const fielders = [{ id: 'far', name: 'Far', x: 120, y: 120 }, { id: 'onLine', name: 'On', x: 380, y: 290, fieldingRating: 80 }];
    expect(evaluateInterception({ ballPath: p as never, fielders: fielders as never, rng }).fielderId).toBe('onLine');
  });
});
