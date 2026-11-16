import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { Stadium, StadiumScoreboardData } from '../3d/Stadium';
import { Lighting } from '../3d/Lighting';
import { CameraSystem, CameraViewMode, CAMERA_LABELS } from '../3d/CameraSystem';
import { toWorld, BOUNDARY_M } from '../3d/worldScale';
import { computeBatterMotion, BatterAction } from '../presentation/batterMotion';
import { CharacterInstance } from '../characters/CharacterInstance';
import KitPreviewPanel from './KitPreviewPanel';
import { bowlingKindOf, heightCmFor, heightScale } from '../characters/playerAppearance';
import { pickVariants, resolveKit, jerseyNumberFor, jerseyNameFor } from '../characters/teamKits';
import { BallVisual } from '../physics/BallVisual';
import { soundFX } from '../3d/CricketSoundFX';
import { CricketArenaAction } from '../lib/cricketArenaAnimations';
import type { DetailedBowlingPlan } from '../engine/ai/BowlingPlanEngine';
import { Camera, Eye, Zap, Crosshair, Maximize2, Minimize2 } from 'lucide-react';

const PADDED_MODEL = '/models/cricket-arena/cartoon_sports_character_3d_model.glb';
const LIGHT_MODEL = '/models/cricket-arena/cartoon_character_3d_model.glb';

// Begin loading both shared player assets before the match scene mounts.
useGLTF.preload(PADDED_MODEL);
useGLTF.preload(LIGHT_MODEL);

type Point = { x: number; y: number };
type ArenaStage = 'IDLE' | 'BOWLER_RELEASE' | 'PITCH_BOUNCE' | 'BAT_CONTACT' | 'BALL_TRAVEL' | 'OUTCOME';

export interface ArenaPlayer {
  id: string;
  name: string;
  role: string;
  currentX: number;
  currentY: number;
  positionKey?: string;
  isBowler?: boolean;
  isWicketkeeper?: boolean;
}

export interface FielderAction {
  fielderId: string;
  action: string;
  currentPos: Point;
}

export interface CricketAction3DViewProps {
  fielders: ArenaPlayer[];
  striker: ArenaPlayer | null;
  nonStriker: ArenaPlayer | null;
  delivery: {
    shotType: string;
    totalRuns: number;
    wicket: boolean;
    wicketType?: string;
    legalBall?: boolean;
    batterRuns?: number;
    extraType?: 'Wide' | 'No Ball' | 'Bye' | 'Leg Bye';
    ballPath: { isAerial?: boolean };
  } | null;
  stage: ArenaStage;
  progress: number;
  ballPos: Point;
  ballVisible: boolean;
  ballScale: number;
  strikerPos: Point;
  nonStrikerPos: Point;
  bowlerPos: Point;
  activeFielderAction: FielderAction | null;
  // Live Scoreboard Data Feed
  score?: { runs: number; wickets: number; overs: number; balls: number };
  target?: number;
  battingTeamName?: string;
  bowlingTeamName?: string;
  /** Match format (IPL | T20 | ODI | TEST) - decides whites vs coloured kit */
  matchFormat?: string;
  initialCameraMode?: CameraViewMode;
  initialDay?: boolean;
  /** Bowling style text of the current bowler ('Right-arm fast', 'Left-arm orthodox' ...) */
  bowlerStyle?: string;
  bowlerRole?: string;
  /** Tactical delivery selected by the match AI / captain. */
  bowlingPlan?: DetailedBowlingPlan | null;
  /** Running between the wickets / walk-off + walk-in, driven by the visualizer so the next ball waits for it */
  batterTransition?: { kind: 'WICKET' | 'RUNS'; progress: number; runs: number } | null;
  strikerRuns?: number;
  strikerBalls?: number;
  nonStrikerRuns?: number;
  nonStrikerBalls?: number;
  bowlerName?: string;
  bowlerWickets?: number;
  bowlerRuns?: number;
  bowlerOvers?: number;
  bowlerBalls?: number;
  isLeftHanded?: boolean;
  fieldFormat?: string;
  fieldPhase?: string;
  fieldRestricted?: boolean;
  actualOutsideCircle?: number;
  maxOutsideCircle?: number;
}

function getShotAction(shotType: string): CricketArenaAction {
  const shot = shotType.toUpperCase().replace(/[^A-Z]/g, '');
  if (shot.includes('SWEEP') && shot.includes('REVERSE')) return 'reverseSweep';
  if (shot.includes('SWEEP')) return 'sweep';
  if (shot.includes('PULL')) return 'pull';
  if (shot.includes('HOOK')) return 'hook';
  if (shot.includes('FLICK')) return 'flick';
  if (shot.includes('LATE') || shot.includes('CUT')) return 'lateCut';
  if (shot.includes('SQUARE')) return 'squareCut';
  if (shot.includes('LOFT') || shot.includes('SIX')) return 'lofted';
  if (shot.includes('DEFEN') || shot.includes('BLOCK')) return 'forwardDefence';
  if (shot.includes('BACK') && shot.includes('DEF')) return 'backDefence';
  if (shot.includes('ON') && shot.includes('DRIVE')) return 'onDrive';
  if (shot.includes('OFF') && shot.includes('DRIVE')) return 'offDrive';
  if (shot.includes('STRAIGHT')) return 'straightDrive';
  if (shot.includes('COVER') || shot.includes('DRIVE') || shot.includes('FOUR')) return 'coverDrive';
  return 'straightDrive';
}

function actionForFielder(fielder: ArenaPlayer, actionStr: string): CricketArenaAction {
  if (fielder.isWicketkeeper) {
    const act = actionStr.toUpperCase();
    if (act.includes('DIVE') && act.includes('LEFT')) return 'keeperDiveL';
    if (act.includes('DIVE')) return 'keeperDiveR';
    if (act.includes('LOW')) return 'keeperLow';
    if (act.includes('HIGH')) return 'keeperHigh';
    if (act.includes('STUMP')) return 'stumping';
    return act.includes('CATCH') ? 'keeperCatch' : 'keeperReady';
  }

  const normalized = actionStr.toUpperCase();
  if (normalized.includes('PICK') || normalized.includes('GATHER')) return 'ballPickup';
  if (normalized.includes('POWER') && normalized.includes('THROW')) return 'throwPower';
  if (normalized.includes('THROW')) return 'throwOver';
  if (normalized.includes('DIVE') && normalized.includes('CATCH')) return 'diveCatch';
  if (normalized.includes('DIVE') || normalized.includes('STOP')) return 'diveStop';
  if (normalized.includes('SLIDE')) return 'slide';
  if (normalized.includes('CATCH')) return 'highCatch';
  if (normalized.includes('CHASE') || normalized.includes('INTERCEPT')) return 'sprint';
  if (normalized.includes('RUN')) return 'run';
  return 'ready';
}

type CharacterSlotProps = React.ComponentProps<typeof CharacterInstance>;

function CharacterLoadingPlaceholder({
  position,
  yaw,
  kitRole = 'fielder',
  team,
  format,
  kitVariant = 'home',
  hasBat = false,
}: Pick<CharacterSlotProps, 'position' | 'yaw' | 'kitRole' | 'team' | 'format' | 'kitVariant' | 'hasBat'>) {
  const kit = team ? resolveKit(team, format, kitVariant) : null;
  const shirt = kitRole === 'umpire' ? '#f8fafc' : kit?.slots.jersey ?? '#e2e8f0';
  const trousers = kitRole === 'umpire' ? '#111827' : kit?.slots.pants ?? '#334155';
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 1.12, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.62, 5, 10]} />
        <meshStandardMaterial color={shirt} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 10]} />
        <meshStandardMaterial color="#c98f6b" roughness={0.88} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.12, 0.48, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.56, 4, 8]} />
            <meshStandardMaterial color={trousers} roughness={0.9} />
          </mesh>
          <mesh position={[side * 0.12, 0.12, 0.035]} castShadow>
            <boxGeometry args={[0.17, 0.11, 0.29]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          <mesh position={[side * 0.29, 1.19, 0]} rotation={[0, 0, side * -0.18]} castShadow>
            <capsuleGeometry args={[0.065, 0.43, 4, 8]} />
            <meshStandardMaterial color={shirt} roughness={0.82} />
          </mesh>
        </group>
      ))}
      {kitRole === 'umpire' && (
        <mesh position={[0, 1.96, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.19, 0.035, 20]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      )}
      {hasBat && (
        <mesh position={[0.34, 0.92, 0.08]} rotation={[0.08, 0, -0.18]} castShadow>
          <boxGeometry args={[0.1, 0.88, 0.055]} />
          <meshStandardMaterial color="#d7a45a" roughness={0.78} />
        </mesh>
      )}
    </group>
  );
}

class CharacterLoadBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[CRIC ARENA] Character asset failed; preserving its player slot.', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function CharacterSlot(props: CharacterSlotProps) {
  const fallback = (
    <CharacterLoadingPlaceholder
      position={props.position}
      yaw={props.yaw}
      kitRole={props.kitRole}
      team={props.team}
      format={props.format}
      kitVariant={props.kitVariant}
      hasBat={props.hasBat}
    />
  );
  return (
    <CharacterLoadBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <CharacterSlot {...props} />
      </Suspense>
    </CharacterLoadBoundary>
  );
}

function SceneLoadingFallback() {
  return (
    <>
      <color attach="background" args={['#8db3c9']} />
      <PerspectiveCamera makeDefault position={[0, 48, 66]} fov={52} />
      <hemisphereLight args={['#e5f2ff', '#356b3e', 1.25]} />
      <ambientLight intensity={0.8} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[74, 72]} />
        <meshStandardMaterial color="#3b8f49" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.05, 20.12]} />
        <meshStandardMaterial color="#c7b38a" roughness={0.96} />
      </mesh>
      {[-0.12, 0, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.48, -10.1]}>
          <cylinderGeometry args={[0.035, 0.035, 0.96, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      ))}
    </>
  );
}

function ModelLoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold tracking-wide text-white/90 shadow-xl backdrop-blur">
      Preparing 3D match assets · {Math.round(progress)}%
    </div>
  );
}

function StadiumScene({
  isDay = false,
  props,
  cameraMode,
  showDebugSkeleton,
}: {
  props: CricketAction3DViewProps;
  cameraMode: CameraViewMode;
  isDay?: boolean;
  showDebugSkeleton: boolean;
}) {
  const {
    fielders,
    striker,
    nonStriker,
    delivery,
    stage,
    progress,
    ballPos,
    ballVisible,
    ballScale,
    strikerPos,
    nonStrikerPos,
    bowlerPos,
    activeFielderAction,
    score,
    target,
    battingTeamName = 'INDIA',
    bowlingTeamName = 'AUSTRALIA',
    matchFormat,
    bowlerStyle,
    bowlerRole,
    bowlingPlan,
    batterTransition,
    strikerRuns,
    strikerBalls,
    nonStrikerRuns,
    nonStrikerBalls,
    bowlerName,
    bowlerWickets,
    bowlerRuns,
    bowlerOvers,
    bowlerBalls,
    isLeftHanded = false,
  } = props;

  // Kits: batting side keeps its home colours; the bowling side switches to its away strip
  // when the two shirts would look alike (e.g. India v Sri Lanka).
  const kitVariants = useMemo(
    () => pickVariants(battingTeamName, bowlingTeamName, matchFormat),
    [battingTeamName, bowlingTeamName, matchFormat]
  );

  const bowling = bowlingKindOf(bowlerStyle);
  const bowlAction: CricketArenaAction = useMemo(() => {
    // Preserve the actual bowler style first, then specialize pace deliveries by
    // the active tactical plan. This makes Yorker / Bouncer / slower / swing
    // clips come from the same match decision that selected the delivery.
    if (bowling.kind === 'SPIN') return 'bowl_spin';
    if (bowlingPlan?.length === 'YORKER') return 'bowl_yorker';
    if (bowlingPlan?.length === 'BOUNCER' || bowlingPlan?.length === 'SHORT') return 'bowl_bouncer';
    if (bowlingPlan?.variation === 'SLOWER_BALL') return 'bowl_slower';
    if (bowlingPlan?.variation === 'SWING' || bowlingPlan?.variation === 'REVERSE_SWING') return 'bowl_swing';
    return bowling.kind === 'MEDIUM' ? 'bowl_seam' : 'bowl_fast';
  }, [bowling.kind, bowlingPlan]);
  const strikerWorld = toWorld(strikerPos);
  const nonStrikerWorld = toWorld(nonStrikerPos);
  const bowlerWorld = toWorld(bowlerPos);
  const squareLegUmpireWorld = toWorld(isLeftHanded ? { x: 235, y: 205 } : { x: 365, y: 205 });
  const squareLegUmpireYaw = Math.atan2(-squareLegUmpireWorld[0], -squareLegUmpireWorld[1]);
  const ballWorld = toWorld(ballPos);

  // Track audio triggers per stage to avoid repeating
  const lastSoundStage = useRef<string>('');

  useEffect(() => {
    if (stage === 'BAT_CONTACT' && lastSoundStage.current !== 'BAT_CONTACT') {
      soundFX.playBatCrack(delivery && delivery.totalRuns >= 4 ? 1.35 : 0.95);
      if (delivery && delivery.totalRuns >= 4) {
        setTimeout(() => soundFX.playCrowdCheer(delivery.totalRuns === 6), 250);
      }
    } else if (stage === 'PITCH_BOUNCE' && lastSoundStage.current !== 'PITCH_BOUNCE') {
      soundFX.playPitchBounce();
    } else if (stage === 'OUTCOME' && lastSoundStage.current !== 'OUTCOME') {
      if (delivery?.wicket) {
        soundFX.playStumpsClatter();
        setTimeout(() => soundFX.playCrowdCheer(true), 150);
      }
    }
    lastSoundStage.current = stage;
  }, [stage, delivery]);

  // Interpolation progress within each delivery stage
  const localProgress =
    stage === 'BALL_TRAVEL'
      ? Math.max(0, Math.min(1, (progress - 58) / 32))
      : stage === 'OUTCOME'
      ? Math.max(0, Math.min(1, (progress - 90) / 10))
      : stage === 'BOWLER_RELEASE'
      ? Math.max(0, Math.min(1, progress / 45))
      : 0;

  const hasRuns = Boolean(delivery && delivery.totalRuns > 0 && !delivery.wicket);
  const isBoundary = Boolean(delivery && delivery.totalRuns >= 4);

  // Striker Action
  const strikerAction: CricketArenaAction = useMemo(() => {
    if (stage === 'OUTCOME') {
      if (delivery?.wicket) return 'defeat';
      if (isBoundary) return 'celebrateJump';
      return hasRuns ? 'runBat' : 'batIdle';
    }
    if (stage === 'BALL_TRAVEL') {
      return hasRuns ? 'runBat' : getShotAction(delivery?.shotType ?? '');
    }
    if (stage === 'BAT_CONTACT') {
      return getShotAction(delivery?.shotType ?? '');
    }
    if (stage === 'PITCH_BOUNCE') {
      return 'backlift';
    }
    if (stage === 'BOWLER_RELEASE') {
      return progress > 25 ? 'backlift' : 'batIdle';
    }
    return 'batIdle';
  }, [stage, delivery, hasRuns, isBoundary, progress]);

  // Non-striker Action
  const nonStrikerAction: CricketArenaAction = useMemo(() => {
    if (hasRuns && (stage === 'BALL_TRAVEL' || stage === 'OUTCOME')) {
      return 'runBat';
    }
    return 'batIdle';
  }, [hasRuns, stage]);

  // Ball 3D flight trajectory calculation
  const ball3DPos: [number, number, number] = useMemo(() => {
    let y = 0.18;
    if (stage === 'BOWLER_RELEASE') {
      // In bowler's raised hand
      y = 1.85 - (progress / 45) * 0.4;
    } else if (stage === 'PITCH_BOUNCE') {
      // Bouncing off turf
      y = 0.14 + Math.sin(localProgress * Math.PI) * 0.45;
    } else if (stage === 'BAT_CONTACT') {
      // Contact with bat
      y = 0.72;
    } else if (stage === 'BALL_TRAVEL') {
      if (delivery?.ballPath.isAerial) {
        // High parabolic arc for aerial six or lofted shot
        const maxHeight = delivery.totalRuns === 6 ? 6.5 : 3.8;
        y = 0.72 + Math.sin(localProgress * Math.PI) * maxHeight;
      } else {
        // Rolling along grass with small initial bounce
        y = localProgress < 0.25 ? 0.45 * (1 - localProgress / 0.25) + 0.14 : 0.14;
      }
    }
    return [ballWorld[0], y, ballWorld[1]];
  }, [stage, progress, localProgress, delivery, ballWorld]);

  // Live Scoreboard Data
  const scoreboardData: StadiumScoreboardData = useMemo(() => {
    let eventNotice = null;
    if (stage === 'OUTCOME') {
      if (delivery?.wicket) eventNotice = 'WICKET FALLS!';
      else if (delivery?.totalRuns === 6) eventNotice = 'MAXIMUM SIX!';
      else if (delivery?.totalRuns === 4) eventNotice = 'BOUNDARY FOUR!';
      else if (delivery?.totalRuns === 0) eventNotice = 'DOT BALL';
      else if (delivery?.totalRuns) eventNotice = `${delivery.totalRuns} RUNS`;
    }

    return {
      battingTeamName,
      bowlingTeamName,
      battingColor: resolveKit(battingTeamName, matchFormat, kitVariants.batting).identity.primary,
      bowlingColor: resolveKit(bowlingTeamName, matchFormat, kitVariants.bowling).slots.jersey,
      score: score || { runs: 0, wickets: 0, overs: 0, balls: 0 },
      target,
      strikerName: striker?.name || 'Striker',
      strikerRuns,
      strikerBalls,
      nonStrikerName: nonStriker?.name || 'Non-striker',
      nonStrikerRuns,
      nonStrikerBalls,
      bowlerName: bowlerName || 'Bowler',
      bowlerWickets,
      bowlerRuns,
      bowlerOvers,
      bowlerBalls,
      recentEvent: eventNotice,
    };
  }, [
    stage,
    delivery,
    battingTeamName,
    bowlingTeamName,
    matchFormat,
    kitVariants,
    score,
    target,
    striker,
    nonStriker,
    bowlerName,
    strikerRuns,
    strikerBalls,
    nonStrikerRuns,
    nonStrikerBalls,
    bowlerWickets,
    bowlerRuns,
    bowlerOvers,
    bowlerBalls,
  ]);


  // ---- Batter movement phase: running between the wickets, or walk-off / walk-in after a wicket ----
  const motion = computeBatterMotion(batterTransition, strikerWorld, nonStrikerWorld, strikerAction as BatterAction, nonStrikerAction as BatterAction);
  const { sPos, sYaw, sVisible, nPos, nYaw, incoming } = motion;
  const sAct = (batterTransition ? motion.sAct : strikerAction) as CricketArenaAction;
  const nAct = (batterTransition ? motion.nAct : nonStrikerAction) as CricketArenaAction;

  // ---- Ball presentation: spin by bowling style, squash on the pitch, and visible bat contact ----
  const bladeRef = useRef<THREE.Vector3 | null>(null);
  const noContact =
    !delivery ||
    (delivery.wicket && (delivery.wicketType === 'Bowled' || delivery.wicketType === 'LBW')) ||
    (delivery.legalBall === false && (delivery.batterRuns ?? 0) === 0);
  const c01 = (x: number) => Math.max(0, Math.min(1, x));
  let ballAttract = 0;
  if (!noContact) {
    if (stage === 'PITCH_BOUNCE') ballAttract = c01((localProgress - 0.7) / 0.3);
    else if (stage === 'BAT_CONTACT') ballAttract = 1;
    else if (stage === 'BALL_TRAVEL') ballAttract = c01(1 - localProgress / 0.14);
  }
  const ballSquash = stage === 'PITCH_BOUNCE' ? c01(1 - localProgress / 0.12) : 0;
  const afterHit = stage === 'BALL_TRAVEL' || stage === 'OUTCOME' || stage === 'BAT_CONTACT';
  const ballSpinRate = afterHit ? 22 : bowling.kind === 'SPIN' ? 55 : bowling.kind === 'MEDIUM' ? 36 : 26;
  const ballSpinTilt = afterHit ? 0 : bowling.kind === 'SPIN' ? 0.6 : bowling.kind === 'MEDIUM' ? 0.25 : 0;

  return (
    <>
      <Lighting night={!isDay} />

      <CameraSystem
        mode={cameraMode}
        ballPos={ball3DPos}
        strikerPos={strikerWorld}
        bowlerPos={bowlerWorld}
        isBallTravelling={stage === 'BALL_TRAVEL' || stage === 'OUTCOME'}
        focus={batterTransition?.kind === 'WICKET' ? (incoming && batterTransition.progress > 0.55 ? incoming.pos : sVisible ? sPos : incoming?.pos ?? null) : null}
      />

      <Stadium
        scoreboardData={scoreboardData}
        stumpHit={Boolean(stage === 'OUTCOME' && delivery?.wicket)}
        isDay={isDay}
        crowdEnergy={stage === 'OUTCOME' && delivery && (delivery.wicket || delivery.totalRuns >= 4) ? 1 : 0.2}
      />

      {/* Striker Batsman */}
      {striker && sVisible && (
        <CharacterSlot
          modelUrl={PADDED_MODEL}
          position={sPos}
          yaw={sYaw}
          jerseyNumber={jerseyNumberFor(striker?.name)}
          jerseyName={jerseyNameFor(striker?.name)}
          heightScale={heightScale(heightCmFor(striker?.name, striker?.role))}
          batBladeRef={bladeRef}
          action={sAct}
          progress={localProgress}
          animationFps={30}
          hasBat={true}
          isLeftHanded={isLeftHanded}
          ballPos={ball3DPos}
          showDebugSkeleton={showDebugSkeleton}
          team={battingTeamName}
          format={matchFormat}
          kitVariant={kitVariants.batting}
          kitRole="batter"
        />
      )}

      {/* Non-Striker Batsman */}
      {nonStriker && (
        <CharacterSlot
          modelUrl={PADDED_MODEL}
          position={nPos}
          yaw={nYaw}
          jerseyNumber={jerseyNumberFor(nonStriker?.name)}
          jerseyName={jerseyNameFor(nonStriker?.name)}
          heightScale={heightScale(heightCmFor(nonStriker?.name, nonStriker?.role))}
          action={nAct}
          progress={localProgress}
          animationFps={30}
          hasBat={true}
          showDebugSkeleton={showDebugSkeleton}
          team={battingTeamName}
          format={matchFormat}
          kitVariant={kitVariants.batting}
          kitRole="batter"
        />
      )}

      {/* Incoming batter walking out after a wicket */}
      {incoming && (
        <CharacterSlot
          modelUrl={PADDED_MODEL}
          position={incoming.pos}
          yaw={incoming.yaw}
          action={incoming.action as CricketArenaAction}
          progress={0}
          animationFps={24}
          hasBat={true}
          showDebugSkeleton={showDebugSkeleton}
          team={battingTeamName}
          format={matchFormat}
          kitVariant={kitVariants.batting}
          kitRole="batter"
        />
      )}

      {/* Bowler and Fielders */}
      {fielders.map((fielder) => {
        const isBowler = fielder.isBowler || fielder.positionKey === 'BOWLER';
        const isKeeper = fielder.isWicketkeeper || fielder.positionKey === 'WICKETKEEPER';
        const active = activeFielderAction?.fielderId === fielder.id ? activeFielderAction : null;

        const location = isBowler
          ? bowlerWorld
          : active
          ? toWorld(active.currentPos)
          : toWorld({ x: fielder.currentX, y: fielder.currentY });

        // Select specific character action
        let action: CricketArenaAction = 'ready';
        if (isBowler) {
          action =
            stage === 'BOWLER_RELEASE' || stage === 'PITCH_BOUNCE'
              ? bowlAction
              : stage === 'OUTCOME' && delivery?.wicket
              ? 'celebrateSmall'
              : 'ready';
        } else if (isKeeper) {
          action =
            active
              ? actionForFielder(fielder, active.action)
              : stage === 'OUTCOME' && delivery?.wicket
              ? 'celebrateSmall'
              : 'keeperReady';
        } else if (active) {
          action = actionForFielder(fielder, active.action);
        } else if (stage === 'OUTCOME' && delivery?.wicket) {
          action = 'handsUp';
        }

        // Direction facing
        const facingAngle = isBowler
          ? 0
          : isKeeper
          ? Math.PI
          : Math.atan2(ballWorld[0] - location[0], ballWorld[1] - location[1]);

        return (
          <CharacterSlot
            key={fielder.id}
            modelUrl={isKeeper ? PADDED_MODEL : LIGHT_MODEL}
            position={location}
            yaw={facingAngle}
            jerseyNumber={jerseyNumberFor(fielder.name)}
            jerseyName={jerseyNameFor(fielder.name)}
            heightScale={heightScale(heightCmFor(fielder.name, (fielder as { role?: string }).role, isBowler ? bowling.kind : undefined))}
            isLeftHanded={isBowler && bowling.leftArm}
            action={action}
            progress={isBowler ? Math.min(1, progress / 45) : localProgress}
            animationFps={isBowler ? (stage === 'BOWLER_RELEASE' || stage === 'PITCH_BOUNCE' ? 30 : 12) : active ? 30 : isKeeper ? 18 : 12}
            ballPos={ball3DPos}
            showDebugSkeleton={showDebugSkeleton}
            team={bowlingTeamName}
            format={matchFormat}
            kitVariant={kitVariants.bowling}
            kitRole={isKeeper ? 'keeper' : 'fielder'}
          />
        );
      })}

      {/* Bowler-end official: neutral white umpire kit + head-rig wide-brim hat. */}
      <CharacterSlot
        modelUrl={LIGHT_MODEL}
        position={[0, -11.35]}
        yaw={0}
        action={
          stage === 'OUTCOME' && delivery?.wicket && delivery.wicketType !== 'Run Out' && delivery.wicketType !== 'Stumped'
            ? 'umpireOut'
            : stage === 'OUTCOME' && delivery?.extraType === 'Wide'
            ? 'umpireWide'
            : stage === 'OUTCOME' && delivery?.extraType === 'No Ball'
            ? 'umpireNoBall'
            : stage === 'OUTCOME' && delivery?.totalRuns === 6
            ? 'umpireSix'
            : 'idle'
        }
        progress={localProgress}
        animationFps={stage === 'OUTCOME' ? 24 : 12}
        team={bowlingTeamName}
        format={matchFormat}
        kitVariant={kitVariants.bowling}
        kitRole="umpire"
      />

      {/* Square-leg official: mirrors to the striker's leg side for left-handed batters. */}
      <CharacterSlot
        modelUrl={LIGHT_MODEL}
        position={squareLegUmpireWorld}
        yaw={squareLegUmpireYaw}
        action={
          stage === 'OUTCOME' && delivery?.wicket && (delivery.wicketType === 'Run Out' || delivery.wicketType === 'Stumped')
            ? 'umpireOut'
            : stage === 'OUTCOME' && delivery?.totalRuns === 4
            ? 'umpireFour'
            : 'idle'
        }
        progress={localProgress}
        animationFps={stage === 'OUTCOME' ? 24 : 12}
        team={bowlingTeamName}
        format={matchFormat}
        kitVariant={kitVariants.bowling}
        kitRole="umpire"
      />

      {/* Physical 3D Cricket Ball */}
      <BallVisual
        position={ball3DPos}
        visible={ballVisible}
        scale={ballScale}
        isHitFlash={stage === 'BAT_CONTACT'}
        spinVelocity={ballSpinRate}
        spinTilt={ballSpinTilt}
        squash={ballSquash}
        attractTo={bladeRef}
        attract={ballAttract}
      />
    </>
  );
}

export default function CricketAction3DView(props: CricketAction3DViewProps) {
  const [cameraMode, setCameraMode] = useState<CameraViewMode>(
    props.initialCameraMode ?? (!props.striker && props.stage === 'IDLE' ? 'DRONE' : 'BROADCAST')
  );
  const sceneRootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === sceneRootRef.current);
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const toggleFullscreen = () => {
    const root = sceneRootRef.current;
    if (!root) return;
    if (document.fullscreenElement === root) {
      void document.exitFullscreen().catch(() => setIsFullscreen(false));
    } else if (root.requestFullscreen) {
      void root.requestFullscreen().catch(() => setIsFullscreen(false));
    }
  };
  // Show the complete field during toss / lineup setup, then return to TV coverage
  // once an opening batter is assigned. Manual camera selection remains available.
  useEffect(() => {
    if (!props.striker && props.stage === 'IDLE') setCameraMode('DRONE');
    else if (props.striker && props.stage === 'IDLE') setCameraMode('BROADCAST');
  }, [props.striker?.id, props.stage]);

  const [showDebugSkeleton, setShowDebugSkeleton] = useState(false);
  const [showKitPreview, setShowKitPreview] = useState(false);
  const [isDay, setIsDay] = useState(props.initialDay ?? false);

  return (
    <div
      ref={sceneRootRef}
      className={`${isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen rounded-none' : 'absolute inset-0 rounded-xl'} overflow-hidden bg-[#080e1e] select-none`}
    >
      <Canvas
        shadows={false}
        dpr={[0.7, 1.05]}
        performance={{ min: 0.65, max: 1, debounce: 500 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={<SceneLoadingFallback />}>
          <StadiumScene
            isDay={isDay}
            props={props}
            cameraMode={cameraMode}
            showDebugSkeleton={showDebugSkeleton}
          />
        </Suspense>
      </Canvas>
      <ModelLoadingOverlay />

      {/* Top Left Status Badge */}
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[min(70%,520px)] flex-col gap-1">
        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-slate-950/85 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200 backdrop-blur-md shadow-lg">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
          <span>AAA 3D Match Stadium</span>
        </div>
        {props.fieldPhase && (
          <div className="rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[9px] font-bold uppercase leading-relaxed text-white/90 backdrop-blur-md shadow-lg">
            <span>{(props.fieldFormat || props.matchFormat || 'T20').toUpperCase()} · {props.fieldPhase}</span>
            <span className="ml-2 text-cyan-200">
              {props.fieldRestricted === false
                ? `NO CIRCLE LIMIT · ${props.actualOutsideCircle ?? 0} OUTSIDE`
                : `OUTSIDE ${props.actualOutsideCircle ?? 0}/${props.maxOutsideCircle ?? 0}`}
            </span>
          </div>
        )}
      </div>

      {showKitPreview && (
        <KitPreviewPanel initialTeam={props.battingTeamName} onClose={() => setShowKitPreview(false)} />
      )}

      {/* Top Right Camera & Debug Controls */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 z-20">
        {/* Camera Selector */}
        <div className="flex items-center bg-slate-950/85 backdrop-blur-md p-0.5 rounded-xl border border-white/10 shadow-lg text-[9px] font-bold">
          {(
            [
              ['EA_BATTER', 'Behind the batter'],
              ['DRONE', 'Drone - orbit the whole ground'],
              ['BROADCAST', 'Broadcast TV'],
              ['BOWLER_CAM', 'Bowler run-up'],
              ['SIDE_ON', 'Side-on'],
              ['ACTION_CAM', 'Action cam'],
              ['ORBIT', 'Free orbit'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCameraMode(mode)}
              title={label}
              className={`px-2 py-1 rounded-lg transition-all ${
                cameraMode === mode
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {CAMERA_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Day / night match */}
        <button
          type="button"
          onClick={() => setIsDay((v) => !v)}
          title="Switch between a day match and a floodlit night match"
          className={`px-2 py-1 rounded-xl text-[9px] font-bold border backdrop-blur-md ${isDay ? 'bg-amber-500/20 text-amber-200 border-amber-400/40' : 'bg-slate-950/85 text-slate-300 border-white/10 hover:text-white'}`}
        >
          {isDay ? 'Day' : 'Night'}
        </button>

        {/* Player / kit preview */}
        <button
          type="button"
          onClick={() => setShowKitPreview((v) => !v)}
          title="Player preview: rotate, zoom, change national kit, format and number"
          className={`px-2 py-1 rounded-xl text-[9px] font-bold border backdrop-blur-md ${showKitPreview ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40' : 'bg-slate-950/85 text-slate-300 border-white/10 hover:text-white'}`}
        >
          Kits
        </button>

        {/* Fullscreen match view */}
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen match view' : 'Enter fullscreen match view'}
          aria-pressed={isFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Watch the match fullscreen'}
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-950/85 px-2 py-1 text-[9px] font-bold text-slate-200 backdrop-blur-md transition-colors hover:border-cyan-400/40 hover:text-white"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span>{isFullscreen ? 'Exit' : 'Full'}</span>
        </button>

        {/* Debug Skeleton & Collision Capsule Toggle */}
        <button
          type="button"
          onClick={() => setShowDebugSkeleton((v) => !v)}
          title={showDebugSkeleton ? 'Hide Debug Skeletons' : 'Show Debug Skeletons & IK Lines'}
          className={`flex items-center justify-center p-1.5 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
            showDebugSkeleton
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
              : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Drag & Orbit hint */}
      {cameraMode === 'ORBIT' && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950/75 px-3 py-1 text-[10px] font-semibold text-cyan-200 backdrop-blur">
          Drag to rotate · Right-click to pan · Scroll to zoom
        </div>
      )}
    </div>
  );
}
