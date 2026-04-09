import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('geometry-animate', {
  schema: {
    mode: { type: 'string', default: 'spin' },
    speed: { type: 'number', default: 1 },
    amplitude: { type: 'number', default: 0.2 },
    axis: { type: 'vec3', default: { x: 0, y: 1, z: 0 } },
    center: { type: 'selector', default: null }
  },

  init: function () {
    this._basePos = this.el.object3D.position.clone();
    this._baseScale = this.el.object3D.scale.clone();
    this._tmp = new THREE.Vector3();
  },

  tick: function (time, dtMs) {
    if (!dtMs) return;

    const t = time * 0.001 * this.data.speed;
    const axis = this.data.axis;

    if (this.data.mode === 'spin') {
      this.el.object3D.rotation.x += axis.x * dtMs * 0.001;
      this.el.object3D.rotation.y += axis.y * dtMs * 0.001;
      this.el.object3D.rotation.z += axis.z * dtMs * 0.001;
      return;
    }

    if (this.data.mode === 'bob') {
      this.el.object3D.position.set(
        this._basePos.x,
        this._basePos.y + Math.sin(t) * this.data.amplitude,
        this._basePos.z
      );
      return;
    }

    if (this.data.mode === 'pulse') {
      const s = 1 + Math.sin(t) * this.data.amplitude;
      this.el.object3D.scale.set(
        this._baseScale.x * s,
        this._baseScale.y * s,
        this._baseScale.z * s
      );
      return;
    }

    if (this.data.mode === 'orbit') {
      const centerEl = this.data.center;
      if (!centerEl) return;
      centerEl.object3D.getWorldPosition(this._tmp);
      this.el.object3D.position.set(
        this._tmp.x + Math.cos(t) * this.data.amplitude,
        this.el.object3D.position.y,
        this._tmp.z + Math.sin(t) * this.data.amplitude
      );
    }
  }
});

AFRAME.registerComponent('geometry-keyframes', {
  schema: {
    primitive: { type: 'string', default: 'box' },
    values: { type: 'array', default: [0.5, 1, 1.5] },
    intervalMs: { type: 'int', default: 500 },
    loop: { type: 'boolean', default: true }
  },

  init: function () {
    this._index = 0;
    this._timer = 0;
    this._start();
  },

  remove: function () {
    if (this._timer) clearInterval(this._timer);
  },

  _start: function () {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.step(), Math.max(40, this.data.intervalMs));
  },

  step: function () {
    const values = this.data.values || [];
    if (!values.length) return;

    const value = Number(values[this._index % values.length]);
    if (Number.isNaN(value)) return;

    if (this.data.primitive === 'sphere') {
      this.el.setAttribute('geometry', 'radius', value);
    } else {
      this.el.setAttribute('geometry', {
        primitive: this.data.primitive,
        width: value,
        height: value,
        depth: value
      });
    }

    emitXrEvent(this.el, 'geometry-keyframe-step', {
      index: this._index,
      value
    });

    this._index += 1;
    if (!this.data.loop && this._index >= values.length) {
      clearInterval(this._timer);
      this._timer = 0;
    }
  }
});
