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
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width  = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near   = 0.1;
dirLight.shadow.camera.far    = 50;
dirLight.shadow.camera.left   = -12;
dirLight.shadow.camera.right  =  12;
dirLight.shadow.camera.top    =  12;
dirLight.shadow.camera.bottom = -12;
scene.add(dirLight);

// ─── Ground ───────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.MeshLambertMaterial({ color: 0x88CC88 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

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

  const roofRadius = Math.max(w, d) * 0.72;
  const roofHeight = h * 0.55;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(roofRadius, roofHeight, 4),
    new THREE.MeshLambertMaterial({ color: roofColor })
  );
  roof.position.y = h + roofHeight * 0.5;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  group.position.set(x, 0, z);
  scene.add(group);
}

function makeTree(x, z) {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.9, 8),
    new THREE.MeshLambertMaterial({ color: 0x8B6040 })
  );
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  group.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(0.62, 1.3, 8),
    new THREE.MeshLambertMaterial({ color: 0x4A8C40 })
  );
  foliage.position.y = 1.55;
  foliage.castShadow = true;
  group.add(foliage);

  group.position.set(x, 0, z);
  scene.add(group);
}

function makeBush(x, z, r = 0.35) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x5A9E48 })
  );
  mesh.position.set(x, r, z);
  scene.add(mesh);
}

function makeRock(x, z, r = 0.28) {
  const mesh = new THREE.Mesh(
    new THREE.DodecahedronGeometry(r, 0),
    new THREE.MeshLambertMaterial({ color: 0x9A9A8A })
  );
  mesh.position.set(x, r * 0.6, z);
  mesh.rotation.y = 1.3;
  scene.add(mesh);
}

function makeBench(x, z, rotY = 0) {
  const mat  = new THREE.MeshLambertMaterial({ color: 0xC4A060 });
  const group = new THREE.Group();

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.35), mat);
  seat.position.y = 0.45;
  group.add(seat);

  for (const lx of [-0.38, 0.38]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.35), mat);
    leg.position.set(lx, 0.225, 0);
    group.add(leg);
  }

  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  scene.add(group);
}

// ─── Village layout ───────────────────────────────────────────────────────────

// Paths (cross shape, warm beige, slightly raised)
const pathMat = new THREE.MeshLambertMaterial({ color: 0xD4B896 });
const ewPath  = new THREE.Mesh(new THREE.BoxGeometry(14, 0.02, 1.8), pathMat);
ewPath.position.y = 0.01;
scene.add(ewPath);

const nsPath  = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 14), pathMat);
nsPath.position.y = 0.01;
scene.add(nsPath);

// Central square
const centerSquare = new THREE.Mesh(new THREE.BoxGeometry(3, 0.02, 3), pathMat);
centerSquare.position.y = 0.015;
scene.add(centerSquare);

// Buildings
//  Capy Store — large, warm yellow, NE
makeBuilding(0xF0D060, 0xC05030, 2.4, 2.2, 2.0,  4.8, -4.2);
//  Boutique   — tall narrow, soft pink, NW
makeBuilding(0xF0A8B8, 0x9040A0, 1.6, 2.8, 1.6, -4.8, -4.2);
//  Bakery     — wide low, warm terracotta, S
makeBuilding(0xD4905C, 0x883020,  2.8, 1.8, 2.2,  0.0,  5.0);

// Trees
makeTree(-2.8, -2.8);
makeTree( 2.8, -2.8);
makeTree(-2.8,  2.8);
makeTree( 2.8,  3.5);
makeTree(-5.5,  1.5);

// Bushes
makeBush(-1.2, -4.2, 0.38);
makeBush( 1.2, -4.2, 0.32);
makeBush(-4.0,  0.5, 0.40);
makeBush( 4.5,  0.5, 0.35);

// Rocks
makeRock(-3.8,  3.2, 0.30);
makeRock( 1.6,  4.8, 0.24);
makeRock( 5.5, -1.2, 0.26);

// Bench near center
makeBench(1.6, 0.9, -0.3);

// ─── Keyboard ─────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup',   (e) => { keys[e.code] = false; });

// ─── Movement constants ───────────────────────────────────────────────────────
const MOVE_SPEED = 2.0;
const BOUND = 6;

// ─── Model ────────────────────────────────────────────────────────────────────
let capy    = null;
let groundY = 0;
let mixer   = null;
const clock  = new THREE.Clock();

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
      capy.position.x += moveDir.x * MOVE_SPEED * delta;
      capy.position.z += moveDir.z * MOVE_SPEED * delta;
      capy.position.x  = Math.max(-BOUND, Math.min(BOUND, capy.position.x));
      capy.position.z  = Math.max(-BOUND, Math.min(BOUND, capy.position.z));
      capy.position.y  = groundY;
      capy.rotation.y  = Math.atan2(moveDir.x, moveDir.z);
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
