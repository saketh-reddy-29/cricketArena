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
/** IPL 2026 completed-season batting leaderboard; scores are kept separate from career totals. */
export const IPL_2026_SEASON_LEADERS: Record<string, {
  team?: string; matches?: number; innings?: number; runs?: number; average?: number;
  strikeRate?: number; fours?: number; sixes?: number; wickets?: number; bestBowling?: string; highScore?: number;
}> = {
  'Vaibhav Sooryavanshi': { team: 'RR', matches: 16, innings: 16, runs: 776, average: 48.50, strikeRate: 237.31, fours: 63, sixes: 72 },
  'Shubman Gill': { team: 'GT', matches: 16, innings: 16, runs: 732, average: 45.75, strikeRate: 163.03, fours: 74, sixes: 33 },
  'Sai Sudharsan': { team: 'GT', matches: 17, innings: 17, runs: 722, average: 45.13, strikeRate: 157.99, fours: 75, sixes: 30 },
  'Virat Kohli': { team: 'RCB', matches: 16, innings: 16, runs: 675, average: 56.25, strikeRate: 165.85, fours: 73, sixes: 25 },
  'Heinrich Klaasen': { team: 'SRH', matches: 15, innings: 15, runs: 624, average: 48.00, strikeRate: 160.00, fours: 48, sixes: 31 },
  'Ishan Kishan': { team: 'SRH', matches: 15, innings: 15, runs: 602, average: 40.13, strikeRate: 182.42, fours: 60, sixes: 32 },
  'KL Rahul': { team: 'DC', matches: 14, innings: 14, runs: 593, average: 45.62, strikeRate: 174.41, fours: 56, sixes: 31, highScore: 152 },
  'Abhishek Sharma': { team: 'SRH', matches: 15, innings: 15, runs: 563, average: 40.21, strikeRate: 204.73, fours: 50, sixes: 43 },
  'Mitchell Marsh': { team: 'LSG', matches: 13, innings: 13, runs: 563, average: 43.31, strikeRate: 163.19, fours: 51, sixes: 36 },
  'Jos Buttler': { team: 'GT', matches: 17, innings: 17, runs: 526, average: 37.57, strikeRate: 152.46, fours: 51, sixes: 26 },
  'Dhruv Jurel': { team: 'RR', matches: 16, innings: 16, runs: 515, average: 36.79, strikeRate: 154.65, fours: 47, sixes: 24 },
  'Prabhsimran Singh': { team: 'PBKS', matches: 14, innings: 13, runs: 510, average: 42.50, strikeRate: 168.87, fours: 55, sixes: 23 },
  'Rajat Patidar': { team: 'RCB', matches: 15, innings: 14, runs: 501, average: 41.75, strikeRate: 192.69, fours: 30, sixes: 42 },
  'Shreyas Iyer': { team: 'PBKS', matches: 14, innings: 13, runs: 498, average: 55.33, strikeRate: 168.81, fours: 39, sixes: 30 },
  'Cooper Connolly': { team: 'PBKS', matches: 14, innings: 13, runs: 491, average: 44.64, strikeRate: 163.12, fours: 43, sixes: 32 },
  'Sanju Samson': { team: 'CSK', matches: 14, innings: 14, runs: 477, average: 43.36, strikeRate: 165.63, fours: 53, sixes: 24 },
  'Devdutt Padikkal': { team: 'RCB', matches: 16, innings: 15, runs: 464, average: 33.14, strikeRate: 168.73, fours: 49, sixes: 24 },
  'Ryan Rickelton': { team: 'MI', matches: 12, innings: 12, runs: 448, average: 40.73, strikeRate: 186.67, fours: 31, sixes: 38 },
  'Yashasvi Jaiswal': { team: 'RR', matches: 16, innings: 16, runs: 427, average: 30.50, strikeRate: 152.50, fours: 52, sixes: 18 },
  'Angkrish Raghuvanshi': { team: 'KKR', matches: 13, innings: 12, runs: 422, average: 42.20, strikeRate: 146.53, fours: 40, sixes: 19 },
  'Travis Head': { team: 'SRH', matches: 15, innings: 15, runs: 410, average: 27.33, strikeRate: 170.12, fours: 46, sixes: 23 },
  'Washington Sundar': { team: 'GT', matches: 17, innings: 16, runs: 377, average: 37.70, strikeRate: 150.20, fours: 40, sixes: 12 },
  'Priyansh Arya': { team: 'PBKS', matches: 13, innings: 13, runs: 364, average: 28.00, strikeRate: 211.63, fours: 27, sixes: 32 },
  'Tilak Varma': { team: 'MI', matches: 14, innings: 14, runs: 359, average: 29.92, strikeRate: 145.93, fours: 30, sixes: 17 },
  'Finn Allen': { team: 'KKR', matches: 11, innings: 11, runs: 349, average: 34.90, strikeRate: 214.11, fours: 33, sixes: 28 },
  'Ruturaj Gaikwad': { team: 'CSK', matches: 14, innings: 14, runs: 337, average: 28.08, strikeRate: 123.44, fours: 29, sixes: 12 },
  'Ajinkya Rahane': { team: 'KKR', matches: 14, innings: 14, runs: 335, average: 25.77, strikeRate: 135.08, fours: 25, sixes: 18 },
  'Cameron Green': { team: 'KKR', matches: 14, innings: 14, runs: 322, average: 32.20, strikeRate: 145.70, fours: 22, sixes: 17 },
  'Naman Dhir': { team: 'MI', matches: 14, innings: 14, runs: 318, average: 26.50, strikeRate: 147.22, fours: 31, sixes: 13 },
  'Donovan Ferreira': { team: 'RR', matches: 15, innings: 13, runs: 317, average: 35.22, strikeRate: 179.10, fours: 25, sixes: 23 },
  'Rishabh Pant': { team: 'LSG', matches: 14, innings: 13, runs: 312, average: 28.36, strikeRate: 138.05, fours: 30, sixes: 11 },
  'Riyan Parag': { team: 'RR', matches: 14, innings: 14, runs: 309, average: 23.77, strikeRate: 157.65, fours: 24, sixes: 21 },
  'Tim David': { team: 'RCB', matches: 16, innings: 15, runs: 305, average: 33.89, strikeRate: 188.27, fours: 22, sixes: 23 },
  'Nitish Kumar Reddy': { team: 'SRH', matches: 14, innings: 13, runs: 302, average: 30.20, strikeRate: 171.59, fours: 19, sixes: 21 },
  'Rinku Singh': { team: 'KKR', matches: 14, innings: 11, runs: 295, average: 59.00, strikeRate: 148.99, fours: 27, sixes: 11 },
  'Kartik Sharma': { team: 'CSK', matches: 11, innings: 11, runs: 295, average: 32.78, strikeRate: 136.57, fours: 24, sixes: 16 },
  'Rohit Sharma': { team: 'MI', matches: 9, innings: 9, runs: 283, average: 35.38, strikeRate: 157.22, fours: 21, sixes: 21 },
  'Pathum Nissanka': { team: 'DC', matches: 10, innings: 10, runs: 278, average: 27.80, strikeRate: 158.86, fours: 33, sixes: 12 },
  'Tristan Stubbs': { team: 'DC', matches: 14, innings: 13, runs: 275, average: 34.38, strikeRate: 127.31, fours: 18, sixes: 9 },
  'Shivam Dube': { team: 'CSK', matches: 13, innings: 12, runs: 270, average: 38.57, strikeRate: 158.82, fours: 24, sixes: 15 },
  'Suryakumar Yadav': { team: 'MI', matches: 13, innings: 13, runs: 270, average: 20.77, strikeRate: 147.54, fours: 28, sixes: 10 },
  'Josh Inglis': { team: 'LSG', matches: 5, innings: 5, runs: 266, average: 53.20, strikeRate: 186.01, fours: 32, sixes: 12 },
  'Ravindra Jadeja': { team: 'RR', matches: 14, innings: 11, runs: 266, average: 66.50, strikeRate: 135.03, fours: 24, sixes: 5 },
  'Sameer Rizvi': { team: 'DC', matches: 11, innings: 9, runs: 252, average: 36.00, strikeRate: 147.37, fours: 15, sixes: 17 },
  'Nicholas Pooran': { team: 'LSG', matches: 14, innings: 14, runs: 234, average: 18.00, strikeRate: 127.87, fours: 11, sixes: 19 },
  'Aiden Markram': { team: 'LSG', matches: 12, innings: 11, runs: 231, average: 25.67, strikeRate: 138.32, fours: 20, sixes: 11 },
  'Krunal Pandya': { team: 'RCB', matches: 16, innings: 9, runs: 226, average: 37.67, strikeRate: 145.81, fours: 20, sixes: 11 },
  'Nitish Rana': { team: 'DC', matches: 9, innings: 9, runs: 225, average: 25.00, strikeRate: 151.01, fours: 27, sixes: 10 },
  'Marcus Stoinis': { team: 'PBKS', matches: 13, innings: 9, runs: 216, average: 36.00, strikeRate: 180.00, fours: 23, sixes: 11 },
  'Ayush Badoni': { team: 'LSG', matches: 10, innings: 10, runs: 215, average: 21.50, strikeRate: 152.48, fours: 23, sixes: 9 },
  'David Miller': { team: 'DC', matches: 11, innings: 10, runs: 211, average: 35.17, strikeRate: 154.01, fours: 15, sixes: 14 },
  'Venkatesh Iyer': { team: 'RCB', matches: 7, innings: 6, runs: 209, average: 52.25, strikeRate: 186.61, fours: 21, sixes: 13 },
  'Hardik Pandya': { team: 'MI', matches: 10, innings: 10, runs: 206, average: 22.89, strikeRate: 138.26, fours: 21, sixes: 7 },
  'Phil Salt': { team: 'RCB', matches: 6, innings: 6, runs: 202, average: 33.67, strikeRate: 168.33, fours: 16, sixes: 11 },
  'Ayush Mhatre': { team: 'CSK', matches: 6, innings: 6, runs: 201, average: 33.50, strikeRate: 177.88, fours: 20, sixes: 12 },
  'Rahul Tewatia': { team: 'GT', matches: 16, innings: 15, runs: 190, average: 27.14, strikeRate: 143.94, fours: 20, sixes: 8 },
  'Rovman Powell': { team: 'KKR', matches: 11, innings: 7, runs: 190, average: 38.00, strikeRate: 134.75, fours: 16, sixes: 10 },
  'Axar Patel': { team: 'DC', matches: 14, innings: 11, runs: 173, average: 19.22, strikeRate: 131.06, fours: 16, sixes: 6 },
  'Ashutosh Sharma': { team: 'DC', matches: 8, innings: 8, runs: 171, average: 34.20, strikeRate: 181.91, fours: 15, sixes: 12 },
  'Mukul Choudhary': { team: 'LSG', matches: 10, innings: 10, runs: 170, average: 28.33, strikeRate: 141.67, fours: 11, sixes: 12 },
  'Sarfaraz Khan': { team: 'CSK', matches: 8, innings: 7, runs: 161, average: 23.00, strikeRate: 169.47, fours: 23, sixes: 6 },
  'Jacob Bethell': { team: 'RCB', matches: 7, innings: 7, runs: 96, average: 13.71, strikeRate: 124.68, fours: 12, sixes: 3 },
  'Himmat Singh': { team: 'LSG', matches: 6, innings: 5, runs: 92, average: 30.67, strikeRate: 133.33, fours: 5, sixes: 5 },
  'Prashant Veer': { team: 'CSK', matches: 6, innings: 5, runs: 90, average: 45.00, strikeRate: 134.33, fours: 10, sixes: 3 },
  'Romario Shepherd': { team: 'RCB', matches: 15, innings: 7, runs: 83, average: 20.75, strikeRate: 125.76, fours: 6, sixes: 5 },
  'Ramandeep Singh': { team: 'KKR', matches: 8, innings: 6, runs: 82, average: 16.40, strikeRate: 120.59, fours: 8, sixes: 2 },
  'Shubham Dubey': { team: 'RR', matches: 7, innings: 6, runs: 81, average: 20.25, strikeRate: 139.66, fours: 8, sixes: 3 },
  'Aniket Verma': { team: 'SRH', matches: 10, innings: 8, runs: 79, average: 13.17, strikeRate: 146.30, fours: 6, sixes: 5 },
  'Shimron Hetmyer': { team: 'RR', matches: 8, innings: 7, runs: 78, average: 13.00, strikeRate: 113.04, fours: 5, sixes: 3 },
  'Manish Pandey': { team: 'KKR', matches: 6, innings: 2, runs: 70, average: 35.00, strikeRate: 142.86, fours: 8, sixes: 2 },
  'Glenn Phillips': { team: 'GT', matches: 6, innings: 5, runs: 67, average: 16.75, strikeRate: 124.07, fours: 4, sixes: 2 },
  'Jason Holder': { team: 'GT', matches: 11, innings: 7, runs: 65, average: 13.00, strikeRate: 125.00, fours: 3, sixes: 3 },
  'Nehal Wadhera': { team: 'PBKS', matches: 8, innings: 6, runs: 65, average: 10.83, strikeRate: 114.04, fours: 4, sixes: 4 },
  'Jofra Archer': { team: 'RR', matches: 16, innings: 10, runs: 64, average: 10.67, strikeRate: 136.17, fours: 4, sixes: 4, wickets: 25 },
  'Dasun Shanaka': { team: 'RR', matches: 7, innings: 5, runs: 63, average: 12.60, strikeRate: 136.96, fours: 3, sixes: 4 },
  'Nishant Sindhu': { team: 'GT', matches: 8, innings: 5, runs: 63, average: 12.60, strikeRate: 126.00, fours: 7, sixes: 2 },
  'Matthew Short': { team: 'CSK', matches: 3, innings: 3, runs: 60, average: 20.00, strikeRate: 117.65, fours: 6, sixes: 1 },
  'Anshul Kamboj': { team: 'CSK', matches: 14, innings: 4, runs: 58, average: 58.00, strikeRate: 152.63, fours: 3, sixes: 4 },
  'Shahbaz Ahmed': { team: 'LSG', matches: 5, innings: 2, runs: 58, strikeRate: 141.46, fours: 4, sixes: 3 },
  'Shivang Kumar': { team: 'SRH', matches: 13, innings: 6, runs: 53, average: 8.83, strikeRate: 115.22, fours: 6, sixes: 1 },
  'Azmatullah Omarzai': { team: 'PBKS', matches: 3, innings: 2, runs: 52, average: 26.00, strikeRate: 192.59, fours: 3, sixes: 5 },
  'Anukul Roy': { team: 'KKR', matches: 14, innings: 7, runs: 52, average: 13.00, strikeRate: 133.33, fours: 3, sixes: 2 },
  'Marco Jansen': { team: 'PBKS', matches: 13, innings: 5, runs: 51, average: 12.75, strikeRate: 113.33, fours: 1, sixes: 3 },
  'Corbin Bosch': { team: 'MI', matches: 6, innings: 4, runs: 50, average: 50.00, strikeRate: 161.29, fours: 5, sixes: 2 },
  'Rashid Khan': { team: 'GT', matches: 17, innings: 6, runs: 50, average: 12.50, strikeRate: 121.95, fours: 4, sixes: 2 },
  'Kagiso Rabada': { team: 'GT', matches: 17, innings: 0, wickets: 29, bestBowling: '3/25' },
  'Bhuvneshwar Kumar': { team: 'RCB', matches: 17, innings: 0, wickets: 28 },
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
  'Aman Rao Perala': 'Batsman', 'Yash Raj Punja': 'Bowler', 'Yash Dayal': 'Bowler', 'Rasikh Dar': 'Bowler',
  'Ajay Mandal': 'All-rounder', 'Luvnith Sisodia': 'Wicketkeeper', 'Tejasvi Singh': 'Wicketkeeper',
  'Atharva Ankolekar': 'All-rounder', 'Mahipal Lamror': 'All-rounder', 'Mitch Owen': 'All-rounder',
  'Pravin Dubey': 'Bowler', 'Emanjot Chahal': 'Bowler', 'Yudhvir Charak': 'All-rounder',
  'Mohammad Izhar': 'Bowler', 'AM Ghazanfar': 'Bowler',
};

const PLAYER_ALIASES: Record<string, string> = {
  'T. Natarajan': 'T Natarajan',
  'Lungisani Ngidi': 'Lungi Ngidi',
  'Mohammad Siraj': 'Mohammed Siraj',
  'Mohd. Arshad Khan': 'Arshad Khan',
  'R. Sai Kishore': 'Sai Kishore',
  'Digvesh Rathi': 'Digvesh Singh Rathi',
  'Auqib Dar': 'Auqib Nabi',
  'Musheer Khan': 'Musheer Ahmed Khan',
  'Aman Rao Perala': 'Aman Rao',
  'Rasikh Dar': 'Rasikh Salam',
  'Mitch Owen': 'Mitchell Owen',
  'Ryan David Rickelton': 'Ryan Rickelton',
  'Finnley Allen': 'Finn Allen',
  'Karthik Sharma': 'Kartik Sharma',
  'B. Sai Sudharsan': 'Sai Sudharsan',
  'R.S. Ambrish': 'R.S. Ambrish',
  'AM Ghazanfar': 'Allah Mohammad Ghazanfar',
  'Mahipal Lamror': 'Mahipal Lomror',
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
