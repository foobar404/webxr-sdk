import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('softbody', {
  schema: {
    amplitude: { type: 'number', default: 0.05 },
    speed: { type: 'number', default: 3.5 },
    idle: { type: 'boolean', default: true }
  },

  init: function () {
    this._baseScale = this.el.object3D.scale.clone();
    this._pulse = 0;

    this._onImpact = () => {
      this._pulse = 1;
      emitXrEvent(this.el, 'softbody-impact', {});
    };

    this.el.addEventListener('xr:damage', this._onImpact);
    this.el.addEventListener('xr:physics-impulse', this._onImpact);
  },

  remove: function () {
    this.el.removeEventListener('xr:damage', this._onImpact);
    this.el.removeEventListener('xr:physics-impulse', this._onImpact);
    this.el.object3D.scale.copy(this._baseScale);
  },

  tick: function (time, dtMs) {
    if (!dtMs) return;
    if (this.data.idle) this._pulse = Math.min(1, this._pulse + 0.006);
    this._pulse = Math.max(0, this._pulse - dtMs / 600);

    const wobble = Math.sin(time * 0.001 * this.data.speed) * this.data.amplitude * this._pulse;
    this.el.object3D.scale.set(
      this._baseScale.x + wobble,
      this._baseScale.y - wobble * 0.6,
      this._baseScale.z + wobble
    );
  }
});
