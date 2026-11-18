export interface CricketArenaPose {
  sp: number;      // Stadium spin / celebration full rotation angle
  yw: number;      // Body orientation along pitch axis (0 = facing bowler, 1 = side-on batting stance)
  lean: number;    // Torso lean forward/backward
  head: number;    // Head pitch / tilt tracking
  crouch: number;  // Pelvis / hip drop in meters
  lfx: number;     // Left foot forward/back
  lfy: number;     // Left foot vertical lift
  rfx: number;     // Right foot forward/back
  rfy: number;     // Right foot vertical lift
  lhx: number;     // Left hand forward target
  lhy: number;     // Left hand height target
  rhx: number;     // Right hand forward target
  rhy: number;     // Right hand height target
  grip: number;    // Bat grip mode (0 = no bat/free, 1 = one-hand hold, 2 = two-hand batting grip)
  bx: number;      // Bat base X position
  by: number;      // Bat base Y height
  ba: number;      // Bat angle (in radians)
  air: number;     // Airborne vertical displacement (running/jumping/diving)
  rot: number;     // Full body pitch / dive rotation
  latL?: number;   // Left arm lateral offset
  latR?: number;   // Right arm lateral offset
  tw?: number;     // Spine twist angle
  toe?: number;    // Foot pitch angle
  mir?: number;    // 1 = left-handed batter (right hand is the top hand on the handle)
  hd?: number;     // Head yaw relative to the body (+ = look to the character's left)
}

export type CricketArenaAction =
  | 'idle'
  | 'ready'
  | 'stand'
  | 'fielderWait'
  | 'fielderReady'
  | 'nonStrikerWait'
  | 'nonStrikerBackUp'
  | 'auctionSit'
  | 'auctionBid'
  | 'auctioneerCall'
  | 'walk'
  | 'jog'
  | 'sprint'
  | 'run'
  | 'runBat'
  | 'walkBat'
  | 'sprintBat'
  | 'batIdle'
  | 'batStance'
  | 'batPickup'
  | 'backlift'
  | 'batLower'
  | 'batShoulder'
  | 'forwardDefence'
  | 'backDefence'
  | 'straightDrive'
  | 'coverDrive'
  | 'offDrive'
  | 'onDrive'
  | 'pull'
  | 'hook'
  | 'sweep'
  | 'reverseSweep'
  | 'lofted'
  | 'flick'
  | 'lateCut'
  | 'squareCut'
  | 'followThrough'
  | 'fastBowl'
  | 'spinBowl'
  | 'bowl_fast'
  | 'bowl_spin'
  | 'bowl_seam'
  | 'bowl_swing'
  | 'bowl_slower'
  | 'bowl_yorker'
  | 'bowl_bouncer'
  | 'groundField'
  | 'ballPickup'
  | 'highCatch'
  | 'diveCatch'
  | 'diveStop'
  | 'getUp'
  | 'slide'
  | 'fall'
  | 'throwOver'
  | 'throwUnder'
  | 'throwPower'
  | 'throwQuick'
  | 'catchChest'
  | 'keeperReady'
  | 'keeperStand'
  | 'keeperCatch'
  | 'keeperLow'
  | 'keeperHigh'
  | 'keeperSide'
  | 'keeperDiveL'
  | 'keeperDiveR'
  | 'stumping'
  | 'celebrateSmall'
  | 'celebrateJump'
  | 'victory'
  | 'handsUp'
  | 'defeat'
  | 'walkAway'
  | 'appeal'
  | 'umpireOut'
  | 'umpireFour'
  | 'umpireSix';

export const CRICKET_ARENA_ACTIONS: readonly CricketArenaAction[] = [
  'idle',
  'ready',
  'stand',
  'fielderWait',
  'fielderReady',
  'nonStrikerWait',
  'nonStrikerBackUp',
  'auctionSit',
  'auctionBid',
  'auctioneerCall',
  'walk',
  'jog',
  'sprint',
  'run',
  'runBat',
  'walkBat',
  'sprintBat',
  'batIdle',
  'batStance',
  'batPickup',
  'backlift',
  'batLower',
  'batShoulder',
  'forwardDefence',
  'backDefence',
  'straightDrive',
  'coverDrive',
  'offDrive',
  'onDrive',
  'pull',
  'hook',
  'sweep',
  'reverseSweep',
  'lofted',
  'flick',
  'lateCut',
  'squareCut',
  'followThrough',
  'fastBowl',
  'spinBowl',
  'bowl_fast',
  'bowl_spin',
  'bowl_seam',
  'bowl_swing',
  'bowl_slower',
  'bowl_yorker',
  'bowl_bouncer',
  'groundField',
  'ballPickup',
  'highCatch',
  'diveCatch',
  'diveStop',
  'getUp',
  'slide',
  'fall',
  'throwOver',
  'throwUnder',
  'throwPower',
  'throwQuick',
  'catchChest',
  'keeperReady',
  'keeperStand',
  'keeperCatch',
  'keeperLow',
  'keeperHigh',
  'keeperSide',
  'keeperDiveL',
  'keeperDiveR',
  'stumping',
  'celebrateSmall',
  'celebrateJump',
  'victory',
  'handsUp',
  'defeat',
  'walkAway',
  'appeal',
  'umpireOut',
  'umpireFour',
  'umpireSix',
] as const;

type Keyframe = readonly [number, Partial<CricketArenaPose>];

const REST: CricketArenaPose = {
  sp: 0,
  yw: 0,
  lean: 0.05,
  head: 0,
  crouch: 0,
  lfx: -0.15,
  lfy: 0,
  rfx: 0.15,
  rfy: 0,
  lhx: 0.05,
  lhy: 0.85,
  rhx: 0.1,
  rhy: 0.85,
  grip: 0,
  bx: 0,
  by: 0,
  ba: 0,
  air: 0,
  rot: 0,
};

// Batting Stance (side-on, wide balanced base, hands low, bat toe resting near back foot)
const BAT_STANCE: Partial<CricketArenaPose> = {
  yw: 1,
  lean: 0.14,
  crouch: 0.14,
  lfx: -0.26,
  rfx: 0.34,
  grip: 2,
  bx: 0.34,
  by: 0.9,
  ba: -0.6,
};

// Backlift pose (bat raised behind back hip, front foot triggered)
const BACKLIFT_POSE: Partial<CricketArenaPose> = {
  yw: 1,
  lean: 0.08,
  crouch: 0.1,
  lfx: -0.3,
  rfx: 0.3,
  grip: 2,
  bx: 0.2,
  by: 1.3,
  ba: -2.5,
};

// Wicketkeeper ready crouch
const KEEPER_READY_POSE: Partial<CricketArenaPose> = {
  crouch: 0.5,
  lean: 0.2,
  lfx: -0.25,
  rfx: 0.25,
  lhx: 0.55,
  lhy: 0.4,
  rhx: 0.55,
  rhy: 0.35,
};

const smooth = (v: number) => v * v * (3 - 2 * v);
const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));

function interpolateKeyframes(frames: Keyframe[], t: number): Partial<CricketArenaPose> {
  const progress = clamp(t);
  if (frames.length === 0) return {};
  if (progress <= frames[0][0]) return frames[0][1];
  if (progress >= frames[frames.length - 1][0]) return frames[frames.length - 1][1];

  for (let i = 1; i < frames.length; i++) {
    const [prevT, prevPose] = frames[i - 1];
    const [nextT, nextPose] = frames[i];
    if (progress <= nextT) {
      const factor = smooth((progress - prevT) / Math.max(0.0001, nextT - prevT));
      const res: Partial<CricketArenaPose> = { ...prevPose };
      const allKeys = new Set([...Object.keys(prevPose), ...Object.keys(nextPose)]) as Set<keyof CricketArenaPose>;
      allKeys.forEach((key) => {
        const startVal = prevPose[key] ?? REST[key];
        const endVal = nextPose[key] ?? startVal;
        if (typeof startVal === 'number' && typeof endVal === 'number') {
          res[key] = startVal + (endVal - startVal) * factor;
        }
      });
      return res;
    }
  }
  return frames[frames.length - 1][1];
}

/**
 * Ground-locked gait model.
 *
 * Each foot follows a stance phase (foot moves backwards under the body at a CONSTANT speed, planted on the
 * ground) and a swing phase (foot lifts and travels forward). Because the stance foot's backward speed is
 * 2*amp/(duty*T), a body that covers `gaitCycleLength` metres per cycle never slides its feet. Callers drive
 * `cycles` from the distance actually travelled, so animation speed always matches movement speed.
 */
export type Gait = 'walk' | 'jog' | 'sprint';

interface GaitSpec {
  amp: number;   // half stride (m): foot x swings between +amp and -amp relative to the hips
  lift: number;  // swing-foot lift
  lean: number;  // forward torso lean
  duty: number;  // fraction of the cycle each foot is planted
  base: number;  // base pelvis drop (m): bent knees let the leg reach the ground at a longer stride
  bob: number;   // extra pelvis drop at mid-stance (m)
  arm: number;   // arm swing amplitude (m)
  armY: number;  // resting hand height
  tw: number;    // chest counter-rotation (rad)
  air: number;   // flight-phase rise (m), only when duty < 0.5
  speed: number; // nominal speed (m/s), used when no distance-driven phase is supplied
}

export const GAITS: Record<Gait, GaitSpec> = {
  walk: { amp: 0.34, lift: 0.12, lean: 0.04, duty: 0.62, base: 0.03, bob: 0.014, arm: 0.2, armY: 0.82, tw: 0.07, air: 0, speed: 1.5 },
  jog: { amp: 0.4, lift: 0.24, lean: 0.14, duty: 0.46, base: 0.1, bob: 0.03, arm: 0.32, armY: 0.95, tw: 0.11, air: 0.02, speed: 3.4 },
  sprint: { amp: 0.46, lift: 0.34, lean: 0.32, duty: 0.34, base: 0.15, bob: 0.04, arm: 0.5, armY: 1.02, tw: 0.17, air: 0.06, speed: 6.8 },
};

/** Metres travelled per full gait cycle (two steps) with no foot sliding. */
export const gaitCycleLength = (g: Gait) => (2 * GAITS[g].amp) / GAITS[g].duty;

/** Pick a gait from ground speed (m/s) with hysteresis so it does not flicker around a threshold. */
export function gaitForSpeed(speed: number, previous: Gait | null): Gait {
  const walkMax = previous === 'jog' || previous === 'sprint' ? 1.8 : 2.3;
  const jogMax = previous === 'sprint' ? 4.4 : 5.2;
  if (speed < walkMax) return 'walk';
  if (speed < jogMax) return 'jog';
  return 'sprint';
}

function footTrack(cycle: number, g: GaitSpec) {
  const u = ((cycle % 1) + 1) % 1;
  if (u < g.duty) return { x: g.amp - (2 * g.amp * u) / g.duty, y: 0 };
  const sw = (u - g.duty) / (1 - g.duty);
  return { x: -g.amp + 2 * g.amp * smooth(sw), y: Math.sin(Math.PI * sw) * g.lift };
}

function gaitPose(gait: Gait, cycles: number, hasBat = false): Partial<CricketArenaPose> {
  const g = GAITS[gait];
  const u = ((cycles % 1) + 1) % 1;
  const L = footTrack(u, g);
  const R = footTrack(u + 0.5, g);
  const ln = L.x / g.amp;
  const rn = R.x / g.amp;
  const half = u % 0.5;
  const air = g.duty < 0.5 && half > g.duty ? g.air * Math.sin((Math.PI * (half - g.duty)) / (0.5 - g.duty)) : 0;
  const bob = 0.5 + 0.5 * Math.cos(4 * Math.PI * (u - g.duty / 2));
  const pose: Partial<CricketArenaPose> = {
    lean: g.lean,
    crouch: g.base + g.bob * bob,
    head: -g.lean * 0.35,
    tw: g.tw * ln,
    lfx: L.x,
    lfy: L.y,
    rfx: R.x,
    rfy: R.y,
    air,
    // Arms counter-swing the legs (left arm forward as the left foot goes back).
    lhx: 0.05 - ln * g.arm,
    lhy: g.armY - ln * 0.1,
  };
  if (hasBat) {
    pose.grip = 1;
    pose.rhx = 0.25;
    pose.rhy = 1.15;
    pose.ba = -2.2;
  } else {
    pose.rhx = 0.05 - rn * g.arm;
    pose.rhy = g.armY - rn * 0.1;
  }
  return pose;
}

function mixPose(a: Partial<CricketArenaPose>, b: Partial<CricketArenaPose>, f: number): Partial<CricketArenaPose> {
  const k = smooth(clamp(f));
  const out: Partial<CricketArenaPose> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof CricketArenaPose>;
  keys.forEach((key) => {
    const av = (a[key] ?? REST[key] ?? 0) as number;
    const bv = (b[key] ?? REST[key] ?? 0) as number;
    out[key] = av + (bv - av) * k;
  });
  return out;
}

/** Swap left/right limbs so a left-arm bowler or thrower uses the mirrored action. */
function mirrorLimbs(p: Partial<CricketArenaPose>): Partial<CricketArenaPose> {
  const o = { ...p };
  const sw = (a: keyof CricketArenaPose, b: keyof CricketArenaPose) => {
    const av = p[a] ?? REST[a];
    const bv = p[b] ?? REST[b];
    (o as Record<string, number>)[a] = bv as number;
    (o as Record<string, number>)[b] = av as number;
  };
  sw('lhx', 'rhx');
  sw('lhy', 'rhy');
  sw('lfx', 'rfx');
  sw('lfy', 'rfy');
  const lL = p.latL ?? 0;
  const lR = p.latR ?? 0;
  o.latL = -lR;
  o.latR = -lL;
  if (p.tw !== undefined) o.tw = -p.tw;
  if (p.hd !== undefined) o.hd = -p.hd;
  return o;
}

// Shot definition table: [backliftAngle, contactAngle, contactHeight, frontFootX, lean, exitVelocity, followThroughAngle]
interface ShotSpec {
  tw?: number;
  a1: number;
  a2: number;
  py: number;
  fx: number;
  lean: number;
  ft: number;
  cr?: number;
  bk?: number;
}

const SHOT_DATABASE: Record<string, ShotSpec> = {
  forwardDefence: { tw: 0.05, a1: -0.8, a2: 0.15, py: 0.85, fx: 0.55, lean: 0.35, ft: 0.5 },
  backDefence: { tw: 0.08, a1: -1.2, a2: 0.1, py: 0.9, fx: 0.1, lean: 0.1, ft: 0.5, cr: 0.15, bk: 1 },
  straightDrive: { tw: 0.15, a1: -2.6, a2: 1.0, py: 1.0, fx: 0.6, lean: 0.3, ft: 2.6 },
  coverDrive: { tw: 0.25, a1: -2.4, a2: 0.8, py: 1.0, fx: 0.6, lean: 0.3, ft: 2.4 },
  offDrive: { tw: 0.22, a1: -2.5, a2: 0.9, py: 1.0, fx: 0.55, lean: 0.3, ft: 2.5 },
  onDrive: { tw: 0.3, a1: -2.6, a2: 1.1, py: 1.0, fx: 0.55, lean: 0.35, ft: 2.7 },
  pull: { tw: 0.6, a1: -1.5, a2: 1.4, py: 1.25, fx: -0.1, lean: 0.2, ft: 2.8, bk: 1 },
  hook: { tw: 0.7, a1: -1.2, a2: 1.8, py: 1.6, fx: -0.1, lean: 0.1, ft: 3.2, bk: 1 },
  sweep: { tw: 0.3, a1: -1.4, a2: 1.2, py: 0.5, fx: 0.5, lean: 0.6, ft: 2.2, cr: 0.5 },
  reverseSweep: { tw: -0.3, a1: 1.4, a2: -1.2, py: 0.5, fx: 0.5, lean: 0.6, ft: -2.2, cr: 0.5 },
  lofted: { tw: 0.35, a1: -2.8, a2: 0.5, py: 1.0, fx: 0.5, lean: 0.2, ft: 3.0 },
  flick: { tw: 0.5, a1: -1.8, a2: 1.5, py: 0.9, fx: 0.3, lean: 0.2, ft: 2.4 },
  lateCut: { tw: 0.3, a1: -1.9, a2: 1.7, py: 0.8, fx: -0.2, lean: 0.2, ft: 2.9, bk: 1 },
  squareCut: { tw: 0.45, a1: -2.0, a2: 1.6, py: 0.95, fx: -0.15, lean: 0.22, ft: 2.8, bk: 1 },
};

export function getCricketArenaPose(
  action: CricketArenaAction,
  progress: number,
  clock: number,
  isLeftHanded = false,
  /** 0..1 per-character value so idle motion, hand placement and glances differ between players. */
  seed = 0,
  /** Gait phase in cycles, driven by distance travelled so feet stay planted. Falls back to the clock. */
  phase?: number
): CricketArenaPose {
  const t = clamp(progress);
  let pose: Partial<CricketArenaPose> = {};
  const sd = seed - Math.floor(seed);
  const wob = (freq: number, k = 0) => Math.sin(clock * freq + sd * 17.3 + k);
  const gaitCycles = (g: Gait) => phase ?? (clock * GAITS[g].speed) / gaitCycleLength(g);

  // 1. IDLE & READY POSES
  if (action === 'idle') {
    pose = {
      crouch: Math.sin(clock * 6.28) * 0.012,
      head: Math.sin(clock * 3) * 0.05,
      lhy: 0.83 + Math.sin(clock * 6.28) * 0.01,
    };
  } else if (action === 'ready' || action === 'fielderReady') {
    // Athletic ready position: split-step micro bounce, weight on the balls of the feet, eyes up.
    const bounce = Math.max(0, wob(5.2));
    pose = {
      lean: 0.27,
      crouch: 0.2 + 0.022 * bounce,
      lfx: -0.22,
      rfx: 0.24,
      lfy: 0.025 * bounce,
      rfy: 0.025 * Math.max(0, -wob(5.2)),
      lhx: 0.42 + 0.02 * wob(2.1),
      lhy: 0.5 + 0.015 * wob(3.3),
      rhx: 0.46 + 0.02 * wob(2.4, 1),
      rhy: 0.48 + 0.015 * wob(2.9, 2),
      head: -0.12 + 0.02 * wob(1.7),
      hd: 0.05 * wob(0.9),
    };
  } else if (action === 'fielderWait') {
    // Between balls: relaxed stance with slow weight shifts, a per-player hand habit and an occasional look around.
    const variant = Math.floor(sd * 3) % 3;
    const shift = wob(0.55);
    pose = {
      lean: 0.08 + 0.025 * wob(0.35),
      crouch: 0.035 + 0.02 * Math.max(0, shift),
      lfx: -0.15 - 0.05 * shift,
      rfx: 0.15 + 0.05 * shift,
      lfy: 0.012 * Math.max(0, -wob(0.55, 1.4)),
      head: 0.02 * wob(0.4),
      hd: 0.35 * wob(0.27) * (0.5 + 0.5 * wob(0.11, 2)),
    };
    if (variant === 0) {
      Object.assign(pose, { lhx: 0.05, lhy: 0.8 + 0.01 * wob(1.1), rhx: 0.06, rhy: 0.8 + 0.01 * wob(1.3) });
    } else if (variant === 1) {
      // hands on knees
      Object.assign(pose, { lean: 0.3, crouch: 0.16, lhx: 0.3, lhy: 0.52, rhx: 0.32, rhy: 0.52 });
    } else {
      // hands clasped in front
      Object.assign(pose, { lhx: 0.3, lhy: 0.9, rhx: 0.32, rhy: 0.9, lean: 0.1 });
    }
  } else if (action === 'stand') {
    // Upright, relaxed (umpires): slow breathing, small weight shift, scanning head.
    pose = {
      lean: 0.03 + 0.01 * wob(0.4),
      crouch: 0.008 * wob(0.9),
      lfx: -0.1 - 0.03 * wob(0.25),
      rfx: 0.1 + 0.03 * wob(0.25),
      lhx: 0.05,
      lhy: 0.8 + 0.01 * wob(1.1),
      rhx: 0.06,
      rhy: 0.8 + 0.01 * wob(1.3),
      head: 0.03 * wob(0.5),
      hd: 0.3 * wob(0.31),
    };
  } else if (action === 'nonStrikerWait') {
    // Upright at the bowler's end, bat hanging from the right hand, watching the bowler.
    pose = {
      lean: 0.06,
      crouch: 0.02 + 0.008 * wob(0.9),
      lfx: -0.13 - 0.03 * wob(0.3),
      rfx: 0.13 + 0.03 * wob(0.3),
      lhx: 0.05,
      lhy: 0.8 + 0.01 * wob(1.1),
      grip: 1,
      rhx: 0.12,
      rhy: 0.88,
      ba: 0.25,
      head: 0.02 * wob(0.6),
    };
  } else if (action === 'nonStrikerBackUp') {
    // Ready to run as the ball is bowled: weight forward, rocking on the toes.
    const rock = wob(6.0);
    pose = {
      lean: 0.2,
      crouch: 0.11 + 0.012 * rock,
      lfx: -0.2,
      rfx: 0.22,
      lfy: 0.015 * Math.max(0, rock),
      lhx: 0.28,
      lhy: 0.72,
      grip: 1,
      rhx: 0.14,
      rhy: 0.84,
      ba: 0.35,
      head: -0.08,
    };
  } else if (action === 'auctionSit') {
    // Franchise delegates sit low behind their desks with forearms toward the bid console.
    pose = {
      lean: 0.18,
      crouch: 0.44,
      lfx: -0.34,
      rfx: 0.34,
      lfy: 0,
      rfy: 0,
      lhx: 0.52,
      lhy: 0.74 + Math.sin(clock * 1.8) * 0.015,
      rhx: 0.58,
      rhy: 0.74 + Math.sin(clock * 1.8 + 0.3) * 0.015,
      head: Math.sin(clock * 1.2) * 0.025,
    };
  } else if (action === 'auctionBid') {
    // Keep the delegate seated while one arm rises to signal a live bid.
    pose = {
      lean: 0.12,
      crouch: 0.4,
      lfx: -0.34,
      rfx: 0.34,
      lhx: 0.52,
      lhy: 0.74,
      rhx: 0.28,
      rhy: 1.88,
      latR: -0.12,
      head: Math.sin(clock * 1.4) * 0.02,
    };
  } else if (action === 'auctioneerCall') {
    pose = interpolateKeyframes([
      [0, { lean: 0.05, lhx: 0.18, lhy: 0.92, rhx: 0.2, rhy: 0.9 }],
      [0.45, { lean: -0.04, lhx: 0.18, lhy: 1.0, rhx: 0.3, rhy: 1.9, latR: -0.12 }],
      [1, { lean: -0.04, lhx: 0.18, lhy: 1.0, rhx: 0.3, rhy: 1.9, latR: -0.12 }],
    ], t);
  } else if (action === 'batIdle') {
    // True batting stance with subtle breathing motion
    pose = {
      ...BAT_STANCE,
      crouch: 0.14 + Math.sin(clock * 6.28) * 0.012,
      head: Math.sin(clock * 2.5) * 0.02,
    };
  } else if (action === 'batStance') {
    pose = interpolateKeyframes([
      [0, REST],
      [1, BAT_STANCE],
    ], t);
  } else if (action === 'batPickup') {
    pose = interpolateKeyframes([
      [0, { lhx: 0.45, lhy: 0.1, rhx: 0.55, rhy: 0.08, lean: 0.5 }],
      [0.55, { lean: 0.95, crouch: 0.25, lfx: -0.3, rfx: 0.3, lhx: 0.5, lhy: 0.08, rhx: 0.55, rhy: 0.08, grip: 2, bx: 0.5, by: 0.08, ba: 1.5 }],
      [1, BAT_STANCE],
    ], t);
  } else if (action === 'backlift') {
    pose = interpolateKeyframes([
      [0, BAT_STANCE],
      [0.7, BACKLIFT_POSE],
      [1, BACKLIFT_POSE],
    ], t);
  } else if (action === 'batLower') {
    pose = interpolateKeyframes([
      [0, BACKLIFT_POSE],
      [1, BAT_STANCE],
    ], t);
  } else if (action === 'batShoulder') {
    pose = {
      grip: 1,
      rhx: 0.25,
      rhy: 1.2,
      ba: -2.2,
      lhx: -0.25,
      lhy: 0.55,
      head: 0.1,
    };

  // 2. SHOT ANIMATIONS (14 distinct professional strokes)
  } else if (SHOT_DATABASE[action]) {
    const s = SHOT_DATABASE[action];
    const cr = s.cr || 0.1;
    const ftBase = { lean: 0.1, crouch: 0.12, lfx: -0.3, rfx: 0.3, grip: 2, yw: 1 };
    const twc = s.tw ?? 0.2;
    pose = interpolateKeyframes([
      [0, { ...BAT_STANCE, tw: 0 }],
      // backlift + trigger movement: shoulders coil back, front foot lifts to step into the shot
      [0.24, { ...BACKLIFT_POSE, ba: s.a1, by: s.py + 0.15, tw: -0.14, lfy: s.bk ? 0 : 0.07 }],
      // contact: weight over the front foot, hips and shoulders unwound through the ball
      [0.48, {
        ...ftBase,
        bx: 0.5,
        by: s.py,
        ba: s.a2,
        lean: s.lean,
        crouch: cr,
        rfx: s.bk ? 0.1 : s.fx,
        lfx: s.bk ? -0.5 : -0.3,
        tw: twc,
        lfy: 0,
        head: 0.1,
      }],
      // follow-through: full rotation, back foot up on the toes
      [1.0, {
        ...ftBase,
        bx: 0.2,
        by: s.py + 0.45,
        ba: s.ft,
        lean: 0.1,
        tw: twc * 1.7,
        rfy: s.bk ? 0 : 0.05,
      }],
    ], t);
  } else if (action === 'followThrough') {
    pose = interpolateKeyframes([
      [0, { grip: 2, bx: 0.5, by: 1.0, ba: 1.0, yw: 1 }],
      [1, { grip: 2, bx: 0.2, by: 1.5, ba: 2.6, lean: 0.1, yw: 1 }],
    ], t);

  // 3. BOWLING MECHANICS (Run-up, Gather, Windmill Arm Rotation, Synchronized Release)
  } else if (action.startsWith('bowl_') || action === 'fastBowl' || action === 'spinBowl') {
    const isSpin = action.includes('spin');
    // 0.00 - 0.44 ground-locked run-up | 0.44 - 0.58 gather & jump | 0.58 - 0.78 delivery stride, arm over,
    // release | 0.78 - 1.00 follow-through run-off
    const runGait: Gait = isSpin ? 'jog' : 'sprint';
    const runCycles = isSpin ? 2.0 : 2.6;
    const ballHand = { rhx: 0.3, rhy: 1.05, latR: 0 };
    const gather0: Partial<CricketArenaPose> = {
      lean: 0.2, crouch: 0.1, tw: -0.1, lfx: 0.25, rfx: -0.3, lfy: 0.1, rfy: 0.15,
      lhx: 0.35, lhy: 1.3, rhx: 0.3, rhy: 1.05, head: -0.18,
    };
    const delivery0 = (u: number): Partial<CricketArenaPose> => {
      // u: 0..1 through the delivery stride.
      const armPhase = u * Math.PI * 2;
      const radius = isSpin ? 0.6 : 0.74;
      const pull = smooth(clamp((u - 0.15) / 0.7));
      return {
        lean: 0.2 + 0.3 * smooth(u),
        crouch: 0.2 - 0.06 * smooth(u),
        tw: -0.5 + 1.0 * smooth(clamp(u / 0.75)),
        lfx: 0.55,
        lfy: 0,
        rfx: -0.32 + 0.1 * smooth(u),
        rfy: u > 0.55 ? 0.08 * smooth((u - 0.55) / 0.45) : 0,
        // front arm reaches up at the target, then pulls down to the hip as the bowling arm comes through
        lhx: 0.5 - 0.5 * pull,
        lhy: 1.85 - 1.05 * pull,
        rhx: 0.1 - radius * Math.sin(armPhase),
        rhy: 1.38 - radius * Math.cos(armPhase),
        head: -0.3 + 0.1 * smooth(u),
      };
    };
    const follow0 = (u: number): Partial<CricketArenaPose> => {
      const trot = gaitPose('jog', u * 1.0);
      const decel: Partial<CricketArenaPose> = {
        ...trot,
        lean: 0.5 - 0.3 * u,
        tw: 0.4 * (1 - u),
        crouch: 0.2 - 0.1 * u,
        rhx: 0.3 - 0.2 * u,
        rhy: 0.55 + 0.25 * u,
        head: -0.2,
      };
      return mixPose(delivery0(1), decel, clamp(u / 0.3));
    };
    if (t < 0.44) {
      const u = t / 0.44;
      const run = { ...gaitPose(runGait, u * runCycles), ...ballHand, lean: isSpin ? 0.18 : 0.26, tw: gaitPose(runGait, u * runCycles).tw };
      pose = u > 0.82 ? mixPose(run, gather0, (u - 0.82) / 0.18) : run;
    } else if (t < 0.58) {
      const u = (t - 0.44) / 0.14;
      const g1 = delivery0(0);
      pose = { ...mixPose(gather0, g1, smooth(u)), air: (isSpin ? 0.14 : 0.3) * Math.sin(u * Math.PI) };
      if (u > 0.85) pose.lfy = 0;
    } else if (t < 0.78) {
      pose = delivery0((t - 0.58) / 0.2);
    } else {
      pose = follow0((t - 0.78) / 0.22);
    }
    if (isLeftHanded) pose = mirrorLimbs(pose);

  // 4. RUNNING & LOCOMOTION
  } else if (action === 'walk') {
    pose = gaitPose('walk', gaitCycles('walk'));
  } else if (action === 'jog') {
    pose = gaitPose('jog', gaitCycles('jog'));
  } else if (action === 'sprint' || action === 'run') {
    pose = gaitPose('sprint', gaitCycles('sprint'));
  } else if (action === 'walkBat') {
    pose = gaitPose('walk', gaitCycles('walk'), true);
  } else if (action === 'runBat') {
    pose = gaitPose('jog', gaitCycles('jog'), true);
  } else if (action === 'sprintBat') {
    pose = gaitPose('sprint', gaitCycles('sprint'), true);

  // 5. WICKETKEEPING
  } else if (action === 'keeperReady') {
    pose = {
      ...KEEPER_READY_POSE,
      crouch: (KEEPER_READY_POSE.crouch ?? 0.5) + 0.012 * wob(1.4),
      lhy: (KEEPER_READY_POSE.lhy ?? 0.4) + 0.025 * wob(2.2),
      rhy: (KEEPER_READY_POSE.rhy ?? 0.35) + 0.025 * wob(2.0, 1),
      head: -0.06 + 0.02 * wob(1.2),
    };
  } else if (action === 'keeperStand') {
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [1, { lean: 0.05, lhx: 0.4, lhy: 1.0, rhx: 0.45, rhy: 1.0 }],
    ], t);
  } else if (action === 'keeperCatch') {
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [0.4, { ...KEEPER_READY_POSE, lhx: 0.6, lhy: 0.45, rhx: 0.68, rhy: 0.45 }],
      [1, KEEPER_READY_POSE],
    ], t);
  } else if (action === 'keeperLow') {
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [0.4, { ...KEEPER_READY_POSE, crouch: 0.65, lean: 0.35, lhx: 0.55, lhy: 0.1, rhx: 0.63, rhy: 0.1 }],
      [1, KEEPER_READY_POSE],
    ], t);
  } else if (action === 'keeperHigh') {
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [0.4, { lean: 0.05, crouch: 0.1, lhx: 0.45, lhy: 1.95, rhx: 0.53, rhy: 1.95 }],
      [1, KEEPER_READY_POSE],
    ], t);
  } else if (action === 'keeperSide') {
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [0.4, { ...KEEPER_READY_POSE, lhx: 0.9, lhy: 0.6, rhx: 0.98, rhy: 0.6 }],
      [1, KEEPER_READY_POSE],
    ], t);
  } else if (action === 'keeperDiveL' || action === 'keeperDiveR') {
    const sg = action === 'keeperDiveL' ? -1 : 1;
    // coil low, push off, stretch both gloves to the line of the ball, land on the ground (not hovering)
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [0.22, { ...KEEPER_READY_POSE, crouch: 0.62, lean: 0.35, rot: sg * 0.15, lhx: 0.45, lhy: 0.7, rhx: 0.5, rhy: 0.7, head: -0.1 }],
      [0.42, { rot: sg * 0.95, air: 0.42, lean: 0.1, lhx: 0.2, lhy: 2.0, rhx: 0.3, rhy: 2.05, lfy: 0.25, rfy: 0.3, head: -0.3 }],
      [0.62, { rot: sg * 1.3, air: 0.46, lhx: 0.2, lhy: 2.1, rhx: 0.3, rhy: 2.1, lfy: 0.3, rfy: 0.3, head: -0.3 }],
      [0.85, { rot: sg * 1.5, air: 0.17, lhx: 0.2, lhy: 2.0, rhx: 0.3, rhy: 2.0, lfy: 0.2, rfy: 0.25, head: -0.2 }],
      [1.0, { rot: sg * 1.5, air: 0.16, lhx: 0.25, lhy: 1.8, rhx: 0.3, rhy: 1.8, head: -0.1 }],
    ], t);
  } else if (action === 'stumping') {
    pose = interpolateKeyframes([
      [0, KEEPER_READY_POSE],
      [0.35, { ...KEEPER_READY_POSE, lhx: -0.7, lhy: 0.65, rhx: -0.7, rhy: 0.7, lean: 0.35 }],
      [1, KEEPER_READY_POSE],
    ], t);

  // 6. FIELDING (Ground collection, catches, dives, throws)
  } else if (action === 'groundField') {
    // Low, balanced attack on the ball: head down on it, gather, then rise and turn ready to throw.
    pose = interpolateKeyframes([
      [0, { lean: 0.25, crouch: 0.2, lhx: 0.45, lhy: 0.55, rhx: 0.5, rhy: 0.5, head: 0.05 }],
      [0.35, { lean: 0.6, crouch: 0.4, lfx: -0.2, rfx: 0.35, lhx: 0.7, lhy: 0.1, rhx: 0.75, rhy: 0.08, head: 0.35, tw: 0.1 }],
      [0.6, { lean: 0.5, crouch: 0.35, lfx: -0.2, rfx: 0.3, lhx: 0.55, lhy: 0.35, rhx: 0.6, rhy: 0.3, head: 0.15, tw: -0.15 }],
      [1, { lean: 0.2, crouch: 0.12, tw: -0.3, lhx: 0.35, lhy: 1.1, rhx: -0.1, rhy: 1.25, head: -0.05 }],
    ], t);
  } else if (action === 'ballPickup') {
    pose = interpolateKeyframes([
      [0, { lean: 0.3, crouch: 0.2, head: 0.05 }],
      [0.4, { lean: 0.9, crouch: 0.3, lfx: -0.3, rfx: 0.3, lhx: 0.9, lhy: 0.1, head: 0.4, tw: 0.1 }],
      [0.55, { lean: 0.9, crouch: 0.3, lhx: 0.9, lhy: 0.1, head: 0.4 }],
      [0.8, { lean: 0.35, crouch: 0.2, lhx: 0.5, lhy: 0.7, rhx: 0.3, rhy: 0.9, tw: -0.25, head: 0.05 }],
      [1, { lean: 0.15, tw: -0.3, lhx: 0.4, lhy: 0.9, rhx: -0.1, rhy: 1.2 }],
    ], t);
  } else if (action === 'highCatch') {
    // Track the ball with the head, rise on the toes, hands up, then cushion the ball in to the chest.
    pose = interpolateKeyframes([
      [0, { lean: 0.1, crouch: 0.1, lhx: 0.3, lhy: 1.0, rhx: 0.35, rhy: 1.0, head: -0.1 }],
      [0.4, { lean: -0.05, crouch: 0, lhx: 0.4, lhy: 2.0, rhx: 0.5, rhy: 2.0, air: 0.07, lfy: 0.05, rfy: 0.02, head: -0.4 }],
      [0.72, { lean: -0.02, lhx: 0.4, lhy: 2.0, rhx: 0.5, rhy: 2.0, air: 0.03, head: -0.35 }],
      [1, { lhx: 0.25, lhy: 0.95, rhx: 0.3, rhy: 0.9, crouch: 0.15, lean: 0.12, head: 0.1 }],
    ], t);
  } else if (action === 'diveCatch' || action === 'diveStop') {
    // Coil and push off, fly with arms extended, land on the ground and skid (body rests on the turf, no hover).
    pose = interpolateKeyframes([
      [0, { lean: 0.35, crouch: 0.15, lhx: 0.5, lhy: 1.0, rhx: 0.5, rhy: 1.0 }],
      [0.18, { lean: 0.5, crouch: 0.38, rot: 0.15, lfx: -0.2, rfx: 0.35, lhx: 0.5, lhy: 0.8, rhx: 0.55, rhy: 0.8, head: -0.1 }],
      [0.34, { rot: 0.85, air: 0.42, lean: 0.2, lhx: 0.1, lhy: 2.0, rhx: 0.2, rhy: 2.05, lfx: -0.3, rfx: -0.5, lfy: 0.25, rfy: 0.32, head: -0.3 }],
      [0.55, { rot: 1.35, air: 0.46, lhx: 0.1, lhy: 2.1, rhx: 0.2, rhy: 2.1, lfx: -0.2, rfx: -0.4, lfy: 0.3, rfy: 0.3, head: -0.3 }],
      [0.8, { rot: 1.5, air: 0.17, lhx: 0.1, lhy: 2.0, rhx: 0.2, rhy: 2.05, lfy: 0.2, rfy: 0.22, head: -0.2 }],
      [1, { rot: 1.5, air: 0.16, lhx: 0.15, lhy: 1.8, rhx: 0.25, rhy: 1.85 }],
    ], t);
  } else if (action === 'getUp') {
    pose = interpolateKeyframes([
      [0, { rot: 1.5, air: 0.16, lhx: 0.15, lhy: 1.8 }],
      [0.45, { rot: 0.55, air: 0.05, lean: 0.7, crouch: 0.4, lhx: 0.7, lhy: 0.3, rhx: 0.7, rhy: 0.3, head: 0.1 }],
      [1, { lean: 0.2, crouch: 0.1 }],
    ], t);
  } else if (action === 'slide') {
    pose = interpolateKeyframes([
      [0, { lean: 0.3, crouch: 0.3 }],
      [0.35, { rot: 1.3, air: 0.2, lhx: 0.1, lhy: 2.0 }],
      [1, { rot: 1.45, air: 0.16 }],
    ], t);
  } else if (action === 'throwOver' || action === 'throwPower') {
    // Overarm throw: side-on cock (chest turned away, glove arm pointing at the target), stride, hips and shoulders
    // unwind, release over the top at ~0.38, then the back leg swings through as the body follows the ball.
    const pw = action === 'throwPower' ? 1.15 : 1;
    pose = interpolateKeyframes([
      [0, { lean: 0.12, crouch: 0.12, tw: -0.1, lfx: 0.05, rfx: -0.2, lhx: 0.4, lhy: 1.2, rhx: -0.1, rhy: 1.3 }],
      [0.18, { lean: -0.05, crouch: 0.15, tw: -0.55 * pw, lfx: 0.3, rfx: -0.3, lhx: 0.6, lhy: 1.5, rhx: -0.75, rhy: 1.7, head: -0.1 }],
      [0.38, { lean: 0.4, crouch: 0.2, tw: 0.4 * pw, lfx: 0.5, rfx: -0.25, lhx: 0.1, lhy: 0.9, rhx: 0.75 * pw, rhy: 1.9, air: action === 'throwPower' ? 0.04 : 0, head: -0.05 }],
      [0.6, { lean: 0.65, crouch: 0.22, tw: 0.7 * pw, lfx: 0.45, rfx: 0.3, rfy: 0.12, lhx: 0.05, lhy: 0.75, rhx: 0.4, rhy: 0.6 }],
      [1, { lean: 0.3, crouch: 0.15, tw: 0.15, lfx: 0.2, rfx: 0.1, rhx: 0.25, rhy: 0.6, lhx: 0.2, lhy: 0.8 }],
    ], t);
  } else if (action === 'throwQuick' || action === 'throwUnder') {
    // Short, flat flick off the front foot (direct-hit / run-out throws).
    pose = interpolateKeyframes([
      [0, { lean: 0.2, crouch: 0.2, tw: -0.1, lfx: 0.05, rfx: -0.2, rhx: -0.2, rhy: 0.55, lhx: 0.4, lhy: 0.8 }],
      [0.2, { lean: 0.25, crouch: 0.22, tw: -0.25, lfx: 0.25, rfx: -0.25, rhx: -0.3, rhy: 0.7, lhx: 0.5, lhy: 0.8 }],
      [0.38, { lean: 0.4, crouch: 0.2, tw: 0.3, lfx: 0.4, rfx: -0.2, rhx: 0.65, rhy: 0.35, lhx: 0.25, lhy: 0.6 }],
      [1, { lean: 0.45, crouch: 0.15, tw: 0.35, lfx: 0.3, rfx: 0.1, rhx: 0.35, rhy: 0.4 }],
    ], t);
  } else if (action === 'catchChest') {
    pose = interpolateKeyframes([
      [0, { lean: 0.05, lhx: 0.4, lhy: 0.95, rhx: 0.45, rhy: 0.95 }],
      [0.45, { lean: 0.08, lhx: 0.5, lhy: 1.1, rhx: 0.55, rhy: 1.1 }],
      [1, { lean: 0.05, lhx: 0.3, lhy: 0.9, rhx: 0.35, rhy: 0.9, crouch: 0.05 }],
    ], t);

  // 7. CELEBRATIONS & DISMISSALS
  } else if (action === 'celebrateJump') {
    // 360-degree stadium spin with bat raised high
    const jump = Math.max(0, Math.sin(clock * 5.5)) * 0.07;
    pose = {
      grip: 1,
      sp: t * Math.PI * 2,
      air: jump,
      rhx: 0.1,
      rhy: 2.25,
      latR: -0.1,
      ba: Math.PI + 0.42 + Math.sin(clock * 3.2) * 0.1,
      lhx: 0.1,
      lhy: 1.2 + Math.sin(clock * 4.1) * 0.12,
      latL: 0.35,
      lean: -0.1,
      head: -0.15,
      lfx: -0.18,
      rfx: 0.18,
      lfy: jump * 0.6,
      rfy: jump * 0.6,
    };
  } else if (action === 'celebrateSmall') {
    pose = interpolateKeyframes([
      [0, REST],
      [0.45, { rhx: 0.3, rhy: 1.9, lhx: -0.1, lhy: 0.6, air: 0.03 }],
      [1, { rhx: 0.3, rhy: 1.9 }],
    ], t);
  } else if (action === 'victory') {
    pose = interpolateKeyframes([
      [0, REST],
      [1, { grip: 1, rhx: 0.1, rhy: 2.25, latR: -0.1, ba: Math.PI + 0.42, lhx: 0.1, lhy: 1.2, latL: 0.35, lean: -0.1, head: -0.15, lfx: -0.18, rfx: 0.18 }],
    ], t);
  } else if (action === 'handsUp') {
    pose = interpolateKeyframes([
      [0, REST],
      [0.4, { lhx: -0.1, lhy: 2.1, rhx: 0.3, rhy: 2.1, lfx: -0.2, rfx: 0.2 }],
      [1, { lhx: -0.1, lhy: 2.1, rhx: 0.3, rhy: 2.1 }],
    ], t);
  } else if (action === 'defeat') {
    pose = interpolateKeyframes([
      [0, REST],
      [1, { lean: 0.25, head: 0.4, lhx: 0.1, lhy: 0.3, rhx: 0.1, rhy: 0.3, crouch: 0.05 }],
    ], t);
  } else if (action === 'walkAway') {
    pose = gaitPose('walk', gaitCycles('walk'));
    pose.lean = 0.2;
    pose.head = 0.25;

  // 8. UMPIRE SIGNALS
  } else if (action === 'umpireOut') {
    pose = interpolateKeyframes([
      [0, REST],
      [0.4, { rhx: 0.15, rhy: 2.15 }],
      [1, { rhx: 0.15, rhy: 2.15 }],
    ], t);
  } else if (action === 'umpireFour') {
    pose = { rhx: 0.5 + Math.sin(clock * 10) * 0.25, rhy: 1.3 };
  } else if (action === 'umpireSix') {
    pose = interpolateKeyframes([
      [0, REST],
      [0.4, { lhx: 0.15, lhy: 2.15, rhx: 0.35, rhy: 2.15 }],
      [1, { lhx: 0.15, lhy: 2.15, rhx: 0.35, rhy: 2.15 }],
    ], t);
  } else if (action === 'appeal') {
    pose = interpolateKeyframes([
      [0, REST],
      [0.3, { lhx: 0.3, lhy: 2.1, rhx: 0.4, rhy: 2.1, lean: -0.1, head: -0.1 }],
      [1, { lhx: 0.3, lhy: 2.1, rhx: 0.4, rhy: 2.1, lean: -0.1 }],
    ], t);
  }

  // Left-handed batter: a true mirror image. The body turns the other way (yw -> -yw), the right hand becomes the
  // top hand (mir), feet and hands swap sides. The rig blends the foot offsets with |yw|, so a plain left/right swap mirrors the feet
  // (and the lift lfy/rfy swaps because the front foot changes sides). Bat angle and hand reach flip through the reversed axis.
  if (isLeftHanded && pose.yw) {
    const oLfx = pose.lfx ?? REST.lfx;
    pose.lfx = pose.rfx ?? REST.rfx;
    pose.rfx = oLfx;
    const oLfy = pose.lfy ?? REST.lfy;
    pose.lfy = pose.rfy ?? REST.rfy;
    pose.rfy = oLfy;
    const oLhx = pose.lhx ?? REST.lhx;
    const oLhy = pose.lhy ?? REST.lhy;
    pose.lhx = pose.rhx ?? REST.rhx;
    pose.lhy = pose.rhy ?? REST.rhy;
    pose.rhx = oLhx;
    pose.rhy = oLhy;
    pose.yw = -(pose.yw as number);
    pose.mir = 1;
    if (pose.tw) pose.tw = -pose.tw;
    if (pose.latL || pose.latR) {
      const ol = pose.latL || 0;
      pose.latL = -(pose.latR || 0);
      pose.latR = -ol;
    }
  }

  return { ...REST, ...pose };
}
