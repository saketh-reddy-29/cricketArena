import { describe, it, expect } from 'vitest';
import {
  getBidIncrement,
  getMaxAllowableBid,
  calculateAIBaseValuation,
  calculateAIMaxWillingToPay,
  shouldAIStopBidding,
  checkSquadRoleQuotas,
  autoPickPlayingXI,
  calculateAuctionFinalStandings,
} from '../lib/iplAuctionEngine';
import { Player } from '../types/common';
import { Franchise } from '../stores/useGameStore';

describe('IPL Auction Engine & AI Bidding Specification Suite', () => {
  describe('1. Bid Increment Engine (Fixed bracket raises)', () => {
    it('applies +₹5 Lakh for bids between ₹20 Lakh and ₹1 Crore', () => {
      expect(getBidIncrement(2_000_000)).toBe(500_000);
      expect(getBidIncrement(5_000_000)).toBe(500_000);
      expect(getBidIncrement(9_500_000)).toBe(500_000);
    });

    it('applies +₹10 Lakh for bids between ₹1 Crore and ₹2 Crore', () => {
      expect(getBidIncrement(10_000_000)).toBe(1_000_000);
      expect(getBidIncrement(15_000_000)).toBe(1_000_000);
      expect(getBidIncrement(19_000_000)).toBe(1_000_000);
    });

    it('applies +₹20 Lakh for bids between ₹2 Crore and ₹5 Crore', () => {
      expect(getBidIncrement(20_000_000)).toBe(2_000_000);
      expect(getBidIncrement(35_000_000)).toBe(2_000_000);
      expect(getBidIncrement(48_000_000)).toBe(2_000_000);
    });

    it('applies +₹25 Lakh for bids above ₹5 Crore', () => {
      expect(getBidIncrement(50_000_000)).toBe(2_500_000);
      expect(getBidIncrement(120_000_000)).toBe(2_500_000);
      expect(getBidIncrement(240_000_000)).toBe(2_500_000);
    });
  });

  describe('2. Max Allowable Bid Formula', () => {
    it('enforces Max Bid = Remaining Purse - (Remaining Minimum Slots * Lowest Base Price)', () => {
      // User with 10 Cr remaining purse, squad size 14 (needs 4 players to reach 18)
      // Buying 1 player leaves 3 remaining unfilled slots * 20 Lakhs = 60 Lakhs reserved
      const purse = 100_000_000; // 10 Cr
      const squadSize = 14;
      const maxBid = getMaxAllowableBid(purse, squadSize, 2_000_000, 18);
      // 10 Cr - (18 - 14 - 1)*20L = 10 Cr - 3*20L = 9.40 Cr
      expect(maxBid).toBe(94_000_000);
    });

    it('allows full remaining purse when minimum squad size is already satisfied', () => {
      const purse = 25_000_000;
      const squadSize = 18;
      const maxBid = getMaxAllowableBid(purse, squadSize, 2_000_000, 18);
      expect(maxBid).toBe(purse);
    });
  });

  describe('3. AI Base Valuation Formula', () => {
    it('rates Marquee Stars (90-100) between ₹14 Crore and ₹22 Crore', () => {
      const val90 = calculateAIBaseValuation(90);
      const val95 = calculateAIBaseValuation(95);
      const val100 = calculateAIBaseValuation(100);

      expect(val90).toBe(140_000_000); // 14 Cr
      expect(val95).toBe(180_000_000); // 18 Cr
      expect(val100).toBe(220_000_000); // 22 Cr
    });

    it('rates Proven Starters (82-89) between ₹7 Crore and ₹13 Crore', () => {
      const val82 = calculateAIBaseValuation(82);
      const val86 = calculateAIBaseValuation(86);
      expect(val82).toBe(70_000_000); // 7 Cr
      expect(val86).toBeGreaterThanOrEqual(70_000_000);
      expect(val86).toBeLessThanOrEqual(130_000_000);
    });

    it('rates Solid Squad Players (75-81) between ₹2 Crore and ₹6 Crore', () => {
      const val75 = calculateAIBaseValuation(75);
      expect(val75).toBe(20_000_000); // 2 Cr
    });

    it('rates Uncapped/Backups (below 75) between ₹30 Lakh and ₹1.5 Crore', () => {
      const val65 = calculateAIBaseValuation(65);
      expect(val65).toBeGreaterThanOrEqual(3_000_000);
      expect(val65).toBeLessThanOrEqual(15_000_000);
    });
  });

  describe('4. AI Hard Limits & Stop Conditions', () => {
    const mockPlayer: Player = {
      id: 'p1',
      name: 'Star Overseas Player',
      role: 'Batsman',
      rating: 92,
      basePrice: 20_000_000,
      nationality: 'Overseas',
    };

    const mockFranchise: Franchise = {
      id: 'f1',
      name: 'Chennai Super Kings',
      shortName: 'CSK',
      color: '#facc15',
      purse: 100_000_000, // 10 Cr
      squad: ['p10', 'p11', 'p12'],
      overseasCount: 3,
    };

    it('stops bidding when next bid exceeds AI valuation', () => {
      const stopCheck = shouldAIStopBidding(150_000_000, 140_000_000, mockFranchise, mockPlayer);
      expect(stopCheck.shouldStop).toBe(true);
      expect(stopCheck.reason).toContain('Valuation cap');
    });

    it('stops bidding when next bid breaches purse safety reserve', () => {
      // 18 - 3 - 1 = 14 needed players * 30L = 4.2 Cr reserve needed
      // With 5 Cr purse, max available is 5 Cr - 4.2 Cr = 80L
      const lowPurseFranchise = { ...mockFranchise, purse: 50_000_000 };
      const stopCheck = shouldAIStopBidding(15_000_000, 200_000_000, lowPurseFranchise, mockPlayer);
      expect(stopCheck.shouldStop).toBe(true);
      expect(stopCheck.reason).toContain('Purse safety');
    });

    it('stops bidding when overseas quota of 8 is reached', () => {
      const maxOverseasFranchise = { ...mockFranchise, overseasCount: 8 };
      const stopCheck = shouldAIStopBidding(25_000_000, 200_000_000, maxOverseasFranchise, mockPlayer);
      expect(stopCheck.shouldStop).toBe(true);
      expect(stopCheck.reason).toContain('Overseas quota');
    });

    it('stops bidding when squad reaches cap of 25', () => {
      const fullSquad = Array.from({ length: 25 }, (_, i) => `p_${i}`);
      const maxSquadFranchise = { ...mockFranchise, squad: fullSquad };
      const domesticPlayer = { ...mockPlayer, nationality: 'Indian' as const };
      const stopCheck = shouldAIStopBidding(25_000_000, 200_000_000, maxSquadFranchise, domesticPlayer);
      expect(stopCheck.shouldStop).toBe(true);
      expect(stopCheck.reason).toContain('Squad cap');
    });
  });

  describe('5. Playing XI Auto-Picker & Final Standings', () => {
    it('picks balanced 11 players respecting max 4 overseas and role requirements', () => {
      const squad: Player[] = [
        // 6 Overseas Players
        { id: 'o1', name: 'Overseas 1', role: 'Batsman', rating: 95, basePrice: 20_000_000, nationality: 'Overseas' },
        { id: 'o2', name: 'Overseas 2', role: 'Batsman', rating: 94, basePrice: 20_000_000, nationality: 'Overseas' },
        { id: 'o3', name: 'Overseas 3', role: 'All-rounder', rating: 93, basePrice: 20_000_000, nationality: 'Overseas' },
        { id: 'o4', name: 'Overseas 4', role: 'Bowler', rating: 92, basePrice: 20_000_000, nationality: 'Overseas' },
        { id: 'o5', name: 'Overseas 5', role: 'Bowler', rating: 91, basePrice: 20_000_000, nationality: 'Overseas' },
        { id: 'o6', name: 'Overseas 6', role: 'Wicketkeeper', rating: 90, basePrice: 20_000_000, nationality: 'Overseas' },
        // 10 Indian Players
        { id: 'i1', name: 'Indian Keeper', role: 'Wicketkeeper', rating: 88, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i2', name: 'Indian Batter 1', role: 'Batsman', rating: 89, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i3', name: 'Indian Batter 2', role: 'Batsman', rating: 87, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i4', name: 'Indian Batter 3', role: 'Batsman', rating: 85, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i5', name: 'Indian Allrounder', role: 'All-rounder', rating: 86, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i6', name: 'Indian Bowler 1', role: 'Bowler', rating: 88, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i7', name: 'Indian Bowler 2', role: 'Bowler', rating: 87, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i8', name: 'Indian Bowler 3', role: 'Bowler', rating: 85, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i9', name: 'Indian Bowler 4', role: 'Bowler', rating: 84, basePrice: 10_000_000, nationality: 'Indian' },
        { id: 'i10', name: 'Indian Backup', role: 'Batsman', rating: 80, basePrice: 10_000_000, nationality: 'Indian' },
      ];

      const { playingXI, bench } = autoPickPlayingXI(squad);
      expect(playingXI.length).toBe(11);
      expect(bench.length).toBe(5);

      // Max 4 Overseas
      const overseasInXI = playingXI.filter((p) => p.nationality === 'Overseas');
      expect(overseasInXI.length).toBeLessThanOrEqual(4);

      // At least 1 Wicketkeeper
      const keepersInXI = playingXI.filter((p) => p.role === 'Wicketkeeper');
      expect(keepersInXI.length).toBeGreaterThanOrEqual(1);

      // At least 5 bowling options
      const bowlingInXI = playingXI.filter((p) => p.role === 'Bowler' || p.role === 'All-rounder');
      expect(bowlingInXI.length).toBeGreaterThanOrEqual(5);
    });

    it('calculates standings with Playing XI points and bonuses', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', role: 'Batsman', rating: 90, basePrice: 20_000_000, nationality: 'Indian' },
        { id: 'p2', name: 'Player 2', role: 'Wicketkeeper', rating: 88, basePrice: 10_000_000, nationality: 'Indian' },
      ];
      const franchises: Franchise[] = [
        { id: 'f1', name: 'Team A', shortName: 'TMA', color: '#ff0000', purse: 50_000_000, squad: ['p1', 'p2'], overseasCount: 0 },
        { id: 'f2', name: 'Team B', shortName: 'TMB', color: '#0000ff', purse: 80_000_000, squad: ['p1'], overseasCount: 0 },
      ];

      const standings = calculateAuctionFinalStandings(franchises, players);
      expect(standings.length).toBe(2);
      expect(standings[0].rank).toBe(1);
      expect(standings[1].rank).toBe(2);
      expect(standings[0].finalScore).toBeGreaterThanOrEqual(standings[1].finalScore);
    });
  });
});
