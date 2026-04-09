import { emitXrEvent } from './core-utils.js';

AFRAME.registerSystem('checkpoint', {
  init: function () {
    this.map = new Map();
  },

  setActive: function (key, checkpointEl) {
    this.map.set(key, checkpointEl);
  },

  getActive: function (key) {
    return this.map.get(key) || null;
  }
});

AFRAME.registerComponent('checkpoint', {
  schema: {
    key: { type: 'string', default: 'player' },
    event: { type: 'string', default: 'click' },
    autoActivate: { type: 'boolean', default: false }
  },

  init: function () {
    this._onActivate = () => this.activate(this.el);
    this.el.addEventListener(this.data.event, this._onActivate);
    if (this.data.autoActivate) this.activate(this.el);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onActivate);
  },

  activate: function (source = null) {
    this.system.setActive(this.data.key, this.el);
    emitXrEvent(this.el, 'checkpoint-activated', {
      key: this.data.key,
      source: source || this.el
    });
  }
});

AFRAME.registerComponent('spawn-point', {
  schema: {
    key: { type: 'string', default: 'player' },
    useAsCheckpoint: { type: 'boolean', default: true }
  },

  init: function () {
    if (this.data.useAsCheckpoint) this.system.setActive(this.data.key, this.el);
  }
});

AFRAME.registerComponent('respawn-at-checkpoint', {
  schema: {
    key: { type: 'string', default: 'player' },
    deathEvent: { type: 'string', default: 'xr:entity-died' },
    delayMs: { type: 'int', default: 800 }
  },

  init: function () {
    this._timer = 0;
    this._onDeath = () => {
      if (this._timer) clearTimeout(this._timer);
      this._timer = setTimeout(() => this.respawn(), this.data.delayMs);
    };

    this.el.addEventListener(this.data.deathEvent, this._onDeath);
  },

  remove: function () {
    this.el.removeEventListener(this.data.deathEvent, this._onDeath);
    if (this._timer) clearTimeout(this._timer);
  },

  respawn: function () {
    const cp = this.system.getActive(this.data.key);
    if (!cp) return;

    const p = cp.getAttribute('position');
    const r = cp.getAttribute('rotation');
    if (p) this.el.setAttribute('position', p);
    if (r) this.el.setAttribute('rotation', r);

    emitXrEvent(this.el, 'entity-respawned', { key: this.data.key, checkpoint: cp });
  }
});
