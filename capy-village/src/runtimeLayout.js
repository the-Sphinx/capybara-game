import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { addCollider } from './world.js';

const DEFAULT_PLAYER_TRANSFORM = Object.freeze({
  position: [0, 0, 2],
  rotation: [0, 180, 0],
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
  const nonBlockingPrefixes = ['stones_', 'stem_', 'milk', 'pumpkin', 'cubes_'];
  if (nonBlockingPrefixes.some((prefix) => assetId.startsWith(prefix))) {
    return true;
  }

  return size.y < 0.9 && Math.max(size.x, size.z) < 1.6;
}

function getColliderForObject(root, assetId) {
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  if (isNonBlockingDecor(assetId, size)) {
    return null;
  }

  if (size.x > 0.01 && size.z > 0.01) {
    return {
      x: center.x,
      z: center.z,
      hw: size.x / 2 + 0.15,
      hd: size.z / 2 + 0.15,
    };
  }
  return null;
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

    for (const object of layout.objects ?? []) {
      const assetPath = manifest[object.assetId];
      if (!assetPath) {
        throw new Error(`Asset "${object.assetId}" is missing from the published manifest.`);
      }

      if (!templateCache.has(object.assetId)) {
        const gltf = await loader.loadAsync(withBaseUrl(assetPath));
        gltf.scene.traverse((node) => {
          if (node.isMesh) {
            sanitizeMeshForRuntime(object.assetId, node);
          }
        });
        templateCache.set(object.assetId, gltf.scene);
      }

      const instance = clonePublishedScene(templateCache.get(object.assetId), object.assetId);
      applyObjectTransform(instance, object);
      villageGroup.add(instance);
      const collider = getColliderForObject(instance, object.assetId);
      if (collider) {
        colliders.push(collider);
      }
    }

    scene.add(villageGroup);
    for (const collider of colliders) {
      addCollider(collider.x, collider.z, collider.hw, collider.hd);
    }

    return {
      success: true,
      player: layout.player ?? DEFAULT_PLAYER_TRANSFORM,
    };
  } catch (error) {
    console.warn('[Layout] Falling back to prototype village:', error);
    return {
      success: false,
      player: DEFAULT_PLAYER_TRANSFORM,
    };
  }
}
