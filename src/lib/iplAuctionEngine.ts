import { Player } from '../types/common';
import { Franchise } from '../stores/useGameStore';

/**
 * IPL Auction Raise Engine & Bid Increments
 * Automatic raise amounts based on current price bracket:
 *  - ₹20 Lakh – ₹1 Crore : + ₹5 Lakh
 *  - ₹1 Crore – ₹2 Crore : + ₹10 Lakh
 *  - ₹2 Crore – ₹5 Crore : + ₹20 Lakh
 *  - Above ₹5 Crore      : + ₹25 Lakh
 */
export function getBidIncrement(currentBid: number): number {
  if (currentBid < 10_000_000) {
    return 500_000; // ₹20L – ₹1Cr: +₹5L
  } else if (currentBid < 20_000_000) {
    return 1_000_000; // ₹1Cr – ₹2Cr: +₹10L
  } else if (currentBid < 50_000_000) {
    return 2_000_000; // ₹2Cr – ₹5Cr: +₹20L
  } else {
    return 2_500_000; // Above ₹5Cr: +₹25L
  }
}

/**
 * Calculates Max Allowable Bid for a franchise:
 * Max Bid = Remaining Purse - (Remaining Minimum Slots * Lowest Base Price)
 * Example: ₹10 Cr left, needs 4 players to reach minimum 18 squad size (lowest base price ₹20L)
 * Cap = ₹10 Cr - (4 - 1)*20L = ₹9.40 Cr, or reserving for remaining unfilled slots.
 */
export function getMaxAllowableBid(
  purse: number,
  squadSize: number,
  lowestBasePrice = 2_000_000,
  minSquad = 18
): number {
  const neededSlotsAfterThis = Math.max(0, minSquad - squadSize - 1);
  return Math.max(0, purse - neededSlotsAfterThis * lowestBasePrice);
}

/**
 * AI Base Valuation Formula based on player's overall rating (out of 100):
 *  - 90 – 100 (Marquee Star)       : ₹14 Crore – ₹22 Crore
 *  - 82 – 89  (Proven Starter)     : ₹7 Crore – ₹13 Crore
 *  - 75 – 81  (Solid Squad Player) : ₹2 Crore – ₹6 Crore
 *  - Below 75 (Uncapped / Backup)  : ₹30 Lakh – ₹1.5 Crore
 */
export function calculateAIBaseValuation(rating: number): number {
  const r = Math.max(50, Math.min(100, rating || 75));

  if (r >= 90) {
    const t = (r - 90) / 10;
    return Math.round(140_000_000 + t * 80_000_000);
  } else if (r >= 82) {
    const t = (r - 82) / 8;
    return Math.round(70_000_000 + t * 60_000_000);
  } else if (r >= 75) {
    const t = (r - 75) / 7;
    return Math.round(20_000_000 + t * 40_000_000);
  } else {
    const t = Math.max(0, r - 60) / 15;
    return Math.round(3_000_000 + t * 12_000_000);
  }
}

export interface PlayerAuctionProfile {
  matches: number;
  hasPerformanceData: boolean;
  isProven: boolean;
  performanceScore: number;
  nominationScore: number;
  maxBidCap: number;
}

/** Uses only recorded match/stat fields; missing real match history is treated as unproven. */
export function getPlayerAuctionProfile(player: Player): PlayerAuctionProfile {
  const career = player.careerStats;
  const matches = Math.max(0, player.matches || 0, career ? career.matches : 0);
  const runs = Math.max(0, player.runs || 0, career ? career.runs : 0);
  const wickets = Math.max(0, player.wickets || 0, career ? career.wickets : 0);
  const strikeRate = Math.max(0, player.strikeRate || 0);
  const economy = Math.max(0, player.economy || 0);
  const hasPerformanceData = matches > 0 && (runs > 0 || wickets > 0 || strikeRate > 0 || economy > 0);
  const rating = Math.max(50, Math.min(100, player.rating || player.baseAbility || 75));
  const form = Math.max(0, Math.min(100, player.form === undefined ? 70 : player.form));
  const batting = Math.max(0, Math.min(100, player.stats ? player.stats.batting : rating));
  const bowling = Math.max(0, Math.min(100, player.stats ? player.stats.bowling : rating));
  const fielding = Math.max(0, Math.min(100, player.stats ? player.stats.fielding : rating));
  const roleSkill = player.role === 'Bowler' ? bowling : player.role === 'All-rounder' ? (batting + bowling) / 2 : batting;
  const abilityScore = rating * 0.42 + roleSkill * 0.38 + form * 0.12 + fielding * 0.08;
  let statisticalScore = abilityScore;
  if (hasPerformanceData) {
    if (player.role === 'Bowler') {
      const wicketRate = Math.min(100, (wickets / matches) * 160);
      const economyScore = economy > 0 ? Math.max(0, Math.min(100, (11 - economy) * 18)) : abilityScore;
      statisticalScore = wicketRate * 0.55 + economyScore * 0.45;
    } else if (player.role === 'All-rounder') {
      const battingRate = Math.min(100, (runs / matches) * 2.2);
      const bowlingRate = Math.min(100, (wickets / matches) * 160);
      statisticalScore = battingRate * 0.32 + bowlingRate * 0.32 + abilityScore * 0.36;
    } else {
      const runsScore = Math.min(100, (runs / matches) * 2.2);
      const strikeScore = strikeRate > 0 ? Math.max(0, Math.min(100, (strikeRate - 70) * 1.35)) : runsScore;
      statisticalScore = runsScore * 0.58 + strikeScore * 0.42;
    }
  }
  const performanceScore = Math.round(Math.max(0, Math.min(100, hasPerformanceData ? statisticalScore * 0.62 + abilityScore * 0.38 : abilityScore)));
  const isProven = matches >= 12 && hasPerformanceData;
  let cap = 15_000_000;
  if (matches >= 40 && isProven && performanceScore >= 88) cap = 250_000_000;
  else if (matches >= 25 && isProven && performanceScore >= 85) cap = 180_000_000;
  else if (matches >= 12 && isProven && performanceScore >= 80) cap = 140_000_000;
  else if (matches >= 6) cap = 90_000_000;
  else if (matches >= 1) cap = 60_000_000;
  else if (rating >= 90) cap = 45_000_000;
  else if (rating >= 82) cap = 25_000_000;
  const maxBidCap = Math.max(player.basePrice || 2_000_000, cap);
  const nominationScore = performanceScore * 100 + rating * 10 + Math.min(matches, 100) * 3 + (isProven ? 1_000 : 0);
  return { matches, hasPerformanceData, isProven, performanceScore, nominationScore, maxBidCap };
}

export function getAuctionNominationScore(player: Player): number {
  return getPlayerAuctionProfile(player).nominationScore;
}
/**
 * Simple deterministic pseudo-random variance between 0.85 and 1.15 (±15%)
 * Consistent for a given player and franchise so AI decisions are stable across counter-bids.
 */
function getPseudoVariance(playerId: string, franchiseId: string): number {
  let hash = 0;
  const str = `${playerId}_${franchiseId}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 10000) / 10000;
  return 0.85 + normalized * 0.3; // 0.85 to 1.15
}

/**
 * Calculates AI Max Valuation (Walk-Away Price):
 * Base valuation * Random variance (±15%) * Role Need Multipliers
 */
export function calculateAIMaxWillingToPay(
  player: Player,
  franchise: Franchise,
  allPlayers: Player[],
  poolIndex = 0,
  totalPool = 100
): number {
  const profile = getPlayerAuctionProfile(player);
  const rating = player.rating || player.baseAbility || 75;
  const baseValuation = calculateAIBaseValuation(rating);
  const variance = getPseudoVariance(player.id, franchise.id);

  // Overall rating creates interest, while recorded experience/performance controls the ceiling.
  let valuation = Math.min(baseValuation * variance, profile.maxBidCap);

  // Role need analysis
  const squadPlayers = franchise.squad
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p));

  const keepers = squadPlayers.filter((p) => p.role === 'Wicketkeeper').length;
  const bowlers = squadPlayers.filter((p) => p.role === 'Bowler').length;
  const allrounders = squadPlayers.filter((p) => p.role === 'All-rounder').length;
  const bowlingOptions = bowlers + allrounders;
  const sameRoleCount = squadPlayers.filter((p) => p.role === player.role).length;

  // Late auction / desperation multiplier (1.3x)
  const isLateAuction = poolIndex > totalPool * 0.45;
  if ((keepers === 0 && player.role === 'Wicketkeeper') || (bowlingOptions < 3 && isLateAuction && (player.role === 'Bowler' || player.role === 'All-rounder'))) {
    valuation *= 1.3;
  }

  // Already have 4+ players in this exact role -> 0.6x (only buys if cheap)
  if (sameRoleCount >= 4) {
    valuation *= 0.6;
  }

  // Minimum floor is player's base price
  const basePrice = player.basePrice || player.price || 2_000_000;
  return Math.min(profile.maxBidCap, Math.max(basePrice, Math.round(valuation)));
}

/**
 * Hard Limits when AI Must Stop Bidding:
 * 1. Valuation Cap: nextBid > aiMaxValuation
 * 2. Purse Safety Rule: nextBid > aiRemainingPurse - (neededMinPlayers * 30_Lakhs)
 * 3. Overseas Limit: player.isOverseas == true AND aiOverseasCount >= 8
 * 4. Squad Cap: aiTotalPlayers >= 25
 */
export function shouldAIStopBidding(
  nextBid: number,
  aiMaxValuation: number,
  franchise: Franchise,
  player: Player,
  minSquad = 18
): { shouldStop: boolean; reason?: string } {
  // 1. Valuation Cap
  if (nextBid > aiMaxValuation) {
    return { shouldStop: true, reason: 'Valuation cap reached' };
  }

  // 2. Purse Safety Rule (reserving at least 30 Lakhs per remaining needed slot)
  const neededMinPlayers = Math.max(0, minSquad - franchise.squad.length - 1);
  const minPurseNeeded = neededMinPlayers * 3_000_000;
  if (nextBid > franchise.purse - minPurseNeeded) {
    return { shouldStop: true, reason: 'Purse safety reserve' };
  }

  // 3. Overseas Limit
  if (player.nationality === 'Overseas' && franchise.overseasCount >= 8) {
    return { shouldStop: true, reason: 'Overseas quota full (8/8)' };
  }

  // 4. Squad Cap
  if (franchise.squad.length >= 25) {
    return { shouldStop: true, reason: 'Squad cap reached (25/25)' };
  }

  return { shouldStop: false };
}

/**
 * Role Quotas for a balanced IPL squad:
 * At least 5 Batters, 5 Bowlers, 2 All-Rounders, 2 Wicketkeepers, Max 8 Overseas, 18-25 Total
 */
export function checkSquadRoleQuotas(squad: Player[]) {
  const batters = squad.filter((p) => p.role === 'Batsman').length;
  const bowlers = squad.filter((p) => p.role === 'Bowler').length;
  const allrounders = squad.filter((p) => p.role === 'All-rounder').length;
  const keepers = squad.filter((p) => p.role === 'Wicketkeeper').length;
  const overseas = squad.filter((p) => p.nationality === 'Overseas').length;
  const total = squad.length;

  return {
    batters: { count: batters, target: 5, met: batters >= 5 },
    bowlers: { count: bowlers, target: 5, met: bowlers >= 5 },
    allrounders: { count: allrounders, target: 2, met: allrounders >= 2 },
    keepers: { count: keepers, target: 2, met: keepers >= 2 },
    overseas: { count: overseas, max: 8, valid: overseas <= 8 },
    total: { count: total, min: 18, max: 25, met: total >= 18 && total <= 25 },
    isBalanced: batters >= 5 && bowlers >= 5 && allrounders >= 2 && keepers >= 2 && overseas <= 8 && total >= 18,
  };
}

/**
 * Playing XI Auto-Picker:
 * Selects each team's best Playing XI respecting:
 *  - Exactly 11 players
 *  - Maximum 4 overseas players
 *  - At least 1 Wicketkeeper
 *  - At least 5 bowling options (Bowlers + All-rounders)
 */
export function autoPickPlayingXI(squad: Player[]): { playingXI: Player[]; bench: Player[] } {
  if (squad.length <= 11) {
    return { playingXI: [...squad], bench: [] };
  }

  const sortedSquad = [...squad].sort((a, b) => (b.rating || 75) - (a.rating || 75));
  const selected: Player[] = [];
  const selectedIds = new Set<string>();

  const getOverseasCount = () => selected.filter((p) => p.nationality === 'Overseas').length;
  const canAdd = (p: Player) => {
    if (selectedIds.has(p.id)) return false;
    if (p.nationality === 'Overseas' && getOverseasCount() >= 4) return false;
    return true;
  };

  // 1. Pick 1 Best Wicketkeeper
  const bestKeeper = sortedSquad.find((p) => p.role === 'Wicketkeeper' && canAdd(p));
  if (bestKeeper) {
    selected.push(bestKeeper);
    selectedIds.add(bestKeeper.id);
  }

  // 2. Pick Top 4-5 Bowling Options
  const bowlingCandidates = sortedSquad.filter((p) => (p.role === 'Bowler' || p.role === 'All-rounder') && canAdd(p));
  for (const b of bowlingCandidates) {
    if (selected.filter((p) => p.role === 'Bowler' || p.role === 'All-rounder').length >= 5) break;
    selected.push(b);
    selectedIds.add(b.id);
  }

  // 3. Fill remaining slots with the highest-rated remaining eligible players
  for (const p of sortedSquad) {
    if (selected.length >= 11) break;
    if (canAdd(p)) {
      selected.push(p);
      selectedIds.add(p.id);
    }
  }

  // 4. If still under 11 (e.g. overseas restriction caused shortage), relax overseas rule as fallback
  if (selected.length < 11) {
    for (const p of sortedSquad) {
      if (selected.length >= 11) break;
      if (!selectedIds.has(p.id)) {
        selected.push(p);
        selectedIds.add(p.id);
      }
    }
  }

  const bench = squad.filter((p) => !selectedIds.has(p.id));
  return { playingXI: selected, bench };
}

export interface AuctionTeamStanding {
  franchiseId: string;
  franchiseName: string;
  shortName: string;
  color: string;
  logo?: string;
  playingXI: Player[];
  bench: Player[];
  xiTotalRating: number;
  purseRemainingCr: number;
  purseBonus: number;
  benchBonus: number;
  finalScore: number;
  rank: number;
  roleQuotas: ReturnType<typeof checkSquadRoleQuotas>;
}

/**
 * Calculates Final Score for an IPL Franchise post-auction:
 * Final Score = Sum of Playing XI rating points + Purse Bonus + Bench Depth Bonus
 */
export function calculateAuctionFinalStandings(
  franchises: Franchise[],
  allPlayers: Player[]
): AuctionTeamStanding[] {
  const standings = franchises.map((franchise) => {
    const squadPlayers = franchise.squad
      .map((id) => allPlayers.find((p) => p.id === id))
      .filter((p): p is Player => Boolean(p));

    const { playingXI, bench } = autoPickPlayingXI(squadPlayers);
    const xiTotalRating = playingXI.reduce((sum, p) => sum + (p.rating || 75), 0);
    const purseRemainingCr = franchise.purse / 10_000_000;
    const purseBonus = Math.round(purseRemainingCr * 1.5 * 10) / 10;
    const benchTotalRating = bench.reduce((sum, p) => sum + (p.rating || 75), 0);
    const benchBonus = Math.round((benchTotalRating / 10) * 0.4 * 10) / 10;
    const finalScore = Math.round((xiTotalRating + purseBonus + benchBonus) * 10) / 10;
    const roleQuotas = checkSquadRoleQuotas(squadPlayers);

    return {
      franchiseId: franchise.id,
      franchiseName: franchise.name,
      shortName: franchise.shortName,
      color: franchise.color,
      logo: franchise.logo,
      playingXI,
      bench,
      xiTotalRating,
      purseRemainingCr,
      purseBonus,
      benchBonus,
      finalScore,
      rank: 1,
      roleQuotas,
    };
  });

  // Sort descending by finalScore
  standings.sort((a, b) => b.finalScore - a.finalScore);
  standings.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return standings;
}
