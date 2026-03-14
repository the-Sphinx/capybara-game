import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gameState, BOUND } from './state.js';
import { initNPCs } from './npc.js';

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
  { id: 'capy-store', label: 'Capy Store', message: '',
    zone: { x:  6.0, z: -3.1, hw: 1.9, hd: 1.0 } },
  { id: 'minigame_hub', label: 'Minigame Hub', message: '',
    prompt: 'Press [E] to open Minigame Hub 🎮',
    zone: { x:  0.0, z:  0.0, hw: 2.5, hd: 2.5 } },
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
  // ACESFilmic tone mapping gives the warm cinematic punch seen in the reference
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0xFFD880);  // warm amber sky
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  // Narrower FOV + more pull-back = telephoto compression, shows full village diorama
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 14, 14);
  camera.lookAt(0, 0, 0);

  // atan(14/14) = 45° downward — proper isometric diorama angle
  const CAM_OFFSET = new THREE.Vector3(0, 14, 14);
  const CAM_LERP   = 0.05;
  const camTarget  = new THREE.Vector3();

  // Bright warm hemisphere: vibrant sky fill + ground bounce
  scene.add(new THREE.HemisphereLight(0xFFE070, 0xD4A840, 1.2));

  // Main warm sun — bright and saturated, top-left for clear shadows
  const dirLight = new THREE.DirectionalLight(0xFFF0A0, 1.8);
  dirLight.position.set(-10, 18, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width  = 2048;
  dirLight.shadow.mapSize.height = 2048;
  const shadowExtent = BOUND + 8;
  dirLight.shadow.camera.near   = 0.1;
  dirLight.shadow.camera.far    = 80;
  dirLight.shadow.camera.left   = -shadowExtent;
  dirLight.shadow.camera.right  =  shadowExtent;
  dirLight.shadow.camera.top    =  shadowExtent;
  dirLight.shadow.camera.bottom = -shadowExtent;
  scene.add(dirLight);

  // Soft fill from opposite side to prevent harsh shadows
  const fillLight = new THREE.DirectionalLight(0xFFD8A0, 0.6);
  fillLight.position.set(8, 6, -6);
  scene.add(fillLight);

  // Warm fog matches sky color
  scene.fog = new THREE.FogExp2(0xFFD880, 0.012);

  const groundSize = (BOUND + 8) * 2;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(groundSize, groundSize),
    new THREE.MeshStandardMaterial({ color: 0x6DC85A, roughness: 0.95, metalness: 0.0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const clock = new THREE.Clock();

  return { renderer, scene, camera, clock, camTarget, CAM_OFFSET, CAM_LERP };
}

// ─── Village helpers (private) ────────────────────────────────────────────────

// Shorthand for PBR toy materials — matte clay look with proper lighting response
function sm(color, transparent = false) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.0, transparent });
}

// Rustic wooden hut with wide thatched dome roof
function makeBuilding(scene, wallColor, roofColor, w, h, d, x, z) {
  const group = new THREE.Group();

  // Wooden walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sm(wallColor, true));
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);
  occluders.push({ mesh: walls, targetOpacity: 1.0 });

  // Door — darker wood inset on front
  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.28, h * 0.45, 0.12), sm(0x4A2408));
  door.position.set(0, h * 0.225, d / 2 + 0.01);
  group.add(door);

  // Wide thatched dome roof — SphereGeometry top hemisphere, wider than walls
  const roofR = Math.max(w, d) * 0.62 + 0.5;
  const roof  = new THREE.Mesh(
    new THREE.SphereGeometry(roofR, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52),
    sm(roofColor, true)
  );
  roof.position.y = h + 0.05;
  roof.castShadow = true;
  group.add(roof);
  occluders.push({ mesh: roof, targetOpacity: 1.0 });

  // Roof rim band
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(roofR * 0.98, roofR * 1.02, 0.12, 16), sm(0x7A5020, true));
  rim.position.y = h + 0.06;
  group.add(rim);
  occluders.push({ mesh: rim, targetOpacity: 1.0 });

  group.position.set(x, 0, z);
  scene.add(group);
  addCollider(x, z, w / 2 + 0.3, d / 2 + 0.3);
}

// Round lollipop tree — sphere foliage matching reference toy look
function makeTree(scene, x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8), sm(0x8B5C20));
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  group.add(trunk);
  const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 10), sm(0x2E8A25));
  foliage.position.y = 2.3;
  foliage.castShadow = true;
  group.add(foliage);
  group.position.set(x, 0, z);
  scene.add(group);
  addCollider(x, z, 0.45, 0.45);
}

function makeBush(scene, x, z, r = 0.50) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), sm(0x3A9830));
  mesh.position.set(x, r, z);
  scene.add(mesh);
}

function makeRock(scene, x, z, r = 0.42) {
  const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), sm(0x8E8E82));
  mesh.position.set(x, r * 0.6, z);
  mesh.rotation.y = 1.3;
  scene.add(mesh);
  addCollider(x, z, r + 0.2, r + 0.2);
}

function makeBench(scene, x, z, rotY = 0) {
  const mat   = sm(0x9B6030);
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

// Central wisdom tree hub — raised platform, thick trunk, layered round canopy
function makeWisdomTree(scene) {
  const group = new THREE.Group();

  // Raised stone platform
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.8, 0.28, 16),
    sm(0xC4A060)
  );
  platform.position.y = 0.14;
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  // Trunk — wide and chunky for toy look
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.38, 2.6, 10),
    sm(0x7B4A20)
  );
  trunk.position.y = 0.28 + 1.3;
  trunk.castShadow = true;
  group.add(trunk);

  // Lower canopy — large round sphere for lollipop tree look
  const canopyLow = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 14, 10),
    sm(0x2E7A28)
  );
  canopyLow.position.y = 0.28 + 2.6 + 0.8;
  canopyLow.castShadow = true;
  group.add(canopyLow);

  // Upper canopy — smaller sphere on top for layered look
  const canopyTop = new THREE.Mesh(
    new THREE.SphereGeometry(1.3, 12, 8),
    sm(0x3D9030)
  );
  canopyTop.position.y = 0.28 + 2.6 + 2.1;
  canopyTop.castShadow = true;
  group.add(canopyTop);

  // Flag on top
  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
    sm(0x8B5C20)
  );
  flagPole.position.y = 0.28 + 2.6 + 3.5;
  group.add(flagPole);

  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0.45, -0.18);
  flagShape.lineTo(0, -0.38);
  flagShape.closePath();
  const flag = new THREE.Mesh(
    new THREE.ShapeGeometry(flagShape),
    new THREE.MeshStandardMaterial({ color: 0xFF3030, roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide })
  );
  flag.position.set(0.05, 0.28 + 2.6 + 4.0, 0);
  group.add(flag);

  scene.add(group);
  addCollider(0, 0, 0.7, 0.7);
}

// Colorful letter block (like in reference image)
function makeLetterBlock(scene, x, z, rotY = 0, size = 0.55) {
  const colors = [0xFF4444, 0x4488FF, 0xFFCC00, 0x44CC44, 0xFF8844, 0xCC44CC];
  const mats = colors.map(c => sm(c));
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mats);
  mesh.position.set(x, size / 2, z);
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  scene.add(mesh);
}

// Bunting triangle flags strung between two points
function makeBunting(scene, x1, z1, x2, z2, y = 3.2) {
  const colors = [0xFF4040, 0x4040FF, 0xFFDD00, 0x40CC40, 0xFF8800];
  const count  = 7;
  const flagShape = new THREE.Shape();
  flagShape.moveTo(-0.13, 0);
  flagShape.lineTo(0.13, 0);
  flagShape.lineTo(0, -0.3);
  flagShape.closePath();
  const flagGeo = new THREE.ShapeGeometry(flagShape);

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    // Slight catenary sag: flags at endpoints are higher, middle lower
    const sag = Math.sin(t * Math.PI) * 0.4;
    const flag = new THREE.Mesh(
      flagGeo,
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 0.8, metalness: 0.0, side: THREE.DoubleSide })
    );
    flag.position.set(x, y - sag, z);
    // Rotate to face outward from the line direction
    const angle = Math.atan2(x2 - x1, z2 - z1);
    flag.rotation.y = angle;
    scene.add(flag);
  }
}

function makeLampPost(scene, x, z) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8),
    sm(0x5C4020)
  );
  post.position.y = 1.1;
  post.castShadow = true;
  group.add(post);
  const lantern = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    sm(0xFFE890)
  );
  lantern.position.y = 2.35;
  group.add(lantern);
  group.position.set(x, 0, z);
  scene.add(group);
}

// Wooden fence post + rail segment
function makeFenceSection(scene, x, z, rotY = 0, width = 2.0) {
  const mat   = sm(0xB08040);
  const group = new THREE.Group();
  // Two posts
  for (const ox of [-width / 2, width / 2]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), mat);
    post.position.set(ox, 0.425, 0);
    post.castShadow = true;
    group.add(post);
  }
  // Top rail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), mat);
  rail.position.set(0, 0.72, 0);
  group.add(rail);
  // Bottom rail
  const railLow = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.08), mat);
  railLow.position.set(0, 0.38, 0);
  group.add(railLow);
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  scene.add(group);
}

function makeFlowerPatch(scene, x, z) {
  const stemMat = sm(0x508840);
  const colors  = [0xFF6B8A, 0xFFD060, 0xFF9040, 0xE060FF];
  [[0, 0], [0.3, 0.2], [-0.25, 0.3], [0.1, -0.35], [-0.15, -0.2]].forEach(([ox, oz], i) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 5), stemMat);
    stem.position.set(x + ox, 0.2, z + oz);
    scene.add(stem);
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 7, 5),
      sm(colors[i % 4])
    );
    bloom.position.set(x + ox, 0.48, z + oz);
    scene.add(bloom);
  });
}

// ─── Village layout ───────────────────────────────────────────────────────────
export function buildVillage(scene) {
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xC8AA7A, roughness: 0.95, metalness: 0.0 });

  // 4 radial stone paths from center to each hut
  const pathW = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.02, 2.2), pathMat);
  pathW.position.set(-3.75, 0.01, 0);
  const pathE = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.02, 2.2), pathMat);
  pathE.position.set(3.75, 0.01, 0);
  const pathN = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 7.5), pathMat);
  pathN.position.set(0, 0.01, -3.75);
  const pathS = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 7.5), pathMat);
  pathS.position.set(0, 0.01, 3.75);
  scene.add(pathW, pathE, pathN, pathS);

  // Ring connecting path — 12 segments at r=7.5
  const ringRadius = 7.5, ringSegW = 4.2, ringSegD = 1.6;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(ringSegW, 0.02, ringSegD), pathMat);
    seg.position.set(Math.sin(angle) * ringRadius, 0.01, Math.cos(angle) * ringRadius);
    seg.rotation.y = -angle;
    scene.add(seg);
  }

  // Central circular plaza — stone cobblestone look (slightly darker)
  const plazaMat = new THREE.MeshStandardMaterial({ color: 0xB8A888, roughness: 0.9, metalness: 0.0 });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.04, 32), plazaMat);
  plaza.position.y = 0.02;
  scene.add(plaza);

  // Cobblestone ring detail on plaza edge
  const cobbleMat = new THREE.MeshStandardMaterial({ color: 0xA89878, roughness: 0.9, metalness: 0.0 });
  const cobbleRing = new THREE.Mesh(
    new THREE.RingGeometry(3.0, 3.35, 32),
    cobbleMat
  );
  cobbleRing.rotation.x = -Math.PI / 2;
  cobbleRing.position.y = 0.035;
  scene.add(cobbleRing);

  // Central wisdom tree hub
  makeWisdomTree(scene);

  // ─── Category huts (visual only — hub modal handles all game access) ───
  // All use warm dark wood walls + golden thatched dome roofs
  const WOOD   = 0x8B5230;   // warm dark wood brown
  const THATCH = 0xD4A828;   // golden straw/thatching

  makeBuilding(scene, WOOD, THATCH, 3.0, 2.8, 3.0, -7.5,  0.0); // Math Garden — west
  makeBuilding(scene, WOOD, THATCH, 3.0, 3.0, 3.0,  0.0, -7.5); // Language Grove — north
  makeBuilding(scene, WOOD, THATCH, 3.0, 2.8, 3.0,  7.5,  0.0); // Watermelon Catch — east
  makeBuilding(scene, WOOD, THATCH, 2.8, 2.5, 2.8,  0.0,  7.5); // Future slot — south

  // ─── Capy Store GLB (NE corner) ───────────────────────────────────────────
  addCollider(6.0, -6.0, 2.25, 1.9);
  const capyStoreLoader = new GLTFLoader();
  capyStoreLoader.load(
    `${import.meta.env.BASE_URL}models/buildings/capy_store.glb`,
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

  // ─── Bunting flags strung between huts ────────────────────────────────────
  makeBunting(scene, -6.0, -1.0,  -1.0, -6.0, 3.4);  // Math hut → Language hut
  makeBunting(scene,  1.0, -6.0,   6.0, -1.0, 3.4);  // Language hut → Watermelon hut
  makeBunting(scene,  6.0,  1.0,   1.0,  6.0, 3.2);  // Watermelon hut → south hut
  makeBunting(scene, -1.0,  6.0,  -6.0,  1.0, 3.2);  // south hut → Math hut

  // ─── Letter/number blocks ─────────────────────────────────────────────────
  makeLetterBlock(scene, -5.5, -5.5,  0.4);
  makeLetterBlock(scene,  5.8, -5.2,  -0.3);
  makeLetterBlock(scene, -5.2,  5.8,   0.6);
  makeLetterBlock(scene,  1.8,  6.2,  -0.2);
  makeLetterBlock(scene, -9.5,  3.0,   0.5, 0.48);

  // ─── Trees flanking hut entrances ─────────────────────────────────────────
  makeTree(scene, -6.0,  1.7);
  makeTree(scene, -6.0, -1.7);
  makeTree(scene,  1.7, -6.0);
  makeTree(scene, -1.7, -6.0);
  makeTree(scene,  6.0,  1.7);
  makeTree(scene,  6.0, -1.7);
  makeTree(scene, -10.5, -8.0);
  makeTree(scene,  9.5,   9.5);

  // ─── Lamp posts at plaza corners ──────────────────────────────────────────
  makeLampPost(scene,  2.8,  2.8);
  makeLampPost(scene, -2.8,  2.8);
  makeLampPost(scene,  2.8, -2.8);
  makeLampPost(scene, -2.8, -2.8);

  // ─── Wooden fence sections near south hut ─────────────────────────────────
  makeFenceSection(scene, -2.5, 5.4,  0);
  makeFenceSection(scene,  2.5, 5.4,  0);
  makeFenceSection(scene, -3.5, 6.2, -0.6);
  makeFenceSection(scene,  3.5, 6.2,  0.6);

  // ─── Flower patches near entrances ────────────────────────────────────────
  makeFlowerPatch(scene, -5.5,  2.2);
  makeFlowerPatch(scene,  5.5,  2.5);
  makeFlowerPatch(scene,  1.8, -5.8);
  makeFlowerPatch(scene, -1.5,  5.5);

  // ─── Bushes in open corners ───────────────────────────────────────────────
  makeBush(scene, -10.5,  0.5, 0.55);
  makeBush(scene,  10.5,  0.5, 0.48);
  makeBush(scene,   0.5, 10.5, 0.52);
  makeBush(scene,  -9.0, -9.0, 0.45);

  // ─── Bench south of book fountain ─────────────────────────────────────────
  makeBench(scene, 0.0, 3.8, 0);

  // ─── Rocks ────────────────────────────────────────────────────────────────
  makeRock(scene,  4.2,  9.2, 0.40);
  makeRock(scene, -4.8, -9.2, 0.36);

  // ─── NPC capys ────────────────────────────────────────────────────────────
  initNPCs(scene);
}
