import { emitXrEvent, resolveRig } from './core-utils.js';

AFRAME.registerComponent('climbable', {
  schema: {
    enabled: { type: 'boolean', default: true }
  }
});

AFRAME.registerComponent('climb-movement', {
  schema: {
    cameraRig: { type: 'selector', default: null },
    startEvent: { type: 'string', default: 'gripdown' },
    endEvent: { type: 'string', default: 'gripup' },
    selector: { type: 'string', default: '[climbable]' }
  },

  init: function () {
    this.rig = resolveRig(this.el, this.data.cameraRig || null);
    this._climbing = false;
    this._last = new THREE.Vector3();
    this._curr = new THREE.Vector3();

    this._onStart = () => {
      const hit = this.el.components.raycaster?.intersections?.[0];
      const target = hit?.object?.el || hit?.object?.parent?.el || null;
      const climbable = target?.closest ? target.closest(this.data.selector) : null;
      if (!climbable?.components?.climbable?.data.enabled || !this.rig) return;

      this._climbing = true;
      this.el.object3D.getWorldPosition(this._last);
      emitXrEvent(this.el, 'climb-start', { target: climbable });
    };

    this._onEnd = () => {
      if (!this._climbing) return;
      this._climbing = false;
      emitXrEvent(this.el, 'climb-end', {});
    };

    this.el.addEventListener(this.data.startEvent, this._onStart);
    this.el.addEventListener(this.data.endEvent, this._onEnd);
  },

  remove: function () {
    this.el.removeEventListener(this.data.startEvent, this._onStart);
    this.el.removeEventListener(this.data.endEvent, this._onEnd);
  },

  tick: function () {
    if (!this._climbing || !this.rig) return;
    this.el.object3D.getWorldPosition(this._curr);
    const delta = this._curr.clone().sub(this._last);
    this.rig.object3D.position.sub(delta);
    this._last.copy(this._curr);
  }
});
