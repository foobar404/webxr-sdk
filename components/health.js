import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('health', {
  schema: {
    max: { type: 'number', default: 100 },
    current: { type: 'number', default: 100 },
    invincible: { type: 'boolean', default: false },
    autoResetOnDeath: { type: 'boolean', default: false },
    resetDelay: { type: 'int', default: 1200 }
  },

  init: function () {
    this.current = Math.min(this.data.max, this.data.current);
    this._resetTimeout = 0;

    this._onDamage = (e) => {
      const amount = e?.detail?.amount;
      this.applyDamage(typeof amount === 'number' ? amount : 0, e?.detail || {});
    };

    this._onHeal = (e) => {
      const amount = e?.detail?.amount;
      this.applyHeal(typeof amount === 'number' ? amount : 0, e?.detail || {});
    };

    this.el.addEventListener('damage', this._onDamage);
    this.el.addEventListener('xr:damage', this._onDamage);
    this.el.addEventListener('heal', this._onHeal);
    this.el.addEventListener('xr:heal', this._onHeal);

    this._emitHealthChanged();
  },

  update: function (oldData) {
    if (oldData.max !== this.data.max && this.current > this.data.max) {
      this.current = this.data.max;
      this._emitHealthChanged();
    }
  },

  remove: function () {
    this.el.removeEventListener('damage', this._onDamage);
    this.el.removeEventListener('xr:damage', this._onDamage);
    this.el.removeEventListener('heal', this._onHeal);
    this.el.removeEventListener('xr:heal', this._onHeal);

    if (this._resetTimeout) {
      clearTimeout(this._resetTimeout);
      this._resetTimeout = 0;
    }
  },

  applyDamage: function (amount, detail = {}) {
    if (this.data.invincible || amount <= 0 || this.current <= 0) return;

    this.current = Math.max(0, this.current - amount);
    this._emitHealthChanged(detail.source || null);

    if (this.current > 0) return;

    emitXrEvent(this.el, 'entity-died', {
      source: detail.source || null,
      reason: detail.reason || 'damage'
    }, 'die');

    if (!this.data.autoResetOnDeath) return;

    if (this._resetTimeout) clearTimeout(this._resetTimeout);
    this._resetTimeout = setTimeout(() => {
      this.reset();
    }, this.data.resetDelay);
  },

  applyHeal: function (amount, detail = {}) {
    if (amount <= 0 || this.current <= 0) return;
    this.current = Math.min(this.data.max, this.current + amount);
    this._emitHealthChanged(detail.source || null);
  },

  reset: function () {
    this.current = this.data.max;
    this._emitHealthChanged(null);
    emitXrEvent(this.el, 'entity-respawned', { health: this.current });
  },

  _emitHealthChanged: function (source) {
    emitXrEvent(this.el, 'health-changed', {
      current: this.current,
      max: this.data.max,
      source: source || null
    }, 'healthchanged');
  }
});
