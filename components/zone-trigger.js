import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('zone-trigger', {
  schema: {
    target: { type: 'selector', default: null },
    shape: { type: 'string', default: 'box' },
    size: { type: 'vec3', default: { x: 2, y: 2, z: 2 } },
    radius: { type: 'number', default: 1.5 },
    enterEvent: { type: 'string', default: 'xr:zone-enter' },
    exitEvent: { type: 'string', default: 'xr:zone-exit' },
    stayEvent: { type: 'string', default: 'xr:zone-stay' },
    once: { type: 'boolean', default: false }
  },

  init: function () {
    this._inside = false;
    this._done = false;
    this._targetPos = new THREE.Vector3();
    this._local = new THREE.Vector3();
  },

  tick: function () {
    if (this._done) return;

    const target = this.data.target || this.el.sceneEl?.querySelector('[camera]') || null;
    if (!target) return;

    target.object3D.getWorldPosition(this._targetPos);
    this._local.copy(this._targetPos);
    this.el.object3D.worldToLocal(this._local);

    const inside = this.data.shape === 'sphere'
      ? this._local.length() <= this.data.radius
      : Math.abs(this._local.x) <= this.data.size.x * 0.5 &&
        Math.abs(this._local.y) <= this.data.size.y * 0.5 &&
        Math.abs(this._local.z) <= this.data.size.z * 0.5;

    if (inside && !this._inside) {
      this._inside = true;
      this.el.emit(this.data.enterEvent, { target, zone: this.el });
      emitXrEvent(this.el, 'zone-enter', { target, zone: this.el });
      if (this.data.once) this._done = true;
      return;
    }

    if (!inside && this._inside) {
      this._inside = false;
      this.el.emit(this.data.exitEvent, { target, zone: this.el });
      emitXrEvent(this.el, 'zone-exit', { target, zone: this.el });
      return;
    }

    if (inside) {
      this.el.emit(this.data.stayEvent, { target, zone: this.el });
    }
  }
});
