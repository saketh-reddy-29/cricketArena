import { Player } from '../../types/common';
import { Franchise } from '../../stores/useGameStore';
import { FranchiseDNA } from './TeamEvaluator';
import { ConfidenceResult } from './ConfidenceEngine';

export type AggressionLevel = 'Low' | 'Medium' | 'High' | 'Extreme';

export interface BidDecision {
  decision: 'BUY' | 'PASS';
  recommendedBid: number;
  maximumBid: number;
  aggression: AggressionLevel;
  dropoutProbability: number;
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export function calculateBidStrategy(
  player: Player,
  franchise: Franchise,
  dna: FranchiseDNA,
  currentBid: number,
  confidence: ConfidenceResult,
  valuationCap: number = franchise.purse
): BidDecision {
  
  // 1. Determine Aggression based on Confidence
  let aggression: AggressionLevel = 'Low';
  if (confidence.score >= 85) aggression = 'Extreme';
  else if (confidence.score >= 70) aggression = 'High';
  else if (confidence.score >= 55) aggression = 'Medium';

  // 2. Dropout Probability (Probabilistic decision making)
  // Even if they want the player, there's a chance they just pass if they aren't 'Extreme'
  let dropoutProbability = 0;
  if (aggression === 'Low') dropoutProbability = 0.85; // 85% chance to just give up
  else if (aggression === 'Medium') dropoutProbability = 0.40;
  else if (aggression === 'High') dropoutProbability = 0.10;
  else dropoutProbability = 0.01; // Almost never drops out early

  // DNA risk tolerance modifies dropout (low risk tolerance = drops out faster)
  dropoutProbability += (100 - dna.riskTolerance) * 0.002;
  dropoutProbability = clamp(dropoutProbability, 0.01, 0.99);

  // 3. Hard walk-away ceiling: market evidence, remaining purse and minimum squad reserve.
  // Aggression changes willingness to reach the ceiling, never the ceiling itself.
  const minimumSquadReserve = Math.max(0, 18 - franchise.squad.length - 1) * 2_000_000;
  const purseSafeCap = Math.max(0, franchise.purse - minimumSquadReserve);
  const hardCap = Math.max(0, Math.min(franchise.purse, purseSafeCap, valuationCap));
  const conviction = 0.78 + (confidence.score / 100) * 0.22;
  const convictionCap = Math.floor(hardCap * conviction);
  const maximumBid = Math.min(hardCap, Math.max(player.basePrice || 2_000_000, convictionCap));

  // 4. Keep raises close to the published auction increment; avoid multi-crore jumps.
  const increment = currentBid < 10_000_000 ? 500_000 : currentBid < 20_000_000 ? 1_000_000 : currentBid < 50_000_000 ? 2_000_000 : 2_500_000;
  const recommendedBid = Math.min(maximumBid, currentBid + increment);
  // 5. Final Decision
  // They BUY if they haven't exceeded max bid and they pass the probabilistic check
  const passesProbabilisticCheck = Math.random() > dropoutProbability;
  
  let decision: 'BUY' | 'PASS' = 'PASS';
  if (recommendedBid > currentBid && currentBid < maximumBid && passesProbabilisticCheck && franchise.purse >= recommendedBid) {
    decision = 'BUY';
  }

  return {
    decision,
    recommendedBid: Math.round(recommendedBid),
    maximumBid: Math.round(maximumBid),
    aggression,
    dropoutProbability
  };
}
