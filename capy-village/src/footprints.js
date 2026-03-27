import * as THREE from 'three';
import sharedFootprintConfig from './config/collider_footprints.json';

function cloneFootprint(footprint) {
  if (!footprint) {
    return null;
  }

  return { ...footprint };
}

function finiteOrDefault(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeFootprint(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const type = raw.type === 'circle' || raw.type === 'rect' ? raw.type : null;
  if (!type) {
    return null;
  }

  const base = {
    type,
    offsetX: finiteOrDefault(raw.offsetX, 0),
    offsetZ: finiteOrDefault(raw.offsetZ, 0),
    rotationOffset: finiteOrDefault(raw.rotationOffset, 0),
  };

  if (type === 'circle') {
    if (!Number.isFinite(raw.radius) || raw.radius <= 0) {
      return null;
    }

    return {
      ...base,
      radius: raw.radius,
    };
  }

  if (!Number.isFinite(raw.width) || raw.width <= 0 || !Number.isFinite(raw.depth) || raw.depth <= 0) {
    return null;
  }

  return {
    ...base,
    width: raw.width,
    depth: raw.depth,
  };
}

export function createFootprintRegistry(source = sharedFootprintConfig) {
  const registry = {};
  for (const [assetId, footprint] of Object.entries(source ?? {})) {
    const normalized = normalizeFootprint(cloneFootprint(footprint));
    if (normalized) {
      registry[assetId] = normalized;
    }
  }
  return registry;
}

export function serializeFootprintRegistry(registry) {
  const sorted = {};
  for (const assetId of Object.keys(registry).sort()) {
    const footprint = normalizeFootprint(registry[assetId]);
    if (footprint) {
      sorted[assetId] = footprint;
    }
  }
  return sorted;
}

export function getSharedFootprint(assetId, registry = sharedFootprintConfig) {
  return normalizeFootprint(cloneFootprint(registry?.[assetId]));
}

function getWorldYaw(root) {
  const quaternion = new THREE.Quaternion();
  root.getWorldQuaternion(quaternion);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
  return Math.atan2(forward.x, forward.z);
}

function getScaledLocalOffset(root, footprint) {
  const worldScale = new THREE.Vector3();
  root.getWorldScale(worldScale);
  return new THREE.Vector3(
    footprint.offsetX * Math.abs(worldScale.x),
    0,
    footprint.offsetZ * Math.abs(worldScale.z),
  );
}

export function computeFootprintCollider(root, assetId, registry = sharedFootprintConfig) {
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const footprint = getSharedFootprint(assetId, registry);

  if (footprint) {
    const worldScale = new THREE.Vector3();
    root.getWorldScale(worldScale);
    const yaw = getWorldYaw(root);
    const rotatedOffset = getScaledLocalOffset(root, footprint).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const colliderX = center.x + rotatedOffset.x;
    const colliderZ = center.z + rotatedOffset.z;

    if (footprint.type === 'circle') {
      return {
        type: 'circle',
        x: colliderX,
        z: colliderZ,
        radius: footprint.radius * Math.max(Math.abs(worldScale.x), Math.abs(worldScale.z)),
      };
    }

    return {
      type: 'rect',
      x: colliderX,
      z: colliderZ,
      width: footprint.width * Math.abs(worldScale.x),
      depth: footprint.depth * Math.abs(worldScale.z),
      rotation: yaw + footprint.rotationOffset,
    };
  }

  const fallbackYaw = getWorldYaw(root);
  if (size.x > 0.01 && size.z > 0.01) {
    return {
      type: 'rect',
      x: center.x,
      z: center.z,
      width: size.x + 0.3,
      depth: size.z + 0.3,
      rotation: fallbackYaw,
    };
  }

  return null;
}
