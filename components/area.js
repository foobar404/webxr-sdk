import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('area', {
  schema: {
    target: { type: 'selector', default: null },
    shape: { type: 'string', default: 'box' },
    size: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    radius: { type: 'number', default: 0.6 },
    enterEvent: { type: 'string', default: 'xr:area-enter' },
    exitEvent: { type: 'string', default: 'xr:area-exit' },
    stayEvent: { type: 'string', default: 'xr:area-stay' }
  },

  init: function () {
    this._inside = false;
    this._targetPos = new THREE.Vector3();
    this._localPos = new THREE.Vector3();
  },

  tick: function () {
    const target = this.data.target || this.el.sceneEl?.querySelector('#rig') || this.el.sceneEl?.querySelector('[camera]');
    if (!target) return;

    target.object3D.getWorldPosition(this._targetPos);
    this._localPos.copy(this._targetPos);
    this.el.object3D.worldToLocal(this._localPos);

    const inside = this.data.shape === 'sphere'
      ? this._localPos.length() <= this.data.radius
      : Math.abs(this._localPos.x) <= this.data.size.x * 0.5 &&
        Math.abs(this._localPos.y) <= this.data.size.y * 0.5 &&
        Math.abs(this._localPos.z) <= this.data.size.z * 0.5;

    if (inside && !this._inside) {
      this._inside = true;
      this.el.emit(this.data.enterEvent, { target, area: this.el });
      emitXrEvent(this.el, 'area-enter', { target, area: this.el });
      return;
    }

    if (!inside && this._inside) {
      this._inside = false;
      this.el.emit(this.data.exitEvent, { target, area: this.el });
      emitXrEvent(this.el, 'area-exit', { target, area: this.el });
      return;
    }

    if (inside) {
      this.el.emit(this.data.stayEvent, { target, area: this.el });
    }
  }
});
