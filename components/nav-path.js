import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('nav-path', {
  schema: {
    points: { type: 'string', default: '' },
    loop: { type: 'boolean', default: false }
  },

  init: function () {
    this.points = [];
    this._tmp = new THREE.Vector3();
    this._parse();
    emitXrEvent(this.el, 'nav-path-ready', { count: this.points.length });
  },

  update: function (oldData) {
    if (oldData.points !== this.data.points) {
      this._parse();
      emitXrEvent(this.el, 'nav-path-ready', { count: this.points.length });
    }
  },

  _parse: function () {
    this.points = [];
    const text = String(this.data.points || '').trim();
    if (!text) return;

    const segments = text.split(';');
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i].trim();
      if (!s) continue;
      const nums = s.split(/\s+/).map(Number);
      if (nums.length < 3 || nums.some(n => Number.isNaN(n))) continue;
      this.points.push(new THREE.Vector3(nums[0], nums[1], nums[2]));
    }
  },

  getPointsWorld: function () {
    const world = [];
    for (let i = 0; i < this.points.length; i++) {
      this._tmp.copy(this.points[i]);
      this.el.object3D.localToWorld(this._tmp);
      world.push(this._tmp.clone());
    }
    return world;
  },

  getClosestIndex: function (worldPos) {
    const pts = this.getPointsWorld();
    if (!pts.length) return -1;

    let best = 0;
    let bestDist = worldPos.distanceToSquared(pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const d = worldPos.distanceToSquared(pts[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }
});
