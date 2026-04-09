import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('pushable', {
  schema: {
    force: { type: 'number', default: 2.5 },
    event: { type: 'string', default: 'xr:interact-use' }
  },

  init: function () {
    this._dir = new THREE.Vector3();
    this._onPush = (e) => {
      const interactor = e?.detail?.interactor || this.el;
      interactor.object3D.getWorldDirection(this._dir);
      this._dir.multiplyScalar(-this.data.force);

      if (this.el.components['rigid-body']) {
        this.el.emit('xr:physics-impulse', { x: this._dir.x, y: this._dir.y, z: this._dir.z });
      } else {
        this.el.object3D.position.addScaledVector(this._dir, 0.06);
      }

      emitXrEvent(this.el, 'pushed', { interactor, force: this.data.force });
    };

    this.el.addEventListener(this.data.event, this._onPush);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onPush);
  }
});
