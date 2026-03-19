import * as THREE from 'three';

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export class TransformController {
  constructor({ camera, domElement, orbitControls, getSelection, onTransform, snapState }) {
    this.camera = camera;
    this.domElement = domElement;
    this.orbitControls = orbitControls;
    this.getSelection = getSelection;
    this.onTransform = onTransform;
    this.snapState = snapState;
    this.raycaster = new THREE.Raycaster();
    this.dragging = null;
  }

  connect() {
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  disconnect() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  onPointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const selected = this.getSelection();
    if (!selected) {
      return;
    }

    const intersections = this.intersectObject(event, selected);
    if (intersections.length === 0) {
      return;
    }

    const hitPoint = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(GROUND_PLANE, hitPoint)) {
      return;
    }

    this.dragging = {
      object: selected,
      offsetX: selected.position.x - hitPoint.x,
      offsetZ: selected.position.z - hitPoint.z,
    };
    this.orbitControls.enabled = false;
  };

  onPointerMove = (event) => {
    if (!this.dragging) {
      return;
    }

    const hitPoint = new THREE.Vector3();
    this.updateRaycaster(event);
    if (!this.raycaster.ray.intersectPlane(GROUND_PLANE, hitPoint)) {
      return;
    }

    let nextX = hitPoint.x + this.dragging.offsetX;
    let nextZ = hitPoint.z + this.dragging.offsetZ;

    if (this.snapState.enabled) {
      nextX = this.snap(nextX);
      nextZ = this.snap(nextZ);
    }

    this.dragging.object.position.x = nextX;
    this.dragging.object.position.z = nextZ;
    this.dragging.object.position.y = this.snapState.keepOnGround ? 0 : this.dragging.object.position.y;
    this.onTransform?.(this.dragging.object);
  };

  onPointerUp = () => {
    if (!this.dragging) {
      return;
    }

    this.dragging = null;
    this.orbitControls.enabled = true;
  };

  intersectObject(event, object) {
    this.updateRaycaster(event);
    const meshes = [];
    object.traverse((node) => {
      if (node.isMesh) {
        meshes.push(node);
      }
    });
    return this.raycaster.intersectObjects(meshes, false);
  }

  updateRaycaster(event) {
    const rect = this.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(pointer, this.camera);
  }

  snap(value) {
    return Math.round(value / this.snapState.step) * this.snapState.step;
  }
}
