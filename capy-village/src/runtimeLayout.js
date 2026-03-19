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

function clonePublishedScene(scene) {
  const clone = scene.clone(true);
  clone.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    node.castShadow = true;
    node.receiveShadow = true;
    node.material = Array.isArray(node.material)
      ? node.material.map((material) => material.clone())
      : node.material.clone();
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

function getColliderForObject(root) {
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
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
        templateCache.set(object.assetId, gltf.scene);
      }

      const instance = clonePublishedScene(templateCache.get(object.assetId));
      applyObjectTransform(instance, object);
      villageGroup.add(instance);
      const collider = getColliderForObject(instance);
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
