import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('path', {
  schema: {
    points: { type: 'string', default: '' },
    loop: { type: 'boolean', default: false }
  },

  init: function () {
    this.points = [];
    this._tmp = new THREE.Vector3();
    this._parse();
  },

  update: function (oldData) {
    if (oldData.points !== this.data.points) this._parse();
  },

  _parse: function () {
    this.points = [];
    const segs = String(this.data.points || '').split(';');
    for (let i = 0; i < segs.length; i++) {
      const nums = segs[i].trim().split(/\s+/).map(Number);
      if (nums.length < 3 || nums.some(n => Number.isNaN(n))) continue;
      this.points.push(new THREE.Vector3(nums[0], nums[1], nums[2]));
    }
  },

  getWorldPoints: function () {
    const out = [];
    for (let i = 0; i < this.points.length; i++) {
      this._tmp.copy(this.points[i]);
      this.el.object3D.localToWorld(this._tmp);
      out.push(this._tmp.clone());
    }
    return out;
  }
});

AFRAME.registerComponent('path-follow', {
  schema: {
    path: { type: 'selector', default: null },
    speed: { type: 'number', default: 1.2 },
    loop: { type: 'boolean', default: true },
    lookAhead: { type: 'boolean', default: true }
  },

  init: function () {
    this._index = 0;
    this._self = new THREE.Vector3();
    this._goal = new THREE.Vector3();
  },

  tick: function (time, dtMs) {
    if (!dtMs || !this.data.path || !this.data.path.components.path) return;
    const pts = this.data.path.components.path.getWorldPoints();
    if (!pts.length) return;

    if (this._index >= pts.length) {
      if (!this.data.loop) return;
      this._index = 0;
    }

    this._goal.copy(pts[this._index]);
    this.el.object3D.getWorldPosition(this._self);
    const to = this._goal.clone().sub(this._self);
    const dist = to.length();
    if (dist < 0.08) {
      this._index += 1;
      emitXrEvent(this.el, 'path-follow-point', { index: this._index });
      return;
    }

    to.normalize();
    const step = (this.data.speed * dtMs) / 1000;
    const nextWorld = this._self.clone().addScaledVector(to, step);
    const parent = this.el.object3D.parent || null;
    const nextLocal = parent ? parent.worldToLocal(nextWorld) : nextWorld;
    this.el.object3D.position.copy(nextLocal);
    if (this.data.lookAhead) this.el.object3D.lookAt(this._goal);
  }
});
