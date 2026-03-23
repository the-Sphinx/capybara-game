import * as THREE from 'three';

export const DEFAULT_FOOTPRINT_CONFIG = Object.freeze({
  hut_1: Object.freeze({
    type: 'circle',
    radius: 1.72,
    offsetX: 0,
    offsetZ: 0,
    rotationOffset: 0,
  }),
  mushroom_house: Object.freeze({
    type: 'circle',
    radius: 2.08,
    offsetX: 0,
    offsetZ: 0,
    rotationOffset: 0,
  }),
  book_statue: Object.freeze({
    type: 'circle',
    radius: 1.18,
    offsetX: 0,
    offsetZ: 0,
    rotationOffset: 0,
  }),
  pumpkin: Object.freeze({
    type: 'circle',
    radius: 1.62,
    offsetX: 0,
    offsetZ: 0,
    rotationOffset: 0,
  }),
  hat_stand: Object.freeze({
    type: 'rect',
    width: 1.7,
    depth: 1.1,
    offsetX: 0,
    offsetZ: 0,
    rotationOffset: 0,
  }),
  melon_stand_2: Object.freeze({
    type: 'rect',
    width: 2.7,
    depth: 1.95,
    offsetX: 0,
    offsetZ: 0,
    rotationOffset: 0,
  }),
});

function cloneFootprint(footprint) {
  if (!footprint) {
    return null;
  }

  return {
    ...footprint,
  };
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

export function getDefaultFootprint(assetId) {
  return normalizeFootprint(cloneFootprint(DEFAULT_FOOTPRINT_CONFIG[assetId]));
}

export function resolveFootprint(assetId, footprintOverride = null) {
  return normalizeFootprint(footprintOverride) ?? getDefaultFootprint(assetId);
}

export function computeFootprintCollider(root, assetId, footprintOverride = null) {
  const bbox = new THREE.Box3().setFromObject(root);
  const size = bbox.getSize(new THREE.Vector3());
  const center = bbox.getCenter(new THREE.Vector3());
  const footprint = resolveFootprint(assetId, footprintOverride);

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
