import * as THREE from 'three';

export class SelectionController {
  constructor(scene) {
    this.scene = scene;
    this.selectedObject = null;
    this.boxHelper = new THREE.BoxHelper();
    this.boxHelper.material.depthTest = false;
    this.boxHelper.material.transparent = true;
    this.boxHelper.material.opacity = 0.95;
    this.boxHelper.material.color.setHex(0xffc857);
    this.boxHelper.visible = false;
    this.scene.add(this.boxHelper);
  }

  setSelection(objectRoot) {
    this.selectedObject = objectRoot ?? null;
    this.update();
  }

  clear() {
    this.setSelection(null);
  }

  getSelected() {
    return this.selectedObject;
  }

  update() {
    if (!this.selectedObject) {
      this.boxHelper.visible = false;
      return;
    }

    this.boxHelper.setFromObject(this.selectedObject);
    this.boxHelper.visible = true;
  }
}
