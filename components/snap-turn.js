import { applyDeadzone, coerceAxisEvent, emitXrEvent, resolveRig } from './core-utils.js';

AFRAME.registerComponent('snap-turn', {
    schema: {
        stepDeg: { type: 'number', default: 30 },      // degrees per snap
        threshold: { type: 'number', default: 0.6 },     // stick deflection to trigger
        resetBand: { type: 'number', default: 0.2 },     // must return inside to re-arm
        cooldown: { type: 'int', default: 180 },     // ms between snaps
        cameraRig: { type: 'selector', default: null }
    },
    init() {
        this.x = 0; this.armed = true; this.lastSnap = 0;
        this._onThumb = (e) => { this.x = coerceAxisEvent(e.detail).x; };
        this._onAxis = (e) => { this.x = coerceAxisEvent(e.detail).x; };
        this._resolveRig();
        this.el.addEventListener('thumbstickmoved', this._onThumb);
        this.el.addEventListener('axismove', this._onAxis);
    },
    update() { this._resolveRig(); },
    remove() {
        this.el.removeEventListener('thumbstickmoved', this._onThumb);
        this.el.removeEventListener('axismove', this._onAxis);
    },
    tick(t) {
        if (!this.rig) return;
        const now = t || performance.now();
        const x = applyDeadzone(this.x, this.data.resetBand * 0.5);
        if (this.armed && Math.abs(x) >= this.data.threshold && now - this.lastSnap >= this.data.cooldown) {
            const dir = this.x > 0 ? 1 : -1;
            // invert direction
            const yawRad = (this.data.stepDeg * -dir) * Math.PI / 180;
            this.rig.object3D.rotation.y += yawRad;
            this.lastSnap = now; this.armed = false;
            emitXrEvent(this.el, 'turn-snap', { dir, stepDeg: this.data.stepDeg }, 'snapturn');
        }
        if (!this.armed && Math.abs(x) <= this.data.resetBand) this.armed = true;
    },
    _resolveRig() {
        this.rig = resolveRig(this.el, this.data.cameraRig || null);
    }
});
