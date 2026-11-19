import type { Player } from '../types/common';

/**
 * Additional players named on the official IPL 2026 franchise squad pages but not
 * present in the legacy game pool. Ratings/base prices here are gameplay defaults only.
 * They are deliberately not career statistics; IPLCareerStats is matched separately.
 */
const fallbackPlayer = (
  id: string,
  name: string,
  role: Player['role'],
  rating: number,
  basePrice = 3_000_000,
  nationality: Player['nationality'] = 'Indian',
): Player => {
  const batting = role === 'Bowler' ? 28 : role === 'All-rounder' ? 68 : 76;
  const bowling = role === 'Batsman' || role === 'Wicketkeeper' ? 0 : role === 'All-rounder' ? 68 : 78;
  return {
    id,
    name,
    role,
    nationality,
    rating,
    baseAbility: rating,
    form: 70,
    basePrice,
    stats: {
      batting,
      bowling,
      fielding: Math.max(65, rating - 3),
    },
    careerStats: {
      matches: 0,
      runs: 0,
      wickets: 0,
      ballsFaced: 0,
      ballsBowled: 0,
      runsConceded: 0,
      dismissals: 0,
      catches: 0,
    },
  };
};

export const OFFICIAL_2026_FALLBACK_PLAYERS: Player[] = [
  fallbackPlayer('mi-atharva-ankolekar', 'Atharva Ankolekar', 'All-rounder', 72),
  fallbackPlayer('gt-gurnoor-singh-brar', 'Gurnoor Singh Brar', 'Bowler', 72),
  fallbackPlayer('kkr-tejasvi-singh', 'Tejasvi Singh', 'Wicketkeeper', 70),
  fallbackPlayer('pbks-harnoor-pannu', 'Harnoor Pannu', 'Batsman', 70),
  fallbackPlayer('pbks-musheer-khan', 'Musheer Khan', 'All-rounder', 76),
  fallbackPlayer('rr-yudhvir-singh-charak', 'Yudhvir Singh Charak', 'All-rounder', 76, 5_000_000),
  fallbackPlayer('rcb-yash-dayal', 'Yash Dayal', 'Bowler', 84, 50_000_000),
  fallbackPlayer('rcb-rasikh-dar', 'Rasikh Dar', 'Bowler', 76, 7_500_000),
];
