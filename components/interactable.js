import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('interactable', {
  schema: {
    enabled: { type: 'boolean', default: true },
    hoverState: { type: 'string', default: 'is-hovered' },
    pressedState: { type: 'string', default: 'is-pressed' },
    useEvent: { type: 'string', default: 'click' }
  },

  init: function () {
    this.hovered = false;
    this.pressed = false;

    this._onIntersected = (e) => {
      const interactor = e?.detail?.el || null;
      this.setHovered(true, interactor);
    };

    this._onIntersectedCleared = (e) => {
      const interactor = e?.detail?.el || null;
      this.setHovered(false, interactor);
    };

    this._onPress = (e) => {
      if (!this.data.enabled) return;
      const interactor = e?.detail?.interactor || e?.detail?.el || null;
      this.pressed = true;
      this.el.addState(this.data.pressedState);
      emitXrEvent(this.el, 'interact-press', { interactor });
    };

    this._onRelease = (e) => {
      if (!this.pressed) return;
      const interactor = e?.detail?.interactor || e?.detail?.el || null;
      this.pressed = false;
      this.el.removeState(this.data.pressedState);
      emitXrEvent(this.el, 'interact-release', { interactor });
    };

    this._onUse = (e) => {
      if (!this.data.enabled) return;
      const interactor = e?.detail?.interactor || e?.detail?.el || e?.target || null;
      emitXrEvent(this.el, 'interact-use', { interactor }, 'use');
    };

    this.el.addEventListener('raycaster-intersected', this._onIntersected);
    this.el.addEventListener('raycaster-intersected-cleared', this._onIntersectedCleared);
    this.el.addEventListener('xr:interact-press', this._onPress);
    this.el.addEventListener('xr:interact-release', this._onRelease);
    this.el.addEventListener(this.data.useEvent, this._onUse);
  },

  update: function (oldData) {
    if (oldData.useEvent && oldData.useEvent !== this.data.useEvent) {
      this.el.removeEventListener(oldData.useEvent, this._onUse);
      this.el.addEventListener(this.data.useEvent, this._onUse);
    }
  },

  remove: function () {
    this.el.removeEventListener('raycaster-intersected', this._onIntersected);
    this.el.removeEventListener('raycaster-intersected-cleared', this._onIntersectedCleared);
    this.el.removeEventListener('xr:interact-press', this._onPress);
    this.el.removeEventListener('xr:interact-release', this._onRelease);
    this.el.removeEventListener(this.data.useEvent, this._onUse);
    this.el.removeState(this.data.hoverState);
    this.el.removeState(this.data.pressedState);
  },

  setHovered: function (isHovered, interactor) {
    if (!this.data.enabled || this.hovered === isHovered) return;

    this.hovered = isHovered;
    if (isHovered) {
      this.el.addState(this.data.hoverState);
      emitXrEvent(this.el, 'interact-hover-start', { interactor });
      return;
    }

    this.el.removeState(this.data.hoverState);
    emitXrEvent(this.el, 'interact-hover-end', { interactor });
  }
});
