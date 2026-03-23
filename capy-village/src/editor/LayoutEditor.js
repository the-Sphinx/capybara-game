import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

import initialLayout from '../../../layouts/village_hub_v1.json';
import playerPreviewUrl from '../../../assets/game_ready/models/characters/capy_idle.glb?url';
import { AssetPalette } from './AssetPalette.js';
import { getAssetRegistry } from './assetRegistry.js';
import { LayoutEditorUI } from './LayoutEditorUI.js';
import { DEFAULT_PLAYER_TRANSFORM, LayoutSerializer } from './LayoutSerializer.js';
import { computeFootprintCollider, createFootprintRegistry, getSharedFootprint, normalizeFootprint, serializeFootprintRegistry } from '../footprints.js';
import { SelectionController } from './SelectionController.js';
import { TransformController } from './TransformController.js';

const DEFAULT_CAMERA_POSITION = new THREE.Vector3(10, 8, 10);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0.75, 0);
const PLAYER_PREVIEW_ID = 'player_preview';

function addEditorPlazaBase(scene) {
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

function cloneAssetScene(scene) {
  let hasSkinnedMesh = false;
  scene.traverse((node) => {
    if (node.isSkinnedMesh) {
      hasSkinnedMesh = true;
    }
  });

  const clone = hasSkinnedMesh ? SkeletonUtils.clone(scene) : scene.clone(true);
  clone.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.material = Array.isArray(node.material)
        ? node.material.map((material) => material.clone())
        : node.material.clone();
    }
  });
  return clone;
}

function toDegrees(radians) {
  return THREE.MathUtils.radToDeg(radians);
}

function toRadians(degrees) {
  return THREE.MathUtils.degToRad(degrees);
}

function vectorToForm(object3D) {
  return {
    x: object3D.x.toFixed(2),
    y: object3D.y.toFixed(2),
    z: object3D.z.toFixed(2),
  };
}

function uniformScaleToForm(object3D) {
  return {
    x: object3D.x.toFixed(2),
    y: object3D.y.toFixed(2),
    z: object3D.z.toFixed(2),
  };
}

function clonePlayerTransform(player) {
  return {
    position: [...player.position],
    rotation: [...player.rotation],
  };
}

function formatFootprintForPanel(footprint) {
  if (!footprint) {
    return null;
  }

  return {
    type: footprint.type,
    radius: footprint.radius?.toFixed(2) ?? '',
    width: footprint.width?.toFixed(2) ?? '',
    depth: footprint.depth?.toFixed(2) ?? '',
    offsetX: (footprint.offsetX ?? 0).toFixed(2),
    offsetZ: (footprint.offsetZ ?? 0).toFixed(2),
    rotationOffset: Math.round(THREE.MathUtils.radToDeg(footprint.rotationOffset ?? 0)).toString(),
  };
}

export class LayoutEditor {
  constructor(host) {
    this.host = host;
    this.assets = [];
    this.assetMap = new Map();
    this.assetCache = new Map();
    this.layoutObjects = new Map();
    this.loader = new GLTFLoader();
    this.snapState = { enabled: true, step: 0.5, keepOnGround: true };
    this.gridVisible = true;
    this.scaleLockEnabled = true;
    this.nextObjectIndex = 1;
    this.layoutName = initialLayout.layoutName || 'village_hub_v1';
    this.playerPreviewCache = null;
    this.playerPreview = null;
    this.footprintsVisible = false;
    this.propertyPanelMode = 'main';
    this.footprintRegistry = createFootprintRegistry();
  }

  async init() {
    this.assets = getAssetRegistry();
    if (this.assets.length === 0) {
      throw new Error('Asset registry could not be loaded or is empty.');
    }

    this.assets.forEach((asset) => {
      this.assetMap.set(asset.id, asset);
    });

    this.ui = new LayoutEditorUI({
      assets: this.assets,
      onAction: (action) => this.handleAction(action),
      onFieldChange: (field, value) => this.handleFieldChange(field, value),
    });
    this.ui.mount(this.host);
    this.ui.setLayoutName(this.layoutName);

    this.assetPalette = new AssetPalette({
      assets: this.assets,
      onSpawn: (assetId) => void this.spawnAssetById(assetId),
    });
    this.assetPalette.render(this.ui.getAssetListElement());

    this.initScene();
    this.bindSelection();
    await this.loadLayoutData(initialLayout, { replace: true, silent: true });
    this.ui.setStatus('Editor ready. Load a layout or spawn an asset from the palette.');
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcde7ff);
    this.scene.fog = new THREE.Fog(0xcde7ff, 28, 48);

    const viewport = this.ui.getViewportElement();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    viewport.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, viewport.clientWidth / viewport.clientHeight, 0.1, 200);
    this.resetCameraView();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.copy(DEFAULT_CAMERA_TARGET);
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 50;

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(10, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    this.scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0xb9d8a3, roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'EditorGround';
    this.ground = ground;
    this.scene.add(ground);
    addEditorPlazaBase(this.scene);

    this.gridHelper = new THREE.GridHelper(60, 120, 0x426241, 0x7fa070);
    this.gridHelper.position.y = 0.01;
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.84;
    this.scene.add(this.gridHelper);

    this.sceneObjectsGroup = new THREE.Group();
    this.scene.add(this.sceneObjectsGroup);

    this.selectionController = new SelectionController(this.scene);
    this.footprintOverlayGroup = new THREE.Group();
    this.footprintOverlayGroup.visible = this.footprintsVisible;
    this.scene.add(this.footprintOverlayGroup);
    this.raycaster = new THREE.Raycaster();
    this.renderer.domElement.addEventListener('pointerdown', this.handleViewportPointerDown);

    this.transformController = new TransformController({
      camera: this.camera,
      domElement: this.renderer.domElement,
      orbitControls: this.controls,
      getSelection: () => this.selectionController.getSelected(),
      onTransform: (objectRoot) => this.onObjectTransformed(objectRoot),
      snapState: this.snapState,
    });
    this.transformController.connect();

    window.addEventListener('resize', this.handleResize);
    this.animate();
  }

  bindSelection() {
    this.updateSelectionPanel(null);
  }

  animate = () => {
    this.animationFrame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.selectionController.update();
    this.renderer.render(this.scene, this.camera);
  };

  handleResize = () => {
    const viewport = this.ui.getViewportElement();
    this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  };

  getSelectableRoots() {
    const roots = [...this.layoutObjects.values()].map((entry) => entry.root);
    if (this.playerPreview?.root) {
      roots.push(this.playerPreview.root);
    }
    return roots;
  }

  handleViewportPointerDown = (event) => {
    if (event.button !== 0 || this.transformController.dragging) {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(pointer, this.camera);

    const meshes = [];
    for (const root of this.getSelectableRoots()) {
      root.traverse((node) => {
        if (node.isMesh) {
          meshes.push(node);
        }
      });
    }

    const [hit] = this.raycaster.intersectObjects(meshes, false);
    if (!hit) {
      this.selectObject(null);
      return;
    }

    let current = hit.object;
    while (current && !current.userData.editorObjectId) {
      current = current.parent;
    }

    if (current?.userData.editorObjectId) {
      this.selectObject(current);
    }
  };

  handleAction(action) {
    switch (action) {
      case 'new-layout':
        void this.newLayout();
        break;
      case 'load-layout':
        void this.openLayoutPicker();
        break;
      case 'save-layout':
        this.saveLayout();
        break;
      case 'duplicate-selected':
        void this.duplicateSelected();
        break;
      case 'delete-selected':
        this.deleteSelected();
        break;
      case 'toggle-snap':
        this.snapState.enabled = !this.snapState.enabled;
        this.ui.setToggleState('toggle-snap', this.snapState.enabled);
        this.ui.setStatus(`Snap ${this.snapState.enabled ? 'enabled' : 'disabled'} (${this.snapState.step} unit grid).`);
        break;
      case 'toggle-grid':
        this.gridVisible = !this.gridVisible;
        this.gridHelper.visible = this.gridVisible;
        this.ui.setToggleState('toggle-grid', this.gridVisible);
        this.ui.setStatus(`Grid ${this.gridVisible ? 'shown' : 'hidden'}.`);
        break;
      case 'reset-view':
        this.resetCameraView();
        this.controls.target.copy(DEFAULT_CAMERA_TARGET);
        this.controls.update();
        this.ui.setStatus('Editor camera reset.');
        break;
      case 'reset-rotation':
        this.applySelectionMutation((root) => root.rotation.set(0, 0, 0), 'Rotation reset.');
        break;
      case 'reset-scale':
        this.applySelectionMutation((root) => root.scale.set(1, 1, 1), 'Scale reset to 1.', { requireScaleEditable: true });
        break;
      case 'move-to-ground':
        this.applySelectionMutation((root) => {
          root.position.y = 0;
        }, 'Selected object moved to ground.');
        break;
      case 'toggle-scale-lock':
        this.scaleLockEnabled = !this.scaleLockEnabled;
        this.updateSelectionPanel(this.selectionController.getSelected());
        this.ui.setStatus(`Scale lock ${this.scaleLockEnabled ? 'enabled' : 'disabled'}.`);
        break;
      case 'toggle-footprints':
        this.footprintsVisible = !this.footprintsVisible;
        this.ui.setToggleState('toggle-footprints', this.footprintsVisible);
        this.refreshFootprintOverlays();
        this.ui.setStatus(`Footprint overlays ${this.footprintsVisible ? 'shown' : 'hidden'}.`);
        break;
      case 'open-footprint-editor':
        if (!this.selectionController.getSelected() || this.isPlayerRoot(this.selectionController.getSelected())) {
          this.ui.setStatus('Select a world object first.', 'warning');
          return;
        }
        this.propertyPanelMode = 'footprint';
        this.ui.setPropertyPanelMode('footprint');
        this.updateSelectionPanel(this.selectionController.getSelected());
        break;
      case 'close-footprint-editor':
        this.propertyPanelMode = 'main';
        this.ui.setPropertyPanelMode('main');
        this.updateSelectionPanel(this.selectionController.getSelected());
        break;
      case 'save-footprints':
        this.saveFootprints();
        break;
      default:
        break;
    }
  }

  handleFieldChange(field, value) {
    if (field === 'layoutName') {
      this.layoutName = value.trim() || 'village_hub_v1';
      return;
    }

    const selected = this.selectionController.getSelected();
    if (!selected || !Number.isFinite(value.value)) {
      return;
    }

    if (field === 'position') {
      selected.position[value.axis] = value.value;
    }

    if (field === 'rotation') {
      selected.rotation[value.axis] = toRadians(value.value);
    }

    if (field === 'scale' && !this.isPlayerRoot(selected)) {
      if (this.scaleLockEnabled) {
        selected.scale.setScalar(value.value);
      } else {
        selected.scale[value.axis] = value.value;
      }
    }

    if (field === 'footprint' && !this.isPlayerRoot(selected)) {
      const assetId = selected.userData.assetId;
      if (!assetId) {
        return;
      }

      const base = getSharedFootprint(assetId, this.footprintRegistry) ?? {
        type: 'circle',
        radius: 1,
        offsetX: 0,
        offsetZ: 0,
        rotationOffset: 0,
      };

      const next = { ...base };
      if (value.field === 'type') {
        if (value.value === 'circle') {
          next.type = 'circle';
          next.radius = Number.isFinite(next.radius) ? next.radius : 1;
          delete next.width;
          delete next.depth;
        } else {
          next.type = 'rect';
          next.width = Number.isFinite(next.width) ? next.width : 1;
          next.depth = Number.isFinite(next.depth) ? next.depth : 1;
          delete next.radius;
        }
      } else if (value.field === 'rotationOffset') {
        next.rotationOffset = toRadians(value.value);
      } else {
        next[value.field] = value.value;
      }

      const normalized = normalizeFootprint(next);
      if (normalized) {
        this.footprintRegistry[assetId] = normalized;
      }
      this.refreshFootprintOverlays();
    }

    this.onObjectTransformed(selected);
  }

  async loadAssetTemplate(assetId) {
    const asset = this.assetMap.get(assetId);
    if (!asset) {
      throw new Error(`Asset "${assetId}" does not exist in the registry.`);
    }

    if (!asset.url) {
      throw new Error(`Normalized asset path missing for "${assetId}". Expected ${asset.output}.`);
    }

    if (!this.assetCache.has(assetId)) {
      const gltf = await this.loader.loadAsync(asset.url);
      this.assetCache.set(assetId, gltf.scene);
    }

    return cloneAssetScene(this.assetCache.get(assetId));
  }

  async loadPlayerPreviewTemplate() {
    if (!this.playerPreviewCache) {
      const gltf = await this.loader.loadAsync(playerPreviewUrl);
      this.playerPreviewCache = gltf.scene;
    }

    return cloneAssetScene(this.playerPreviewCache);
  }

  async ensurePlayerPreview(playerTransform = DEFAULT_PLAYER_TRANSFORM) {
    if (!this.playerPreview?.root) {
      const previewAsset = await this.loadPlayerPreviewTemplate();
      const root = new THREE.Group();
      root.name = PLAYER_PREVIEW_ID;
      root.userData.editorObjectId = PLAYER_PREVIEW_ID;
      root.userData.editorKind = 'player';
      root.userData.assetId = 'capy_idle';
      root.add(previewAsset);
      root.scale.set(1, 1, 1);
      this.sceneObjectsGroup.add(root);
      this.playerPreview = { root };
    }

    this.playerPreview.root.position.set(...playerTransform.position);
    this.playerPreview.root.rotation.set(
      toRadians(playerTransform.rotation[0]),
      toRadians(playerTransform.rotation[1]),
      toRadians(playerTransform.rotation[2]),
    );
    this.playerPreview.root.scale.set(1, 1, 1);
    return this.playerPreview.root;
  }

  async spawnAssetById(assetId, transform = null) {
    try {
      const assetRoot = await this.loadAssetTemplate(assetId);
      const objectId = transform?.id ?? this.generateObjectId();
      const instanceRoot = new THREE.Group();
      instanceRoot.name = objectId;
      instanceRoot.userData.editorObjectId = objectId;
      instanceRoot.userData.editorKind = 'object';
      instanceRoot.userData.assetId = assetId;
      instanceRoot.add(assetRoot);

      const spawnPosition = transform?.position
        ? new THREE.Vector3(...transform.position)
        : this.getSpawnPosition();
      const spawnRotation = transform?.rotation ?? [0, 0, 0];
      const spawnScale = transform?.scale ?? [1, 1, 1];

      instanceRoot.position.copy(spawnPosition);
      instanceRoot.rotation.set(
        toRadians(spawnRotation[0]),
        toRadians(spawnRotation[1]),
        toRadians(spawnRotation[2]),
      );
      instanceRoot.scale.set(spawnScale[0], spawnScale[1], spawnScale[2]);

      this.sceneObjectsGroup.add(instanceRoot);
      this.layoutObjects.set(objectId, {
        id: objectId,
        assetId,
        root: instanceRoot,
      });
      this.selectObject(instanceRoot);
      this.onObjectTransformed(instanceRoot);
      this.ui.setStatus(`Spawned ${assetId} as ${objectId}.`);
      return instanceRoot;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.ui.setStatus(message, 'error');
      console.error(error);
      return null;
    }
  }

  getSpawnPosition() {
    const offset = this.layoutObjects.size * 0.75;
    return new THREE.Vector3(
      this.controls.target.x + (offset % 3) - 1,
      0,
      this.controls.target.z + Math.floor(offset / 3) * 0.75,
    );
  }

  generateObjectId() {
    let candidate = '';
    do {
      candidate = `obj_${String(this.nextObjectIndex).padStart(3, '0')}`;
      this.nextObjectIndex += 1;
    } while (this.layoutObjects.has(candidate));
    return candidate;
  }

  isPlayerRoot(root) {
    return root?.userData.editorKind === 'player';
  }

  getSelectionDetails(root) {
    const isPlayer = this.isPlayerRoot(root);
    return {
      id: root.userData.editorObjectId,
      typeLabel: isPlayer ? 'player' : 'world-object',
      assetName: isPlayer ? 'capy_idle' : root.userData.assetId,
      position: vectorToForm(root.position),
      rotation: {
        x: Math.round(toDegrees(root.rotation.x)).toString(),
        y: Math.round(toDegrees(root.rotation.y)).toString(),
        z: Math.round(toDegrees(root.rotation.z)).toString(),
      },
      scale: uniformScaleToForm(root.scale),
      scaleLocked: this.scaleLockEnabled,
      showScale: !isPlayer,
      scaleEditable: !isPlayer,
      canDuplicate: !isPlayer,
      canDelete: !isPlayer,
      canEditFootprint: !isPlayer,
      footprintEditable: !isPlayer,
      footprint: isPlayer ? null : formatFootprintForPanel(
        getSharedFootprint(root.userData.assetId, this.footprintRegistry),
      ),
    };
  }

  selectObject(root) {
    this.selectionController.setSelection(root);
    this.updateSelectionPanel(root);
  }

  updateSelectionPanel(root) {
    if (!root) {
      this.propertyPanelMode = 'main';
      this.ui.setPropertyPanelMode('main');
      this.ui.updateSelection(null);
      this.ui.updateFootprintEditor(null);
      return;
    }

    const details = this.getSelectionDetails(root);
    if (this.isPlayerRoot(root) && this.propertyPanelMode === 'footprint') {
      this.propertyPanelMode = 'main';
    }
    this.ui.setPropertyPanelMode(this.propertyPanelMode);
    this.ui.updateSelection(details);
    this.ui.updateFootprintEditor(details);
  }

  onObjectTransformed(root) {
    if (this.isPlayerRoot(root)) {
      root.scale.set(1, 1, 1);
    }

    this.selectionController.update();
    this.refreshFootprintOverlays();
    this.updateSelectionPanel(root);
  }

  applySelectionMutation(mutate, statusMessage, { requireScaleEditable = false } = {}) {
    const selected = this.selectionController.getSelected();
    if (!selected) {
      this.ui.setStatus('Select an object first.', 'warning');
      return;
    }

    if (requireScaleEditable && this.isPlayerRoot(selected)) {
      this.ui.setStatus('Player Preview scale is locked.', 'warning');
      return;
    }

    mutate(selected);
    this.onObjectTransformed(selected);
    this.ui.setStatus(statusMessage);
  }

  async duplicateSelected() {
    const selected = this.selectionController.getSelected();
    if (!selected) {
      this.ui.setStatus('Select an object first.', 'warning');
      return;
    }

    if (this.isPlayerRoot(selected)) {
      this.ui.setStatus('Player Preview cannot be duplicated.', 'warning');
      return;
    }

    const duplicate = await this.spawnAssetById(selected.userData.assetId, {
      position: [selected.position.x + 0.75, selected.position.y, selected.position.z + 0.75],
      rotation: [toDegrees(selected.rotation.x), toDegrees(selected.rotation.y), toDegrees(selected.rotation.z)],
      scale: [selected.scale.x, selected.scale.y, selected.scale.z],
    });

    if (duplicate) {
      this.ui.setStatus(`Duplicated ${selected.userData.editorObjectId}.`);
    }
  }

  deleteSelected() {
    const selected = this.selectionController.getSelected();
    if (!selected) {
      this.ui.setStatus('Select an object first.', 'warning');
      return;
    }

    if (this.isPlayerRoot(selected)) {
      this.ui.setStatus('Player Preview cannot be deleted.', 'warning');
      return;
    }

    const objectId = selected.userData.editorObjectId;
    this.layoutObjects.delete(objectId);
    this.sceneObjectsGroup.remove(selected);
    this.refreshFootprintOverlays();
    this.selectObject(null);
    this.ui.setStatus(`Deleted ${objectId}.`);
  }

  async newLayout() {
    if (this.layoutObjects.size > 0 && !window.confirm('Clear the current layout and start a new one?')) {
      return;
    }

    await this.loadLayoutData(LayoutSerializer.createEmptyLayout(this.ui.getLayoutName()), { replace: true, silent: true });
    this.ui.setStatus('Started a new layout with Player Preview.');
  }

  getPlayerTransform() {
    if (!this.playerPreview?.root) {
      return clonePlayerTransform(DEFAULT_PLAYER_TRANSFORM);
    }

    return {
      position: [
        this.playerPreview.root.position.x,
        this.playerPreview.root.position.y,
        this.playerPreview.root.position.z,
      ],
      rotation: [
        toDegrees(this.playerPreview.root.rotation.x),
        toDegrees(this.playerPreview.root.rotation.y),
        toDegrees(this.playerPreview.root.rotation.z),
      ],
    };
  }

  saveLayout() {
    const serialized = LayoutSerializer.serialize(
      this.ui.getLayoutName(),
      this.getPlayerTransform(),
      [...this.layoutObjects.values()].map((entry) => ({
        id: entry.id,
        assetId: entry.assetId,
        position: [entry.root.position.x, entry.root.position.y, entry.root.position.z],
        rotation: [toDegrees(entry.root.rotation.x), toDegrees(entry.root.rotation.y), toDegrees(entry.root.rotation.z)],
        scale: [entry.root.scale.x, entry.root.scale.y, entry.root.scale.z],
      })),
    );

    const validation = LayoutSerializer.validate(serialized);
    if (!validation.valid) {
      this.ui.setStatus(validation.error, 'error');
      return;
    }

    const blob = new Blob([`${JSON.stringify(serialized, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${serialized.layoutName || 'layout'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.ui.setStatus(`Saved ${serialized.layoutName}.json`);
  }

  async openLayoutPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const [file] = input.files ?? [];
      if (!file) {
        return;
      }

      const text = await file.text();
      const parsed = LayoutSerializer.parse(text);
      if (!parsed.layout) {
        this.ui.setStatus(parsed.error, 'error');
        return;
      }

      await this.loadLayoutData(parsed.layout, { replace: true });
    });
    input.click();
  }

  async loadLayoutData(layout, { replace = false, silent = false } = {}) {
    const validation = LayoutSerializer.validate(layout);
    if (!validation.valid) {
      this.ui.setStatus(validation.error, 'error');
      return false;
    }

    const missingAssets = layout.objects.filter((object) => !this.assetMap.has(object.assetId));
    if (missingAssets.length > 0) {
      this.ui.setStatus(`AssetId in layout does not exist in registry: ${missingAssets[0].assetId}`, 'error');
      return false;
    }

    if (replace && this.layoutObjects.size > 0) {
      this.clearLayoutObjects();
    }

    this.layoutName = layout.layoutName;
    this.ui.setLayoutName(layout.layoutName);

    this.clearLayoutObjects();
    await this.ensurePlayerPreview(layout.player ?? DEFAULT_PLAYER_TRANSFORM);

    for (const object of layout.objects) {
      await this.spawnAssetById(object.assetId, object);
    }

    this.selectObject(this.playerPreview?.root ?? null);

    this.syncNextObjectIndex();
    if (!silent) {
      this.ui.setStatus(`Loaded layout "${layout.layoutName}" with Player Preview and ${layout.objects.length} object(s).`);
    }
    return true;
  }

  clearLayoutObjects() {
    for (const entry of this.layoutObjects.values()) {
      this.sceneObjectsGroup.remove(entry.root);
    }
      this.layoutObjects.clear();
    this.refreshFootprintOverlays();
    this.selectObject(null);
  }

  syncNextObjectIndex() {
    let maxId = 0;
    for (const objectId of this.layoutObjects.keys()) {
      const value = Number(objectId.replace('obj_', ''));
      if (Number.isFinite(value)) {
        maxId = Math.max(maxId, value);
      }
    }
    this.nextObjectIndex = maxId + 1;
  }

  resetCameraView() {
    this.camera.position.copy(DEFAULT_CAMERA_POSITION);
    this.camera.lookAt(DEFAULT_CAMERA_TARGET);
  }

  refreshFootprintOverlays() {
    if (!this.footprintOverlayGroup) {
      return;
    }

    const selected = this.selectionController?.getSelected() ?? null;
    const showSelectedOnly = this.propertyPanelMode === 'footprint' && !!selected && !this.isPlayerRoot(selected);
    this.footprintOverlayGroup.visible = this.footprintsVisible || showSelectedOnly;
    this.footprintOverlayGroup.clear();

    if (!this.footprintsVisible && !showSelectedOnly) {
      return;
    }

    const selectedAssetId = selected?.userData?.assetId ?? null;
    for (const entry of this.layoutObjects.values()) {
      if (showSelectedOnly && entry.assetId !== selectedAssetId) {
        continue;
      }

      const collider = computeFootprintCollider(entry.root, entry.assetId, this.footprintRegistry);
      if (!collider) {
        continue;
      }
      this.footprintOverlayGroup.add(this.createFootprintOverlay(collider, selected === entry.root));
    }
  }

  createFootprintOverlay(collider, selected = false) {
    const group = new THREE.Group();
    const fillColor = selected ? 0xaee4ff : 0xbfefff;
    const borderColor = selected ? 0x134f8d : 0x2c6ca8;
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: fillColor,
      transparent: true,
      opacity: selected ? 0.34 : 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const lineMaterial = new THREE.LineBasicMaterial({
      color: borderColor,
      transparent: true,
      opacity: 0.95,
    });

    if (collider.type === 'circle') {
      const fill = new THREE.Mesh(new THREE.CircleGeometry(collider.radius, 48), fillMaterial);
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(collider.x, 0.035, collider.z);
      fill.renderOrder = 20;
      group.add(fill);

      const points = [];
      for (let i = 0; i < 48; i += 1) {
        const angle = (i / 48) * Math.PI * 2;
        points.push(new THREE.Vector3(
          collider.x + Math.cos(angle) * collider.radius,
          0.055,
          collider.z + Math.sin(angle) * collider.radius,
        ));
      }
      const border = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), lineMaterial);
      border.renderOrder = 21;
      group.add(border);
      return group;
    }

    const fill = new THREE.Mesh(new THREE.PlaneGeometry(collider.width, collider.depth), fillMaterial);
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(collider.x, 0.035, collider.z);
    fill.rotation.y = collider.rotation;
    fill.renderOrder = 20;
    group.add(fill);

    const hw = collider.width / 2;
    const hd = collider.depth / 2;
    const corners = [
      new THREE.Vector3(-hw, 0.055, -hd),
      new THREE.Vector3(hw, 0.055, -hd),
      new THREE.Vector3(hw, 0.055, hd),
      new THREE.Vector3(-hw, 0.055, hd),
    ];
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(corners);
    const border = new THREE.LineLoop(borderGeometry, lineMaterial);
    border.position.set(collider.x, 0, collider.z);
    border.rotation.y = collider.rotation;
    border.renderOrder = 21;
    group.add(border);

    return group;
  }

  saveFootprints() {
    const serialized = serializeFootprintRegistry(this.footprintRegistry);
    const blob = new Blob([`${JSON.stringify(serialized, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'collider_footprints.json';
    link.click();
    URL.revokeObjectURL(url);
    this.ui.setStatus('Saved collider_footprints.json');
  }
}
