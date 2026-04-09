import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('ai-agent', {
  schema: {
    target: { type: 'selector', default: null },
    targetSelector: { type: 'string', default: '' },
    patrolPoints: { type: 'string', default: '' },
    speed: { type: 'number', default: 1.2 },
    sightRange: { type: 'number', default: 8 },
    attackRange: { type: 'number', default: 1.5 },
    attackCooldownMs: { type: 'int', default: 800 },
    damage: { type: 'number', default: 1 }
  },

  init: function () {
    this._targetPos = new THREE.Vector3();
    this._targetLocal = new THREE.Vector3();
    this._lookWorld = new THREE.Vector3();
    this._selfPos = new THREE.Vector3();
    this._moveDir = new THREE.Vector3();

    this.state = 'idle';
    this._patrolIndex = 0;
    this._readyAt = 0;
    this._patrol = this._parsePatrol(this.data.patrolPoints);
  },

  update: function (oldData) {
    if (oldData.patrolPoints !== this.data.patrolPoints) {
      this._patrol = this._parsePatrol(this.data.patrolPoints);
      this._patrolIndex = 0;
    }
  },

  tick: function (time, dtMs) {
    if (!dtMs) return;

    const target = this._resolveTarget();
    if (target) {
      target.object3D.getWorldPosition(this._targetPos);
      this.el.object3D.getWorldPosition(this._selfPos);
      const dist = this._selfPos.distanceTo(this._targetPos);

      if (dist <= this.data.attackRange) {
        this._setState('attack');
        this._tryAttack(target);
        return;
      }

      if (dist <= this.data.sightRange) {
        this._setState('chase');
        this._targetLocal.copy(this._targetPos);
        if (this.el.object3D.parent) this.el.object3D.parent.worldToLocal(this._targetLocal);
        this._moveTowardLocal(this._targetLocal, dtMs);
        return;
      }
    }

    if (this._patrol.length) {
      this._setState('patrol');
      this._doPatrol(dtMs);
      return;
    }

    this._setState('idle');
  },

  _resolveTarget: function () {
    if (this.data.target) return this.data.target;
    if (!this.data.targetSelector || !this.el.sceneEl) return null;
    return this.el.sceneEl.querySelector(this.data.targetSelector);
  },

  _tryAttack: function (target) {
    const now = performance.now();
    if (now < this._readyAt) return;

    this._readyAt = now + this.data.attackCooldownMs;
    target.emit('xr:damage', {
      amount: this.data.damage,
      source: this.el,
      reason: 'ai-attack'
    });

    emitXrEvent(this.el, 'ai-attack', { target, damage: this.data.damage });
  },

  _doPatrol: function (dtMs) {
    if (!this._patrol.length) return;

    const goal = this._patrol[this._patrolIndex];
    this.el.object3D.getWorldPosition(this._selfPos);
    if (this._selfPos.distanceTo(goal) < 0.2) {
      this._patrolIndex = (this._patrolIndex + 1) % this._patrol.length;
    }

    this._moveTowardLocal(goal, dtMs);
  },

  _moveTowardLocal: function (targetLocalPos, dtMs) {
    const obj = this.el.object3D;
    this._moveDir.copy(targetLocalPos).sub(obj.position);

    const dist = this._moveDir.length();
    if (dist <= 0.0001) return;

    this._moveDir.normalize();
    const step = Math.min(dist, (this.data.speed * dtMs) / 1000);
    obj.position.addScaledVector(this._moveDir, step);

    this._lookWorld.copy(targetLocalPos);
    if (obj.parent) obj.parent.localToWorld(this._lookWorld);
    obj.lookAt(this._lookWorld);
  },

  _setState: function (next) {
    if (this.state === next) return;
    const from = this.state;
    this.state = next;
    emitXrEvent(this.el, 'ai-state-changed', { from, to: next }, 'aistatechanged');
  },

  _parsePatrol: function (text) {
    if (!text) return [];
    const points = [];
    const segments = String(text).split('|');
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i].trim();
      if (!s) continue;
      const nums = s.split(/\s+/).map(Number);
      if (nums.length < 3 || nums.some(n => Number.isNaN(n))) continue;
      points.push(new THREE.Vector3(nums[0], nums[1], nums[2]));
    }
    return points;
  }
});
