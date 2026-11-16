import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Stadium, StadiumScoreboardData } from '../3d/Stadium';
import { Lighting } from '../3d/Lighting';
import { CameraSystem, CameraViewMode, CAMERA_LABELS } from '../3d/CameraSystem';
import { toWorld, BOUNDARY_M, CREASE_Z, PITCH_HALF } from '../3d/worldScale';
import { computeBatterMotion, BatterAction } from '../presentation/batterMotion';
import { CharacterInstance, CharacterErrorBoundary } from '../characters/CharacterInstance';
import KitPreviewPanel from './KitPreviewPanel';
import { bowlingKindOf, heightCmFor, heightScale } from '../characters/playerAppearance';
import { pickVariants, resolveKit, jerseyNumberFor, jerseyNameFor } from '../characters/teamKits';
import { BallVisual } from '../physics/BallVisual';
import { soundFX } from '../3d/CricketSoundFX';
import { CricketArenaAction } from '../lib/cricketArenaAnimations';
import { Camera, Eye, Zap, Crosshair, Settings, Sun, Moon, Sliders, X, Check, Activity, Shield, Sparkles } from 'lucide-react';

export type MotionQuality = 'ULTRA' | 'BALANCED' | 'POWER_SAVE';

const PADDED_MODEL = '/models/cricket-arena/cartoon_sports_character_3d_model.glb';
const LIGHT_MODEL = '/models/cricket-arena/cartoon_character_3d_model.glb';

// Warm both shared GLB caches before the first delivery starts.
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
  progress?: number;
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

function CharacterLoadingSilhouette({ position, yaw = 0 }: { position: [number, number]; yaw?: number }) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, yaw - Math.PI / 2, 0]}>
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 1.0, 8]} />
        <meshStandardMaterial color="#7e9fc9" roughness={0.85} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.19, 10, 8]} />
        <meshStandardMaterial color="#c1cde0" roughness={0.8} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function StadiumScene({
  isDay = false,
  props,
  cameraMode,
  showDebugSkeleton,
  motionQuality = 'ULTRA',
}: {
  props: CricketAction3DViewProps;
  cameraMode: CameraViewMode;
  isDay?: boolean;
  showDebugSkeleton: boolean;
  motionQuality?: MotionQuality;
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
  const bowlAction: CricketArenaAction = bowling.kind === 'SPIN' ? 'bowl_spin' : bowling.kind === 'MEDIUM' ? 'bowl_seam' : 'bowl_fast';
  const strikerWorld = toWorld(strikerPos);
  
  // Safe lateral offset for non-striker so they stand beside the pitch, never in the bowler's path
  const rawNonStriker = toWorld(nonStrikerPos);
  const nonStrikerWorld: [number, number] = useMemo(() => {
    const latOffset = isLeftHanded ? 1.85 : -1.85;
    const x = Math.abs(rawNonStriker[0]) < 0.6 ? latOffset : rawNonStriker[0];
    return [x, rawNonStriker[1]];
  }, [rawNonStriker, isLeftHanded]);

  // Smooth bowler run-up position along pitch axis
  const rawBowler = toWorld(bowlerPos);
  const bowlerWorld: [number, number] = useMemo(() => {
    if (stage === 'BOWLER_RELEASE') {
      const pNorm = Math.min(1, progress / 45);
      const startDepth = bowling.kind === 'SPIN' ? -16.0 : -25.5;
      const endDepth = -CREASE_Z;
      const followThroughDepth = -6.8;
      const curZ = pNorm < 0.78
        ? startDepth + (endDepth - startDepth) * (pNorm / 0.78)
        : endDepth + (followThroughDepth - endDepth) * ((pNorm - 0.78) / 0.22);
      const curX = THREE.MathUtils.lerp(0.55, -0.2, pNorm);
      return [curX, curZ];
    }
    if (stage === 'PITCH_BOUNCE' || stage === 'BAT_CONTACT') {
      return [-0.25, -6.6];
    }
    return [rawBowler[0], rawBowler[1]];
  }, [stage, progress, rawBowler, bowling.kind]);

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
    } else if (stage === 'OUTCOME') {
      // Authentic 3D parabolic return throw from fielder to bowler's hands
      const bowlerWorldPos = bowlerWorld;
      const dX = ballWorld[0] - bowlerWorldPos[0];
      const dZ = ballWorld[1] - bowlerWorldPos[1];
      const distToBowler = Math.hypot(dX, dZ);
      const totalThrowDist = activeFielderAction
        ? Math.hypot(toWorld(activeFielderAction.currentPos)[0] - bowlerWorldPos[0], toWorld(activeFielderAction.currentPos)[1] - bowlerWorldPos[1])
        : 18.0;

      if (distToBowler > 0.45 && totalThrowDist > 1.2) {
        const tFlight = Math.max(0, Math.min(1, 1 - distToBowler / Math.max(1, totalThrowDist)));
        const arcHeight = Math.min(3.8, Math.max(1.1, totalThrowDist * 0.12));
        const startY = 0.95; // Fielder release height
        const targetY = 1.35; // Bowler catch height
        y = THREE.MathUtils.lerp(startY, targetY, tFlight) + Math.sin(tFlight * Math.PI) * arcHeight;
      } else {
        // Gathered cleanly into bowler's hands at crease
        y = 1.35;
      }
    }
    return [ballWorld[0], y, ballWorld[1]];
  }, [stage, progress, localProgress, delivery, ballWorld, bowlerWorld, activeFielderAction]);

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
        <CharacterErrorBoundary fallback={<CharacterLoadingSilhouette position={sPos} yaw={sYaw} />}>
          <Suspense fallback={<CharacterLoadingSilhouette position={sPos} yaw={sYaw} />}>
            <CharacterInstance
              modelUrl={PADDED_MODEL}
              position={sPos}
              yaw={sYaw}
              jerseyNumber={jerseyNumberFor(striker?.name)}
              jerseyName={jerseyNameFor(striker?.name)}
              heightScale={heightScale(heightCmFor(striker?.name, striker?.role))}
              batBladeRef={bladeRef}
              action={sAct}
              progress={localProgress}
              hasBat={true}
              isLeftHanded={isLeftHanded}
              ballPos={ball3DPos}
              showDebugSkeleton={showDebugSkeleton}
              updateFps={motionQuality === 'ULTRA' ? 60 : motionQuality === 'BALANCED' ? 45 : 30}
              trackBall
              castShadow
              team={battingTeamName}
              format={matchFormat}
              kitVariant={kitVariants.batting}
              kitRole="batter"
            />
          </Suspense>
        </CharacterErrorBoundary>
      )}

      {/* Non-Striker Batsman */}
      {nonStriker && (
        <CharacterErrorBoundary fallback={<CharacterLoadingSilhouette position={nPos} yaw={nYaw} />}>
          <Suspense fallback={<CharacterLoadingSilhouette position={nPos} yaw={nYaw} />}>
            <CharacterInstance
              modelUrl={PADDED_MODEL}
              position={nPos}
              yaw={nYaw}
              jerseyNumber={jerseyNumberFor(nonStriker?.name)}
              jerseyName={jerseyNameFor(nonStriker?.name)}
              heightScale={heightScale(heightCmFor(nonStriker?.name, nonStriker?.role))}
              action={nAct}
              progress={localProgress}
              hasBat={true}
              showDebugSkeleton={showDebugSkeleton}
              updateFps={motionQuality === 'ULTRA' ? 45 : motionQuality === 'BALANCED' ? 30 : 20}
              trackBall={false}
              castShadow={false}
              team={battingTeamName}
              format={matchFormat}
              kitVariant={kitVariants.batting}
              kitRole="batter"
            />
          </Suspense>
        </CharacterErrorBoundary>
      )}

      {/* Incoming batter walking out after a wicket */}
      {incoming && (
        <CharacterErrorBoundary fallback={<CharacterLoadingSilhouette position={incoming.pos} yaw={incoming.yaw} />}>
          <Suspense fallback={<CharacterLoadingSilhouette position={incoming.pos} yaw={incoming.yaw} />}>
            <CharacterInstance
              modelUrl={PADDED_MODEL}
              position={incoming.pos}
              yaw={incoming.yaw}
              action={incoming.action as CricketArenaAction}
              progress={0}
              hasBat={true}
              showDebugSkeleton={showDebugSkeleton}
              updateFps={motionQuality === 'ULTRA' ? 45 : motionQuality === 'BALANCED' ? 30 : 20}
              trackBall={false}
              castShadow={false}
              team={battingTeamName}
              format={matchFormat}
              kitVariant={kitVariants.batting}
              kitRole="batter"
            />
          </Suspense>
        </CharacterErrorBoundary>
      )}

      {/* Bowler-end Umpire (Rigged 3D character with official signals: out, four, six) */}
      <CharacterErrorBoundary fallback={<CharacterLoadingSilhouette position={[0, -PITCH_HALF - 2.2]} yaw={0} />}>
        <Suspense fallback={<CharacterLoadingSilhouette position={[0, -PITCH_HALF - 2.2]} yaw={0} />}>
          <CharacterInstance
            modelUrl={LIGHT_MODEL}
            position={[0, -PITCH_HALF - 2.2]}
            yaw={0}
            action={
              stage === 'OUTCOME' && delivery?.wicket
                ? 'umpireOut'
                : stage === 'OUTCOME' && delivery?.totalRuns === 6
                ? 'umpireSix'
                : stage === 'OUTCOME' && delivery?.totalRuns === 4
                ? 'umpireFour'
                : 'ready'
            }
            progress={localProgress}
            heightScale={1.0}
            updateFps={18}
            trackBall={stage === 'BALL_TRAVEL' || stage === 'OUTCOME'}
            castShadow
            format={matchFormat}
            kitRole="umpire"
          />
        </Suspense>
      </CharacterErrorBoundary>

      {/* Square-leg Umpire */}
      <CharacterErrorBoundary fallback={<CharacterLoadingSilhouette position={[isLeftHanded ? -20 : 20, CREASE_Z - 0.5]} yaw={isLeftHanded ? Math.PI / 2 : -Math.PI / 2} />}>
        <Suspense fallback={<CharacterLoadingSilhouette position={[isLeftHanded ? -20 : 20, CREASE_Z - 0.5]} yaw={isLeftHanded ? Math.PI / 2 : -Math.PI / 2} />}>
          <CharacterInstance
            modelUrl={LIGHT_MODEL}
            position={[isLeftHanded ? -20 : 20, CREASE_Z - 0.5]}
            yaw={isLeftHanded ? Math.PI / 2 : -Math.PI / 2}
            action="ready"
            progress={0}
            heightScale={0.98}
            updateFps={12}
            trackBall={false}
            castShadow={false}
            format={matchFormat}
            kitRole="umpire"
          />
        </Suspense>
      </CharacterErrorBoundary>

      {/* Bowler and Fielders */}
      {fielders.map((fielder) => {
        const isBowler = fielder.isBowler || fielder.positionKey === 'BOWLER';
        const isKeeper = fielder.isWicketkeeper || fielder.positionKey === 'WICKETKEEPER';
        const active = activeFielderAction?.fielderId === fielder.id ? activeFielderAction : null;

        // Realistic cricket placement: Wicketkeeper stands right behind striker's stumps
        // (up to stumps for spin, back for pace bowling)
        const location: [number, number] = isBowler
          ? bowlerWorld
          : isKeeper && !active
          ? [
              isLeftHanded ? 0.25 : -0.25,
              bowling.kind === 'SPIN' ? PITCH_HALF + 1.25 : PITCH_HALF + 3.4,
            ]
          : active
          ? toWorld(active.currentPos)
          : toWorld({ x: fielder.currentX, y: fielder.currentY });

        // Select specific character action
        let action: CricketArenaAction = 'ready';
        if (isBowler) {
          const dX = ballWorld[0] - bowlerWorld[0];
          const dZ = ballWorld[1] - bowlerWorld[1];
          const distToBowler = Math.hypot(dX, dZ);
          const isCatching = stage === 'OUTCOME' && !delivery?.wicket && distToBowler < 8.5;

          action =
            stage === 'BOWLER_RELEASE' || stage === 'PITCH_BOUNCE'
              ? bowlAction
              : stage === 'OUTCOME' && delivery?.wicket
              ? 'celebrateSmall'
              : isCatching
              ? 'catchChest'
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

        // Direction facing: fielders face the striker unless actively tracking/chasing or throwing
        const facingAngle = isBowler
          ? (stage === 'OUTCOME' && !delivery?.wicket
              ? Math.atan2(ballWorld[0] - location[0], ballWorld[1] - location[1])
              : 0)
          : isKeeper
          ? Math.PI
          : active
          ? (stage === 'OUTCOME'
              ? Math.atan2(bowlerWorld[0] - location[0], bowlerWorld[1] - location[1])
              : Math.atan2(ballWorld[0] - location[0], ballWorld[1] - location[1]))
          : Math.atan2(strikerWorld[0] - location[0], strikerWorld[1] - location[1]);

        const fielderFps = isBowler || active
          ? (motionQuality === 'ULTRA' ? 60 : 45)
          : isKeeper
          ? (motionQuality === 'ULTRA' ? 45 : 30)
          : (motionQuality === 'ULTRA' ? 30 : 20);

        const charProgress = isBowler
          ? (stage === 'OUTCOME'
              ? Math.max(0, Math.min(1, 1 - Math.hypot(ballWorld[0] - bowlerWorld[0], ballWorld[1] - bowlerWorld[1]) / 6.0))
              : Math.min(1, progress / 45))
          : active?.progress !== undefined
          ? active.progress
          : localProgress;

        return (
          <CharacterErrorBoundary key={fielder.id} fallback={<CharacterLoadingSilhouette position={location} yaw={facingAngle} />}>
            <Suspense fallback={<CharacterLoadingSilhouette position={location} yaw={facingAngle} />}>
              <CharacterInstance
                modelUrl={isKeeper ? PADDED_MODEL : LIGHT_MODEL}
                position={location}
                yaw={facingAngle}
                jerseyNumber={jerseyNumberFor(fielder.name)}
                jerseyName={jerseyNameFor(fielder.name)}
                heightScale={heightScale(heightCmFor(fielder.name, (fielder as { role?: string }).role, isBowler ? bowling.kind : undefined))}
                isLeftHanded={isBowler && bowling.leftArm}
                action={action}
                progress={charProgress}
                ballPos={ball3DPos}
                showDebugSkeleton={showDebugSkeleton}
                updateFps={fielderFps}
                trackBall={isBowler || isKeeper || Boolean(active)}
                castShadow={isBowler || Boolean(active)}
                team={bowlingTeamName}
                format={matchFormat}
                kitVariant={kitVariants.bowling}
                kitRole={isKeeper ? 'keeper' : 'fielder'}
              />
            </Suspense>
          </CharacterErrorBoundary>
        );
      })}

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
  const [cameraMode, setCameraMode] = useState<CameraViewMode>(() => {
    return (localStorage.getItem('cricket_arena_camera_mode') as CameraViewMode) || props.initialCameraMode || 'EA_BATTER';
  });
  const [motionQuality, setMotionQuality] = useState<MotionQuality>(() => {
    return (localStorage.getItem('cricket_arena_motion_quality') as MotionQuality) || 'ULTRA';
  });
  const [isDay, setIsDay] = useState<boolean>(() => {
    const saved = localStorage.getItem('cricket_arena_is_day');
    return saved !== null ? saved === 'true' : (props.initialDay ?? false);
  });
  const [showDebugSkeleton, setShowDebugSkeleton] = useState(false);
  const [showKitPreview, setShowKitPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleSetCameraMode = (mode: CameraViewMode) => {
    setCameraMode(mode);
    try {
      localStorage.setItem('cricket_arena_camera_mode', mode);
    } catch {
      // ignore
    }
  };

  const handleSetMotionQuality = (quality: MotionQuality) => {
    setMotionQuality(quality);
    try {
      localStorage.setItem('cricket_arena_motion_quality', quality);
    } catch {
      // ignore
    }
  };

  const handleSetIsDay = (day: boolean) => {
    setIsDay(day);
    try {
      localStorage.setItem('cricket_arena_is_day', String(day));
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl bg-[#080e1e] select-none">
      <Canvas
        shadows
        dpr={[1, 1.25]}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <StadiumScene
          isDay={isDay}
          props={props}
          cameraMode={cameraMode}
          showDebugSkeleton={showDebugSkeleton}
          motionQuality={motionQuality}
        />
      </Canvas>

      {/* Top Left Status Badge */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 z-20">
        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-slate-950/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-200 backdrop-blur-md shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AAA 3D Match Stadium</span>
        </div>
      </div>

      {showKitPreview && (
        <KitPreviewPanel initialTeam={props.battingTeamName} onClose={() => setShowKitPreview(false)} />
      )}

      {/* Top Right Clean Controls: Quick Camera Selector, Day/Night toggle, and Settings */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 z-20">
        {/* Quick Camera Dropdown / Button */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-slate-950/85 text-[10px] font-bold text-cyan-200 backdrop-blur-md shadow-lg hover:border-cyan-400 hover:text-white transition-all"
            onClick={() => setShowSettingsModal(true)}
            title="Change Camera Perspective"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>{CAMERA_LABELS[cameraMode] || 'Camera'}</span>
            <span className="text-[8px] text-cyan-400/70">▾</span>
          </button>
        </div>

        {/* Day / Night quick button */}
        <button
          type="button"
          onClick={() => handleSetIsDay(!isDay)}
          title={isDay ? 'Switch to Floodlit Night Match' : 'Switch to Day Match'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border backdrop-blur-md transition-all shadow-lg ${
            isDay
              ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
              : 'bg-slate-950/85 text-slate-300 border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          {isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-300" />}
          <span className="hidden sm:inline">{isDay ? 'Day' : 'Night'}</span>
        </button>

        {/* Clean Preferences & Settings Button */}
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          title="Open Match & Stadium Preferences"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-100 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:from-cyan-600/40 hover:to-blue-600/40 hover:border-cyan-300 transition-all cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-300" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>

      {/* Interactive Drag & Orbit hint */}
      {cameraMode === 'ORBIT' && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-slate-950/75 px-3 py-1 text-[10px] font-semibold text-cyan-200 backdrop-blur">
          Drag to rotate · Right-click to pan · Scroll to zoom
        </div>
      )}

      {/* Clean Match Preferences Modal */}
      {showSettingsModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#09152b] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Stadium & Match Preferences</h3>
                  <p className="text-[10px] text-slate-400">Adjust camera perspective, frame rate smoothness, and lighting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close preferences"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 py-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Camera Perspective Option Cards */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block mb-2">
                  Camera Perspective
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['EA_BATTER', 'Behind Batter', 'Immersive batting crease view down pitch'],
                      ['BROADCAST', 'TV Broadcast', 'Classic side-on television camera'],
                      ['DRONE', 'Drone Aerial', 'Sweeping 360° stadium aerial view'],
                      ['ACTION_CAM', 'Action Cam', 'Dynamic chase camera following ball'],
                      ['BOWLER_CAM', 'Bowler Run-Up', 'Follow behind bowler delivering ball'],
                      ['SIDE_ON', 'Side-On', 'Side crease technical analysis angle'],
                      ['ORBIT', 'Free 3D Orbit', 'Freely rotate, zoom, and explore stadium'],
                    ] as const
                  ).map(([mode, name, desc]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleSetCameraMode(mode)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        cameraMode === mode
                          ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black">{name}</span>
                        {cameraMode === mode && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Smoothness & Quality */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block mb-2">
                  Motion Smoothness (FPS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['ULTRA', 'Ultra (60 FPS)', 'Buttery smooth IK animations & ball motion', Activity],
                      ['BALANCED', 'Balanced (45 FPS)', 'Standard smooth pacing for laptops', Zap],
                      ['POWER_SAVE', 'Power Save (30 FPS)', 'Reduced power consumption', Shield],
                    ] as const
                  ).map(([qual, name, desc, Icon]) => (
                    <button
                      key={qual}
                      type="button"
                      onClick={() => handleSetMotionQuality(qual)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        motionQuality === qual
                          ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-3.5 h-3.5 ${motionQuality === qual ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {motionQuality === qual && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-[10px] font-black">{name}</div>
                      <p className="text-[8px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lighting & Atmosphere */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block mb-2">
                  Atmosphere & Lighting
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetIsDay(true)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                      isDay
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <Sun className={`w-4 h-4 ${isDay ? 'text-amber-400' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="text-[11px] font-black">Day Match</div>
                      <div className="text-[9px] text-slate-400">Natural daylight sky</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetIsDay(false)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                      !isDay
                        ? 'border-blue-400 bg-blue-500/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                        : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <Moon className={`w-4 h-4 ${!isDay ? 'text-blue-300' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <div className="text-[11px] font-black">Floodlit Night</div>
                      <div className="text-[9px] text-slate-400">Night stadium lights</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Visual Aids & Customizer */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block mb-2">
                  Visual Tools & Overlays
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDebugSkeleton((v) => !v)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      showDebugSkeleton
                        ? 'border-emerald-400 bg-emerald-500/20 text-white'
                        : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Crosshair className={`w-3.5 h-3.5 ${showDebugSkeleton ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold">Debug Skeletons</span>
                    </div>
                    {showDebugSkeleton && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowKitPreview(true);
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-300 hover:border-cyan-400 hover:text-white transition-all text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                      <span className="text-[10px] font-bold block">Team Kit Preview</span>
                      <span className="text-[8px] text-slate-400">View team colors & jerseys</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
              >
                Apply & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
