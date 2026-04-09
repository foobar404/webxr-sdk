import { applyDeadzone, coerceAxisEvent, emitXrEvent, resolveRig } from './core-utils.js';

AFRAME.registerComponent('smooth-turn', {
    schema: {
        speedDeg: { type: 'number', default: 120 },     // deg/sec at full deflection
        deadzone: { type: 'number', default: 0.15 },
        cameraRig: { type: 'selector', default: null }
    },
    init() {
        this.x = 0;
        this._onThumb = (e) => {
            this.x = coerceAxisEvent(e.detail).x;
        };
        this._onAxis = (e) => {
            this.x = coerceAxisEvent(e.detail).x;
        };
        this._resolveRig(); this.el.addEventListener('thumbstickmoved', this._onThumb);
        this.el.addEventListener('axismove', this._onAxis);
    },
    update() { this._resolveRig(); },
    remove() {
        this.el.removeEventListener('thumbstickmoved', this._onThumb);
        this.el.removeEventListener('axismove', this._onAxis);
    },
    tick(t, dt) {
        if (!this.rig) return;
        let x = applyDeadzone(this.x, this.data.deadzone);
        if (!x) return;
        x = -x;
        const yawDeg = this.data.speedDeg * x * (dt / 1000);
        const yawRad = yawDeg * Math.PI / 180;
        this.rig.object3D.rotation.y += yawRad;
        emitXrEvent(this.el, 'turn-smooth-step', { yawDeg }, 'smoothturnstep');
    },
    _resolveRig() {
        this.rig = resolveRig(this.el, this.data.cameraRig || null);
    }
});