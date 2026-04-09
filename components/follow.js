import { resolveCamera } from './core-utils.js';

AFRAME.registerComponent('follow', {
  schema: {
    target: { type: 'selector', default: null },
    offset: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    speed: { type: 'number', default: 6 },
    snapDistance: { type: 'number', default: 8 }
  },

  init: function () {
    this._targetPos = new THREE.Vector3();
    this._selfPos = new THREE.Vector3();
    this._offset = new THREE.Vector3();
  },

  tick: function (time, dtMs) {
    const targetEl = this.data.target || resolveCamera(this.el.sceneEl);
    if (!targetEl || !dtMs) return;

    const alpha = Math.min(1, (this.data.speed * dtMs) / 1000);
    this._offset.set(this.data.offset.x, this.data.offset.y, this.data.offset.z);

    targetEl.object3D.getWorldPosition(this._targetPos);
    this._targetPos.add(this._offset);

    this.el.object3D.getWorldPosition(this._selfPos);
    const parent = this.el.object3D.parent || null;
    if (this._selfPos.distanceTo(this._targetPos) > this.data.snapDistance) {
      const snapLocal = parent ? parent.worldToLocal(this._targetPos.clone()) : this._targetPos;
      this.el.object3D.position.copy(snapLocal);
      return;
    }

    const nextWorld = this._selfPos.clone().lerp(this._targetPos, alpha);
    const nextLocal = parent ? parent.worldToLocal(nextWorld) : nextWorld;
    this.el.object3D.position.copy(nextLocal);
  }
});

AFRAME.registerComponent('look-at-target', {
  schema: {
    target: { type: 'selector', default: null },
    lockY: { type: 'boolean', default: false },
    forward: { type: 'string', default: '-z' }
  },

  init: function () {
    this._targetPos = new THREE.Vector3();
    this._selfPos = new THREE.Vector3();
    this._mat = new THREE.Matrix4();
    this._quat = new THREE.Quaternion();
    this._correction = new THREE.Quaternion();
    this._up = new THREE.Vector3(0, 1, 0);
    this._setCorrection();
  },

  update: function () {
    this._setCorrection();
  },

  tick: function () {
    const targetEl = this.data.target || resolveCamera(this.el.sceneEl);
    if (!targetEl) return;

    targetEl.object3D.getWorldPosition(this._targetPos);
    if (this.data.lockY) {
      this.el.object3D.getWorldPosition(this._selfPos);
      this._targetPos.y = this._selfPos.y;
    }

    this.el.object3D.getWorldPosition(this._selfPos);
    this._mat.lookAt(this._selfPos, this._targetPos, this._up);
    this._quat.setFromRotationMatrix(this._mat);
    this.el.object3D.quaternion.copy(this._quat).multiply(this._correction);
  },

  _setCorrection: function () {
    this._correction.identity();
    const forward = String(this.data.forward || '-z').toLowerCase();
    if (forward === 'y') {
      this._correction.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      return;
    }
    if (forward === '-y') {
      this._correction.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      return;
    }
    if (forward === 'x') {
      this._correction.setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      return;
    }
    if (forward === '-x') {
      this._correction.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
    }
  }
});
