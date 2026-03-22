import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gameState, BOUND } from './state.js';

// ─── Collision ────────────────────────────────────────────────────────────────
const colliders = [];

export function addCollider(x, z, hw, hd) {
  colliders.push({ x, z, hw, hd });
}

export function collides(nx, nz) {
  const r = 0.35;
  for (const c of colliders) {
    if (nx + r > c.x - c.hw && nx - r < c.x + c.hw &&
        nz + r > c.z - c.hd && nz - r < c.z + c.hd) {
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

export function setInteractablesEnabled(enabled) {
  interactablesEnabled = enabled;
}

export function getActiveInteractable(cx, cz) {
  if (!interactablesEnabled) {
    return null;
  }

  for (const b of interactables) {
    const z = b.zone;
    if (Math.abs(cx - z.x) < z.hw && Math.abs(cz - z.z) < z.hd) return b;
  }
  return null;
}

function createToyGround(scene) {
  const baseRadius = BOUND + 7.5;

  const baseRing = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius + 0.55, baseRadius + 0.95, 0.5, 48),
    new THREE.MeshStandardMaterial({
      color: 0x88a074,
      roughness: 0.95,
      metalness: 0.0,
    }),
  );
  baseRing.position.y = -0.26;
  baseRing.receiveShadow = true;
  scene.add(baseRing);

  const topBase = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius + 0.2, 0.24, 48),
    new THREE.MeshStandardMaterial({
      color: 0xbfd8a6,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  topBase.position.y = -0.12;
  topBase.receiveShadow = true;
  scene.add(topBase);

  const innerMeadow = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius - 2.1, baseRadius - 2.5, 0.05, 48),
    new THREE.MeshStandardMaterial({
      color: 0xcddfaf,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );
  innerMeadow.position.y = 0.005;
  innerMeadow.receiveShadow = true;
  scene.add(innerMeadow);

  const softPatchMaterial = new THREE.MeshStandardMaterial({
    color: 0xb2c98f,
    roughness: 0.95,
    metalness: 0.0,
  });

  const patches = [
    { x: -4.4, z: -2.6, rx: 1.4, rz: 1.0, s: 1.0 },
    { x: 3.8, z: -4.1, rx: -0.7, rz: 0.8, s: 0.9 },
    { x: 5.1, z: 2.2, rx: 0.9, rz: -1.2, s: 1.15 },
    { x: -1.9, z: 4.6, rx: -1.0, rz: 1.7, s: 0.85 },
  ];

  for (const patch of patches) {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.9 * patch.s, 32),
      softPatchMaterial,
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(patch.x, 0.012, patch.z);
    mesh.scale.set(1 + patch.rx * 0.08, 1, 1 + patch.rz * 0.08);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  const plazaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.35, 3.58, 0.16, 40),
    new THREE.MeshStandardMaterial({
      color: 0xc2b292,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  plazaBase.position.y = -0.03;
  plazaBase.receiveShadow = true;
  scene.add(plazaBase);

  const plazaTop = new THREE.Mesh(
    new THREE.CylinderGeometry(3.02, 3.14, 0.08, 40),
    new THREE.MeshStandardMaterial({
      color: 0xe8d8b5,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  plazaTop.position.y = 0.03;
  plazaTop.receiveShadow = true;
  scene.add(plazaTop);
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
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0xdfeaf5);
  document.body.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0xdfeaf5);
  const camera = new THREE.PerspectiveCamera(26, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.copy(DIORAMA_CAMERA_POSITION);
  camera.lookAt(DIORAMA_CAMERA_TARGET);
  camera.updateProjectionMatrix();

  const hemiLight = new THREE.HemisphereLight(0xfff5d6, 0x9dbf87, 0.6);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xfff2cc, 1.2);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width  = 1024;
  dirLight.shadow.mapSize.height = 1024;
  const shadowExtent = BOUND + 6;   // margin beyond walkable area
  dirLight.shadow.camera.near   = 0.5;
  dirLight.shadow.camera.far    = 50;
  dirLight.shadow.camera.left   = -shadowExtent;
  dirLight.shadow.camera.right  =  shadowExtent;
  dirLight.shadow.camera.top    =  shadowExtent;
  dirLight.shadow.camera.bottom = -shadowExtent;
  dirLight.shadow.bias = -0.00015;
  dirLight.shadow.normalBias = 0.03;
  if ('radius' in dirLight.shadow) {
    dirLight.shadow.radius = 2.2;
  }
  scene.add(dirLight);

  createToyGround(scene);

  const clock = new THREE.Clock();

  return { renderer, scene, camera, clock };
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
