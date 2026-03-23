import * as THREE from 'three';
import sharedFootprintConfig from '../../config/collider_footprints.json';

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

export function computeFootprintCollider(root, assetId, registry = sharedFootprintConfig) {
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const footprint = getSharedFootprint(assetId, registry);

  if (footprint) {
    if (footprint.type === 'circle') {
      return {
        type: 'circle',
        x: center.x + footprint.offsetX,
        z: center.z + footprint.offsetZ,
        radius: footprint.radius,
      };
    }

    return {
      type: 'rect',
      x: center.x + footprint.offsetX,
      z: center.z + footprint.offsetZ,
      width: footprint.width,
      depth: footprint.depth,
      rotation: root.rotation.y + footprint.rotationOffset,
    };
  }

  if (size.x > 0.01 && size.z > 0.01) {
    return {
      type: 'rect',
      x: center.x,
      z: center.z,
      width: size.x + 0.3,
      depth: size.z + 0.3,
      rotation: root.rotation.y,
    };
  }

  return null;
}
