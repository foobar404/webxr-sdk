import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('damage-source', {
  schema: {
    amount: { type: 'number', default: 1 },
    event: { type: 'string', default: 'hit' },
    target: { type: 'selector', default: null },
    reason: { type: 'string', default: 'source' }
  },

  init: function () {
    this._onDamage = (e) => {
      const target = this.data.target || e?.detail?.target || e?.target;
      if (!target || !target.emit) return;

      const payload = {
        amount: this.data.amount,
        source: this.el,
        reason: this.data.reason
      };

      target.emit('xr:damage', payload);
      emitXrEvent(this.el, 'damage-sent', payload);
    };

    this.el.addEventListener(this.data.event, this._onDamage);
  },

  update: function (oldData) {
    if (oldData.event && oldData.event !== this.data.event) {
      this.el.removeEventListener(oldData.event, this._onDamage);
      this.el.addEventListener(this.data.event, this._onDamage);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onDamage);
  }
});

AFRAME.registerComponent('damage-receiver', {
  schema: {
    event: { type: 'string', default: 'xr:damage' },
    multiplier: { type: 'number', default: 1 },
    invulnerable: { type: 'boolean', default: false },
    forwardToHealth: { type: 'boolean', default: true }
  },

  init: function () {
    this._onDamage = (e) => {
      if (this.data.invulnerable) return;

      const raw = typeof e?.detail?.amount === 'number' ? e.detail.amount : 0;
      const amount = Math.max(0, raw * this.data.multiplier);
      if (amount <= 0) return;

      const payload = {
        amount,
        source: e?.detail?.source || null,
        reason: e?.detail?.reason || 'damage-receiver'
      };

      if (this.data.forwardToHealth && this.el.components.health) {
        this.el.emit('xr:damage', payload);
      }

      emitXrEvent(this.el, 'damage-received', payload);
    };

    this.el.addEventListener(this.data.event, this._onDamage);
  },

  update: function (oldData) {
    if (oldData.event && oldData.event !== this.data.event) {
      this.el.removeEventListener(oldData.event, this._onDamage);
      this.el.addEventListener(this.data.event, this._onDamage);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onDamage);
  }
});
