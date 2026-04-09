import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('resource', {
  schema: {
    name: { type: 'string', default: 'energy' },
    max: { type: 'number', default: 100 },
    current: { type: 'number', default: 100 },
    rechargeRate: { type: 'number', default: 0 },
    rechargeDelayMs: { type: 'int', default: 0 }
  },

  init: function () {
    this._rechargeBlockedUntil = 0;

    this._onConsume = (e) => {
      const amount = typeof e?.detail?.amount === 'number' ? e.detail.amount : 0;
      this.consume(amount, e?.detail?.source || this.el);
    };

    this._onAdd = (e) => {
      const amount = typeof e?.detail?.amount === 'number' ? e.detail.amount : 0;
      this.add(amount, e?.detail?.source || this.el);
    };

    this.el.addEventListener('xr:resource-consume', this._onConsume);
    this.el.addEventListener('xr:resource-add', this._onAdd);
    this._emitChanged();
  },

  remove: function () {
    this.el.removeEventListener('xr:resource-consume', this._onConsume);
    this.el.removeEventListener('xr:resource-add', this._onAdd);
  },

  tick: function (time, dtMs) {
    if (!dtMs || this.data.rechargeRate <= 0) return;
    if (performance.now() < this._rechargeBlockedUntil) return;
    if (this.data.current >= this.data.max) return;

    const delta = (this.data.rechargeRate * dtMs) / 1000;
    this.el.setAttribute('resource', 'current', Math.min(this.data.max, this.data.current + delta));
    this._emitChanged();
  },

  consume: function (amount, source = null) {
    if (amount <= 0) return true;
    if (this.data.current < amount) {
      emitXrEvent(this.el, 'resource-empty', { name: this.data.name, source });
      return false;
    }

    this.el.setAttribute('resource', 'current', this.data.current - amount);
    this._rechargeBlockedUntil = performance.now() + this.data.rechargeDelayMs;
    this._emitChanged(source);
    return true;
  },

  add: function (amount, source = null) {
    if (amount <= 0) return;
    this.el.setAttribute('resource', 'current', Math.min(this.data.max, this.data.current + amount));
    this._emitChanged(source);
  },

  _emitChanged: function (source = null) {
    emitXrEvent(this.el, 'resource-changed', {
      name: this.data.name,
      current: this.data.current,
      max: this.data.max,
      source
    });
  }
});

AFRAME.registerComponent('ability', {
  schema: {
    useEvent: { type: 'string', default: 'xr:ability-use' },
    actionEvent: { type: 'string', default: 'xr:ability-activate' },
    cooldownMs: { type: 'int', default: 1200 },
    cost: { type: 'number', default: 0 },
    resourceSource: { type: 'selector', default: null }
  },

  init: function () {
    this._readyAt = 0;

    this._onUse = (e) => {
      this.use(e?.detail?.source || this.el);
    };

    this.el.addEventListener(this.data.useEvent, this._onUse);
  },

  update: function (oldData) {
    if (oldData.useEvent && oldData.useEvent !== this.data.useEvent) {
      this.el.removeEventListener(oldData.useEvent, this._onUse);
      this.el.addEventListener(this.data.useEvent, this._onUse);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.useEvent, this._onUse);
  },

  use: function (source = null) {
    const now = performance.now();
    if (now < this._readyAt) {
      emitXrEvent(this.el, 'ability-blocked', { reason: 'cooldown', remainingMs: Math.ceil(this._readyAt - now) });
      return false;
    }

    if (this.data.cost > 0) {
      const resourceComp = (this.data.resourceSource || this.el).components.resource;
      if (!resourceComp || !resourceComp.consume(this.data.cost, source || this.el)) {
        emitXrEvent(this.el, 'ability-blocked', { reason: 'resource' });
        return false;
      }
    }

    this._readyAt = now + this.data.cooldownMs;
    this.el.emit(this.data.actionEvent, { source: source || this.el, cost: this.data.cost });
    emitXrEvent(this.el, 'ability-used', { cooldownMs: this.data.cooldownMs, cost: this.data.cost, source: source || this.el });
    return true;
  }
});
