import * as THREE from 'three';
import './style.css';
import { gameState, ACCESSORIES, EQUIPPED, SELECTED, MOVE_SPEED, BOUND } from './state.js';
import { initScene, buildVillage, collides, updateOcclusion, getActiveInteractable } from './world.js';
import { loadCapy, accessoryMounts, previewAccessoryMounts, previewState } from './capy.js';
import { promptEl, openModal, closeModal, openCloset, closeCloset } from './ui.js';
import { closeHub } from './ui/HubModal.js';
import { gameManager } from './games/GameManager.js';
import { WatermelonCatchGame } from './games/watermelonCatch/WatermelonCatchGame.js';
import { MathGardenGame } from './games/mathGarden/MathGardenGame.js';
import { LanguageGroveGame } from './games/languageGrove/LanguageGroveGame.js';
import wmcAdventure from './games/watermelonCatch/adventure.json';
import wmcArcade from './games/watermelonCatch/arcade.json';
import mgAdventure from './games/mathGarden/adventure.json';
import mgArcade from './games/mathGarden/arcade.json';
import lgAdventure from './games/languageGrove/adventure.json';
import lgArcade from './games/languageGrove/arcade.json';
import { soundManager } from './audio/SoundManager.js';
import { SOUND_CONFIG } from './config/sounds.js';
import { saveManager } from './SaveManager.js';
import { updateNPCs } from './npc.js';

// ─── Scene setup ──────────────────────────────────────────────────────────────
const { renderer, scene, camera, clock, camTarget, CAM_OFFSET, CAM_LERP } = initScene();
buildVillage(scene);
saveManager.load();   // must run before loadCapy reads EQUIPPED
loadCapy(scene);

// ─── Audio ────────────────────────────────────────────────────────────────────
soundManager.load(SOUND_CONFIG);

// ─── Register minigames ───────────────────────────────────────────────────────
gameManager.register('watermelon_catch', (cfg) => new WatermelonCatchGame(cfg));
gameManager.registerLevels('watermelon_catch', wmcAdventure);
gameManager.registerArcadeConfig('watermelon_catch', wmcArcade);

gameManager.register('math_garden', (cfg) => new MathGardenGame(cfg));
gameManager.registerLevels('math_garden', mgAdventure);
gameManager.registerArcadeConfig('math_garden', mgArcade);

gameManager.register('language_grove', (cfg) => new LanguageGroveGame(cfg));
gameManager.registerLevels('language_grove', lgAdventure);
gameManager.registerArcadeConfig('language_grove', lgArcade);

// Dev helpers
window.ACCESSORIES   = ACCESSORIES;
window._openCloset   = () => openCloset();
window._startGame    = (id) => gameManager.startGame(id);
window._saveManager  = saveManager;

// ─── Keyboard ─────────────────────────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE') {
    if (gameManager.isGameRunning())     return;
    if (gameState.closetOpen)            closeCloset();
    else if (gameState.hubOpen)          closeHub();
    else if (gameState.modalOpen)        closeModal();
    else if (gameState.activeTarget)     openModal(gameState.activeTarget);
  }
  if (e.code === 'Escape' && gameState.modalOpen) {
    if (gameManager.isGameRunning())     return;
    if (gameState.closetOpen)            closeCloset();
    else if (gameState.hubOpen)          closeHub();
    else                                 closeModal();
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animate ──────────────────────────────────────────────────────────────────
const moveDir = new THREE.Vector3();
const _wp     = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  gameManager.update(delta);
  updateNPCs(delta);

  const { capy, mixer, groundY } = gameState;

  if (capy) {
    if (!gameState.modalOpen) {
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

    if (!gameState.modalOpen) {
      gameState.activeTarget = getActiveInteractable(capy.position.x, capy.position.z);
      promptEl.textContent = gameState.activeTarget
        ? (gameState.activeTarget.prompt ?? `Press [E] to enter ${gameState.activeTarget.label}`) : '';
      promptEl.classList.toggle('ui-prompt--visible', !!gameState.activeTarget);
    }

    updateOcclusion(camera);

    const desired = capy.position.clone().add(CAM_OFFSET);
    camera.position.lerp(desired, CAM_LERP);
    camTarget.copy(capy.position);
    camTarget.y += 1.0;
    camera.lookAt(camTarget);
  }

  if (mixer) mixer.update(delta);

  // Track main scene accessory mounts
  if (capy && Object.keys(accessoryMounts).length > 0) {
    capy.updateWorldMatrix(true, true);
    for (const [anchorName, { mount, bone }] of Object.entries(accessoryMounts)) {
      bone.getWorldPosition(_wp);
      const accId = EQUIPPED[anchorName];
      const off   = accId && ACCESSORIES[accId]?.offset;
      if (off && (off.x || off.y || off.z)) {
        const yaw = capy.rotation.y;
        _wp.x += off.x * Math.cos(yaw) + off.z * Math.sin(yaw);
        _wp.y += off.y;
        _wp.z += -off.x * Math.sin(yaw) + off.z * Math.cos(yaw);
      }
      mount.position.copy(_wp);
      mount.rotation.y = capy.rotation.y;
    }
  }

  // Preview scene updates
  const pvCapy     = previewState.capy;
  const pvMixer    = previewState.mixer;
  const pvRenderer = previewState.renderer;
  const pvScene    = previewState.scene;
  const pvCamera   = previewState.camera;
  const pvTweak    = previewState.tweak;
  const _pwp       = previewState._pwp;

  if (pvMixer) pvMixer.update(delta);
  if (pvCapy && gameState.closetOpen) pvCapy.rotation.y += delta * 0.6;

  if (pvCapy && gameState.closetOpen && Object.keys(previewAccessoryMounts).length > 0) {
    pvCapy.updateWorldMatrix(true, true);
    for (const [anchorName, { mount, bone }] of Object.entries(previewAccessoryMounts)) {
      bone.getWorldPosition(_pwp);
      const accId = SELECTED[anchorName];
      const off   = accId && ACCESSORIES[accId]?.offset;
      if (off && (off.x || off.y || off.z)) {
        const yaw = pvCapy.rotation.y;
        _pwp.x += off.x * Math.cos(yaw) + off.z * Math.sin(yaw);
        _pwp.y += off.y;
        _pwp.z += -off.x * Math.sin(yaw) + off.z * Math.cos(yaw);
      }
      mount.position.copy(_pwp);
      mount.rotation.y = pvCapy.rotation.y;
    }
  }

  renderer.render(scene, camera);

  if (gameState.closetOpen && pvRenderer && pvScene && pvCamera) {
    if (pvCapy) {
      pvCapy.position.z = pvTweak.capyZ;
      pvCapy.scale.setScalar(pvTweak.capyScale);
    }
    pvCamera.position.set(0, pvTweak.camY, pvTweak.camZ);
    pvCamera.lookAt(0, 0.55, 0);
    pvRenderer.render(pvScene, pvCamera);
  }
}

animate();
