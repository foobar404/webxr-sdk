import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('fog-volume', {
  schema: {
    color: { type: 'color', default: '#1a2a3a' },
    near: { type: 'number', default: 1 },
    far: { type: 'number', default: 8 },
    size: { type: 'vec3', default: { x: 2, y: 2, z: 2 } },
    target: { type: 'selector', default: null }
  },

  init: function () {
    this._inside = false;
    this._targetPos = new THREE.Vector3();
    this._localPos = new THREE.Vector3();
    this._prevFog = null;
  },

  tick: function () {
    const scene = this.el.sceneEl;
    if (!scene) return;

    const target = this.data.target || scene.querySelector('[camera]') || scene.querySelector('a-camera');
    if (!target) return;

    target.object3D.getWorldPosition(this._targetPos);
    this._localPos.copy(this._targetPos);
    this.el.object3D.worldToLocal(this._localPos);

    const inside = Math.abs(this._localPos.x) <= this.data.size.x * 0.5 &&
      Math.abs(this._localPos.y) <= this.data.size.y * 0.5 &&
      Math.abs(this._localPos.z) <= this.data.size.z * 0.5;

    if (inside && !this._inside) {
      this._inside = true;
      this._prevFog = scene.getAttribute('fog');
      scene.setAttribute('fog', { type: 'linear', color: this.data.color, near: this.data.near, far: this.data.far });
      emitXrEvent(this.el, 'fog-volume-enter', {});
      return;
    }

    if (!inside && this._inside) {
      this._inside = false;
      if (this._prevFog) scene.setAttribute('fog', this._prevFog);
      else scene.removeAttribute('fog');
      emitXrEvent(this.el, 'fog-volume-exit', {});
    }
  }
});
