/**
 * Selected official TATA IPL 2026 season leaderboard highlights.
 * Source: IPL's official season summary at https://www.iplt20.com/
 * These are selected headline records, not a complete 2026 player-stat export.
 */
export interface OfficialIPL2026Highlight {
  matches?: number;
  runs?: number;
  battingAverage?: number;
  highestScore?: number;
  highestScoreOpponent?: string;
  highestScoreStrikeRate?: number;
  wickets?: number;
  bestBowling?: string;
  dotBalls?: number;
  award: string;
}

export const OFFICIAL_IPL_2026_SOURCE = {
  title: 'TATA IPL 2026 official season summary',
  url: 'https://www.iplt20.com/',
  season: 2026,
} as const;

const highlights: Record<string, OfficialIPL2026Highlight> = {
  'vaibhavsooryavanshi': {
    matches: 16,
    runs: 776,
    battingAverage: 48.5,
    award: 'Orange Cap',
  },
  'kagisorabada': {
    matches: 17,
    wickets: 29,
    bestBowling: '3/25',
    award: 'Purple Cap',
  },
  'klrahul': {
    highestScore: 152,
    highestScoreOpponent: 'Punjab Kings',
    highestScoreStrikeRate: 226.86,
    award: 'Highest individual score',
  },
  'mohsinkhan': {
    matches: 7,
    wickets: 11,
    dotBalls: 69,
    award: 'Best bowling figures leaderboard',
  },
};

const aliases: Record<string, string> = {
  'klrahul': 'kl rahul',
  'mohsin khan': 'mohsin khan',
  'moshinkhan': 'mohsin khan',
};

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

export function getOfficialIPL2026Highlight(name: string): OfficialIPL2026Highlight | undefined {
  const key = normalize(name);
  return highlights[aliases[key] || key];
}
