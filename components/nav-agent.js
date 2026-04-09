import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('nav-agent', {
  schema: {
    path: { type: 'selector', default: null },
    pathSelector: { type: 'string', default: '' },
    target: { type: 'selector', default: null },
    targetSelector: { type: 'string', default: '' },
    speed: { type: 'number', default: 1.2 },
    repathIntervalMs: { type: 'int', default: 800 },
    arriveDistance: { type: 'number', default: 0.5 },
    nextDistance: { type: 'number', default: 0.35 },
    avoidDistance: { type: 'number', default: 0.8 },
    avoidStrength: { type: 'number', default: 1.1 }
  },

  init: function () {
    this.route = [];
    this.routeIndex = 0;
    this._repathAt = 0;
    this._state = 'idle';

    this._selfPos = new THREE.Vector3();
    this._targetPos = new THREE.Vector3();
    this._goalPos = new THREE.Vector3();
    this._move = new THREE.Vector3();
    this._avoid = new THREE.Vector3();
    this._tmp = new THREE.Vector3();
  },

  tick: function (time, dtMs) {
    if (!dtMs) return;

    const target = this._resolveTarget();
    if (!target) {
      this._setState('idle');
      return;
    }

    target.object3D.getWorldPosition(this._targetPos);
    this.el.object3D.getWorldPosition(this._selfPos);

    if (!this.route.length || time >= this._repathAt) {
      this._buildRoute(this._targetPos);
      this._repathAt = time + this.data.repathIntervalMs;
    }

    if (!this.route.length) {
      this._setState('idle');
      return;
    }

    this._setState('moving');
    this._goalPos.copy(this.route[this.routeIndex]);

    const distToGoal = this._selfPos.distanceTo(this._goalPos);
    if (distToGoal <= this.data.nextDistance && this.routeIndex < this.route.length - 1) {
      this.routeIndex += 1;
      this._goalPos.copy(this.route[this.routeIndex]);
      emitXrEvent(this.el, 'nav-agent-waypoint', {
        index: this.routeIndex,
        total: this.route.length
      });
    }

    const distToTarget = this._selfPos.distanceTo(this._targetPos);
    if (distToTarget <= this.data.arriveDistance) {
      this.route = [];
      this.routeIndex = 0;
      this._setState('arrived');
      emitXrEvent(this.el, 'nav-agent-arrived', { target });
      return;
    }

    this._move.copy(this._goalPos).sub(this._selfPos);
    if (this._move.lengthSq() <= 0.000001) return;
    this._move.normalize();

    this._computeAvoidance(this._selfPos, this._avoid);
    this._move.addScaledVector(this._avoid, this.data.avoidStrength);
    if (this._move.lengthSq() <= 0.000001) return;
    this._move.normalize();

    const step = (this.data.speed * dtMs) / 1000;
    this.el.object3D.position.addScaledVector(this._move, step);

    this._tmp.copy(this._selfPos).add(this._move);
    this.el.object3D.lookAt(this._tmp);
  },

  _resolvePathComponent: function () {
    const pathEl = this.data.path || (this.data.pathSelector && this.el.sceneEl ? this.el.sceneEl.querySelector(this.data.pathSelector) : null);
    if (!pathEl || !pathEl.components) return null;
    return pathEl.components['nav-path'] || null;
  },

  _resolveTarget: function () {
    if (this.data.target) return this.data.target;
    if (!this.data.targetSelector || !this.el.sceneEl) return null;
    return this.el.sceneEl.querySelector(this.data.targetSelector);
  },

  _buildRoute: function (targetPos) {
    const pathComp = this._resolvePathComponent();
    this.route = [];
    this.routeIndex = 0;

    if (!pathComp) {
      this.route.push(targetPos.clone());
      return;
    }

    const worldPoints = pathComp.getPointsWorld();
    if (!worldPoints.length) {
      this.route.push(targetPos.clone());
      return;
    }

    this.el.object3D.getWorldPosition(this._selfPos);

    const start = this._nearestIndex(worldPoints, this._selfPos);
    const end = this._nearestIndex(worldPoints, targetPos);
    if (start === -1 || end === -1) {
      this.route.push(targetPos.clone());
      return;
    }

    const indices = this._collectPathIndices(start, end, worldPoints.length, !!pathComp.data.loop);
    for (let i = 0; i < indices.length; i++) {
      this.route.push(worldPoints[indices[i]].clone());
    }
    this.route.push(targetPos.clone());

    emitXrEvent(this.el, 'nav-agent-route', {
      points: this.route.length,
      start,
      end
    });
  },

  _nearestIndex: function (points, worldPos) {
    if (!points.length) return -1;
    let best = 0;
    let bestDist = worldPos.distanceToSquared(points[0]);
    for (let i = 1; i < points.length; i++) {
      const d = worldPos.distanceToSquared(points[i]);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  },

  _collectPathIndices: function (start, end, total, loop) {
    if (!loop) {
      const out = [];
      if (start <= end) {
        for (let i = start; i <= end; i++) out.push(i);
      } else {
        for (let i = start; i >= end; i--) out.push(i);
      }
      return out;
    }

    const forward = [];
    let i = start;
    while (true) {
      forward.push(i);
      if (i === end) break;
      i = (i + 1) % total;
    }

    const backward = [];
    i = start;
    while (true) {
      backward.push(i);
      if (i === end) break;
      i = (i - 1 + total) % total;
    }

    return forward.length <= backward.length ? forward : backward;
  },

  _computeAvoidance: function (selfPos, out) {
    out.set(0, 0, 0);
    const system = this.el.sceneEl && this.el.sceneEl.systems ? this.el.sceneEl.systems['nav-obstacle'] : null;
    if (!system || !system.items || !system.items.size) return;

    for (const obs of system.items) {
      if (!obs || !obs.data || !obs.data.enabled || obs.el === this.el) continue;
      obs.el.object3D.getWorldPosition(this._tmp);
      const radius = Math.max(0.01, obs.data.radius);
      const d = selfPos.distanceTo(this._tmp);
      const limit = radius + this.data.avoidDistance;
      if (d <= 0.0001 || d >= limit) continue;

      const strength = (limit - d) / limit;
      out.addScaledVector(selfPos.clone().sub(this._tmp).normalize(), strength);
    }

    out.y = 0;
  },

  _setState: function (next) {
    if (this._state === next) return;
    const from = this._state;
    this._state = next;
    emitXrEvent(this.el, 'nav-agent-state', { from, to: next });
  }
});
