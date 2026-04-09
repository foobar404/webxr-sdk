import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('timed-spawner', {
  schema: {
    prefab: { type: 'selector', default: null },
    parent: { type: 'selector', default: null },
    interval: { type: 'int', default: 3000 },
    maxAlive: { type: 'int', default: 5 },
    radius: { type: 'number', default: 1.5 },
    enabled: { type: 'boolean', default: true }
  },

  init: function () {
    this._spawned = new Set();
    this._timer = 0;
    this._tmpPos = new THREE.Vector3();
    this._start();
  },

  update: function () {
    this._stop();
    this._start();
  },

  remove: function () {
    this._stop();
    this._spawned.clear();
  },

  spawnNow: function () {
    this._prune();
    if (!this.data.enabled) return null;
    if (!this.data.prefab) return null;
    if (this._spawned.size >= this.data.maxAlive) return null;

    const clone = this.data.prefab.cloneNode(true);
    clone.removeAttribute('id');
    clone.setAttribute('visible', true);

    const parent = this.data.parent || this.el.sceneEl;
    if (!parent) return null;

    this.el.object3D.getWorldPosition(this._tmpPos);
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.data.radius;

    clone.object3D.position.set(
      this._tmpPos.x + Math.cos(angle) * dist,
      this._tmpPos.y,
      this._tmpPos.z + Math.sin(angle) * dist
    );

    parent.appendChild(clone);
    this._spawned.add(clone);

    emitXrEvent(this.el, 'spawned', {
      count: this._spawned.size
    });

    return clone;
  },

  _start: function () {
    if (!this.data.enabled || this.data.interval <= 0) return;
    this._timer = setInterval(() => {
      this.spawnNow();
    }, this.data.interval);
  },

  _stop: function () {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = 0;
  },

  _prune: function () {
    for (const el of this._spawned) {
      if (!el || !el.isConnected) {
        this._spawned.delete(el);
      }
    }
  }
});
