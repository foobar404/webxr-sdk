import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('ray-interactor', {
  schema: {
    enabled: { type: 'boolean', default: true },
    pressEvent: { type: 'string', default: 'triggerdown' },
    releaseEvent: { type: 'string', default: 'triggerup' },
    useEvent: { type: 'string', default: 'triggerdown' }
  },

  init: function () {
    this._onPress = () => this._dispatch('press');
    this._onRelease = () => this._dispatch('release');
    this._onUse = () => this._dispatch('use');

    this.el.addEventListener(this.data.pressEvent, this._onPress);
    this.el.addEventListener(this.data.releaseEvent, this._onRelease);
    this.el.addEventListener(this.data.useEvent, this._onUse);
  },

  update: function (oldData) {
    if (oldData.pressEvent && oldData.pressEvent !== this.data.pressEvent) {
      this.el.removeEventListener(oldData.pressEvent, this._onPress);
      this.el.addEventListener(this.data.pressEvent, this._onPress);
    }

    if (oldData.releaseEvent && oldData.releaseEvent !== this.data.releaseEvent) {
      this.el.removeEventListener(oldData.releaseEvent, this._onRelease);
      this.el.addEventListener(this.data.releaseEvent, this._onRelease);
    }

    if (oldData.useEvent && oldData.useEvent !== this.data.useEvent) {
      this.el.removeEventListener(oldData.useEvent, this._onUse);
      this.el.addEventListener(this.data.useEvent, this._onUse);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.pressEvent, this._onPress);
    this.el.removeEventListener(this.data.releaseEvent, this._onRelease);
    this.el.removeEventListener(this.data.useEvent, this._onUse);
  },

  _dispatch: function (kind) {
    if (!this.data.enabled) return;

    const target = this._getTarget();
    if (!target) return;

    const detail = { interactor: this.el, target };

    if (kind === 'press') {
      target.emit('xr:interact-press', detail);
      emitXrEvent(this.el, 'interactor-press', { target });
      return;
    }

    if (kind === 'release') {
      target.emit('xr:interact-release', detail);
      emitXrEvent(this.el, 'interactor-release', { target });
      return;
    }

    target.emit('xr:interact-use', detail);
    target.emit('click', detail);
    emitXrEvent(this.el, 'interactor-use', { target });
  },

  _getTarget: function () {
    const ray = this.el.components.raycaster;
    const hit = ray && ray.intersections && ray.intersections.length ? ray.intersections[0] : null;
    if (!hit || !hit.object) return null;

    let node = hit.object;
    while (node && !node.el) node = node.parent;
    if (!node || !node.el) return null;

    const targetEl = node.el;
    if (targetEl.components.interactable) return targetEl;
    return targetEl.closest('[interactable]');
  }
});
