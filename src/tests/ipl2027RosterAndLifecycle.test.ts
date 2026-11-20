import { describe, expect, it } from 'vitest';
import type { Player } from '../types/common';
import {
  getIpl2027AuctionPool,
  getIpl2027Franchises,
  IPL_2027_FRANCHISE_PURSES,
  IPL_2027_RELEASED_PLAYERS,
  IPL_2027_RETAINED_SQUADS,
  normaliseIplName,
  prepareIpl2027Players,
} from '../data/ipl2027';
import { INITIAL_PLAYER_POOL } from '../data/players';
import { INTL_PLAYER_POOL } from '../data/intlPlayers';
import {
  isMegaAuctionDue,
  validateIplRetention,
  validateOneForOneTrade,
} from '../engine/competition/franchiseLifecycle';

const templates = Object.entries(IPL_2027_RETAINED_SQUADS).map(([shortName], index) => ({
  id: String(index + 1),
  name: shortName,
  shortName,
  color: '#123456',
  logo: '',
  strategy: 'Aggressive',
  purse: 0,
  squad: [],
  shortlist: [],
  overseasCount: 0,
}));

describe('IPL 2027 official roster baseline', () => {
  it('contains all 184 official retained players across ten franchises', () => {
    expect(Object.keys(IPL_2027_RETAINED_SQUADS)).toHaveLength(10);
    expect(Object.values(IPL_2027_RETAINED_SQUADS).reduce((sum, squad) => sum + squad.length, 0)).toBe(184);
  });

  it('contains 89 released players for the opening auction pool', () => {
    expect(IPL_2027_RELEASED_PLAYERS).toHaveLength(89);
    expect(new Set(IPL_2027_RELEASED_PLAYERS.map((player) => normaliseIplName(player.name))).size).toBe(89);
  });

  it('does not place a retained player into the released-player auction pool', () => {
    const retained = new Set(Object.values(IPL_2027_RETAINED_SQUADS).flat().map(normaliseIplName));
    expect(IPL_2027_RELEASED_PLAYERS.some((player) => retained.has(normaliseIplName(player.name)))).toBe(false);
  });

  it('builds a deduplicated provisional shortlist from the official baseline and extra candidates', () => {
    // Empty input intentionally exercises the fallback path for every published name.
    const prepared = prepareIpl2027Players([]);
    const franchises = getIpl2027Franchises(prepared, templates as any);
    const auctionPool = getIpl2027AuctionPool(prepared);
    const retainedIds = franchises.flatMap((franchise) => franchise.squad);

    expect(prepared).toHaveLength(293);
    expect(new Set(prepared.map((player) => player.id)).size).toBe(prepared.length);
    expect(franchises.reduce((sum, franchise) => sum + franchise.squad.length, 0)).toBe(184);
    expect(new Set(retainedIds).size).toBe(184);
    expect(auctionPool).toHaveLength(109);
    expect(auctionPool.some((id) => retainedIds.includes(id))).toBe(false);
  });

  it('normalizes the real game database without merging similarly named players', () => {
    const prepared = prepareIpl2027Players([...INITIAL_PLAYER_POOL, ...INTL_PLAYER_POOL]);
    const franchises = getIpl2027Franchises(prepared, templates as any);
    const auctionPool = getIpl2027AuctionPool(prepared);
    const mukul = prepared.find((player) => normaliseIplName(player.name) === normaliseIplName('Mukul Choudhary'));
    const mukesh = prepared.find((player) => normaliseIplName(player.name) === normaliseIplName('Mukesh Choudhary'));

    const retainedIds = new Set(franchises.flatMap((franchise) => franchise.squad));
    expect(auctionPool).toHaveLength(350);
    expect(auctionPool.length).toBeGreaterThanOrEqual(350);
    expect(auctionPool.length).toBeLessThanOrEqual(369);
    expect(new Set(auctionPool).size).toBe(auctionPool.length);
    expect(auctionPool.some((id) => retainedIds.has(id))).toBe(false);
    expect(franchises.reduce((sum, franchise) => sum + franchise.squad.length, 0)).toBe(184);
    expect(mukul).toBeDefined();
    expect(mukesh).toBeDefined();
    expect(mukul?.id).not.toBe(mukesh?.id);
  });

  it('matches the published remaining purse total of ₹297.95 crore', () => {
    const total = Object.values(IPL_2027_FRANCHISE_PURSES).reduce((sum, purse) => sum + purse, 0);
    expect(total).toBe(2_979_500_000);
  });
});

describe('franchise retention and trading rules', () => {
  const player = (id: string, isCapped: boolean): Player => ({
    id,
    name: id,
    role: 'All-rounder',
    nationality: 'Indian',
    rating: 70,
    baseAbility: 70,
    form: 70,
    basePrice: 3_000_000,
    isCapped,
    stats: { batting: 70, bowling: 70, fielding: 70 },
    careerStats: { matches: 0, runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, dismissals: 0, catches: 0 },
  });

  it('allows at most six retentions, with five capped and two uncapped maximums', () => {
    const players = [
      player('c1', true), player('c2', true), player('c3', true),
      player('c4', true), player('c5', true), player('c6', true),
      player('u1', false), player('u2', false), player('u3', false),
    ];
    expect(validateIplRetention(players, ['c1', 'c2', 'c3', 'c4', 'c5', 'u1']).ok).toBe(true);
    expect(validateIplRetention(players, ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']).ok).toBe(false);
    expect(validateIplRetention(players, ['c1', 'c2', 'c3', 'c4', 'u1', 'u2', 'u3']).ok).toBe(false);
    expect(validateIplRetention(players, ['missing']).ok).toBe(false);
  });

  it('only triggers a mega auction after each fourth completed season', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].filter(isMegaAuctionDue)).toEqual([4, 8]);
  });

  it('validates a direct one-for-one trade against both current squads', () => {
    expect(validateOneForOneTrade(['a1'], 'a1', ['b1'], 'b1').ok).toBe(true);
    expect(validateOneForOneTrade(['a1'], 'a2', ['b1'], 'b1').ok).toBe(false);
    expect(validateOneForOneTrade(['a1'], 'a1', ['b1'], 'b2').ok).toBe(false);
  });
});
