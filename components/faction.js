import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('faction', {
  schema: {
    team: { type: 'string', default: 'neutral' },
    hostileTo: { type: 'array', default: [] }
  },

  init: function () {
    this._hostileSet = new Set((this.data.hostileTo || []).map(String));
  },

  update: function () {
    this._hostileSet = new Set((this.data.hostileTo || []).map(String));
  },

  isHostileTo: function (otherEl) {
    const other = otherEl?.components?.faction;
    if (!other) return false;
    if (other.data.team === this.data.team) return false;
    if (this._hostileSet.has(other.data.team)) return true;
    if (other._hostileSet && other._hostileSet.has(this.data.team)) return true;
    return false;
  }
});

AFRAME.registerComponent('faction-damage-gate', {
  schema: {
    event: { type: 'string', default: 'xr:damage' },
    blockedEvent: { type: 'string', default: 'xr:damage-blocked-friendly' }
  },

  init: function () {
    this._onDamage = (e) => {
      const source = e?.detail?.source || null;
      if (!source || !source.components?.faction || !this.el.components?.faction) return;

      const hostile = this.el.components.faction.isHostileTo(source);
      if (hostile) return;

      e.stopImmediatePropagation();
      this.el.emit(this.data.blockedEvent, {
        source,
        reason: 'friendly-fire'
      });
      emitXrEvent(this.el, 'friendly-fire-blocked', { source });
    };

    this.el.addEventListener(this.data.event, this._onDamage);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onDamage);
  }
});
