/**
 * Offline kit preview: renders the supplied GLB players in every country kit and format
 * using the exact same code path as the game (buildCharacterRig -> createKitCharacter -> applyTeamKit).
 * Used by tools/kit-preview/run.mjs to produce screenshots for visual verification.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildCharacterRig } from '../../src/characters/CharacterRig';
import { applyKitSlots, applyTeamKit, createKitCharacter } from '../../src/characters/kitMaterial';
import { COUNTRY_KITS } from '../../src/characters/teamKits';
import { getCricketArenaPose } from '../../src/lib/cricketArenaAnimations';

const params = new URLSearchParams(location.search);
const formats = (params.get('formats') || 'ODI,T20,TEST').split(',');
const teams = params.get('teams') ? params.get('teams')!.split(',') : COUNTRY_KITS.slice(0, 14).map((k) => k.name);
const variant = (params.get('variant') || 'home') as 'home' | 'away';
const role = (params.get('role') || 'batter') as 'batter' | 'keeper' | 'fielder';
const modelKey = params.get('model') || 'sports';
const action = (params.get('action') || 'ready') as any;
const kitOff = params.get('kit') === 'off';

const URLS: Record<string, string> = {
  sports: '/public/models/cricket-arena/cartoon_sports_character_3d_model.glb',
  plain: '/public/models/cricket-arena/cartoon_character_3d_model.glb',
};

async function main() {
  const gltf = await new GLTFLoader().loadAsync(URLS[modelKey]);
  const W = parseInt(params.get('w') || '2000'), H = parseInt(params.get('h') || String(Math.max(500, 330 * formats.length + 40)));
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H);
  renderer.setClearColor(0x1b2433);
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 4, 5);
  scene.add(sun);

  const sx = 1.25, sy = 2.1;
  const log: string[] = [];
  formats.forEach((fmt, row) => {
    teams.forEach((team, col) => {
      const model = buildCharacterRig(gltf.scene as THREE.Group);
      const kit = createKitCharacter(model);
      if (params.get('debug') === 'zones') {
        applyKitSlots(kit, { jersey: '#ff0000', sleeves: '#00ff00', collar: '#0000ff', pants: '#ffff00', socks: '#ff00ff', shoes: '#00ffff', accent: '#ffffff', gloves: '#ff8800', pads: '#888888', helmet: '#222222' }, { helmet: true });
        if (col === 0 && row === 0) {
          const CCg = (globalThis as any).CAColors, RIGg = (globalThis as any).CARig;
          log.length = 0;
          log.push('measures ' + JSON.stringify(CCg.measures(model.description, RIGg.roleOf)));
          const hips = model.description[model.rig.R.hips];
          const head = model.description[model.rig.R.head];
          log.push('hips.wp ' + JSON.stringify(hips.wp) + ' head.wp ' + JSON.stringify(head.wp) + ' S=' + model.rig.S);
          let mn = 1e9, mx = -1e9, cnt = 0;
          model.scene.traverse((o: any) => { if (o.isSkinnedMesh) { const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) { mn = Math.min(mn, P.getY(i)); mx = Math.max(mx, P.getY(i)); } cnt++; if (cnt === 1) log.push('mesh0 matrixWorld.elements[0,5,10]=' + [o.matrixWorld.elements[0], o.matrixWorld.elements[5], o.matrixWorld.elements[10]].join(',') + ' bindMatrix[5]=' + o.bindMatrix.elements[5]); } });
          log.push('geom Y range ' + mn.toFixed(3) + ' .. ' + mx.toFixed(3));
          const za = new Map<number, number>();
          model.scene.traverse((o: any) => { if (o.isSkinnedMesh) { const a = o.geometry.attributes.caZa, b = o.geometry.attributes.caZb; for (let i = 0; i < a.count; i++) { let z = 0; for (let k = 0; k < 4; k++) { if (a.array[i * 4 + k] > 0) z = k + 1; if (b.array[i * 4 + k] > 0) z = k + 5; } za.set(z, (za.get(z) || 0) + 1); } } });
          log.push('zone histogram ' + JSON.stringify([...za.entries()]));
        }
      } else if (!kitOff) applyTeamKit(kit, team, fmt, variant, role, modelKey === 'sports', { number: 7 + ((col * 17 + row * 5) % 90), name: team.split(' ').pop()!.toUpperCase().slice(0, 9) });
      log.push(`${team}|${fmt}|zoned=${kit.zoned}`);
      const actCol = params.get('actions') ? params.get('actions')!.split(',')[col % params.get('actions')!.split(',').length] : action;
      const pose = getCricketArenaPose(actCol as any, parseFloat(params.get('prog') || '0.5'), 0.9, false);
      const state: Record<string, unknown> = {};
      let out: any;
      for (let i = 0; i < 20; i++) out = model.rig.solve(pose, state, 0.033);
      model.description.forEach((d, i) => {
        if (d.isBone) model.nodes[d.si].quaternion.set(out.lq[i * 4], out.lq[i * 4 + 1], out.lq[i * 4 + 2], out.lq[i * 4 + 3]);
      });
      const hi = model.rig.R.hips;
      if (hi !== undefined) model.nodes[model.description[hi].si].position.set(out.hipsLocal[0], out.hipsLocal[1], out.hipsLocal[2]);
      const root = new THREE.Group();
      const wrap = new THREE.Group();
      wrap.scale.setScalar(model.rig.S);
      wrap.rotation.y = Math.PI / 2 - (pose.yw || 0) * Math.PI / 2;
      root.rotation.y = -Math.PI / 2 + (pose.yw || 0) * Math.PI / 2;
      wrap.add(model.scene);
      root.add(wrap);
      if (params.get('back') === '1' || (params.get('back') === '2' && row % 2 === 1)) root.rotation.y += Math.PI;
      root.position.set((col - (teams.length - 1) / 2) * sx, -row * sy, 0);
      scene.add(root);
    });
  });
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  const span = Math.max((teams.length - 1) * sx + 1.6, (formats.length - 1) * sy + 2.2);
  const dist = (span / 2) / Math.tan((cam.fov * Math.PI) / 360) * Math.max(1, (W / H) > 1 ? 0.82 : 1.1);
  const zf = parseFloat(params.get('zoom') || '1');
  cam.position.set(0, -(formats.length - 1) * sy / 2 + 0.9, Math.max(dist / zf, 3));
  cam.lookAt(0, -(formats.length - 1) * sy / 2 + 0.9, 0);
  scene.updateMatrixWorld(true);
  renderer.render(scene, cam);
  (window as any).__log = log;
  (window as any).__done = true;
}
main().catch((e) => { (window as any).__err = String(e && e.stack || e); (window as any).__done = true; });
