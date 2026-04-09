import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('spawner', {
  schema: {
    prefab: { type: 'selector', default: null },
    event: { type: 'string', default: 'xr:spawn' },
    intervalMs: { type: 'int', default: 0 },
    maxAlive: { type: 'int', default: 8 },
    radius: { type: 'number', default: 0 }
  },

  init: function () {
    this._alive = new Set();
    this._timer = 0;
    this._spawnPos = new THREE.Vector3();

    this._onEvent = () => this.spawn();
    this.el.addEventListener(this.data.event, this._onEvent);

    if (this.data.intervalMs > 0) {
      this._timer = setInterval(() => this.spawn(), this.data.intervalMs);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onEvent);
    if (this._timer) clearInterval(this._timer);
  },

  spawn: function () {
    this._prune();
    if (!this.data.prefab) return null;
    if (this._alive.size >= this.data.maxAlive) return null;

    const clone = this.data.prefab.cloneNode(true);
    clone.removeAttribute('id');

    this.el.object3D.getWorldPosition(this._spawnPos);
    if (this.data.radius > 0) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * this.data.radius;
      this._spawnPos.x += Math.cos(a) * d;
      this._spawnPos.z += Math.sin(a) * d;
    }

    clone.object3D.position.copy(this._spawnPos);
    this.el.sceneEl.appendChild(clone);
    this._alive.add(clone);

    emitXrEvent(this.el, 'spawner-spawned', { entity: clone, alive: this._alive.size });
    return clone;
  },

  _prune: function () {
    for (const el of this._alive) {
      if (!el || !el.isConnected) this._alive.delete(el);
    }
  }
});
