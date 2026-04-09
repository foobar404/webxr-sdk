import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('cooldown', {
  schema: {
    duration: { type: 'int', default: 600 },
    triggerEvent: { type: 'string', default: 'xr:use' },
    readyEvent: { type: 'string', default: 'xr:cooldown-ready' }
  },

  init: function () {
    this.readyAt = 0;
    this._wasCooling = false;

    this._onTrigger = (e) => {
      const ok = this.tryConsume(e?.target || this.el);
      if (!ok) {
        emitXrEvent(this.el, 'cooldown-rejected', { remainingMs: this.getRemaining() });
      }
    };

    this.el.addEventListener(this.data.triggerEvent, this._onTrigger);
  },

  update: function (oldData) {
    if (oldData.triggerEvent && oldData.triggerEvent !== this.data.triggerEvent) {
      this.el.removeEventListener(oldData.triggerEvent, this._onTrigger);
      this.el.addEventListener(this.data.triggerEvent, this._onTrigger);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.triggerEvent, this._onTrigger);
  },

  tick: function () {
    const cooling = this.getRemaining() > 0;
    if (this._wasCooling && !cooling) {
      this.el.emit(this.data.readyEvent, { source: this.el });
      emitXrEvent(this.el, 'cooldown-ready', { source: this.el });
    }
    this._wasCooling = cooling;
  },

  tryConsume: function (source = null) {
    const now = performance.now();
    if (now < this.readyAt) return false;

    this.readyAt = now + this.data.duration;
    this._wasCooling = true;
    emitXrEvent(this.el, 'cooldown-start', {
      durationMs: this.data.duration,
      source
    });
    return true;
  },

  reset: function () {
    this.readyAt = 0;
    this._wasCooling = false;
  },

  getRemaining: function () {
    return Math.max(0, Math.ceil(this.readyAt - performance.now()));
  }
});

AFRAME.registerComponent('timer', {
  schema: {
    interval: { type: 'int', default: 1000 },
    repeat: { type: 'boolean', default: true },
    autostart: { type: 'boolean', default: true },
    immediate: { type: 'boolean', default: false },
    event: { type: 'string', default: 'xr:timer-tick' }
  },

  init: function () {
    this._id = 0;
    this._ticks = 0;
    if (this.data.autostart) this.start();
  },

  remove: function () {
    this.stop();
  },

  start: function () {
    this.stop();

    if (this.data.immediate) this._fire();

    this._id = setInterval(() => {
      this._fire();
      if (!this.data.repeat) this.stop();
    }, Math.max(1, this.data.interval));
  },

  stop: function () {
    if (!this._id) return;
    clearInterval(this._id);
    this._id = 0;
  },

  reset: function () {
    this._ticks = 0;
  },

  _fire: function () {
    this._ticks += 1;
    this.el.emit(this.data.event, { tick: this._ticks, source: this.el });
    emitXrEvent(this.el, 'timer-tick', { tick: this._ticks, source: this.el });
  }
});
