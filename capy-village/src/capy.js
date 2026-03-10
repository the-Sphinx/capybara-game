import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { gameState, ACCESSORIES, EQUIPPED, SELECTED } from './state.js';

// ─── Shared materials ─────────────────────────────────────────────────────────
const furMaterial = new THREE.MeshStandardMaterial({
  color: 0xE3A68C, roughness: 0.85, metalness: 0.0,
});
const eyeWhiteMaterial = new THREE.MeshStandardMaterial({
  color: 0xF0EDE8, roughness: 0.25, metalness: 0.0,
});
const eyeDarkMaterial = new THREE.MeshStandardMaterial({
  color: 0x1A1A1F, roughness: 0.05, metalness: 0.0,
});

// ─── Exported state ───────────────────────────────────────────────────────────
export const accessoryMounts        = {};
export const previewAccessoryMounts = {};

export const previewState = {
  renderer: null,
  scene:    null,
  camera:   null,
  capy:     null,
  mixer:    null,
  tweak: { capyZ: 0.5, capyScale: 1.0, camY: 2.0, camZ: 4.5 },
  _pwp: new THREE.Vector3(),
};
window._previewTweak = previewState.tweak;

const _iconCache = {};

// ─── Material helper ──────────────────────────────────────────────────────────
function applyMaterial(mesh, acc) {
  if (acc.colors !== undefined) {
    const mats = Object.fromEntries(
      Object.entries(acc.colors).map(([key, col]) => {
        const mat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: acc.roughness ?? 0.8,
          metalness: acc.metalness ?? 0.0,
          side: acc.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
        });
        if (acc.polygonOffsetPart && key === acc.polygonOffsetPart) {
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = -2;
          mat.polygonOffsetUnits  = -2;
        }
        return [key, mat];
      })
    );
    mesh.traverse((node) => {
      if (!node.isMesh) return;
      for (const [key, mat] of Object.entries(mats)) {
        if (node.name.includes(key)) { node.material = mat; break; }
      }
    });
  } else if (acc.color !== undefined) {
    const mat = new THREE.MeshStandardMaterial({
      color: acc.color,
      roughness: acc.roughness ?? 0.8,
      metalness: acc.metalness ?? 0.0,
      side: acc.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    });
    mesh.traverse((node) => { if (node.isMesh) node.material = mat; });
  }
}

// ─── Main capy equipment ──────────────────────────────────────────────────────
export function equipAccessory(anchorName, accId) {
  const entry = accessoryMounts[anchorName];
  if (!entry) { console.warn(`Anchor not ready: ${anchorName}`); return; }

  while (entry.mount.children.length) {
    entry.mount.remove(entry.mount.children[0]);
  }

  EQUIPPED[anchorName] = accId;
  if (!accId) return;

  const acc = ACCESSORIES[accId];
  if (!acc) { console.warn(`Unknown accessory: ${accId}`); return; }

  const ldr = new GLTFLoader();
  ldr.load(
    `${import.meta.env.BASE_URL}${acc.path}`,
    (gltf) => {
      const mesh = gltf.scene;
      mesh.scale.setScalar(acc.scale);
      if (acc.tiltX) mesh.rotation.x = THREE.MathUtils.degToRad(acc.tiltX);
      applyMaterial(mesh, acc);
      entry.mount.add(mesh);
    },
    undefined,
    (err) => console.error(`Failed to load ${acc.path}:`, err)
  );
}

function loadAccessories(capyScene, scene) {
  for (const [anchorName, accId] of Object.entries(EQUIPPED)) {
    const bone = capyScene.getObjectByName(anchorName);
    if (!bone) { console.warn(`Anchor not found: ${anchorName}`); continue; }
    const mount = new THREE.Object3D();
    scene.add(mount);
    accessoryMounts[anchorName] = { mount, bone };
    if (accId) equipAccessory(anchorName, accId);
  }
}

// ─── Main capy loader ─────────────────────────────────────────────────────────
export function loadCapy(scene) {
  const loader = new GLTFLoader();
  loader.load(
    `${import.meta.env.BASE_URL}capy_idle.glb`,
    (gltf) => {
      const capy = gltf.scene;
      scene.add(capy);
      capy.traverse((node) => {
        if (!node.isMesh) return;
        node.castShadow = true;
        node.receiveShadow = true;
        const matName = node.material?.name ?? '';
        if (matName === 'mat_eye_white' || node.name.startsWith('eye_white')) node.material = eyeWhiteMaterial;
        else if (matName === 'mat_eye_dark' || node.name.startsWith('eye_dark')) node.material = eyeDarkMaterial;
        else node.material = furMaterial;
      });
      const box  = new THREE.Box3().setFromObject(capy);
      const size = new THREE.Vector3();
      box.getSize(size);
      gameState.groundY = size.y / 2;
      capy.position.y   = gameState.groundY;

      if (gltf.animations?.length > 0) {
        const mixer = new THREE.AnimationMixer(capy);
        const action = mixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        gameState.mixer = mixer;
      }
      gameState.capy = capy;
      loadAccessories(capy, scene);
    },
    undefined,
    (err) => console.error('Failed to load model:', err)
  );
}

// ─── Preview accessory equipment ─────────────────────────────────────────────
export function equipPreviewAccessory(anchorName, accId) {
  SELECTED[anchorName] = accId;

  const entry = previewAccessoryMounts[anchorName];
  if (!entry) return; // mounts not ready yet; capy load callback will apply SELECTED

  while (entry.mount.children.length) {
    entry.mount.remove(entry.mount.children[0]);
  }

  if (!accId) return;

  const acc = ACCESSORIES[accId];
  if (!acc) return;

  const ldr = new GLTFLoader();
  ldr.load(
    `${import.meta.env.BASE_URL}${acc.path}`,
    (gltf) => {
      const mesh = gltf.scene;
      mesh.scale.setScalar(acc.scale);
      if (acc.tiltX) mesh.rotation.x = THREE.MathUtils.degToRad(acc.tiltX);
      applyMaterial(mesh, acc);
      entry.mount.add(mesh);
    },
    undefined,
    (err) => console.error(`Preview: failed to load ${acc.path}:`, err)
  );
}

// ─── Accessory icon rendering (offscreen, cached) ─────────────────────────────
export function renderAccessoryIcon(accId, onReady) {
  if (_iconCache[accId]) { onReady(_iconCache[accId]); return; }

  const acc = ACCESSORIES[accId];
  if (!acc) return;

  const iconRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  iconRenderer.setPixelRatio(1);
  iconRenderer.setSize(128, 128);
  iconRenderer.outputColorSpace = THREE.SRGBColorSpace;

  const iconScene  = new THREE.Scene();
  iconScene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const iLight = new THREE.DirectionalLight(0xffffff, 1.1);
  iLight.position.set(2, 4, 3);
  iconScene.add(iLight);

  const iconCamera = new THREE.PerspectiveCamera(40, 1, 0.01, 30);

  const ldr = new GLTFLoader();
  ldr.load(
    `${import.meta.env.BASE_URL}${acc.path}`,
    (gltf) => {
      const mesh = gltf.scene;
      mesh.scale.setScalar(acc.scale);
      applyMaterial(mesh, acc);
      iconScene.add(mesh);

      const bbox   = new THREE.Box3().setFromObject(mesh);
      const center = bbox.getCenter(new THREE.Vector3());
      const size   = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov    = iconCamera.fov * (Math.PI / 180);
      const dist   = (maxDim / (2 * Math.tan(fov / 2))) * 1.6;
      iconCamera.position.set(center.x + maxDim * 0.15, center.y + maxDim * 0.1, center.z + dist);
      iconCamera.lookAt(center);

      iconRenderer.render(iconScene, iconCamera);
      const dataURL = iconRenderer.domElement.toDataURL('image/png');
      _iconCache[accId] = dataURL;
      iconRenderer.dispose();
      onReady(dataURL);
    },
    undefined,
    () => { iconRenderer.dispose(); }
  );
}

// ─── Preview scene init (lazy, called once on first openCloset) ───────────────
export function initPreviewScene(previewColEl) {
  if (previewState.renderer) return; // already initialised

  const pvRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  pvRenderer.setPixelRatio(window.devicePixelRatio);
  pvRenderer.setSize(400, 400);
  pvRenderer.outputColorSpace = THREE.SRGBColorSpace;
  pvRenderer.domElement.className = 'closet-preview-canvas';
  previewColEl.insertBefore(pvRenderer.domElement, previewColEl.firstChild);
  previewState.renderer = pvRenderer;

  const pvScene = new THREE.Scene();
  pvScene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const pvLight = new THREE.DirectionalLight(0xffffff, 1.2);
  pvLight.position.set(3, 6, 4);
  pvScene.add(pvLight);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.70, 0.1, 32),
    new THREE.MeshStandardMaterial({ color: 0xC4926A, roughness: 0.8 })
  );
  disc.position.y = -0.05;
  pvScene.add(disc);

  const pvCamera = new THREE.PerspectiveCamera(45, 485 / 493, 0.1, 50);
  pvCamera.position.set(0, 1.1, 3.4);
  pvCamera.lookAt(0, 0.55, 0);

  previewState.scene  = pvScene;
  previewState.camera = pvCamera;

  const pvLoader = new GLTFLoader();
  pvLoader.load(
    `${import.meta.env.BASE_URL}capy_idle.glb`,
    (gltf) => {
      const pvCapy = gltf.scene;
      pvCapy.traverse((node) => {
        if (!node.isMesh) return;
        const matName = node.material?.name ?? '';
        if (matName === 'mat_eye_white' || node.name.startsWith('eye_white')) {
          node.material = eyeWhiteMaterial.clone();
        } else if (matName === 'mat_eye_dark' || node.name.startsWith('eye_dark')) {
          node.material = eyeDarkMaterial.clone();
        } else {
          node.material = furMaterial.clone();
        }
      });

      const pvBbox = new THREE.Box3().setFromObject(pvCapy);
      pvCapy.position.y = -pvBbox.min.y;
      pvCapy.position.z  = previewState.tweak.capyZ;
      pvCapy.scale.setScalar(previewState.tweak.capyScale);
      pvScene.add(pvCapy);

      if (gltf.animations?.length > 0) {
        const pvMixer = new THREE.AnimationMixer(pvCapy);
        const action  = pvMixer.clipAction(gltf.animations[0]);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        previewState.mixer = pvMixer;
      }
      previewState.capy = pvCapy;

      for (const anchorName of Object.keys(EQUIPPED)) {
        const bone = pvCapy.getObjectByName(anchorName);
        if (!bone) { console.warn(`Preview: anchor not found: ${anchorName}`); continue; }
        const mount = new THREE.Object3D();
        pvScene.add(mount);
        previewAccessoryMounts[anchorName] = { mount, bone };
      }

      for (const [anch, accId] of Object.entries(SELECTED)) {
        if (accId) equipPreviewAccessory(anch, accId);
      }
    },
    undefined,
    (err) => console.error('Preview capy load failed:', err)
  );
}
