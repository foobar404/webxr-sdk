import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('haptics', {
  schema: {
    intensity: { default: 0.6 },
    duration: { default: 30 }
  },

  init() {
    this._timers = [];
    this._onPulse = (e) => this.pulse(e.detail || {});
    this._onBurst = (e) => this.burst(e.detail || {});

    this.el.addEventListener('haptic-pulse', this._onPulse);
    this.el.addEventListener('haptic-burst', this._onBurst);
    this.el.addEventListener('xr:haptics-pulse', this._onPulse);
    this.el.addEventListener('xr:haptics-burst', this._onBurst);
  },

  remove() {
    this.el.removeEventListener('haptic-pulse', this._onPulse);
    this.el.removeEventListener('haptic-burst', this._onBurst);
    this.el.removeEventListener('xr:haptics-pulse', this._onPulse);
    this.el.removeEventListener('xr:haptics-burst', this._onBurst);

    for (let i = 0; i < this._timers.length; i++) {
      clearTimeout(this._timers[i]);
    }
    this._timers.length = 0;
  },

  getActuator() {
    const controller = this.el.components['tracked-controls']?.controller;
    const gamepad = controller?.gamepad;
    return gamepad?.hapticActuators?.[0] || gamepad?.vibrationActuator || null;
  },

  pulse(options = {}) {
    const actuator = this.getActuator();
    if (!actuator) return;

    const intensity = options.intensity ?? this.data.intensity;
    const duration = options.duration ?? this.data.duration;

    if (actuator.pulse) {
      actuator.pulse(intensity, duration);
    } else if (actuator.playEffect) {
      actuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity
      });
    }

    emitXrEvent(this.el, 'haptics-fired', { intensity, duration });
  },

  burst(options = {}) {
    const count = options.count ?? 3;
    const gap = options.gap ?? 40;
    const intensity = options.intensity ?? this.data.intensity;
    const duration = options.duration ?? this.data.duration;

    let pulseCount = 0;
    const doPulse = () => {
      if (pulseCount++ >= count) return;
      this.pulse({ intensity, duration });
      const id = setTimeout(doPulse, gap);
      this._timers.push(id);
    };

    doPulse();
  }
});
