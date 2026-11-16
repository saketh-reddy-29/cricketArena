/**
 * Body-collision audit: runs every animation clip through the rig on the real GLB and records the worst
 * clearance (m; < 0 = penetration) for arm-vs-torso, arm-vs-arm, leg-vs-body, leg-vs-leg and bat-vs-body,
 * plus the lowest foot/toe height relative to the standing rest pose.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildCharacterRig } from '../../src/characters/CharacterRig';
import { CRICKET_ARENA_ACTIONS, getCricketArenaPose } from '../../src/lib/cricketArenaAnimations';

async function main() {
  const gltf = await new GLTFLoader().loadAsync('/public/models/cricket-arena/cartoon_sports_character_3d_model.glb');
  const model = buildCharacterRig(gltf.scene as THREE.Group);
  const footIdx = ['Left_Foot', 'Right_Foot', 'Left_Toes', 'Right_Toes'].map((n) => model.description.findIndex((d: any) => d.n === n)).filter((i) => i >= 0);
  const wp = new THREE.Vector3();
  const restMin = Math.min(...footIdx.map((i) => model.description[i].wp[1]));
  const rows: any[] = [];
  for (const action of CRICKET_ARENA_ACTIONS) {
    const state: Record<string, unknown> = {};
    const worst = { armTorso: 1e9, armArm: 1e9, legBody: 1e9, legLeg: 1e9, bat: 1e9, limit: 0, footMin: 1e9, footClamped: 1e9 };
    for (let k = 0; k <= 10; k++) {
      const prog = k / 10;
      const pose = getCricketArenaPose(action, prog, prog * 1.7, false);
      let out: any;
      for (let i = 0; i < 8; i++) out = model.rig.solve(pose, state, 0.033);
      const d = out.dbg;
      worst.armTorso = Math.min(worst.armTorso, d.armTorso);
      worst.armArm = Math.min(worst.armArm, d.armArm);
      worst.legBody = Math.min(worst.legBody, d.legBody);
      worst.legLeg = Math.min(worst.legLeg, d.legLeg);
      worst.bat = Math.min(worst.bat, d.bat);
      worst.limit = Math.max(worst.limit, d.limit);
      // foot height after applying the solved pose
      model.description.forEach((dd: any, i: number) => { if (dd.isBone) model.nodes[dd.si].quaternion.set(out.lq[i * 4], out.lq[i * 4 + 1], out.lq[i * 4 + 2], out.lq[i * 4 + 3]); });
      const hi = model.rig.R.hips;
      model.nodes[model.description[hi].si].position.set(out.hipsLocal[0], out.hipsLocal[1], out.hipsLocal[2]);
      model.scene.updateMatrixWorld(true);
      const lowest = () => { let m = 1e9; for (const i of footIdx) { model.nodes[model.description[i].si].getWorldPosition(wp); model.scene.worldToLocal(wp); m = Math.min(m, wp.y); } return m; };
      model.scene.position.y = 0; model.scene.updateMatrixWorld(true);
      const raw = lowest(); worst.footMin = Math.min(worst.footMin, raw);
      // same clamp as CharacterInstance: lift the model so no foot sinks below the standing floor
      const deficit = restMin - raw; model.scene.position.y = deficit > 0.002 ? deficit : 0; model.scene.updateMatrixWorld(true);
      let after = 1e9; for (const i of footIdx) { model.nodes[model.description[i].si].getWorldPosition(wp); after = Math.min(after, wp.y); }   // parent frame (what the game renders)
      worst.footClamped = Math.min(worst.footClamped, after);
    }
    rows.push({ action, ...Object.fromEntries(Object.entries(worst).map(([k, v]) => [k, k === 'limit' ? v : Math.round((v as number) * 1000) / 1000])) });
  }
  (window as any).__log = JSON.stringify({ restFootMin: Math.round(restMin * 1000) / 1000, rows });
  (window as any).__done = true;
}
main().catch((e) => { (window as any).__err = String((e && e.stack) || e); (window as any).__done = true; });
