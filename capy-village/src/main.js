import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xBFE3FF);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── Camera ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 4.5);
camera.lookAt(0, 0.5, 0);

const CAM_OFFSET = new THREE.Vector3(0, 2.5, 4.5);
const CAM_LERP   = 0.1;
const camTarget  = new THREE.Vector3();

// ─── Lights ───────────────────────────────────────────────────────────────────
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

// ─── Ground ───────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshLambertMaterial({ color: 0x88CC88 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ─── Collision system ─────────────────────────────────────────────────────────
const colliders = []; // { x, z, hw, hd }

function addCollider(x, z, hw, hd) {
  colliders.push({ x, z, hw, hd });
}

function collides(nx, nz) {
  const r = 0.35; // capy footprint radius
  for (const c of colliders) {
    if (nx + r > c.x - c.hw && nx - r < c.x + c.hw &&
        nz + r > c.z - c.hd && nz - r < c.z + c.hd) {
      return true;
    }
  }
  return false;
}

// ─── Village helpers ──────────────────────────────────────────────────────────

function makeBuilding(wallColor, roofColor, w, h, d, x, z) {
  const group = new THREE.Group();

  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color: wallColor })
  );
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  const roofR = Math.max(w, d) * 0.72;
  const roofH = h * 0.55;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(roofR, roofH, 4),
    new THREE.MeshLambertMaterial({ color: roofColor })
  );
  roof.position.y = h + roofH * 0.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  group.position.set(x, 0, z);
  scene.add(group);
  addCollider(x, z, w / 2 + 0.3, d / 2 + 0.3);
}

function makeTree(x, z) {
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

function makeBush(x, z, r = 0.50) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x5A9E48 })
  );
  mesh.position.set(x, r, z);
  scene.add(mesh);
  // Bushes are passable — no collider
}

function makeRock(x, z, r = 0.42) {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(r, 0),
    new THREE.MeshLambertMaterial({ color: 0x9A9A8A })
  );
  mesh.position.set(x, r * 0.6, z);
  mesh.rotation.y = 1.3;
  scene.add(mesh);
  addCollider(x, z, r + 0.2, r + 0.2);
}

function makeBench(x, z, rotY = 0) {
  const mat   = new THREE.MeshLambertMaterial({ color: 0xC4A060 });
  const group = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.45), mat);
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

// Paths — cross shape, warm beige, wider
const pathMat = new THREE.MeshLambertMaterial({ color: 0xD4B896 });

const ewPath = new THREE.Mesh(new THREE.BoxGeometry(22, 0.02, 3.2), pathMat);
ewPath.position.y = 0.01;
scene.add(ewPath);

const nsPath = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 22), pathMat);
nsPath.position.y = 0.01;
scene.add(nsPath);

// Central plaza — slightly raised, slightly lighter
const plazaMat = new THREE.MeshLambertMaterial({ color: 0xDDC8A8 });
const plaza = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.025, 5.5), plazaMat);
plaza.position.y = 0.015;
scene.add(plaza);

// Buildings — scaled ~1.5x, pushed outward for open central space
//  Boutique   — tall, pink walls + purple roof, NW
makeBuilding(0xF0A8B8, 0x9040A0,  2.6, 4.5, 2.6,  -6.0, -6.0);
//  Capy Store — large, warm yellow + red roof, NE
makeBuilding(0xF0D060, 0xC05030,  3.8, 3.5, 3.2,   6.0, -6.0);
//  Bakery     — wide, terracotta + dark red roof, S
makeBuilding(0xD4905C, 0x883020,  4.5, 2.8, 3.6,   0.0,  7.0);

// Trees
makeTree(-3.5, -3.5);
makeTree( 3.5, -3.5);
makeTree(-4.0,  3.2);
makeTree( 4.0,  3.8);
makeTree(-7.0,  1.5);

// Bushes (passable)
makeBush(-1.8, -5.0, 0.50);
makeBush( 1.8, -5.0, 0.44);
makeBush(-5.0,  0.8, 0.52);
makeBush( 5.5,  0.8, 0.46);

// Rocks
makeRock(-4.5,  3.8, 0.42);
makeRock( 2.0,  6.0, 0.36);
makeRock( 7.0, -1.5, 0.38);

// Bench near plaza
makeBench(2.0, 1.2, -0.3);

// ─── Keyboard ─────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup',   (e) => { keys[e.code] = false; });

// ─── Movement constants ───────────────────────────────────────────────────────
const MOVE_SPEED = 2.0;
const BOUND = 8;

// ─── Model ────────────────────────────────────────────────────────────────────
let capy    = null;
let groundY = 0;
let mixer   = null;
const clock = new THREE.Clock();

const furMaterial = new THREE.MeshStandardMaterial({
  color: 0xE3A68C, roughness: 0.85, metalness: 0.0,
});

const loader = new GLTFLoader();
loader.load(
  `${import.meta.env.BASE_URL}capy_idle.glb`,
  (gltf) => {
    capy = gltf.scene;
    scene.add(capy);

    capy.traverse((node) => {
      if (node.isMesh) {
        node.material = furMaterial;
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    const box  = new THREE.Box3().setFromObject(capy);
    const size = new THREE.Vector3();
    box.getSize(size);
    groundY = size.y / 2;
    capy.position.y = groundY;

    if (gltf.animations?.length > 0) {
      mixer = new THREE.AnimationMixer(capy);
      const action = mixer.clipAction(gltf.animations[0]);
      action.setLoop(THREE.LoopRepeat);
      action.play();
    }
  },
  undefined,
  (err) => console.error('Failed to load model:', err)
);

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animate ──────────────────────────────────────────────────────────────────
const moveDir = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (capy) {
    moveDir.set(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp'])    moveDir.z -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  moveDir.z += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  moveDir.x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      capy.rotation.y = Math.atan2(moveDir.x, moveDir.z);

      const nx = Math.max(-BOUND, Math.min(BOUND, capy.position.x + moveDir.x * MOVE_SPEED * delta));
      const nz = Math.max(-BOUND, Math.min(BOUND, capy.position.z + moveDir.z * MOVE_SPEED * delta));

      // Slide along walls by checking axes independently
      if (!collides(nx, capy.position.z)) capy.position.x = nx;
      if (!collides(capy.position.x, nz)) capy.position.z = nz;

      capy.position.y = groundY;
    }

    // Camera follow
    const desired = capy.position.clone().add(CAM_OFFSET);
    camera.position.lerp(desired, CAM_LERP);
    camTarget.copy(capy.position);
    camTarget.y += 0.5;
    camera.lookAt(camTarget);
  }

  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

animate();
