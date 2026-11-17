import React, { Component, useEffect, useId, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { buildCharacterRig, CricketRigModel } from './CharacterRig';
import {
  CricketArenaAction,
  CricketArenaPose,
  Gait,
  gaitCycleLength,
  gaitForSpeed,
  getCricketArenaPose,
} from '../lib/cricketArenaAnimations';
import { applyTeamKit, createKitCharacter } from './kitMaterial';
import { KitFormat, KitRole, KitVariant } from './teamKits';

export interface CharacterInstanceProps {
  modelUrl: string;
  position: [number, number] | [number, number, number]; // [x, z] or [x, y, z] in 3D coordinates
  yaw: number;                // Facing angle in radians
  action: CricketArenaAction;
  progress: number;
  hasBat?: boolean;
  isLeftHanded?: boolean;
  /** Uniform scale from the player's height (1 = the model's nominal 182 cm). Never distorts proportions. */
  heightScale?: number;
  /** Receives the world position of the bat blade every frame (used to make the ball meet the bat). */
  batBladeRef?: React.MutableRefObject<THREE.Vector3 | null>;
  ballPos?: [number, number, number];
  showDebugSkeleton?: boolean;
  /** Team (country / franchise) whose kit this player wears. Omit to keep the model's original look. */
  team?: string;
  /** Match format: TEST = whites, ODI = team colours, T20/IPL = colour-blocked kit */
  format?: KitFormat | string;
  kitVariant?: KitVariant;
  /** batter / keeper wear a helmet; fielders do not; umpire wears official attire */
  kitRole?: KitRole;
  /** Shirt number and surname printed on the back */
  jerseyNumber?: number;
  jerseyName?: string;
  /** Pose-solve frequency; use a lower rate for distant, idle players. */
  updateFps?: number;
  /** Disable live-ball head tracking for background players. */
  trackBall?: boolean;
  /** Only foreground characters should cast dynamic shadows. */
  castShadow?: boolean;
  /**
   * Glide to the requested position / turn smoothly to the requested yaw instead of snapping.
   * Use for fielders, keepers and umpires. Leave off for characters whose position is already
   * animated frame-by-frame by the match (bowler run-up, batters running between the wickets).
   */
  smoothMotion?: boolean;
  /**
   * Derive walk / jog / sprint from the character's real ground speed and drive the stride from
   * distance travelled, so feet stay planted (no sliding) whatever the caller asked for.
   */
  autoLocomotion?: boolean;
  /**
   * With smoothMotion: cap travel speed (m/s) so repositioning looks like walking / jogging rather than
   * a slide. Large jumps (> 25 m, e.g. a reset) still snap.
   */
  maxSpeed?: number;
  /** 0..1 value that varies idle behaviour per player. Defaults to a stable per-instance value. */
  idleSeed?: number;
}

const LOCOMOTION_ACTIONS = new Set<CricketArenaAction>(['walk', 'jog', 'sprint', 'run', 'runBat', 'sprintBat', 'walkBat', 'walkAway']);
const IDLE_ACTIONS = new Set<CricketArenaAction>(['ready', 'fielderReady', 'fielderWait', 'stand', 'nonStrikerWait', 'nonStrikerBackUp']);

const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}

/** Error boundary per character instance to prevent one failing character from bringing down the stadium */
export class CharacterErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('Character 3D instance fallback rendered:', err);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/** Linear interpolation between two poses for smooth animation transitions */
function blendPoses(a: CricketArenaPose, b: CricketArenaPose, factor: number): CricketArenaPose {
  const f = Math.max(0, Math.min(1, factor));
  const lerpVal = (valA?: number, valB?: number, def = 0) => {
    const va = valA ?? def;
    const vb = valB ?? def;
    return va + (vb - va) * f;
  };

  return {
    sp: lerpVal(a.sp, b.sp),
    yw: lerpVal(a.yw, b.yw),
    lean: lerpVal(a.lean, b.lean),
    head: lerpVal(a.head, b.head),
    crouch: lerpVal(a.crouch, b.crouch),
    lfx: lerpVal(a.lfx, b.lfx),
    lfy: lerpVal(a.lfy, b.lfy),
    rfx: lerpVal(a.rfx, b.rfx),
    rfy: lerpVal(a.rfy, b.rfy),
    lhx: lerpVal(a.lhx, b.lhx),
    lhy: lerpVal(a.lhy, b.lhy),
    rhx: lerpVal(a.rhx, b.rhx),
    rhy: lerpVal(a.rhy, b.rhy),
    grip: lerpVal(a.grip, b.grip),
    bx: lerpVal(a.bx, b.bx),
    by: lerpVal(a.by, b.by),
    ba: lerpVal(a.ba, b.ba),
    air: lerpVal(a.air, b.air),
    rot: lerpVal(a.rot, b.rot),
    latL: lerpVal(a.latL, b.latL),
    latR: lerpVal(a.latR, b.latR),
    tw: lerpVal(a.tw, b.tw),
    toe: lerpVal(a.toe, b.toe),
    hd: lerpVal(a.hd, b.hd),
  };
}

function CharacterInstanceInner({
  modelUrl,
  position,
  yaw,
  action,
  progress,
  hasBat = false,
  isLeftHanded = false,
  heightScale = 1,
  batBladeRef,
  ballPos,
  showDebugSkeleton = false,
  team,
  format,
  kitVariant = 'home',
  kitRole = 'fielder',
  jerseyNumber,
  jerseyName,
  updateFps = 30,
  trackBall = true,
  castShadow = false,
  smoothMotion = false,
  autoLocomotion = false,
  maxSpeed,
  idleSeed,
}: CharacterInstanceProps) {
  const reactId = useId();
  const seed = idleSeed ?? hashSeed(reactId);
  const { scene } = useGLTF(modelUrl);
  const model: CricketRigModel = useMemo(() => buildCharacterRig(scene), [scene]);

  const rootRef = useRef<THREE.Group>(null);
  const modelWrapperRef = useRef<THREE.Group>(null);
  const batRef = useRef<THREE.Group>(null);
  const solverState = useRef<Record<string, unknown>>({});
  // Frame-rate independent motion state (smoothed transform, speed, gait phase, head tracking).
  const motion = useRef({
    init: false,
    x: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    phase: 0,
    gait: null as Gait | null,
    hd: 0,
    headPitch: 0,
    yw: 0,
    sp: 0,
  });

  // Animation cross-fading & state tracking
  const prevPoseRef = useRef<CricketArenaPose | null>(null);
  const prevActionRef = useRef<CricketArenaAction>(action);
  const blendStateRef = useRef<{ fromPose: CricketArenaPose; startTime: number; duration: number } | null>(null);

  // Debug Skeleton Line Ref
  const debugLinesRef = useRef<THREE.LineSegments>(null);
  const lastFrameRef = useRef<{ time: number; action: CricketArenaAction | null }>({ time: -Infinity, action: null });

  // 3D Bat geometry & materials - Real-world international cricket bat dimensions (MCC Law 5)
  // Total length: 0.83 m (~33 inches), Blade: 0.55 m, Handle: 0.28 m. Perfectly proportioned.
  const batGroup = useMemo(() => {
    const group = new THREE.Group();

    // Bat Handle (Dark cane rubber wrap, 0.28m length)
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.85 })
    );
    handle.position.y = -0.04;

    // Bat Grip (Textured rubber grip in orange/red, 0.20m length)
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.021, 0.20, 12),
      new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6 })
    );
    grip.position.y = 0.0;

    // Bat Blade (English Willow wood with curved profile, 0.55m length, 0.108m width, 0.055m depth)
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.108, 0.55, 0.055),
      new THREE.MeshStandardMaterial({ color: '#d8aa62', roughness: 0.72, metalness: 0.04 })
    );
    blade.position.y = -0.415;

    // Bat Spine Ridge (curved contour along the back of the willow)
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.44, 0.026),
      new THREE.MeshStandardMaterial({ color: '#c2924a', roughness: 0.78 })
    );
    spine.position.set(0, -0.415, -0.032);

    group.add(handle, grip, blade, spine);
    return group;
  }, []);

  // Per-character kit state (own materials, helmet gear, bat colours). Built once per instance.
  const kit = useMemo(() => {
    const parts: Record<string, THREE.Mesh[]> = { batHandle: [], batGrip: [], batBlade: [] };
    batGroup.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      if (i === 0) parts.batHandle.push(mesh);
      else if (i === 1) parts.batGrip.push(mesh);
      else parts.batBlade.push(mesh);
    });
    return createKitCharacter(model, parts);
  }, [model, batGroup]);

  // Clean up materials on unmount to prevent GPU leaks
  useEffect(() => {
    return () => {
      kit.kitMaterials.forEach((m) => m.dispose());
      if (kit.helmetMat) kit.helmetMat.dispose();
      if (kit.grilleMat) kit.grilleMat.dispose();
    };
  }, [kit]);

  const hasPadsModel = modelUrl.includes('sports_character');

  useEffect(() => {
    if (!team) return;
    applyTeamKit(kit, team, format, kitVariant, kitRole, hasPadsModel, { number: jerseyNumber, name: jerseyName });
  }, [kit, team, format, kitVariant, kitRole, hasPadsModel, jerseyNumber, jerseyName]);

  // Feet reference for floor standing
  const feet = useMemo(() => {
    const idx = ['Left_Foot', 'Right_Foot', 'Left_Toes', 'Right_Toes']
      .map((n) => model.description.findIndex((d: { n?: string }) => d.n === n))
      .filter((i) => i >= 0);
    return {
      nodes: idx.map((i) => model.nodes[model.description[i].si]),
      floor: idx.length ? Math.min(...idx.map((i) => model.description[i].wp[1])) : 0,
      v: new THREE.Vector3(),
    };
  }, [model]);

  useEffect(() => {
    model.scene.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = false;
    });
  }, [model, castShadow]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const modelWrapper = modelWrapperRef.current;
    if (!root || !modelWrapper) return;

    const clock = state.clock.elapsedTime;
    // Real frame time (only capped against hitches): speed, gait phase and glide must track wall-clock motion
    // even on a slow device. The pose solver below keeps its own, tighter cap.
    const dt = Math.min(Math.max(delta, 1 / 240), 0.25);
    const m = motion.current;

    // ---- Per-frame motion: runs every frame regardless of the pose-solve rate ----
    const tx = position[0];
    const ty = position.length === 3 ? position[1] : 0;
    const tz = position.length === 3 ? position[2] : position[1];
    const prevX = m.x;
    const prevZ = m.z;
    let snapped = false;
    const gap = Math.hypot(tx - m.x, tz - m.z);
    if (!m.init || !smoothMotion || gap > (maxSpeed ? 25 : 8)) {
      snapped = !m.init || smoothMotion; // a teleport (new innings, reset) must not read as a sprint
      m.x = tx;
      m.z = tz;
    } else if (maxSpeed) {
      // Speed-limited follow with ease-out: never faster than maxSpeed, settles gently on arrival.
      const desired = Math.min(maxSpeed, gap * 6);
      const stepLen = Math.min(gap, desired * dt);
      if (gap > 1e-6) {
        m.x += ((tx - m.x) / gap) * stepLen;
        m.z += ((tz - m.z) / gap) * stepLen;
      }
    } else {
      m.x = THREE.MathUtils.damp(m.x, tx, 14, dt);
      m.z = THREE.MathUtils.damp(m.z, tz, 14, dt);
    }
    const step = snapped ? 0 : Math.hypot(m.x - prevX, m.z - prevZ);
    m.speed = THREE.MathUtils.damp(m.speed, step / dt, 8, dt);

    // Facing: turn smoothly; when travelling quickly, face the direction of travel so the feet never run sideways.
    let targetYaw = yaw;
    if (smoothMotion && autoLocomotion && m.speed > 1.6 && step > 1e-5) {
      const travelYaw = Math.atan2(m.x - prevX, m.z - prevZ);
      const w = THREE.MathUtils.clamp((m.speed - 1.6) / 1.6, 0, 1);
      targetYaw = yaw + wrapAngle(travelYaw - yaw) * w;
    }
    if (!m.init || !smoothMotion) {
      m.yaw = yaw;
    } else {
      const err = wrapAngle(targetYaw - m.yaw);
      const turn = THREE.MathUtils.clamp(err * (1 - Math.exp(-9 * dt)), -7 * dt, 7 * dt);
      m.yaw += turn;
    }
    const yawLead = smoothMotion ? wrapAngle(targetYaw - m.yaw) : 0; // how far the body still has to turn
    m.init = true;

    root.position.set(m.x, ty, m.z);
    root.rotation.y = m.yaw - Math.PI / 2 + m.yw * Math.PI / 2 + m.sp;

    // ---- Choose the effective action (context-aware locomotion) ----
    let effAction: CricketArenaAction = action;
    let phase: number | undefined;
    if (autoLocomotion) {
      const moving = m.speed > (m.gait ? 0.35 : 0.6);
      const wantsLoco = LOCOMOTION_ACTIONS.has(action);
      if ((wantsLoco || IDLE_ACTIONS.has(action)) && moving) {
        const gait = gaitForSpeed(m.speed, m.gait);
        m.gait = gait;
        m.phase += step / gaitCycleLength(gait);
        phase = m.phase;
        if (action === 'walkAway' && gait === 'walk') effAction = 'walkAway';
        else if (hasBat) effAction = gait === 'walk' ? 'walkBat' : gait === 'jog' ? 'runBat' : 'sprintBat';
        else effAction = gait;
      } else {
        m.gait = null;
        if (wantsLoco && m.speed <= 0.35) {
          const chase = action === 'sprint' || action === 'run' || action === 'jog' || action === 'runBat' || action === 'sprintBat';
          effAction = hasBat ? 'nonStrikerWait' : chase ? 'fielderReady' : 'stand';
        }
      }
    }

    const fps = Math.max(8, Math.min(60, updateFps));
    const previousFrame = lastFrameRef.current;
    if (previousFrame.action === effAction && clock - previousFrame.time < 1 / fps) return;
    const solveDelta = Number.isFinite(previousFrame.time)
      ? Math.min(clock - previousFrame.time, 0.05)
      : Math.min(delta, 0.05);
    lastFrameRef.current = { time: clock, action: effAction };

    // Check if action transitioned: trigger smooth cross-fade blend
    if (prevActionRef.current !== effAction) {
      if (prevPoseRef.current) {
        blendStateRef.current = {
          fromPose: { ...prevPoseRef.current },
          startTime: clock,
          duration: 0.18,
        };
      }
      prevActionRef.current = effAction;
    }

    const rawPose = getCricketArenaPose(effAction, progress, clock, isLeftHanded, seed, phase);

    // Apply smooth blending across animation switches
    let pose: CricketArenaPose;
    if (blendStateRef.current) {
      const elapsed = clock - blendStateRef.current.startTime;
      const tBlend = Math.min(1, elapsed / blendStateRef.current.duration);
      if (tBlend < 1) {
        const factor = tBlend * tBlend * (3 - 2 * tBlend);
        pose = blendPoses(blendStateRef.current.fromPose, rawPose, factor);
      } else {
        blendStateRef.current = null;
        pose = rawPose;
      }
    } else {
      pose = rawPose;
    }
    prevPoseRef.current = pose;

    // Head tracking: the head turns (yaw) and dips (pitch) to follow the ball, eased so it never snaps.
    // Also leads into turns: the eyes get to the target before the body does.
    let wantHd = THREE.MathUtils.clamp(yawLead * 0.7, -0.7, 0.7);
    let wantPitch = 0;
    if (trackBall && ballPos) {
      const dx = ballPos[0] - m.x;
      const dz = ballPos[2] - m.z;
      const dist = Math.hypot(dx, dz);
      const w = 1 - THREE.MathUtils.smoothstep(dist, 10, 18);
      if (w > 0) {
        const look = THREE.MathUtils.clamp(wrapAngle(Math.atan2(dx, dz) - m.yaw), -0.9, 0.9);
        wantHd += look * w;
        wantPitch = THREE.MathUtils.clamp(Math.atan2(1.55 - ballPos[1], Math.max(dist, 1.5)) * 0.6, -0.35, 0.5) * w;
      }
    }
    m.hd = THREE.MathUtils.damp(m.hd, wantHd, 10, solveDelta);
    m.headPitch = THREE.MathUtils.damp(m.headPitch, wantPitch, 8, solveDelta);
    pose = { ...pose, hd: (pose.hd || 0) + m.hd, head: (pose.head || 0) + m.headPitch };
    m.yw = pose.yw || 0;
    m.sp = pose.sp || 0;

    // Orientation inside the rig (side-on batting stance, celebration spin). Position and yaw were set above.
    root.rotation.y = m.yaw - Math.PI / 2 + m.yw * Math.PI / 2 + m.sp;

    modelWrapper.position.y = pose.air || 0;
    modelWrapper.rotation.set(0, Math.PI / 2 - (pose.yw || 0) * Math.PI / 2, -(pose.rot || 0));

    // Solve kinematics and anatomical collision constraints
    const output = model.rig.solve(pose, solverState.current, solveDelta);

    // Apply solved bone quaternions
    const bones = model.description;
    for (let i = 0; i < bones.length; i++) {
      if (bones[i].isBone) {
        const node = model.nodes[bones[i].si];
        node.quaternion.set(
          output.lq[i * 4],
          output.lq[i * 4 + 1],
          output.lq[i * 4 + 2],
          output.lq[i * 4 + 3]
        );
      }
    }

    // Apply solved hips displacement
    const hipsIdx = model.rig.R.hips;
    if (hipsIdx !== undefined) {
      const hipsNode = model.nodes[model.description[hipsIdx].si];
      hipsNode.position.set(output.hipsLocal[0], output.hipsLocal[1], output.hipsLocal[2]);
    }

    // Ground clamp: keep feet above grass level efficiently without full-graph traverse
    if (feet.nodes.length && pose.crouch > 0.3 && ty === 0) {
      let minY = Infinity;
      for (const n of feet.nodes) {
        n.getWorldPosition(feet.v);
        if (feet.v.y < minY) minY = feet.v.y;
      }
      if (minY < 0.005) {
        model.scene.position.y = THREE.MathUtils.damp(model.scene.position.y, -minY + 0.005, 12, solveDelta);
      } else {
        model.scene.position.y = THREE.MathUtils.damp(model.scene.position.y, 0, 10, solveDelta);
      }
    } else {
      model.scene.position.y = 0;
    }

    // Update Bat position attached cleanly to hands
    const bat = batRef.current;
    if (bat && hasBat) {
      const isGripping = (pose.grip || 0) > 0.5;
      bat.visible = isGripping;
      if (isGripping) {
        const isTwoHand = (pose.grip || 0) > 1.5;
        const palm = isTwoHand ? output.palmL : output.palmR;
        const ba = output.ba;
        const dx = Math.sin(ba);
        const dy = -Math.cos(ba);

        bat.position.set(
          palm[0] - dx * 0.045,
          palm[1] - dy * 0.045,
          isTwoHand ? (output.palmL[2] + output.palmR[2]) * 0.5 : palm[2]
        );
        bat.rotation.set(0, 0, ba);
      }
      // Publish the blade position so the ball meets it at contact point
      if (batBladeRef && isGripping && batGroup.children[2]) {
        if (!batBladeRef.current) batBladeRef.current = new THREE.Vector3();
        batGroup.children[2].getWorldPosition(batBladeRef.current);
      }
    }

    // Update debug skeleton if enabled
    if (showDebugSkeleton && debugLinesRef.current) {
      const geom = debugLinesRef.current.geometry;
      const positions = geom.attributes.position.array as Float32Array;
      let ptr = 0;
      const R = model.rig.R;
      const pairs = [
        [R.hips, R.spine],
        [R.spine, R.chest],
        [R.chest, R.neck],
        [R.neck, R.head],
        [R.chest, R.Lua],
        [R.Lua, R.Lla],
        [R.Lla, R.Lhand],
        [R.chest, R.Rua],
        [R.Rua, R.Rla],
        [R.Rla, R.Rhand],
        [R.hips, R.Lul],
        [R.Lul, R.Lll],
        [R.Lll, R.Lfoot],
        [R.hips, R.Rul],
        [R.Rul, R.Rll],
        [R.Rll, R.Rfoot],
      ];

      const vA = new THREE.Vector3();
      const vB = new THREE.Vector3();
      pairs.forEach(([a, b]) => {
        if (a !== undefined && b !== undefined) {
          const nodeA = model.nodes[model.description[a].si];
          const nodeB = model.nodes[model.description[b].si];
          nodeA.getWorldPosition(vA);
          nodeB.getWorldPosition(vB);
          positions[ptr++] = vA.x;
          positions[ptr++] = vA.y;
          positions[ptr++] = vA.z;
          positions[ptr++] = vB.x;
          positions[ptr++] = vB.y;
          positions[ptr++] = vB.z;
        }
      });
      geom.attributes.position.needsUpdate = true;
    }
  });

  const debugGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(16 * 6), 3));
    return geom;
  }, []);

  return (
    <group ref={rootRef} position={[position[0], 0, position[1]]}>
      <group ref={modelWrapperRef} scale={model.rig.S * heightScale}>
        <primitive object={model.scene} />
        {hasBat && <primitive object={batGroup} ref={batRef} />}
      </group>

      {showDebugSkeleton && (
        <lineSegments ref={debugLinesRef} geometry={debugGeometry}>
          <lineBasicMaterial color="#00ffcc" depthTest={false} linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
}

const STATIC_POSE_ACTIONS = new Set<CricketArenaAction>([
  'idle', 'ready', 'keeperReady', 'batIdle', 'stand', 'fielderWait', 'fielderReady', 'nonStrikerWait', 'nonStrikerBackUp',
]);

function sameVector(a?: readonly number[], b?: readonly number[]) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function areCharacterPropsEqual(prev: CharacterInstanceProps, next: CharacterInstanceProps) {
  const staticPose = prev.action === next.action && STATIC_POSE_ACTIONS.has(next.action);
  const compareBall = next.trackBall !== false;
  return (
    prev.modelUrl === next.modelUrl &&
    sameVector(prev.position, next.position) &&
    prev.yaw === next.yaw &&
    prev.action === next.action &&
    (staticPose || prev.progress === next.progress) &&
    (!compareBall || sameVector(prev.ballPos, next.ballPos)) &&
    prev.hasBat === next.hasBat &&
    prev.isLeftHanded === next.isLeftHanded &&
    prev.heightScale === next.heightScale &&
    prev.batBladeRef === next.batBladeRef &&
    prev.showDebugSkeleton === next.showDebugSkeleton &&
    prev.team === next.team &&
    prev.format === next.format &&
    prev.kitVariant === next.kitVariant &&
    prev.kitRole === next.kitRole &&
    prev.jerseyNumber === next.jerseyNumber &&
    prev.jerseyName === next.jerseyName &&
    prev.updateFps === next.updateFps &&
    prev.trackBall === next.trackBall &&
    prev.castShadow === next.castShadow &&
    prev.smoothMotion === next.smoothMotion &&
    prev.autoLocomotion === next.autoLocomotion &&
    prev.maxSpeed === next.maxSpeed &&
    prev.idleSeed === next.idleSeed
  );
}

export const CharacterInstance = React.memo(CharacterInstanceInner, areCharacterPropsEqual);
export default CharacterInstance;
