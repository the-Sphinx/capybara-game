import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0xBFE3FF);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.5, 4.5);
camera.lookAt(0, 0.5, 0);

const CAM_OFFSET = new THREE.Vector3(0, 2.5, 4.5);
const CAM_LERP = 0.1;
const camTarget = new THREE.Vector3();

// Lights
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;
scene.add(dirLight);

// Ground plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshLambertMaterial({ color: 0x88CC88 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Keyboard state
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup',   (e) => { keys[e.code] = false; });

// Movement constants
const MOVE_SPEED = 2.0;
const BOUND = 6;

// Model reference & ground offset
let capy = null;
let groundY = 0;

// Load model
let mixer = null;
const clock = new THREE.Clock();
const loader = new GLTFLoader();

const furMaterial = new THREE.MeshStandardMaterial({
  color: 0xE3A68C,
  roughness: 0.85,
  metalness: 0.0,
});

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

    const box = new THREE.Box3().setFromObject(capy);
    const size = new THREE.Vector3();
    box.getSize(size);
    groundY = size.y / 2;
    capy.position.y = groundY;

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(capy);
      const action = mixer.clipAction(gltf.animations[0]);
      action.setLoop(THREE.LoopRepeat);
      action.play();
    }
  },
  undefined,
  (err) => console.error('Failed to load model:', err)
);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const moveDir = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (capy) {
    // Build movement direction from keyboard state
    moveDir.set(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp'])    moveDir.z -= 1;
    if (keys['KeyS'] || keys['ArrowDown'])  moveDir.z += 1;
    if (keys['KeyA'] || keys['ArrowLeft'])  moveDir.x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();

      // Move
      capy.position.x += moveDir.x * MOVE_SPEED * delta;
      capy.position.z += moveDir.z * MOVE_SPEED * delta;

      // Clamp to bounds
      capy.position.x = Math.max(-BOUND, Math.min(BOUND, capy.position.x));
      capy.position.z = Math.max(-BOUND, Math.min(BOUND, capy.position.z));

      // Keep grounded
      capy.position.y = groundY;

      // Face movement direction
      capy.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }
  }

  // Camera follow
  if (capy) {
    const desired = capy.position.clone().add(CAM_OFFSET);
    camera.position.lerp(desired, CAM_LERP);
    camTarget.copy(capy.position).y += 0.5;
    camera.lookAt(camTarget);
  }

  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

animate();
