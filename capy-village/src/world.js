import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gameState, BOUND } from './state.js';

// ─── Collision ────────────────────────────────────────────────────────────────
const colliders = [];
const PLAYER_COLLISION_RADIUS = 0.35;

export function addCollider(xOrCollider, z, hw, hd) {
  if (typeof xOrCollider === 'object' && xOrCollider !== null) {
    colliders.push(xOrCollider);
    return;
  }

  colliders.push({
    type: 'rect',
    x: xOrCollider,
    z,
    width: hw * 2,
    depth: hd * 2,
    rotation: 0,
  });
}

export function collides(nx, nz) {
  for (const c of colliders) {
    if (c.type === 'circle') {
      const dx = nx - c.x;
      const dz = nz - c.z;
      const radius = c.radius + PLAYER_COLLISION_RADIUS;
      if (dx * dx + dz * dz < radius * radius) {
        return true;
      }
      continue;
    }

    const rotation = c.rotation ?? 0;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const dx = nx - c.x;
    const dz = nz - c.z;
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    const halfWidth = c.width / 2 + PLAYER_COLLISION_RADIUS;
    const halfDepth = c.depth / 2 + PLAYER_COLLISION_RADIUS;

    if (Math.abs(localX) < halfWidth && Math.abs(localZ) < halfDepth) {
      return true;
    }
  }
  return false;
}

// ─── Occlusion ────────────────────────────────────────────────────────────────
const occluders = [];
const raycaster  = new THREE.Raycaster();

export function updateOcclusion(camera) {
  const capy = gameState.capy;
  if (!capy) return;

  const capyEye = new THREE.Vector3(
    capy.position.x,
    capy.position.y + 0.5,
    capy.position.z
  );
  const dir     = capyEye.clone().sub(camera.position).normalize();
  const maxDist = camera.position.distanceTo(capyEye);
  raycaster.set(camera.position, dir);

  const meshList = occluders.map(o => o.mesh);
  const hits     = raycaster.intersectObjects(meshList, false);
  const inTheWay = new Set(
    hits.filter(h => h.distance < maxDist).map(h => h.object)
  );

  for (const occ of occluders) {
    occ.targetOpacity = inTheWay.has(occ.mesh) ? 0.3 : 1.0;
    occ.mesh.material.opacity = THREE.MathUtils.lerp(
      occ.mesh.material.opacity,
      occ.targetOpacity,
      0.12
    );
  }
}

// ─── Interactables ────────────────────────────────────────────────────────────
const interactables = [
  { id: 'boutique',   label: 'Boutique',   message: 'This building will open the fashion boutique later.',
    zone: { x: -6.0, z: -3.5, hw: 1.3, hd: 0.9 } },
  { id: 'capy-store', label: 'Capy Store', message: 'This building will open the capy customization screen later.',
    zone: { x:  6.0, z: -3.1, hw: 1.9, hd: 1.0 } },
  { id: 'bakery',     label: 'Bakery',     message: 'This building will open the bakery shop later.',
    zone: { x:  0.0, z:  4.0, hw: 2.2, hd: 0.9 } },
  { id: 'minigame_hub', label: 'Minigame Hub', message: '',
    prompt: 'Press [E] to open Minigame Hub 🎮',
    zone: { x:  2.0, z: -3.5, hw: 1.0, hd: 0.8 } },
];

let interactablesEnabled = true;
const runtimeInteractables = [];
const interactableWorldPos = new THREE.Vector3();
let lastActiveRuntimeInteractable = null;

export function setInteractablesEnabled(enabled) {
  interactablesEnabled = enabled;
}

export function setRuntimeInteractables(entries) {
  runtimeInteractables.length = 0;
  lastActiveRuntimeInteractable = null;
  for (const entry of entries ?? []) {
    if (!entry?.object) {
      continue;
    }

    runtimeInteractables.push({
      radius: 2.8,
      ...entry,
      feedbackObject: entry.feedbackObject ?? entry.object,
      interactionBuffer: entry.interactionBuffer ?? 0,
    });
  }
}

export function getActiveInteractable(cx, cz) {
  if (runtimeInteractables.length > 0) {
    if (lastActiveRuntimeInteractable) {
      lastActiveRuntimeInteractable.object.getWorldPosition(interactableWorldPos);
      const dx = cx - interactableWorldPos.x;
      const dz = cz - interactableWorldPos.z;
      const stickyRadius = (lastActiveRuntimeInteractable.radius ?? 2.8) + 0.35;
      if (dx * dx + dz * dz <= stickyRadius * stickyRadius) {
        return lastActiveRuntimeInteractable;
      }
    }

    let closest = null;
    let closestDistanceSq = Infinity;

    for (const entry of runtimeInteractables) {
      entry.object.getWorldPosition(interactableWorldPos);
      const dx = cx - interactableWorldPos.x;
      const dz = cz - interactableWorldPos.z;
      const distanceSq = dx * dx + dz * dz;
      const radiusSq = (entry.radius ?? 2.8) ** 2;

      if (distanceSq <= radiusSq && distanceSq < closestDistanceSq) {
        closest = entry;
        closestDistanceSq = distanceSq;
      }
    }

    lastActiveRuntimeInteractable = closest;
    return closest;
  }

  if (!interactablesEnabled) {
    return null;
  }

  for (const b of interactables) {
    const z = b.zone;
    if (Math.abs(cx - z.x) < z.hw && Math.abs(cz - z.z) < z.hd) return b;
  }
  return null;
}

export function updateInteractableFeedback(activeInteractable, elapsedTime) {
  if (runtimeInteractables.length === 0) {
    return;
  }

  for (const entry of runtimeInteractables) {
    const targetIntensity = entry === activeInteractable
      ? 0.16 + Math.sin(elapsedTime * 4.2) * 0.035
      : 0;

    const feedbackRoot = entry.feedbackObject ?? entry.object;
    feedbackRoot.traverse((node) => {
      if (!node.isMesh) {
        return;
      }

      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (!material || !('emissiveIntensity' in material)) {
          continue;
        }

        if (material.userData._baseEmissiveIntensity === undefined) {
          material.userData._baseEmissiveIntensity = material.emissiveIntensity ?? 0;
          material.userData._baseEmissive = material.emissive?.clone?.() ?? new THREE.Color(0x000000);
        }

        if (material.emissive) {
          material.emissive.copy(material.userData._baseEmissive);
        }
        material.emissiveIntensity = THREE.MathUtils.lerp(
          material.emissiveIntensity ?? 0,
          material.userData._baseEmissiveIntensity + targetIntensity,
          entry === activeInteractable ? 0.16 : 0.22,
        );
      }
    });
  }
}

function createToyGround(scene) {
  const groundRadius = 12;
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(groundRadius, groundRadius + 0.45, 0.46, 64),
    new THREE.MeshStandardMaterial({
      color: 0xd1d2a8,
      roughness: 1.0,
      metalness: 0.0,
    }),
  );
  island.position.y = -0.23;
  island.receiveShadow = true;
  scene.add(island);

  const plazaRing = new THREE.Mesh(
    new THREE.CylinderGeometry(3.35, 3.58, 0.12, 40),
    new THREE.MeshStandardMaterial({
      color: 0xc2b292,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  plazaRing.position.y = -0.01;
  plazaRing.receiveShadow = true;
  scene.add(plazaRing);

  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(3.08, 3.18, 0.1, 40),
    new THREE.MeshStandardMaterial({
      color: 0xe8d8b5,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );
  plaza.position.y = 0.01;
  plaza.receiveShadow = true;
  scene.add(plaza);
}

function createCloudVariant(parts, material) {
  const group = new THREE.Group();
  for (const part of parts) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(part.radius, 10, 8),
      material,
    );
    puff.position.set(part.x, part.y, part.z);
    puff.scale.set(part.sx ?? 1, part.sy ?? 1, part.sz ?? 1);
    puff.castShadow = false;
    puff.receiveShadow = false;
    group.add(puff);
  }
  return group;
}

function createSkyCloudLayer(scene, camera) {
  const cloudHeightRange = { min: 7.0, max: 10.0 };
  const randomInRange = (min, max) => min + Math.random() * (max - min);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
    emissive: 0xf3f8ff,
    emissiveIntensity: 0.12,
  });

  const variants = [
    createCloudVariant([
      { x: -0.55, y: 0.0, z: 0, radius: 0.48 },
      { x: 0.0, y: 0.12, z: 0.08, radius: 0.62 },
      { x: 0.58, y: 0.02, z: -0.06, radius: 0.45 },
    ], cloudMaterial),
    createCloudVariant([
      { x: -0.95, y: 0.04, z: 0.02, radius: 0.48, sx: 1.2 },
      { x: -0.24, y: 0.18, z: 0.06, radius: 0.66, sx: 1.1 },
      { x: 0.48, y: 0.1, z: -0.05, radius: 0.56, sx: 1.25 },
      { x: 1.08, y: 0.02, z: 0.04, radius: 0.42, sx: 1.15 },
    ], cloudMaterial),
    createCloudVariant([
      { x: -0.18, y: 0.0, z: 0.02, radius: 0.52 },
      { x: 0.16, y: 0.54, z: 0.0, radius: 0.44 },
      { x: 0.48, y: 0.18, z: -0.04, radius: 0.36 },
    ], cloudMaterial),
    createCloudVariant([
      { x: -1.08, y: 0.02, z: 0, radius: 0.36, sx: 1.25 },
      { x: -0.3, y: 0.1, z: 0.04, radius: 0.58, sx: 1.45 },
      { x: 0.58, y: 0.12, z: -0.03, radius: 0.5, sx: 1.3 },
      { x: 1.28, y: 0.02, z: 0.03, radius: 0.34, sx: 1.15 },
    ], cloudMaterial),
  ];

  const cloudRoot = new THREE.Group();
  camera.add(cloudRoot);

  const cloudEntries = [
    { variant: 1, x: -24.5, z: -52.0, scale: 1.75, speed: 0.02 },
    { variant: 0, x: -15.0, z: -44.0, scale: 1.15, speed: 0.026 },
    { variant: 3, x: -5.8, z: -49.0, scale: 1.55, speed: 0.018 },
    { variant: 2, x: 3.0, z: -41.0, scale: 0.92, speed: 0.024 },
    { variant: 1, x: 12.5, z: -46.0, scale: 1.35, speed: 0.021 },
    { variant: 0, x: 21.0, z: -53.0, scale: 1.65, speed: 0.017 },
    { variant: 2, x: 29.5, z: -42.5, scale: 0.88, speed: 0.023 },
    ].map((entry) => {
    const cloud = variants[entry.variant].clone(true);
    cloud.position.set(
      entry.x,
      randomInRange(cloudHeightRange.min, cloudHeightRange.max),
      entry.z,
    );
    cloud.scale.setScalar(entry.scale);
    cloud.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
    cloudRoot.add(cloud);
    return {
      cloud,
      speed: entry.speed,
      minX: -34,
      maxX: 34,
    };
  });

  return (delta) => {
    for (const entry of cloudEntries) {
      entry.cloud.position.x += entry.speed * delta;
      if (entry.cloud.position.x > entry.maxX) {
        entry.cloud.position.x = entry.minX;
      }
    }
  };
}

// ─── Scene init ───────────────────────────────────────────────────────────────
export function initScene() {
  const DIORAMA_CAMERA_POSITION = new THREE.Vector3(0.2, 9.8, 15.4);
  const DIORAMA_CAMERA_TARGET = new THREE.Vector3(0, 1.6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.setClearColor(0xc9e4ff);
  document.body.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0xc9e4ff);
  scene.fog = null;
  const camera = new THREE.PerspectiveCamera(26, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.copy(DIORAMA_CAMERA_POSITION);
  camera.lookAt(DIORAMA_CAMERA_TARGET);
  camera.updateProjectionMatrix();
  scene.add(camera);

  const hemiLight = new THREE.HemisphereLight(0xe9f2ff, 0xc8c29b, 0.65);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xf7ca4b, 1.0);
  dirLight.position.set(6, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width  = 2048;
  dirLight.shadow.mapSize.height = 2048;
  const shadowExtent = BOUND + 6;   // margin beyond walkable area
  dirLight.shadow.camera.near   = 0.5;
  dirLight.shadow.camera.far    = 50;
  dirLight.shadow.camera.left   = -shadowExtent;
  dirLight.shadow.camera.right  =  shadowExtent;
  dirLight.shadow.camera.top    =  shadowExtent;
  dirLight.shadow.camera.bottom = -shadowExtent;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.03;
  if ('radius' in dirLight.shadow) {
    dirLight.shadow.radius = 2.8;
  }
  scene.add(dirLight);

  createToyGround(scene);
  const updateSky = createSkyCloudLayer(scene, camera);

  const clock = new THREE.Clock();

  return { renderer, scene, camera, clock, updateSky };
}

// ─── Village helpers (private) ────────────────────────────────────────────────
function makeBuilding(scene, wallColor, roofColor, w, h, d, x, z) {
  const group   = new THREE.Group();
  const wallMat = new THREE.MeshLambertMaterial({ color: wallColor, transparent: true });
  const walls   = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);
  occluders.push({ mesh: walls, targetOpacity: 1.0 });

  const roofR   = Math.max(w, d) * 0.72;
  const roofH   = h * 0.55;
  const roofMat = new THREE.MeshLambertMaterial({ color: roofColor, transparent: true });
  const roof    = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 4), roofMat);
  roof.position.y = h + roofH * 0.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);
  occluders.push({ mesh: roof, targetOpacity: 1.0 });

  group.position.set(x, 0, z);
  scene.add(group);
  addCollider(x, z, w / 2 + 0.3, d / 2 + 0.3);
}

function makeTree(scene, x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 1.2, 8),
    new THREE.MeshLambertMaterial({ color: 0x8B6040 })
  );
  trunk.position.y = 0.6;
  trunk.castShadow = true;
  group.add(trunk);
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(0.85, 1.8, 8),
    new THREE.MeshLambertMaterial({ color: 0x4A8C40 })
  );
  foliage.position.y = 2.1;
  foliage.castShadow = true;
  group.add(foliage);
  group.position.set(x, 0, z);
  scene.add(group);
  addCollider(x, z, 0.45, 0.45);
}

function makeBush(scene, x, z, r = 0.50) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x5A9E48 })
  );
  mesh.position.set(x, r, z);
  scene.add(mesh);
}

function makeRock(scene, x, z, r = 0.42) {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(r, 0),
    new THREE.MeshLambertMaterial({ color: 0x9A9A8A })
  );
  mesh.position.set(x, r * 0.6, z);
  mesh.rotation.y = 1.3;
  scene.add(mesh);
  addCollider(x, z, r + 0.2, r + 0.2);
}

function makeBench(scene, x, z, rotY = 0) {
  const mat   = new THREE.MeshLambertMaterial({ color: 0xC4A060 });
  const group = new THREE.Group();
  const seat  = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.45), mat);
  seat.position.y = 0.5;
  group.add(seat);
  for (const lx of [-0.45, 0.45]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.45), mat);
    leg.position.set(lx, 0.25, 0);
    group.add(leg);
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  scene.add(group);
}

// ─── Village layout ───────────────────────────────────────────────────────────
export function buildVillage(scene) {
  const pathMat = new THREE.MeshLambertMaterial({ color: 0xD4B896 });

  const ewPath = new THREE.Mesh(new THREE.BoxGeometry(22, 0.02, 3.2), pathMat);
  ewPath.position.y = 0.01;
  scene.add(ewPath);

  const nsPath = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 22), pathMat);
  nsPath.position.y = 0.01;
  scene.add(nsPath);

  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 0.025, 5.5),
    new THREE.MeshLambertMaterial({ color: 0xDDC8A8 })
  );
  plaza.position.y = 0.015;
  scene.add(plaza);

  makeBuilding(scene, 0xF0A8B8, 0x9040A0,  2.6, 4.5, 2.6,  -6.0, -6.0); // Boutique
  makeBuilding(scene, 0xD4905C, 0x883020,  4.5, 2.8, 3.6,   0.0,  7.0);  // Bakery

  // Capy Store — real GLB asset (NE, box collider for movement)
  addCollider(6.0, -6.0, 2.25, 1.9);
  const capyStoreLoader = new GLTFLoader();
  capyStoreLoader.load(
    `${import.meta.env.BASE_URL}assets/models/buildings/capy_store.glb`,
    (gltf) => {
      const model = gltf.scene;
      const bbox  = new THREE.Box3().setFromObject(model);
      model.position.set(6.0, -bbox.min.y, -6.0);
      model.traverse((node) => {
        if (node.isMesh) {
          node.material = node.material.clone();
          node.material.transparent = true;
          node.castShadow = true;
          node.receiveShadow = true;
          occluders.push({ mesh: node, targetOpacity: 1.0 });
        }
      });
      scene.add(model);
    },
    undefined,
    (err) => console.error('Failed to load capy_store.glb:', err)
  );

  makeTree(scene, -3.5, -3.5);
  makeTree(scene,  3.5, -3.5);
  makeTree(scene, -4.0,  3.2);
  makeTree(scene,  4.0,  3.8);
  makeTree(scene, -7.0,  1.5);

  makeBush(scene, -1.8, -5.0, 0.50);
  makeBush(scene,  1.8, -5.0, 0.44);
  makeBush(scene, -5.0,  0.8, 0.52);
  makeBush(scene,  5.5,  0.8, 0.46);

  makeRock(scene, -4.5,  3.8, 0.42);
  makeRock(scene,  2.0,  6.0, 0.36);
  makeRock(scene,  7.0, -1.5, 0.38);

  makeBench(scene, 2.0, 1.2, -0.3);

  // Watermelon game stand — post + green ball marker at (-4.5, 5.5)
  const standPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8),
    new THREE.MeshLambertMaterial({ color: 0x8B6040 })
  );
  standPost.position.set(1.75, 0.5, -3.5);
  standPost.castShadow = true;
  scene.add(standPost);

  const watermelonBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 12, 8),
    new THREE.MeshLambertMaterial({ color: 0xFB503B })
  );
  watermelonBall.position.set(1.75, 1.35, -3.5);
  watermelonBall.castShadow = true;
  scene.add(watermelonBall);
}
