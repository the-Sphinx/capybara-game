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

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

// ─── Camera ──────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 4.5);
camera.lookAt(0, 0.5, 0);

const CAM_OFFSET = new THREE.Vector3(0, 2.5, 4.5);
const CAM_LERP   = 0.1;
const camTarget  = new THREE.Vector3();

// ─── Lights ──────────────────────────────────────────────────────────────────
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

// ─── Ground ──────────────────────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshLambertMaterial({ color: 0x88CC88 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ─── Collision system ─────────────────────────────────────────────────────────
const colliders = [];

function addCollider(x, z, hw, hd) {
  colliders.push({ x, z, hw, hd });
}

function collides(nx, nz) {
  const r = 0.35;
  for (const c of colliders) {
    if (nx + r > c.x - c.hw && nx - r < c.x + c.hw &&
        nz + r > c.z - c.hd && nz - r < c.z + c.hd) {
      return true;
    }
  }
  return false;
}

// ─── Occlusion system ────────────────────────────────────────────────────────
// Each entry: { mesh: THREE.Mesh, targetOpacity: number }
// Buildings register their wall+roof meshes here with transparent materials.
const occluders = [];
const raycaster  = new THREE.Raycaster();

function updateOcclusion() {
  if (!capy) return;

  // Aim ray at capy upper body
  const capyEye = new THREE.Vector3(
    capy.position.x,
    capy.position.y + 0.5,
    capy.position.z
  );
  const dir     = capyEye.clone().sub(camera.position).normalize();
  const maxDist = camera.position.distanceTo(capyEye);
  raycaster.set(camera.position, dir);

  const meshList   = occluders.map(o => o.mesh);
  const hits       = raycaster.intersectObjects(meshList, false);
  const inTheWay   = new Set(
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

// ─── Interaction system ───────────────────────────────────────────────────────
const interactables = [
  {
    id:      'boutique',
    label:   'Boutique',
    message: 'This building will open the fashion boutique later.',
    zone: { x: -6.0, z: -3.5, hw: 1.3, hd: 0.9 },
  },
  {
    id:      'capy-store',
    label:   'Capy Store',
    message: 'This building will open the capy customization screen later.',
    zone: { x: 6.0, z: -3.1, hw: 1.9, hd: 1.0 },
  },
  {
    id:      'bakery',
    label:   'Bakery',
    message: 'This building will open the bakery shop later.',
    zone: { x: 0.0, z: 4.0, hw: 2.2, hd: 0.9 },
  },
];

let activeTarget = null;
let modalOpen    = false;

function getActiveInteractable(cx, cz) {
  for (const b of interactables) {
    const z = b.zone;
    if (Math.abs(cx - z.x) < z.hw && Math.abs(cz - z.z) < z.hd) return b;
  }
  return null;
}

// ─── Interaction UI ───────────────────────────────────────────────────────────
const promptEl = document.createElement('div');
Object.assign(promptEl.style, {
  display: 'none', position: 'fixed', bottom: '60px', left: '50%',
  transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)',
  color: 'white', padding: '10px 24px', borderRadius: '8px',
  fontFamily: 'sans-serif', fontSize: '16px',
  pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: '10',
});
document.body.appendChild(promptEl);

const modalEl = document.createElement('div');
Object.assign(modalEl.style, {
  display: 'none', position: 'fixed', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)', background: 'rgba(20,20,30,0.92)',
  color: 'white', padding: '40px 52px', borderRadius: '14px',
  fontFamily: 'sans-serif', minWidth: '300px', textAlign: 'center',
  zIndex: '20', boxSizing: 'border-box',
});
document.body.appendChild(modalEl);

function openModal(building) {
  modalOpen = true;
  promptEl.style.display = 'none';
  modalEl.innerHTML =
    `<h2 style="margin:0 0 14px;font-size:22px">${building.label}</h2>` +
    `<p style="margin:0 0 24px;color:#ddd;line-height:1.6">${building.message}</p>` +
    `<p style="font-size:13px;color:#888">Press [E] or [Esc] to close</p>`;
  modalEl.style.display = 'block';
}

function closeModal() {
  modalOpen = false;
  modalEl.style.display = 'none';
}

// ─── Village helpers ──────────────────────────────────────────────────────────

function makeBuilding(wallColor, roofColor, w, h, d, x, z) {
  const group = new THREE.Group();

  // Each building gets its own material instances for independent opacity control
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
const pathMat = new THREE.MeshLambertMaterial({ color: 0xD4B896 });
const ewPath  = new THREE.Mesh(new THREE.BoxGeometry(22, 0.02, 3.2), pathMat);
ewPath.position.y = 0.01;
scene.add(ewPath);

const nsPath  = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 22), pathMat);
nsPath.position.y = 0.01;
scene.add(nsPath);

const plaza = new THREE.Mesh(
  new THREE.BoxGeometry(5.5, 0.025, 5.5),
  new THREE.MeshLambertMaterial({ color: 0xDDC8A8 })
);
plaza.position.y = 0.015;
scene.add(plaza);

makeBuilding(0xF0A8B8, 0x9040A0,  2.6, 4.5, 2.6,  -6.0, -6.0); // Boutique
makeBuilding(0xD4905C, 0x883020,  4.5, 2.8, 3.6,   0.0,  7.0);  // Bakery

// Capy Store — real GLB asset (NE, replaces placeholder box)
// Box collider kept for smooth movement
addCollider(6.0, -6.0, 2.25, 1.9);
const capyStoreLoader = new GLTFLoader();
capyStoreLoader.load(
  `${import.meta.env.BASE_URL}buildings/capy_store.glb`,
  (gltf) => {
    const model = gltf.scene;
    // Sit exactly on ground using bounding box
    const bbox = new THREE.Box3().setFromObject(model);
    model.position.set(6.0, -bbox.min.y, -6.0);
    // Register every submesh with occlusion system (unique material per mesh)
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

makeTree(-3.5, -3.5);
makeTree( 3.5, -3.5);
makeTree(-4.0,  3.2);
makeTree( 4.0,  3.8);
makeTree(-7.0,  1.5);

makeBush(-1.8, -5.0, 0.50);
makeBush( 1.8, -5.0, 0.44);
makeBush(-5.0,  0.8, 0.52);
makeBush( 5.5,  0.8, 0.46);

makeRock(-4.5,  3.8, 0.42);
makeRock( 2.0,  6.0, 0.36);
makeRock( 7.0, -1.5, 0.38);

makeBench(2.0, 1.2, -0.3);

// ─── Keyboard ────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE') {
    if (modalOpen) closeModal();
    else if (activeTarget) openModal(activeTarget);
  }
  if (e.code === 'Escape' && modalOpen) closeModal();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// ─── Movement constants ───────────────────────────────────────────────────────
const MOVE_SPEED = 2.0;
const BOUND      = 8;

// ─── Model ───────────────────────────────────────────────────────────────────
// Equipped accessories — add/remove entries here to change what capy wears.
// scale: 1.0 means use the model at its exported size.
const EQUIPPED_ACCESSORIES = [
  { anchor: 'hat_anchor', path: 'crown.glb', scale: 1.0, tiltX: -7 },
  // { anchor: 'face_anchor', path: 'glasses.glb', scale: 1.0, tiltX: 0 },
];

let capy    = null;
let groundY = 0;
let mixer   = null;
const clock = new THREE.Clock();

// Map from anchor name → { mount: Object3D, bone: Object3D }
const accessoryMounts = {};

function loadAccessories(capyScene) {
  for (const acc of EQUIPPED_ACCESSORIES) {
    const bone = capyScene.getObjectByName(acc.anchor);
    if (!bone) { console.warn(`Anchor not found: ${acc.anchor}`); continue; }
    const mount = new THREE.Object3D();
    scene.add(mount);
    accessoryMounts[acc.anchor] = { mount, bone };

    const ldr = new GLTFLoader();
    ldr.load(
      `${import.meta.env.BASE_URL}${acc.path}`,
      (gltf) => {
        const mesh = gltf.scene;
        mesh.scale.setScalar(acc.scale);
        if (acc.tiltX) mesh.rotation.x = THREE.MathUtils.degToRad(acc.tiltX);
        mount.add(mesh);
      },
      undefined,
      (err) => console.error(`Failed to load ${acc.path}:`, err)
    );
  }
}

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

    loadAccessories(capy);
  },
  undefined,
  (err) => console.error('Failed to load model:', err)
);

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animate ─────────────────────────────────────────────────────────────────
const moveDir = new THREE.Vector3();
const _wp     = new THREE.Vector3(); // reused each frame for accessory tracking

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (capy) {
    if (!modalOpen) {
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
        if (!collides(nx, capy.position.z)) capy.position.x = nx;
        if (!collides(capy.position.x, nz)) capy.position.z = nz;
        capy.position.y = groundY;
      }
    }

    if (!modalOpen) {
      activeTarget = getActiveInteractable(capy.position.x, capy.position.z);
      promptEl.textContent = activeTarget ? `Press [E] to enter ${activeTarget.label}` : '';
      promptEl.style.display = activeTarget ? 'block' : 'none';
    }

    updateOcclusion();

    const desired = capy.position.clone().add(CAM_OFFSET);
    camera.position.lerp(desired, CAM_LERP);
    camTarget.copy(capy.position);
    camTarget.y += 0.5;
    camera.lookAt(camTarget);
  }

  if (mixer) mixer.update(delta);

  // Track each accessory mount: world position from bone, yaw from capy
  // (tiltX is applied in mesh-local space, so forwarding capy yaw keeps
  //  the tilt pointing toward capy's back regardless of walk direction)
  if (capy && Object.keys(accessoryMounts).length > 0) {
    capy.updateWorldMatrix(true, true);
    for (const { mount, bone } of Object.values(accessoryMounts)) {
      bone.getWorldPosition(_wp);
      mount.position.copy(_wp);
      mount.rotation.y = capy.rotation.y;
    }
  }

  renderer.render(scene, camera);
}

animate();
