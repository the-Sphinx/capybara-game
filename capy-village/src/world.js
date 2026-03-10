import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gameState } from './state.js';

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
];

export function getActiveInteractable(cx, cz) {
  for (const b of interactables) {
    const z = b.zone;
    if (Math.abs(cx - z.x) < z.hw && Math.abs(cz - z.z) < z.hd) return b;
  }
  return null;
}

// ─── Scene init ───────────────────────────────────────────────────────────────
export function initScene() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xBFE3FF);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 2.5, 4.5);
  camera.lookAt(0, 0.5, 0);

  const CAM_OFFSET = new THREE.Vector3(0, 2.5, 4.5);
  const CAM_LERP   = 0.1;
  const camTarget  = new THREE.Vector3();

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width  = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near   = 0.1;
  dirLight.shadow.camera.far    = 60;
  dirLight.shadow.camera.left   = -14;
  dirLight.shadow.camera.right  =  14;
  dirLight.shadow.camera.top    =  14;
  dirLight.shadow.camera.bottom = -14;
  scene.add(dirLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshLambertMaterial({ color: 0x88CC88 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const clock = new THREE.Clock();

  return { renderer, scene, camera, clock, camTarget, CAM_OFFSET, CAM_LERP };
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
    `${import.meta.env.BASE_URL}buildings/capy_store.glb`,
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
}
