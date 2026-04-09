import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('status-effects', {
  schema: {
    burnTickMs: { type: 'int', default: 500 }
  },

  init: function () {
    this.effects = new Map();
    this._burnAcc = 0;

    this._onApply = (e) => {
      const effect = e?.detail?.effect;
      if (!effect || !effect.type) return;
      this.apply(effect, e?.detail?.source || this.el);
    };

    this._onRemove = (e) => {
      const type = e?.detail?.type;
      if (!type) return;
      this.removeEffect(type, e?.detail?.source || this.el);
    };

    this._onClear = (e) => {
      this.clear(e?.detail?.source || this.el);
    };

    this.el.addEventListener('xr:effect-apply', this._onApply);
    this.el.addEventListener('xr:effect-remove', this._onRemove);
    this.el.addEventListener('xr:effect-clear', this._onClear);
  },

  remove: function () {
    this.el.removeEventListener('xr:effect-apply', this._onApply);
    this.el.removeEventListener('xr:effect-remove', this._onRemove);
    this.el.removeEventListener('xr:effect-clear', this._onClear);
  },

  tick: function (time, dtMs) {
    if (!dtMs || !this.effects.size) return;

    const toDelete = [];
    for (const [type, eff] of this.effects.entries()) {
      if (eff.remainingMs === Infinity) continue;
      eff.remainingMs -= dtMs;
      if (eff.remainingMs <= 0) toDelete.push(type);
    }

    for (let i = 0; i < toDelete.length; i++) {
      this.removeEffect(toDelete[i], this.el);
    }

    const burn = this.effects.get('burn');
    if (burn) {
      this._burnAcc += dtMs;
      if (this._burnAcc >= this.data.burnTickMs) {
        this._burnAcc = 0;
        const amount = burn.power || 1;
        this.el.emit('xr:damage', { amount, source: burn.source || this.el, reason: 'burn' });
      }
    }
  },

  apply: function (effect, source = null) {
    const duration = typeof effect.durationMs === 'number' ? effect.durationMs : 1000;
    this.effects.set(effect.type, {
      type: effect.type,
      power: typeof effect.power === 'number' ? effect.power : 1,
      remainingMs: duration < 0 ? Infinity : duration,
      source: source || effect.source || null
    });

    emitXrEvent(this.el, 'effect-applied', { type: effect.type, durationMs: duration, source });
    this._emitChanged(source);
  },

  removeEffect: function (type, source = null) {
    if (!this.effects.has(type)) return false;
    this.effects.delete(type);
    emitXrEvent(this.el, 'effect-removed', { type, source });
    this._emitChanged(source);
    return true;
  },

  clear: function (source = null) {
    this.effects.clear();
    emitXrEvent(this.el, 'effect-cleared', { source });
    this._emitChanged(source);
  },

  has: function (type) {
    return this.effects.has(type);
  },

  getMultiplier: function (kind) {
    if (kind === 'move' && this.effects.has('slow')) {
      const slow = this.effects.get('slow');
      return Math.max(0, 1 - Math.min(0.95, slow.power));
    }
    if (kind === 'damage' && this.effects.has('shield')) {
      const shield = this.effects.get('shield');
      return Math.max(0, 1 - Math.min(0.95, shield.power));
    }
    return 1;
  },

  _emitChanged: function (source = null) {
    emitXrEvent(this.el, 'effects-changed', {
      effects: Array.from(this.effects.values()),
      source
    });
  }
});
