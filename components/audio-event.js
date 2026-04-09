import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('audio-event', {
  schema: {
    event: { type: 'string', default: 'xr:interact-use' },
    stopEvent: { type: 'string', default: '' },
    src: { type: 'asset', default: '' },
    volume: { type: 'number', default: 1 },
    loop: { type: 'boolean', default: false },
    positional: { type: 'boolean', default: true },
    autoplay: { type: 'boolean', default: false },
    poolSize: { type: 'int', default: 3 }
  },

  init: function () {
    this._configureSound();

    this._onPlay = () => this.play();
    this._onStop = () => this.stop();

    this.el.addEventListener(this.data.event, this._onPlay);
    if (this.data.stopEvent) this.el.addEventListener(this.data.stopEvent, this._onStop);

    if (this.data.autoplay) this.play();
  },

  update: function (oldData) {
    if (oldData.event && oldData.event !== this.data.event) {
      this.el.removeEventListener(oldData.event, this._onPlay);
      this.el.addEventListener(this.data.event, this._onPlay);
    }

    if (oldData.stopEvent !== this.data.stopEvent) {
      if (oldData.stopEvent) this.el.removeEventListener(oldData.stopEvent, this._onStop);
      if (this.data.stopEvent) this.el.addEventListener(this.data.stopEvent, this._onStop);
    }

    if (oldData.src !== this.data.src || oldData.volume !== this.data.volume || oldData.loop !== this.data.loop || oldData.positional !== this.data.positional || oldData.poolSize !== this.data.poolSize) {
      this._configureSound();
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onPlay);
    if (this.data.stopEvent) this.el.removeEventListener(this.data.stopEvent, this._onStop);
  },

  play: function () {
    const sound = this.el.components.sound;
    if (!sound) return;
    sound.playSound();
    emitXrEvent(this.el, 'audio-play', { event: this.data.event });
  },

  stop: function () {
    const sound = this.el.components.sound;
    if (!sound) return;
    sound.stopSound();
    emitXrEvent(this.el, 'audio-stop', { event: this.data.stopEvent || null });
  },

  _configureSound: function () {
    if (!this.data.src) return;
    this.el.setAttribute('sound', {
      src: this.data.src,
      volume: this.data.volume,
      loop: this.data.loop,
      positional: this.data.positional,
      poolSize: this.data.poolSize,
      autoplay: false
    });
  }
});

AFRAME.registerComponent('spatial-audio', {
  schema: {
    src: { type: 'asset', default: '' },
    autoplay: { type: 'boolean', default: false },
    loop: { type: 'boolean', default: false },
    volume: { type: 'number', default: 1 },
    distanceModel: { type: 'string', default: 'inverse' },
    maxDistance: { type: 'number', default: 30 },
    refDistance: { type: 'number', default: 1 },
    rolloffFactor: { type: 'number', default: 1 }
  },

  init: function () {
    this.apply();
  },

  update: function () {
    this.apply();
  },

  apply: function () {
    if (!this.data.src) return;
    this.el.setAttribute('sound', {
      src: this.data.src,
      autoplay: this.data.autoplay,
      loop: this.data.loop,
      volume: this.data.volume,
      positional: true,
      distanceModel: this.data.distanceModel,
      maxDistance: this.data.maxDistance,
      refDistance: this.data.refDistance,
      rolloffFactor: this.data.rolloffFactor
    });
  }
});
