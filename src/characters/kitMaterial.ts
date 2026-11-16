/**
 * Team-kit application for the supplied GLB players.
 *
 * Ported from the Cricket Arena prototype (colors.js + index.html):
 *  - every skinned vertex is tagged with a clothing ZONE (jersey / sleeves / collar / pants /
 *    legs-pads / shoes / gloves) from its rest position and the bone group that drives it;
 *  - a small shader patch recolours texels of the ORIGINAL texture inside each zone, so the
 *    stitching, shading and UVs of the supplied model are kept and skin / hair / face are
 *    never touched;
 *  - every character gets its OWN cloned materials, so one team's kit never leaks to another;
 *  - helmet + grille gear and the bat colours are separate per-character objects.
 *
 * Nothing here edits the GLB, its skeleton, weights or proportions.
 */
import * as THREE from 'three';
import '../lib/cricketArenaColors.js';
import type { CricketRigModel } from './CharacterRig';
import { applyRole, KitFormat, KitRole, KitSlots, KitVariant, resolveKit } from './teamKits';

/* eslint-disable @typescript-eslint/no-explicit-any */
type CAColorsApi = any;
type CARigApi = any;

const getCC = (): CAColorsApi | null => ((globalThis as any).CAColors as CAColorsApi) ?? null;
const getRig = (): CARigApi | null => ((globalThis as any).CARig as CARigApi) ?? null;

export type BatPart = 'batHandle' | 'batGrip' | 'batBlade';

export interface KitCharacter {
  model: CricketRigModel;
  /** Shared uniform array (9 vec4, one per shader slot) read by this character's materials */
  uniforms: THREE.Vector4[];
  /** true when the model could be zoned and its materials were swapped to the kit shader */
  zoned: boolean;
  helm: THREE.Group | null;
  helmetMat: THREE.MeshStandardMaterial | null;
  grilleMat: THREE.MeshStandardMaterial | null;
  /** Wide-brim official hat, shown only for the umpire role. */
  umpireHat: THREE.Group | null;
  hair: THREE.Object3D[];
  bat: Partial<Record<BatPart, THREE.MeshStandardMaterial[]>>;
  kitMaterials: THREE.Material[];
  /** Back-of-shirt number/name decal (hidden until a number is set) */
  decal: THREE.Mesh | null;
  decalCanvas: HTMLCanvasElement | null;
}

const hexRGB = (h: string): [number, number, number] => {
  const n = parseInt(String(h).replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Tag every skinned vertex with its clothing zone (idempotent; geometry is shared between clones). */
export function tagKitZones(model: CricketRigModel): boolean {
  const CC = getCC();
  const RIG = getRig();
  if (!CC || !RIG) return false;
  const mz = CC.measures(model.description, RIG.roleOf);
  if (!mz) return false;

  model.scene.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const g = mesh.geometry;
    const P = g.attributes.position;
    const si = g.attributes.skinIndex;
    const sw = g.attributes.skinWeight;
    if (!P) return;
    const n = P.count;

    if (!g.attributes.caZa || !g.attributes.caZb) {
      const za = new Float32Array(n * 4);
      const zb = new Float32Array(n * 4);
      let hair = false;
      let backZ = Infinity;
      let jerseyY0 = Infinity;
      let jerseyY1 = -Infinity;
      if (si && sw) {
        const groups = mesh.skeleton.bones.map((b) => CC.groupOf(b.name));
        let headVerts = 0;
        let headY = 0;
        let headZ = 0;
        const pt = [0, 0, 0];
        const wv = new THREE.Vector3();
        // Classify by the REAL rest-pose position (skinned, then to model space) - the same space the
        // bone measurements live in. The raw geometry is in the exporter's own orientation/offset.
        mesh.updateMatrixWorld(true);
        mesh.skeleton.update();
        const idx = [0, 0, 0, 0];
        const wgt = [0, 0, 0, 0];
        for (let i = 0; i < n; i++) {
          idx[0] = si.getX(i); idx[1] = si.getY(i); idx[2] = si.getZ(i); idx[3] = si.getW(i);
          wgt[0] = sw.getX(i); wgt[1] = sw.getY(i); wgt[2] = sw.getZ(i); wgt[3] = sw.getW(i);
          const acc: Record<string, number> = {};
          for (let k = 0; k < 4; k++) {
            const grp = groups[idx[k]];
            acc[grp] = (acc[grp] || 0) + wgt[k];
          }
          let best = 'body';
          let bw = -1;
          for (const k in acc) if (acc[k] > bw) { bw = acc[k]; best = k; }
          mesh.getVertexPosition(i, wv);
          wv.applyMatrix4(mesh.matrixWorld);
          if (best === 'head') { headVerts++; headY += wv.y; headZ += wv.z; }
          pt[0] = wv.x; pt[1] = wv.y; pt[2] = wv.z;
          const z = CC.zoneOf(pt, best, mz);
          if (z === 1 && Math.abs(wv.x) < 0.09 && wv.y > mz.hemY + 0.04 && wv.y < mz.collarY - 0.02) {
            if (wv.z < backZ) backZ = wv.z;
            if (wv.y < jerseyY0) jerseyY0 = wv.y;
            if (wv.y > jerseyY1) jerseyY1 = wv.y;
          }
          if (z > 0) (z <= 4 ? za : zb)[i * 4 + (z <= 4 ? z - 1 : z - 5)] = 1;
        }
        if (headVerts > 0.8 * n) {
          headY /= headVerts;
          headZ /= headVerts;
          hair = headY >= 0.83 || (headZ <= 0 && headY >= 0.74);
        }
      }
      g.setAttribute('caZa', new THREE.BufferAttribute(za, 4));
      g.setAttribute('caZb', new THREE.BufferAttribute(zb, 4));
      g.userData.caHair = hair;
      g.userData.caBack = Number.isFinite(backZ) ? { z: backZ, y0: jerseyY0, y1: jerseyY1 } : null;
    }
    if (g.userData.caHair) mesh.userData.hair = 1;
  });
  return true;
}

function makeKitMaterial(old: THREE.Material, uniforms: THREE.Vector4[]): THREE.Material {
  const CC = getCC();
  const m = old.clone() as THREE.MeshStandardMaterial;
  if ('roughness' in m) m.roughness = 0.7;
  if ('metalness' in m) m.metalness = 0;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uCa = { value: uniforms };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${CC.GLSL_VERT_DECL}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvZa = caZa; vZb = caZb;');
    // The zone thresholds were tuned on sRGB texels: recolour in sRGB, then return to linear.
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${CC.GLSL_FRAG_DECL}`)
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec3 caS = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
          caS = caRecolor(caS);
          diffuseColor.rgb = pow(caS, vec3(2.2));
        }`
      );
  };
  m.customProgramCacheKey = () => 'caRecolor';
  m.needsUpdate = true;
  return m;
}

function buildGearMesh(g: { p: number[]; i: number[] }, mat: THREE.Material, headPos: THREE.Vector3, invQ: THREE.Quaternion): THREE.Mesh {
  const n = g.p.length / 3;
  const P = new Float32Array(g.p.length);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.set(g.p[i * 3], g.p[i * 3 + 1], g.p[i * 3 + 2]).sub(headPos).applyQuaternion(invQ);
    P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  // The gear builders emit some quads with both windings; keep one triangle per vertex set so
  // computed normals do not cancel out (the material is double-sided anyway).
  const seen = new Set<string>();
  const idx: number[] = [];
  for (let t = 0; t < g.i.length; t += 3) {
    const tri = [g.i[t], g.i[t + 1], g.i[t + 2]];
    const key = [...tri].sort((a, b) => a - b).join('_');
    if (seen.has(key)) continue;
    seen.add(key);
    idx.push(tri[0], tri[1], tri[2]);
  }
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  return mesh;
}

/**
 * Create the per-character kit state: zone-tag the model, swap in this character's own kit
 * materials, and attach the helmet gear to the head bone (hidden until a kit asks for it).
 */
export function createKitCharacter(model: CricketRigModel, batParts?: Partial<Record<BatPart, THREE.Mesh[]>>): KitCharacter {
  const CC = getCC();
  const RIG = getRig();
  const kc: KitCharacter = {
    model,
    uniforms: Array.from({ length: 9 }, () => new THREE.Vector4(0, 0, 0, 0)),
    zoned: false,
    helm: null,
    helmetMat: null,
    grilleMat: null,
    umpireHat: null,
    hair: [],
    bat: {},
    kitMaterials: [],
    decal: null,
    decalCanvas: null,
  };

  if (CC && RIG) {
    kc.zoned = tagKitZones(model);
  }

  if (kc.zoned) {
    model.scene.traverse((obj) => {
      const mesh = obj as THREE.SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      if (mesh.userData?.hair) kc.hair.push(mesh);
      const swap = (mt: THREE.Material) => {
        const nm = makeKitMaterial(mt, kc.uniforms);
        kc.kitMaterials.push(nm);
        return nm;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });

    // Helmet + grille, fitted to the model's own head bone
    const headIdx = model.rig.R.head;
    if (headIdx !== undefined) {
      const headDesc = model.description[headIdx];
      const headNode = model.nodes[headDesc.si];
      const invQ = new THREE.Quaternion().fromArray(headDesc.wq).invert();
      const headPos = new THREE.Vector3().fromArray(headDesc.wp);
      kc.helmetMat = new THREE.MeshStandardMaterial({ color: 0x1e56c8, roughness: 0.45, metalness: 0.1, side: THREE.DoubleSide });
      kc.grilleMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide });
      const hc = [-0.01, 0.775, -0.005];
      const hr = [0.162, 0.168, 0.152];
      const gc = [-0.01, 0.79, -0.005];
      const gr = [0.19, 0.175, 0.18];
      const helm = new THREE.Group();
      helm.add(buildGearMesh(CC.gear.helmetShell(hc, hr), kc.helmetMat, headPos, invQ));
      helm.add(buildGearMesh(CC.gear.helmetGrille(gc, gr), kc.grilleMat, headPos, invQ));
      helm.visible = false;
      headNode.add(helm);
      kc.helm = helm;

      // A separate, light-weight wide-brim official hat. It is attached to the
      // same head bone as the batter helmet and is toggled by the kit role.
      const umpireHat = new THREE.Group();
      const hatMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.78 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x172033, roughness: 0.58 });
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.018, 32), hatMat);
      brim.position.y = 0.155;
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.112, 0.13, 24), hatMat);
      crown.position.y = 0.22;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.113, 0.113, 0.025, 24), bandMat);
      band.position.y = 0.188;
      umpireHat.add(brim, crown, band);
      umpireHat.visible = false;
      umpireHat.traverse((part) => {
        if ((part as THREE.Mesh).isMesh) {
          (part as THREE.Mesh).castShadow = true;
          (part as THREE.Mesh).receiveShadow = true;
        }
      });
      headNode.add(umpireHat);
      kc.umpireHat = umpireHat;
    }

    // Back-of-shirt number + name decal, attached to the chest bone
    let back: { z: number; y0: number; y1: number } | null = null;
    model.scene.traverse((obj) => {
      const g = (obj as THREE.SkinnedMesh).geometry as THREE.BufferGeometry | undefined;
      const b = g?.userData?.caBack as { z: number; y0: number; y1: number } | null | undefined;
      if (b && (!back || b.z < back.z)) back = { ...b };
    });
    const chestIdx = model.rig.R.chest ?? model.rig.R.spine;
    if (back && chestIdx !== undefined) {
      const bk = back as { z: number; y0: number; y1: number };
      const d = model.description[chestIdx];
      const node = model.nodes[d.si];
      const invQ = new THREE.Quaternion().fromArray(d.wq).invert();
      const wpos = new THREE.Vector3(0, (bk.y0 + bk.y1) / 2 + 0.01, bk.z - 0.006);
      const local = wpos.sub(new THREE.Vector3().fromArray(d.wp)).applyQuaternion(invQ);
      const cv = document.createElement('canvas');
      cv.width = 256; cv.height = 256;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, toneMapped: false });
      const size = Math.min(0.2, (bk.y1 - bk.y0) * 0.95);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
      mesh.position.copy(local);
      mesh.quaternion.copy(invQ).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
      mesh.visible = false;
      mesh.frustumCulled = false;
      node.add(mesh);
      kc.decal = mesh;
      kc.decalCanvas = cv;
    }
  }

  if (batParts) {
    (Object.keys(batParts) as BatPart[]).forEach((k) => {
      kc.bat[k] = (batParts[k] ?? []).map((mesh) => {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mesh.material = mat;
        return mat;
      });
    });
  }
  return kc;
}

export interface ApplyKitOptions {
  /** shirt number + surname printed on the back */
  number?: number;
  name?: string;
  /** show the helmet (and hide the hair that would poke through the shell) */
  helmet?: boolean;
  /** show the wide-brim official hat and keep hair clear of its brim */
  umpire?: boolean;
}

function paintDecal(kc: KitCharacter, jerseyHex: string, trimHex: string, num: number, name: string) {
  if (!kc.decal || !kc.decalCanvas) return;
  const cv = kc.decalCanvas;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, 256, 256);
  const lum = (h: string) => { const [r, gg, b] = hexRGB(h); return 0.299 * r + 0.587 * gg + 0.114 * b; };
  // text colour: the trim colour if it contrasts with the shirt, otherwise white / near-black
  let txt = trimHex;
  if (Math.abs(lum(trimHex) - lum(jerseyHex)) < 0.35) txt = lum(jerseyHex) > 0.5 ? '#101828' : '#ffffff';
  g.textAlign = 'center'; g.fillStyle = txt;
  g.strokeStyle = lum(txt) > 0.5 ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'; g.lineWidth = 6; g.lineJoin = 'round';
  if (name) {
    g.font = '900 60px Arial Black, Impact, Arial, sans-serif';
    g.strokeText(name, 128, 66, 236); g.fillText(name, 128, 66, 236);
  }
  g.font = '900 160px Arial Black, Impact, Arial, sans-serif';
  g.strokeText(String(num), 128, 218); g.fillText(String(num), 128, 218);
  const mat = kc.decal.material as THREE.MeshBasicMaterial;
  if (mat.map) mat.map.needsUpdate = true;
  kc.decal.visible = true;
}

/** Push a full set of slot colours into a character. Skin, hair and face are never recoloured. */
export function applyKitSlots(kc: KitCharacter, slots: Partial<KitSlots>, opts: ApplyKitOptions = {}): void {
  const CC = getCC();
  if (CC) {
    (CC.SHADER_SLOTS as string[]).forEach((name, i) => {
      const v = (slots as Record<string, string | undefined>)[name];
      if (v) {
        const [r, g, b] = hexRGB(v);
        kc.uniforms[i].set(r, g, b, 1);
      } else {
        kc.uniforms[i].set(0, 0, 0, 0);
      }
    });
  }
  if (kc.helmetMat && slots.helmet) kc.helmetMat.color.set(slots.helmet);
  if (kc.grilleMat && slots.grille) kc.grilleMat.color.set(slots.grille);
  if (kc.decal) {
    if (opts.number !== undefined) paintDecal(kc, slots.jersey ?? '#ffffff', slots.accent ?? '#ffffff', opts.number, opts.name ?? '');
    else kc.decal.visible = false;
  }
  const showHelmet = Boolean(opts.helmet);
  const showUmpireHat = Boolean(opts.umpire);
  if (kc.helm) kc.helm.visible = showHelmet;
  if (kc.umpireHat) kc.umpireHat.visible = showUmpireHat;
  kc.hair.forEach((h) => { h.visible = !showHelmet && !showUmpireHat; });
  (['batHandle', 'batGrip', 'batBlade'] as BatPart[]).forEach((k) => {
    const v = slots[k];
    if (v) (kc.bat[k] ?? []).forEach((mat) => mat.color.set(v));
  });
}

/**
 * applyTeamKit(character, country, format, kitVariant)
 * Resolves the correct uniform for country + format + variant and applies it to the
 * character's clothing zones only.
 */
export function applyTeamKit(
  character: KitCharacter,
  country: string,
  format: KitFormat | string | undefined,
  kitVariant: KitVariant = 'home',
  role: KitRole = 'fielder',
  hasPadsModel = false,
  print?: { number?: number; name?: string }
) {
  const kit = resolveKit(country, format, kitVariant);
  const { slots, helmet } = applyRole(kit, role, hasPadsModel);
  applyKitSlots(character, slots, { helmet, umpire: role === 'umpire', number: print?.number, name: print?.name });
  return kit;
}
