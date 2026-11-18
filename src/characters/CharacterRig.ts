import * as THREE from 'three';
import { clone as cloneSkinnedModel } from 'three/addons/utils/SkeletonUtils.js';
import '../lib/cricketArenaRig.js';
import { CricketArenaPose } from '../lib/cricketArenaAnimations';

export interface RigBoneDescription {
  n: string;
  si: number;
  isBone: boolean;
  p: number;
  lp: number[];
  lq: number[];
  wp: number[];
  wq: number[];
}

export interface RigResult {
  lq: Float32Array;
  hipsLocal: number[];
  palmL: number[];
  palmR: number[];
  wristL: number[];
  wristR: number[];
  elbowL: number[];
  elbowR: number[];
  shoulderL: number[];
  shoulderR: number[];
  ankleL: number[];
  ankleR: number[];
  kneeL: number[];
  kneeR: number[];
  ba: number;
  caps?: {
    body: Array<{ a: number[]; b: number[]; r: number; n: string }>;
    RAD: Record<string, number>;
  };
  dbg?: {
    armTorso: number;
    armArm: number;
    legLeg: number;
    legBody: number;
    bat: number;
    limit: number;
  };
}

export interface CricketRigModel {
  scene: THREE.Group;
  nodes: THREE.Object3D[];
  description: RigBoneDescription[];
  rig: {
    S: number;
    R: Record<string, number>;
    solve: (pose: CricketArenaPose, state: Record<string, unknown>, delta: number) => RigResult;
  };
}

interface CharacterRigBlueprint {
  description: RigBoneDescription[];
  rig: CricketRigModel['rig'];
}

// GLTFLoader caches the source scene by URL. Rest-pose measurements and the solver
// are identical between players, so compute the blueprint once and clone only the
// independently animated skinned scene for each character.
function isHeadDominantMesh(mesh: THREE.SkinnedMesh): boolean {
  const meshName = (mesh.name || '').toLowerCase();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const materialNames = materials.map((material) => (material.name || '').toLowerCase()).join(' ');
  if (/(hair|eyebrow|eyelash|eye|helmet|grille)/.test(meshName) || /(hair|eyebrow|eyelash|eye|helmet|grille)/.test(materialNames)) return false;
  if (/(head|face|skin)/.test(meshName) || /(head|face|skin)/.test(materialNames)) return true;
  const names = mesh.skeleton.bones.map((bone) => (bone.name || '').toLowerCase());
  const headIndexes = new Set<number>();
  names.forEach((name, index) => { if (name.includes('head') || name.includes('face')) headIndexes.add(index); });
  if (!headIndexes.size) return false;
  const skinIndex = mesh.geometry.attributes.skinIndex;
  const skinWeight = mesh.geometry.attributes.skinWeight;
  if (!skinIndex || !skinWeight) return false;
  let totalWeight = 0;
  let headWeight = 0;
  for (let i = 0; i < skinIndex.count; i++) {
    const indexes = [skinIndex.getX(i), skinIndex.getY(i), skinIndex.getZ(i), skinIndex.getW(i)];
    const weights = [skinWeight.getX(i), skinWeight.getY(i), skinWeight.getZ(i), skinWeight.getW(i)];
    for (let j = 0; j < 4; j++) {
      totalWeight += weights[j];
      if (headIndexes.has(indexes[j])) headWeight += weights[j];
    }
  }
  return totalWeight > 0 && headWeight / totalWeight >= 0.58;
}

function makeHeadMaterialsOpaque(mesh: THREE.SkinnedMesh): void {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.forEach((material) => {
    const name = (material.name || '').toLowerCase();
    if (/(hair|eyebrow|eyelash|eye|helmet|grille)/.test(name)) return;
    material.transparent = false;
    material.opacity = 1;
    material.alphaTest = 0;
    material.depthWrite = true;
    material.depthTest = true;
    material.blending = THREE.NormalBlending;
    material.needsUpdate = true;
  });
}
const rigBlueprints = new WeakMap<THREE.Group, CharacterRigBlueprint>();

export function buildCharacterRig(sourceScene: THREE.Group): CricketRigModel {
  const cloned = cloneSkinnedModel(sourceScene) as THREE.Group;
  const allNodes: THREE.Object3D[] = [];
  cloned.traverse((node) => allNodes.push(node));

  let blueprint = rigBlueprints.get(sourceScene);
  if (!blueprint) {
    cloned.updateMatrixWorld(true);
    const keep = new Set<THREE.Object3D>();
  allNodes.forEach((node) => {
    if (node.type === 'Bone') {
      for (let parent: THREE.Object3D | null = node; parent; parent = parent.parent) {
        keep.add(parent);
      }
    }
  });

    const rigNodes = allNodes.filter((node) => keep.has(node));
    const nodeIndexes = new Map(rigNodes.map((node, index) => [node, index]));
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const bones: RigBoneDescription[] = rigNodes.map((node) => {
      node.matrixWorld.decompose(pos, quat, scale);
      return {
        n: node.name || 'node',
        si: allNodes.indexOf(node),
        isBone: node.type === 'Bone',
        p: node.parent ? (nodeIndexes.get(node.parent) ?? -1) : -1,
        lp: node.position.toArray(),
        lq: node.quaternion.toArray(),
        wp: pos.toArray(),
        wq: quat.toArray(),
      };
    });

    let ground = 0;
    try {
      ground = new THREE.Box3().setFromObject(cloned).min.y;
    } catch {
      ground = 0;
    }

    const api = (window as unknown as { CARig?: { build: (d: { bones: RigBoneDescription[]; ground: number }) => CricketRigModel['rig'] } }).CARig;
    if (!api) {
      throw new Error('CARig system is not available in global window context.');
    }

    blueprint = { description: bones, rig: api.build({ bones, ground }) };
    rigBlueprints.set(sourceScene, blueprint);
  }

  // Apply render flags to each independent clone. Geometry remains shared by GLTF.
  cloned.traverse((child) => {
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      const mesh = child as THREE.SkinnedMesh;
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.material) {
        const headDominant = isHeadDominantMesh(mesh);
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          if ('roughness' in material) (material as THREE.MeshStandardMaterial).roughness = 0.7;
        });
        if (headDominant) makeHeadMaterialsOpaque(mesh);
      }
    }
  });

  return {
    scene: cloned,
    nodes: allNodes,
    description: blueprint.description,
    rig: blueprint.rig,
  };
}

export default buildCharacterRig;
