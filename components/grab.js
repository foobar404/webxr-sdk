import { emitXrEvent } from './core-utils.js';

if (!AFRAME.components.grabbable) {
  AFRAME.registerComponent('grabbable', {
    schema: {
      enabled: { type: 'boolean', default: true }
    },

    init: function () {
      this.grabbed = false;
      this.interactor = null;
    },

    setGrabbed: function (grabbed, interactor) {
      if (!this.data.enabled || this.grabbed === grabbed) return;

      this.grabbed = grabbed;
      this.interactor = grabbed ? interactor : null;
      if (grabbed) {
        this.el.addState('grabbed');
        emitXrEvent(this.el, 'grab-start', { interactor });
        return;
      }

      this.el.removeState('grabbed');
      emitXrEvent(this.el, 'grab-end', { interactor });
    }
  });
}

if (!AFRAME.components['grab-interactor']) {
AFRAME.registerComponent('grab-interactor', {
  schema: {
    enabled: { type: 'boolean', default: true },
    startEvent: { type: 'string', default: 'gripdown' },
    endEvent: { type: 'string', default: 'gripup' }
  },

  init: function () {
    this.grabbedEl = null;
    this.originalParent = null;

    this._onStart = () => this.startGrab();
    this._onEnd = () => this.endGrab();

    this.el.addEventListener(this.data.startEvent, this._onStart);
    this.el.addEventListener(this.data.endEvent, this._onEnd);
  },

  update: function (oldData) {
    if (oldData.startEvent && oldData.startEvent !== this.data.startEvent) {
      this.el.removeEventListener(oldData.startEvent, this._onStart);
      this.el.addEventListener(this.data.startEvent, this._onStart);
    }

    if (oldData.endEvent && oldData.endEvent !== this.data.endEvent) {
      this.el.removeEventListener(oldData.endEvent, this._onEnd);
      this.el.addEventListener(this.data.endEvent, this._onEnd);
    }
  },

  remove: function () {
    this.endGrab();
    this.el.removeEventListener(this.data.startEvent, this._onStart);
    this.el.removeEventListener(this.data.endEvent, this._onEnd);
  },

  startGrab: function () {
    if (!this.data.enabled || this.grabbedEl) return;

    const target = this._getTarget();
    if (!target || !target.components.grabbable) return;

    this.grabbedEl = target;
    this.originalParent = target.object3D.parent;

    this.el.object3D.attach(target.object3D);
    if (typeof target.components.grabbable.setGrabbed === 'function') {
      target.components.grabbable.setGrabbed(true, this.el);
    } else {
      target.addState('grabbed');
      target.emit('grab-start', { interactor: this.el });
      target.emit('xr:grab-start', { interactor: this.el });
    }
    emitXrEvent(this.el, 'grab-start', { target });
  },

  endGrab: function () {
    if (!this.grabbedEl) return;

    const target = this.grabbedEl;
    if (this.originalParent) {
      this.originalParent.attach(target.object3D);
    } else {
      target.sceneEl.object3D.add(target.object3D);
    }

    if (target.components.grabbable && typeof target.components.grabbable.setGrabbed === 'function') {
      target.components.grabbable.setGrabbed(false, this.el);
    } else {
      target.removeState('grabbed');
      target.emit('grab-end', { interactor: this.el });
      target.emit('xr:grab-end', { interactor: this.el });
    }

    emitXrEvent(this.el, 'grab-end', { target });
    this.grabbedEl = null;
    this.originalParent = null;
  },

  _getTarget: function () {
    const ray = this.el.components.raycaster;
    const hit = ray && ray.intersections && ray.intersections.length ? ray.intersections[0] : null;
    if (!hit || !hit.object) return null;

    let node = hit.object;
    while (node && !node.el) node = node.parent;
    if (!node || !node.el) return null;

    const targetEl = node.el;
    if (targetEl.components.grabbable) return targetEl;
    return targetEl.closest('[grabbable]');
  }
});
}
