import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('pickup', {
  schema: {
    event: { type: 'string', default: 'click' },
    target: { type: 'selector', default: null },
    score: { type: 'number', default: 0 },
    heal: { type: 'number', default: 0 },
    respawn: { type: 'boolean', default: false },
    respawnDelay: { type: 'int', default: 2500 }
  },

  init: function () {
    this._active = true;
    this._respawnTimer = 0;
    this._target = this.data.target || this.el.sceneEl?.querySelector('#rig') || this.el;

    this._onConsume = (e) => {
      this.consume(e?.target || this.el);
    };

    this.el.addEventListener(this.data.event, this._onConsume);
  },

  update: function (oldData) {
    if (oldData.event !== this.data.event) {
      this.el.removeEventListener(oldData.event, this._onConsume);
      this.el.addEventListener(this.data.event, this._onConsume);
    }

    if (oldData.target !== this.data.target) {
      this._target = this.data.target || this.el.sceneEl?.querySelector('#rig') || this.el;
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onConsume);
    if (this._respawnTimer) {
      clearTimeout(this._respawnTimer);
      this._respawnTimer = 0;
    }
  },

  consume: function (source) {
    if (!this._active) return;

    if (this.data.heal > 0 && this._target) {
      this._target.emit('xr:heal', {
        amount: this.data.heal,
        source: source || this.el
      });
    }

    if (this.data.score !== 0 && this.el.sceneEl?.systems?.score) {
      this.el.sceneEl.systems.score.add(this.data.score, source || this.el);
    }

    emitXrEvent(this.el, 'pickup-consumed', {
      source: source || this.el,
      score: this.data.score,
      heal: this.data.heal
    });

    this._setActive(false);

    if (!this.data.respawn) return;

    this._respawnTimer = setTimeout(() => {
      this._setActive(true);
      emitXrEvent(this.el, 'pickup-respawned', {});
    }, this.data.respawnDelay);
  },

  _setActive: function (isActive) {
    this._active = isActive;
    this.el.setAttribute('visible', isActive);
  }
});
