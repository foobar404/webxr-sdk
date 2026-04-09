import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('grab-point', {
  schema: {
    offset: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    alignRotation: { type: 'boolean', default: true }
  },

  init: function () {
    this._offset = new THREE.Vector3();
  },

  applyTo: function (targetEl) {
    if (!targetEl) return;
    this._offset.set(this.data.offset.x, this.data.offset.y, this.data.offset.z);
    targetEl.object3D.position.copy(this.el.object3D.position).add(this._offset);
    if (this.data.alignRotation) {
      targetEl.object3D.quaternion.copy(this.el.object3D.quaternion);
    }
    emitXrEvent(this.el, 'grab-point-applied', { target: targetEl });
  }
});

AFRAME.registerComponent('grab-point-target', {
  schema: {
    point: { type: 'selector', default: null },
    event: { type: 'string', default: 'xr:grab-start' }
  },

  init: function () {
    this._onEvent = () => {
      const point = this.data.point;
      if (!point || !point.components['grab-point']) return;
      point.components['grab-point'].applyTo(this.el);
    };
    this.el.addEventListener(this.data.event, this._onEvent);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onEvent);
  }
});
