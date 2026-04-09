import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('ammo', {
  schema: {
    clipSize: { type: 'int', default: 12 },
    clip: { type: 'int', default: 12 },
    reserve: { type: 'int', default: 48 },
    reloadTime: { type: 'int', default: 1000 },
    autoReload: { type: 'boolean', default: true }
  },

  init: function () {
    this.reloading = false;
    this._reloadTimer = 0;

    this._onConsume = (e) => {
      const amount = typeof e?.detail?.amount === 'number' ? e.detail.amount : 1;
      this.consume(amount, e?.detail?.source || this.el);
    };

    this._onReload = (e) => {
      this.reload(e?.detail?.source || this.el);
    };

    this._onAdd = (e) => {
      const amount = typeof e?.detail?.amount === 'number' ? e.detail.amount : 0;
      this.addReserve(amount, e?.detail?.source || this.el);
    };

    this.el.addEventListener('xr:ammo-consume', this._onConsume);
    this.el.addEventListener('xr:ammo-reload', this._onReload);
    this.el.addEventListener('xr:ammo-add', this._onAdd);
    this._emitChanged();
  },

  remove: function () {
    this.el.removeEventListener('xr:ammo-consume', this._onConsume);
    this.el.removeEventListener('xr:ammo-reload', this._onReload);
    this.el.removeEventListener('xr:ammo-add', this._onAdd);
    if (this._reloadTimer) clearTimeout(this._reloadTimer);
  },

  consume: function (amount = 1, source = null) {
    if (this.reloading) return false;
    if (this.data.clip < amount) {
      emitXrEvent(this.el, 'ammo-empty', { clip: this.data.clip, reserve: this.data.reserve, source });
      if (this.data.autoReload) this.reload(source);
      return false;
    }

    this.el.setAttribute('ammo', 'clip', this.data.clip - amount);
    this._emitChanged(source);
    return true;
  },

  reload: function (source = null) {
    if (this.reloading) return false;
    if (this.data.reserve <= 0 || this.data.clip >= this.data.clipSize) return false;

    this.reloading = true;
    emitXrEvent(this.el, 'ammo-reload-start', { source, reloadTime: this.data.reloadTime });

    this._reloadTimer = setTimeout(() => {
      const needed = this.data.clipSize - this.data.clip;
      const moved = Math.min(needed, this.data.reserve);
      this.el.setAttribute('ammo', 'clip', this.data.clip + moved);
      this.el.setAttribute('ammo', 'reserve', this.data.reserve - moved);
      this.reloading = false;
      this._emitChanged(source);
      emitXrEvent(this.el, 'ammo-reload-complete', { moved, source });
    }, this.data.reloadTime);

    return true;
  },

  addReserve: function (amount, source = null) {
    if (amount <= 0) return;
    this.el.setAttribute('ammo', 'reserve', this.data.reserve + amount);
    this._emitChanged(source);
  },

  _emitChanged: function (source = null) {
    emitXrEvent(this.el, 'ammo-changed', {
      clip: this.data.clip,
      clipSize: this.data.clipSize,
      reserve: this.data.reserve,
      reloading: this.reloading,
      source
    });
  }
});

AFRAME.registerComponent('weapon', {
  schema: {
    fireEvent: { type: 'string', default: 'shoot' },
    reloadEvent: { type: 'string', default: 'xr:weapon-reload' },
    actionEvent: { type: 'string', default: 'shoot' },
    cooldownMs: { type: 'int', default: 130 },
    damage: { type: 'number', default: 1 },
    requireAmmo: { type: 'boolean', default: true },
    ammoSource: { type: 'selector', default: null }
  },

  init: function () {
    this._readyAt = 0;

    this._onFire = (e) => {
      this.fire(e?.detail?.source || this.el);
    };

    this._onReload = (e) => {
      const ammo = this._getAmmo();
      if (!ammo) return;
      ammo.reload(e?.detail?.source || this.el);
    };

    this.el.addEventListener(this.data.fireEvent, this._onFire);
    this.el.addEventListener(this.data.reloadEvent, this._onReload);
  },

  update: function (oldData) {
    if (oldData.fireEvent && oldData.fireEvent !== this.data.fireEvent) {
      this.el.removeEventListener(oldData.fireEvent, this._onFire);
      this.el.addEventListener(this.data.fireEvent, this._onFire);
    }

    if (oldData.reloadEvent && oldData.reloadEvent !== this.data.reloadEvent) {
      this.el.removeEventListener(oldData.reloadEvent, this._onReload);
      this.el.addEventListener(this.data.reloadEvent, this._onReload);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.fireEvent, this._onFire);
    this.el.removeEventListener(this.data.reloadEvent, this._onReload);
  },

  fire: function (source = null) {
    const now = performance.now();
    if (now < this._readyAt) {
      emitXrEvent(this.el, 'weapon-blocked', { reason: 'cooldown', remainingMs: Math.ceil(this._readyAt - now) });
      return false;
    }

    if (this.data.requireAmmo) {
      const ammo = this._getAmmo();
      if (!ammo || !ammo.consume(1, source)) {
        emitXrEvent(this.el, 'weapon-blocked', { reason: 'ammo' });
        return false;
      }
    }

    this._readyAt = now + this.data.cooldownMs;
    this.el.emit(this.data.actionEvent, { source: source || this.el, damage: this.data.damage });
    emitXrEvent(this.el, 'weapon-fired', {
      damage: this.data.damage,
      cooldownMs: this.data.cooldownMs,
      source: source || this.el
    });
    return true;
  },

  _getAmmo: function () {
    const src = this.data.ammoSource || this.el;
    return src.components.ammo || null;
  }
});
