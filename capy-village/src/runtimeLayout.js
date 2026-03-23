import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { addCollider, setRuntimeInteractables } from './world.js';
import { computeFootprintCollider, getSharedFootprint } from './footprints.js';

const RUNTIME_ASSET_DEBUG = import.meta.env.DEV;
const DEFAULT_PLAYER_TRANSFORM = Object.freeze({
  position: [0, 0, 2],
  rotation: [0, 180, 0],
});
const WORLD_ROLE_CONFIG = Object.freeze({
  book_statue: {
    id: 'minigame_hub',
    label: 'Wisdom Place',
    prompt: 'Press [E] to Explore Knowledge',
    interactionBuffer: 0.9,
  },
  hat_stand: {
    id: 'capy-store',
    label: 'Boutique',
    prompt: 'Press [E] to Browse Hats',
    interactionBuffer: 0.85,
  },
  melon_stand_2: {
    id: 'watermelon_catch',
    label: 'Watermelon Catch',
    prompt: 'Press [E] to Play Watermelon Catch',
    interactionBuffer: 0.95,
    gameId: 'watermelon_catch',
  },
});
function withBaseUrl(assetPath) {
  const normalized = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
  return `${import.meta.env.BASE_URL}${normalized}`;
}

function getMaterialArray(material) {
  if (!material) {
    return [];
  }
  return Array.isArray(material) ? material : [material];
}

function hasVertexColors(geometry) {
  return !!geometry?.attributes?.color;
}

function ensureGeometryNormals(geometry) {
  const position = geometry?.attributes?.position;
  const normals = geometry?.attributes?.normal;
  const hasValidNormals = !!position && !!normals && normals.count === position.count;

  if (!position) {
    return 'missing-position';
  }

  if (!hasValidNormals) {
    geometry.computeVertexNormals();
    return 'recomputed';
  }

  return 'present';
}

function ensureGeometryBoundingBox(geometry) {
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }

  if (!geometry.boundingBox) {
    return false;
  }

  return Number.isFinite(geometry.boundingBox.min.x)
    && Number.isFinite(geometry.boundingBox.min.y)
    && Number.isFinite(geometry.boundingBox.min.z)
    && Number.isFinite(geometry.boundingBox.max.x)
    && Number.isFinite(geometry.boundingBox.max.y)
    && Number.isFinite(geometry.boundingBox.max.z);
}

function sanitizeMaterial(material, geometry) {
  const useVertexColors = hasVertexColors(geometry);
  const clonedMaterial = material?.isMaterial ? material.clone() : null;

  if (!clonedMaterial) {
    return { material: null, fallbackApplied: false };
  }

  if ('vertexColors' in clonedMaterial) {
    clonedMaterial.vertexColors = useVertexColors;
  }

  clonedMaterial.needsUpdate = true;
  return { material: clonedMaterial, fallbackApplied: false };
}

function sanitizeMeshForRuntime(assetId, mesh, { emitLog = true } = {}) {
  const normalsState = ensureGeometryNormals(mesh.geometry);
  const bboxValid = ensureGeometryBoundingBox(mesh.geometry);
  const useVertexColors = hasVertexColors(mesh.geometry);

  const originalMaterials = getMaterialArray(mesh.material);
  const hadMaterial = originalMaterials.length > 0;
  let fallbackApplied = false;

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((material) => {
      const sanitized = sanitizeMaterial(material, mesh.geometry);
      fallbackApplied ||= sanitized.fallbackApplied;
      return sanitized.material ?? material;
    });
  } else {
    const sanitized = sanitizeMaterial(mesh.material, mesh.geometry);
    fallbackApplied = sanitized.fallbackApplied;
    mesh.material = sanitized.material ?? mesh.material;
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const firstMaterial = getMaterialArray(mesh.material)[0] ?? null;
  const colorHex = firstMaterial?.color ? `#${firstMaterial.color.getHexString()}` : 'n/a';

  if (emitLog) {
    console.info(
      `[Runtime Asset] ${assetId}\n`
        + `mesh: ${mesh.name || '(unnamed)'}\n`
        + `material: ${firstMaterial?.type ?? 'missing'}\n`
        + `materialColor: ${colorHex}\n`
        + `vertexColors: ${useVertexColors}\n`
        + `normals: ${normalsState}\n`
        + `bboxValid: ${bboxValid}\n`
        + `materialMissing: ${!hadMaterial}\n`
        + `fallbackApplied: ${fallbackApplied}`,
    );
  }
}

function clonePublishedScene(scene, assetId) {
  const clone = scene.clone(true);
  clone.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    sanitizeMeshForRuntime(assetId, node, { emitLog: false });
  });
  return clone;
}

function buildObjectMatrix(object) {
  const position = new THREE.Vector3(object.position[0], object.position[1], object.position[2]);
  const rotation = new THREE.Euler(
    THREE.MathUtils.degToRad(object.rotation[0]),
    THREE.MathUtils.degToRad(object.rotation[1]),
    THREE.MathUtils.degToRad(object.rotation[2]),
  );
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = new THREE.Vector3(object.scale[0], object.scale[1], object.scale[2]);
  return new THREE.Matrix4().compose(position, quaternion, scale);
}

function applyObjectTransform(root, object) {
  root.position.set(object.position[0], object.position[1], object.position[2]);
  root.rotation.set(
    THREE.MathUtils.degToRad(object.rotation[0]),
    THREE.MathUtils.degToRad(object.rotation[1]),
    THREE.MathUtils.degToRad(object.rotation[2]),
  );
  root.scale.set(object.scale[0], object.scale[1], object.scale[2]);
}

function isNonBlockingDecor(assetId, size) {
  if (getSharedFootprint(assetId)) {
    return false;
  }

  const nonBlockingPrefixes = ['stones_', 'stem_', 'milk', 'pumpkin', 'cubes_'];
  if (nonBlockingPrefixes.some((prefix) => assetId.startsWith(prefix))) {
    return true;
  }

  return size.y < 0.9 && Math.max(size.x, size.z) < 1.6;
}

function getColliderForObject(root, assetId) {
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  if (isNonBlockingDecor(assetId, size)) {
    return null;
  }
  return computeFootprintCollider(root, assetId);
}

function getSceneSize(root) {
  return new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
}

function getScaledSize(baseSize, scale) {
  return new THREE.Vector3(
    Math.abs(baseSize.x * scale[0]),
    Math.abs(baseSize.y * scale[1]),
    Math.abs(baseSize.z * scale[2]),
  );
}

function getInstancedMeshSources(root) {
  root.updateMatrixWorld(true);
  const meshes = [];
  root.traverse((node) => {
    if (!node.isMesh || node.isSkinnedMesh) {
      return;
    }

    meshes.push({
      geometry: node.geometry,
      material: node.material,
      matrixWorld: node.matrixWorld.clone(),
      castShadow: node.castShadow,
      receiveShadow: node.receiveShadow,
    });
  });
  return meshes;
}

function canInstanceDecorGroup(assetId, templateRoot, objects) {
  if (objects.length <= 1) {
    return false;
  }

  const meshSources = getInstancedMeshSources(templateRoot);
  if (meshSources.length === 0) {
    return false;
  }

  const baseSize = getSceneSize(templateRoot);
  return objects.every((object) => isNonBlockingDecor(assetId, getScaledSize(baseSize, object.scale)));
}

function buildInstancedDecorGroup(assetId, templateRoot, objects) {
  const meshSources = getInstancedMeshSources(templateRoot);
  const instancedGroup = new THREE.Group();
  instancedGroup.name = `${assetId}_instanced_group`;

  const objectMatrix = new THREE.Matrix4();
  const instanceMatrix = new THREE.Matrix4();

  for (const [meshIndex, source] of meshSources.entries()) {
    const material = Array.isArray(source.material)
      ? source.material.map((entry) => entry?.isMaterial ? entry.clone() : entry)
      : source.material?.isMaterial
        ? source.material.clone()
        : source.material;

    const instancedMesh = new THREE.InstancedMesh(source.geometry, material, objects.length);
    instancedMesh.name = `${assetId}_instanced_${meshIndex}`;
    instancedMesh.castShadow = source.castShadow;
    instancedMesh.receiveShadow = source.receiveShadow;
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (const [index, object] of objects.entries()) {
      objectMatrix.copy(buildObjectMatrix(object));
      instanceMatrix.multiplyMatrices(objectMatrix, source.matrixWorld);
      instancedMesh.setMatrixAt(index, instanceMatrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.computeBoundingSphere) {
      instancedMesh.computeBoundingSphere();
    }
    if (instancedMesh.computeBoundingBox) {
      instancedMesh.computeBoundingBox();
    }
    instancedGroup.add(instancedMesh);
  }

  console.info(`[Runtime Asset] ${assetId}\ninstanced: true\ncount: ${objects.length}`);
  return instancedGroup;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }
  return await response.json();
}

export async function loadPublishedVillage(scene) {
  try {
    const [layout, manifest] = await Promise.all([
      fetchJson(withBaseUrl('/layouts/village_hub_v1.json')),
      fetchJson(withBaseUrl('/assets/manifest.json')),
    ]);

    const loader = new GLTFLoader();
    const templateCache = new Map();
    const villageGroup = new THREE.Group();
    const colliders = [];
    const objectsByAssetId = new Map();
    const runtimeInteractables = [];

    for (const object of layout.objects ?? []) {
      if (!objectsByAssetId.has(object.assetId)) {
        objectsByAssetId.set(object.assetId, []);
      }
      objectsByAssetId.get(object.assetId).push(object);
    }

    for (const [assetId, objects] of objectsByAssetId.entries()) {
      const assetPath = manifest[assetId];
      if (!assetPath) {
        throw new Error(`Asset "${assetId}" is missing from the published manifest.`);
      }

      if (!templateCache.has(assetId)) {
        const gltf = await loader.loadAsync(withBaseUrl(assetPath));
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            sanitizeMeshForRuntime(assetId, node, { emitLog: RUNTIME_ASSET_DEBUG });
          }
        });
        templateCache.set(assetId, gltf.scene);
      }

      const template = templateCache.get(assetId);

      if (canInstanceDecorGroup(assetId, template, objects)) {
        villageGroup.add(buildInstancedDecorGroup(assetId, template, objects));
        continue;
      }

      for (const object of objects) {
        const instance = clonePublishedScene(template, assetId);
        applyObjectTransform(instance, object);
        villageGroup.add(instance);
        const collider = getColliderForObject(instance, assetId);

        const worldRole = WORLD_ROLE_CONFIG[assetId];
        if (worldRole) {
          runtimeInteractables.push({
            ...worldRole,
            object: instance,
            feedbackObject: instance,
            radius: collider?.type === 'circle'
              ? collider.radius + (worldRole.interactionBuffer ?? 0.8)
              : Math.max(collider?.width ?? 0, collider?.depth ?? 0) / 2 + (worldRole.interactionBuffer ?? 0.8),
          });
        }

        if (collider) {
          colliders.push(collider);
        }
      }
    }

    scene.add(villageGroup);
    setRuntimeInteractables(runtimeInteractables);
    for (const collider of colliders) {
      addCollider(collider);
    }

    return {
      success: true,
      player: layout.player ?? DEFAULT_PLAYER_TRANSFORM,
    };
  } catch (error) {
    setRuntimeInteractables([]);
    console.warn('[Layout] Falling back to prototype village:', error);
    return {
      success: false,
      player: DEFAULT_PLAYER_TRANSFORM,
    };
  }
}
