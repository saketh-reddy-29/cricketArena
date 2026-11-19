import type { Player } from '../types/common';

/** Official IPL 2027 retained squads, published 18 November 2026. */
export const IPL_2027_RETAINED_SQUADS: Record<string, string[]> = {
  CSK: ['Akeal Hosein','Anshul Kamboj','Ayush Mhatre','Dewald Brevis','Gurjapneet Singh','Jack Edwards','Jamie Overton','Kartik Sharma','Liam Livingstone','Mukesh Choudhary','Noor Ahmad','Rahul Chahar','Ramakrishna Ghosh','Ruturaj Gaikwad','Sanju Samson','Sarfaraz Khan','Shivam Dube','Shreyas Gopal','Urvil Patel'],
  DC: ['Ashutosh Sharma','Auqib Dar','Axar Patel','David Miller','KL Rahul','Kyle Jamieson','Lungisani Ngidi','Madhav Tiwari','Mukesh Kumar','Prithvi Shaw','Rishabh Pant','Sameer Rizvi','Tripurana Vijay','Tristan Stubbs','Vipraj Nigam','Zeeshan Ansari'],
  GT: ['Anuj Rawat','Ashok Sharma','Glenn Phillips','Gurnoor Singh Brar','Harshal Patel','Jason Holder','Jayant Yadav','Jos Buttler','Kagiso Rabada','Kumar Kushagra','Manav Suthar','Mohammad Siraj','Mohd. Arshad Khan','Nishant Sindhu','Prasidh Krishna','R. Sai Kishore','Rahul Tewatia','Rashid Khan','Sai Sudharsan','Shubman Gill','Tom Banton','Washington Sundar'],
  KKR: ['Angkrish Raghuvanshi','Anukul Roy','Cameron Green','Finn Allen','Harshit Rana','Kartik Tyagi','Manish Pandey','Prashant Solanki','Ramandeep Singh','Rinku Singh','Rovman Powell','Sarthak Ranjan','Saurabh Dubey','Sunil Narine','Tim Seifert','Vaibhav Arora','Varun Chakaravarthy'],
  LSG: ['Abdul Samad','Aiden Markram','Akash Singh','Akshat Raghuwanshi','Arjun Tendulkar','Arshin Kulkarni','Ayush Badoni','Digvesh Rathi','Josh Inglis','Kuldeep Yadav','Mayank Yadav','Mitchell Marsh','Mohsin Khan','Mukul Choudhary','Nicholas Pooran','Prince Yadav','Sam Curran','Shahbaz Ahmed'],
  MI: ['Arshdeep Singh','Ashwani Kumar','Corbin Bosch','Jasprit Bumrah','Mitchell Santner','Naman Dhir','Quinton de Kock','Raghu Sharma','Raj Angad Bawa','Rohit Sharma','Ryan Rickelton','Shardul Thakur','Sherfane Rutherford','Suryakumar Yadav','Tilak Varma','Will Jacks'],
  PBKS: ['Azmatullah Omarzai','Ben Dwarshuis','Cooper Connolly','Hardik Pandya','Harnoor Pannu','Harpreet Brar','Marco Jansen','Marcus Stoinis','Musheer Khan','Prabhsimran Singh','Priyansh Arya','Shashank Singh','Shreyas Iyer','Suryansh Shedge','Vishnu Vinod','Vyshak Vijaykumar','Xavier Bartlett','Yash Thakur','Yuzvendra Chahal'],
  RR: ['Aman Rao Perala','Brijesh Sharma','Dasun Shanaka','Dhruv Jurel','Donovan Ferreira','Jofra Archer','Lhuan-dre Pretorius','Manimaran Siddharth','Mohammed Shami','Nandre Burger','Ravi Bishnoi','Ravindra Jadeja','Riyan Parag','Sandeep Sharma','Shubham Dubey','Sushant Mishra','Vaibhav Sooryavanshi','Yash Raj Punja','Yashasvi Jaiswal'],
  RCB: ['Abhinandan Singh','Bhuvneshwar Kumar','Devdutt Padikkal','Jacob Duffy','Jitesh Sharma','Jordan Cox','Josh Hazlewood','Kanishk Chouhan','Krunal Pandya','Nuwan Thushara','Phil Salt','Rajat Patidar','Rasikh Dar','Romario Shepherd','Suyash Sharma','Tim David','Venkatesh Iyer','Vicky Ostwal','Virat Kohli','Yash Dayal'],
  SRH: ['Abhishek Sharma','Aniket Verma','Brydon Carse','Eshan Malinga','Harsh Dubey','Heinrich Klaasen','Ishan Kishan','Khaleel Ahmed','Krains Fuletra','Nathan Ellis','Nitish Kumar Reddy','Pat Cummins','Praful Hinge','Sakib Hussain','Salil Arora','Shivang Kumar','Smaran Ravichandran','T. Natarajan'],
};

/** Current purse remaining after official 2027 retentions (₹). */
export const IPL_2027_FRANCHISE_PURSES: Record<string, number> = {
  CSK: 280_500_000, DC: 395_000_000, GT: 87_500_000, KKR: 416_500_000,
  LSG: 474_500_000, MI: 326_000_000, PBKS: 186_000_000, RR: 270_500_000,
  RCB: 141_500_000, SRH: 401_500_000,
};

/** Released players and their last reported IPL salary, in lakh rupees. */
export const IPL_2027_RELEASED_PLAYERS: Array<{ name: string; lastSalaryLakh: number; overseas: boolean }> = [
  { name: 'Akash Madhwal', lastSalaryLakh: 30, overseas: false },
  { name: 'Aman Khan', lastSalaryLakh: 40, overseas: false },
  { name: 'Dian Forrester', lastSalaryLakh: 75, overseas: true },
  { name: 'Kuldip Yadav', lastSalaryLakh: 30, overseas: false },
  { name: 'Macneil Noronha', lastSalaryLakh: 30, overseas: false },
  { name: 'Matt Henry', lastSalaryLakh: 200, overseas: true },
  { name: 'Matthew Short', lastSalaryLakh: 150, overseas: true },
  { name: 'MS Dhoni', lastSalaryLakh: 400, overseas: false },
  { name: 'Prashant Veer', lastSalaryLakh: 1420, overseas: false },
  { name: 'Spencer Johnson', lastSalaryLakh: 150, overseas: true },
  { name: 'Zak Foulkes', lastSalaryLakh: 75, overseas: true },
  { name: 'Abishek Porel', lastSalaryLakh: 400, overseas: false },
  { name: 'Ajay Mandal', lastSalaryLakh: 30, overseas: false },
  { name: 'Dushmantha Chameera', lastSalaryLakh: 75, overseas: true },
  { name: 'Karun Nair', lastSalaryLakh: 50, overseas: false },
  { name: 'Mitchell Starc', lastSalaryLakh: 1175, overseas: true },
  { name: 'Nitish Rana', lastSalaryLakh: 420, overseas: false },
  { name: 'Pathum Nissanka', lastSalaryLakh: 400, overseas: true },
  { name: 'Rehan Ahmed', lastSalaryLakh: 75, overseas: true },
  { name: 'Sahil Parakh', lastSalaryLakh: 30, overseas: false },
  { name: 'Connor Esterhuizen', lastSalaryLakh: 75, overseas: true },
  { name: 'Luke Wood', lastSalaryLakh: 75, overseas: true },
  { name: 'Ishant Sharma', lastSalaryLakh: 75, overseas: false },
  { name: 'Kulwant Khejroliya', lastSalaryLakh: 30, overseas: false },
  { name: 'Prithviraj Yarra', lastSalaryLakh: 30, overseas: false },
  { name: 'Shahrukh Khan', lastSalaryLakh: 400, overseas: false },
  { name: 'Ajinkya Rahane', lastSalaryLakh: 150, overseas: false },
  { name: 'Akash Deep', lastSalaryLakh: 100, overseas: false },
  { name: 'Blessing Muzarabani', lastSalaryLakh: 150, overseas: true },
  { name: 'Daksh Kamra', lastSalaryLakh: 30, overseas: false },
  { name: 'Luvnith Sisodia', lastSalaryLakh: 30, overseas: false },
  { name: 'Matheesha Pathirana', lastSalaryLakh: 1800, overseas: true },
  { name: 'Mustafizur Rahman', lastSalaryLakh: 920, overseas: true },
  { name: 'Navdeep Saini', lastSalaryLakh: 75, overseas: false },
  { name: 'Rachin Ravindra', lastSalaryLakh: 200, overseas: true },
  { name: 'Rahul Tripathi', lastSalaryLakh: 75, overseas: false },
  { name: 'Tejasvi Singh', lastSalaryLakh: 300, overseas: false },
  { name: 'Umran Malik', lastSalaryLakh: 75, overseas: false },
  { name: 'Anrich Nortje', lastSalaryLakh: 200, overseas: true },
  { name: 'Avesh Khan', lastSalaryLakh: 975, overseas: false },
  { name: 'George Linde', lastSalaryLakh: 100, overseas: true },
  { name: 'Himmat Singh', lastSalaryLakh: 30, overseas: false },
  { name: 'Matthew Breetzke', lastSalaryLakh: 75, overseas: true },
  { name: 'Naman Tiwari', lastSalaryLakh: 100, overseas: false },
  { name: 'Wanindu Hasaranga', lastSalaryLakh: 200, overseas: true },
  { name: 'AM Ghazanfar', lastSalaryLakh: 480, overseas: true },
  { name: 'Atharva Ankolekar', lastSalaryLakh: 30, overseas: false },
  { name: 'Danish Malewar', lastSalaryLakh: 30, overseas: false },
  { name: 'Deepak Chahar', lastSalaryLakh: 925, overseas: false },
  { name: 'Keshav Maharaj', lastSalaryLakh: 75, overseas: true },
  { name: 'Krish Bhagat', lastSalaryLakh: 30, overseas: false },
  { name: 'Mahipal Lamror', lastSalaryLakh: 50, overseas: false },
  { name: 'Mayank Markande', lastSalaryLakh: 30, overseas: false },
  { name: 'Mayank Rawat', lastSalaryLakh: 30, overseas: false },
  { name: 'Mohammad Izhar', lastSalaryLakh: 30, overseas: false },
  { name: 'Robin Minz', lastSalaryLakh: 65, overseas: false },
  { name: 'Ruchit Ahir', lastSalaryLakh: 30, overseas: false },
  { name: 'Trent Boult', lastSalaryLakh: 1250, overseas: true },
  { name: 'Lockie Ferguson', lastSalaryLakh: 200, overseas: true },
  { name: 'Mitch Owen', lastSalaryLakh: 300, overseas: true },
  { name: 'Nehal Wadhera', lastSalaryLakh: 420, overseas: false },
  { name: 'Pravin Dubey', lastSalaryLakh: 30, overseas: false },
  { name: 'Pyla Avinash', lastSalaryLakh: 30, overseas: false },
  { name: 'Vishal Nishad', lastSalaryLakh: 30, overseas: false },
  { name: 'Adam Milne', lastSalaryLakh: 240, overseas: true },
  { name: 'Emanjot Chahal', lastSalaryLakh: 30, overseas: false },
  { name: 'Kuldeep Sen', lastSalaryLakh: 75, overseas: false },
  { name: 'Kwena Maphaka', lastSalaryLakh: 150, overseas: true },
  { name: 'Ravi Singh', lastSalaryLakh: 95, overseas: false },
  { name: 'Shimron Hetmyer', lastSalaryLakh: 1100, overseas: true },
  { name: 'Tushar Deshpande', lastSalaryLakh: 650, overseas: false },
  { name: 'Vignesh Puthur', lastSalaryLakh: 30, overseas: false },
  { name: 'Yudhvir Charak', lastSalaryLakh: 35, overseas: false },
  { name: 'Jacob Bethell', lastSalaryLakh: 260, overseas: true },
  { name: 'Mangesh Yadav', lastSalaryLakh: 520, overseas: false },
  { name: 'Richard Gleeson', lastSalaryLakh: 160, overseas: true },
  { name: 'Satvik Deswal', lastSalaryLakh: 30, overseas: false },
  { name: 'Swapnil Singh', lastSalaryLakh: 50, overseas: false },
  { name: 'Vihaan Malhotra', lastSalaryLakh: 30, overseas: false },
  { name: 'Amit Kumar', lastSalaryLakh: 30, overseas: false },
  { name: 'David Payne', lastSalaryLakh: 150, overseas: true },
  { name: 'Dilshan Madushanka', lastSalaryLakh: 75, overseas: true },
  { name: 'Gerald Coetzee', lastSalaryLakh: 200, overseas: true },
  { name: 'Jaydev Unadkat', lastSalaryLakh: 100, overseas: false },
  { name: 'Kamindu Mendis', lastSalaryLakh: 75, overseas: true },
  { name: 'Onkar Tarmale', lastSalaryLakh: 30, overseas: false },
  { name: 'R.S. Ambrish', lastSalaryLakh: 30, overseas: false },
  { name: 'Shivam Mavi', lastSalaryLakh: 75, overseas: false },
  { name: 'Travis Head', lastSalaryLakh: 1400, overseas: true },
];

/** Real TATA IPL 2026 winning bids, in crore rupees; reference only, not 2027 bids. */
export const IPL_2026_TOP_AUCTION_BUYS: Record<string, number> = {
  'Cameron Green': 25.2, 'Matheesha Pathirana': 18, 'Kartik Sharma': 14.2,
  'Prashant Veer': 14.2, 'Liam Livingstone': 13, 'Mustafizur Rahman': 9.2,
  'Josh Inglis': 8.6, 'Auqib Dar': 8.4, 'Ravi Bishnoi': 7.2,
  'Jason Holder': 7, 'Venkatesh Iyer': 7,
};

/** Verified IPL 2026 season leaderboard signals, kept separate from career totals. */
export const IPL_2026_SEASON_LEADERS: Record<string, { matches?: number; runs?: number; average?: number; wickets?: number; bestBowling?: string; highScore?: number; strikeRate?: number }> = {
  'Vaibhav Sooryavanshi': { matches: 16, runs: 776, average: 48.5 },
  'Kagiso Rabada': { matches: 17, wickets: 29, bestBowling: '3/25' },
  'KL Rahul': { highScore: 152, strikeRate: 226.86 },
  'Mohsin Khan': { matches: 7, wickets: 11 },
};

/** IPL 2027 retained salary-cap table, in crore rupees. */
export const IPL_2027_FRANCHISE_SPEND: Record<string, { spentCr: number; remainingCr: number; players: number; overseas: number; slots: number; overseasSlots: number }> = {
  CSK: { spentCr: 101.95, remainingCr: 28.05, players: 19, overseas: 6, slots: 6, overseasSlots: 2 },
  DC: { spentCr: 90.5, remainingCr: 39.5, players: 16, overseas: 4, slots: 9, overseasSlots: 4 },
  GT: { spentCr: 121.25, remainingCr: 8.75, players: 22, overseas: 6, slots: 3, overseasSlots: 2 },
  KKR: { spentCr: 88.35, remainingCr: 41.65, players: 17, overseas: 5, slots: 8, overseasSlots: 3 },
  LSG: { spentCr: 82.55, remainingCr: 47.45, players: 18, overseas: 5, slots: 7, overseasSlots: 3 },
  MI: { spentCr: 97.4, remainingCr: 32.6, players: 16, overseas: 6, slots: 9, overseasSlots: 2 },
  PBKS: { spentCr: 111.4, remainingCr: 18.6, players: 19, overseas: 6, slots: 6, overseasSlots: 2 },
  RR: { spentCr: 102.95, remainingCr: 27.05, players: 19, overseas: 5, slots: 6, overseasSlots: 3 },
  RCB: { spentCr: 115.85, remainingCr: 14.15, players: 20, overseas: 7, slots: 5, overseasSlots: 1 },
  SRH: { spentCr: 89.85, remainingCr: 40.15, players: 18, overseas: 5, slots: 7, overseasSlots: 3 },
};

const OVERSEAS_2027_RETAINED = new Set([
  'Akeal Hosein','Dewald Brevis','Jack Edwards','Jamie Overton','Liam Livingstone','Noor Ahmad',
  'David Miller','Kyle Jamieson','Lungisani Ngidi','Tristan Stubbs',
  'Glenn Phillips','Jason Holder','Jos Buttler','Kagiso Rabada','Rashid Khan','Tom Banton',
  'Cameron Green','Finn Allen','Rovman Powell','Sunil Narine','Tim Seifert',
  'Aiden Markram','Josh Inglis','Mitchell Marsh','Nicholas Pooran','Sam Curran',
  'Corbin Bosch','Mitchell Santner','Quinton de Kock','Ryan Rickelton','Sherfane Rutherford','Will Jacks',
  'Azmatullah Omarzai','Ben Dwarshuis','Cooper Connolly','Marco Jansen','Marcus Stoinis','Xavier Bartlett',
  'Dasun Shanaka','Donovan Ferreira','Jofra Archer','Lhuan-dre Pretorius','Nandre Burger',
  'Jacob Duffy','Jordan Cox','Josh Hazlewood','Nuwan Thushara','Phil Salt','Romario Shepherd','Tim David',
  'Brydon Carse','Eshan Malinga','Heinrich Klaasen','Nathan Ellis','Pat Cummins',
]);

const PLAYER_ROLE_OVERRIDES: Record<string, Player['role']> = {
  'Jack Edwards': 'All-rounder', 'Auqib Dar': 'Bowler', 'Lungisani Ngidi': 'Bowler',
  'Gurnoor Singh Brar': 'Bowler', 'Mohammad Siraj': 'Bowler', 'Mohd. Arshad Khan': 'All-rounder',
  'R. Sai Kishore': 'Bowler', 'Tom Banton': 'Wicketkeeper', 'Digvesh Rathi': 'Bowler',
  'Harnoor Pannu': 'Batsman', 'Musheer Khan': 'All-rounder', 'Yash Thakur': 'Bowler',
  'Aman Rao Perala': 'Batsman', 'Yash Raj Punja': 'Bowler', 'Rasikh Dar': 'Bowler', 'Yash Dayal': 'Bowler',
  'Ajay Mandal': 'All-rounder', 'Luvnith Sisodia': 'Wicketkeeper', 'Tejasvi Singh': 'Wicketkeeper',
  'Atharva Ankolekar': 'All-rounder', 'Mahipal Lamror': 'All-rounder', 'Mitch Owen': 'All-rounder',
  'Pravin Dubey': 'Bowler', 'Emanjot Chahal': 'Bowler', 'Yudhvir Charak': 'All-rounder',
  'Mohammad Izhar': 'Bowler', 'AM Ghazanfar': 'Bowler', 'Mahipal Lamror': 'All-rounder',
};

const PLAYER_ALIASES: Record<string, string> = {
  'T. Natarajan': 'T Natarajan',
  'R.S. Ambrish': 'R.S. Ambrish',
  'AM Ghazanfar': 'Allah Mohammad Ghazanfar',
  'Mahipal Lamror': 'Mahipal Lomror',
  'Mukul Choudhary': 'Mukesh Choudhary',
  'Varun Chakaravarthy': 'Varun Chakravarthy',
};
const UNCAPPED_2027_GAME_CLASSIFICATION = new Set([
  'Anshul Kamboj','Ayush Mhatre','Gurjapneet Singh','Kartik Sharma','Ramakrishna Ghosh','Urvil Patel',
  'Ashutosh Sharma','Auqib Dar','Madhav Tiwari','Sameer Rizvi','Tripurana Vijay','Vipraj Nigam','Zeeshan Ansari',
  'Anuj Rawat','Ashok Sharma','Gurnoor Singh Brar','Kumar Kushagra','Manav Suthar','Nishant Sindhu',
  'Mohd. Arshad Khan','Digvesh Rathi','Harnoor Pannu','Musheer Khan','Priyansh Arya','Suryansh Shedge',
  'Aman Rao Perala','Yash Raj Punja','Abhinandan Singh','Kanishk Chouhan','Rasikh Dar','Suyash Sharma',
  'Vicky Ostwal','Krains Fuletra','Praful Hinge','Salil Arora','Smaran Ravichandran','Shivang Kumar',
]);

export function normaliseIplName(name: string): string {
  return (PLAYER_ALIASES[name] || name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function playerRecordScore(player: Player): number {
  const extra = player as Player & { stats?: Record<string, number>; matches?: number; runs?: number; wickets?: number };
  const stats = extra.stats || {};
  return (player.careerStats?.matches || 0) * 4 + (extra.matches || stats.matches || 0) * 3
    + (player.careerStats?.runs || extra.runs || stats.runs || 0) / 100
    + (player.careerStats?.wickets || extra.wickets || stats.wickets || 0);
}

function makeRosterFallback(name: string, overseas: boolean, idSeed: string): Player {
  const role = PLAYER_ROLE_OVERRIDES[name] || 'All-rounder';
  const rating = role === 'Bowler' ? 74 : role === 'Wicketkeeper' ? 75 : 73;
  return {
    id: 'ipl27-' + idSeed,
    name,
    role,
    nationality: overseas ? 'Overseas' : 'Indian',
    rating,
    baseAbility: rating,
    form: 70,
    basePrice: 3_000_000,
    stats: { batting: role === 'Bowler' ? 24 : 70, bowling: role === 'Batsman' || role === 'Wicketkeeper' ? 0 : 68, fielding: 68 },
    careerStats: { matches: 0, runs: 0, wickets: 0, ballsFaced: 0, ballsBowled: 0, runsConceded: 0, dismissals: 0, catches: 0 },
  };
}

export function prepareIpl2027Players(sourcePlayers: Player[]): Player[] {
  const unique = new Map<string, Player>();
  sourcePlayers.forEach((player) => {
    const key = normaliseIplName(player.name);
    const previous = unique.get(key);
    if (!previous || playerRecordScore(player) > playerRecordScore(previous)) unique.set(key, player);
  });

  const officialNames = Object.entries(IPL_2027_RETAINED_SQUADS).flatMap(([team, names]) =>
    names.map((name) => ({ name, overseas: OVERSEAS_2027_RETAINED.has(name), seed: 'retained-' + team.toLowerCase() }))
  );
  const releasedNames = IPL_2027_RELEASED_PLAYERS.map((player) => ({ ...player, seed: 'released' }));
  [...officialNames, ...releasedNames].forEach(({ name, overseas, seed }) => {
    const key = normaliseIplName(name);
    const existing = unique.get(key);
    const lastSalaryLakh = 'lastSalaryLakh' in (releasedNames.find((entry) => normaliseIplName(entry.name) === key) || {}) 
      ? (releasedNames.find((entry) => normaliseIplName(entry.name) === key) as { lastSalaryLakh: number }).lastSalaryLakh
      : undefined;
    const isCapped = !UNCAPPED_2027_GAME_CLASSIFICATION.has(name);
    if (existing) {
      unique.set(key, {
        ...existing,
        nationality: overseas ? 'Overseas' : 'Indian',
        lastIplSalaryLakh: lastSalaryLakh ?? existing.lastIplSalaryLakh,
        isCapped,
      });
    } else {
      unique.set(key, { ...makeRosterFallback(name, overseas, key || seed), lastIplSalaryLakh, isCapped });
    }
  });

  return Array.from(unique.values());
}

export function getIpl2027Franchises(players: Player[], templates: Array<{ id: string; name: string; shortName: string; color: string; logo: string; strategy: any; purse: number; squad: string[]; shortlist: string[]; overseasCount: number }>) {
  const byName = new Map(players.map((player) => [normaliseIplName(player.name), player]));
  return templates.map((team) => {
    const roster = IPL_2027_RETAINED_SQUADS[team.shortName] || [];
    const squad = roster.map((name) => byName.get(normaliseIplName(name))?.id).filter((id): id is string => Boolean(id));
    return {
      ...team,
      squad: Array.from(new Set(squad)),
      purse: IPL_2027_FRANCHISE_PURSES[team.shortName] ?? 0,
      overseasCount: squad.filter((id) => players.find((player) => player.id === id)?.nationality === 'Overseas').length,
    };
  });
}

export function getIpl2027AuctionPool(players: Player[]): string[] {
  const byName = new Map(players.map((player) => [normaliseIplName(player.name), player.id]));
  return IPL_2027_RELEASED_PLAYERS.map((entry) => byName.get(normaliseIplName(entry.name))).filter((id): id is string => Boolean(id));
}

export function getIpl2027MarketData(name: string) {
  const canonical = PLAYER_ALIASES[name] || name;
  const release = IPL_2027_RELEASED_PLAYERS.find((entry) => normaliseIplName(entry.name) === normaliseIplName(name));
  const topBuy = Object.entries(IPL_2026_TOP_AUCTION_BUYS).find(([playerName]) => normaliseIplName(playerName) === normaliseIplName(canonical));
  const season = Object.entries(IPL_2026_SEASON_LEADERS).find(([playerName]) => normaliseIplName(playerName) === normaliseIplName(canonical))?.[1];
  return {
    lastSalary: release ? release.lastSalaryLakh * 100_000 : undefined,
    lastWinningBid: topBuy ? topBuy[1] * 10_000_000 : undefined,
    season2026: season,
  };
}
