import { applyDeadzone, coerceAxisEvent, emitXrEvent, resolveCamera, resolveRig } from './core-utils.js';

AFRAME.registerComponent('smooth-move', {
    schema: {
        speed: { type: 'number', default: 3 },     // meters/sec at full deflection
        deadzone: { type: 'number', default: 0.15 },    // ignore tiny stick noise
        cameraRig: { type: 'selector', default: null },  // optional rig selector
        headBased: { type: 'boolean', default: true }    // move by head yaw
    },

    init: function () {
        this.axis = { x: 0, y: 0 };
        this.fwd = new THREE.Vector3();
        this.right = new THREE.Vector3();
        this.up = new THREE.Vector3(0, 1, 0);
        this.tmp = new THREE.Vector3();

        this._onThumb = this._onThumb.bind(this);
        this._onAxisMove = this._onAxisMove.bind(this);

        this._resolveRig();
        this._resolveHead();

        this.el.addEventListener('thumbstickmoved', this._onThumb);
        this.el.addEventListener('axismove', this._onAxisMove);
    },

    update: function () {
        this._resolveRig();
        this._resolveHead();
    },

    remove: function () {
        this.el.removeEventListener('thumbstickmoved', this._onThumb);
        this.el.removeEventListener('axismove', this._onAxisMove);
    },

    tick: function (t, dt) {
        if (!this.rig || !this.head) return;
        const secs = dt / 1000;

        const x = applyDeadzone(this.axis.x, this.data.deadzone);
        const y = applyDeadzone(this.axis.y, this.data.deadzone);
        if (!x && !y) return;

        if (this.data.headBased) {
            this.head.object3D.getWorldDirection(this.fwd);
            this.fwd.y = 0; this.fwd.normalize();
            this.right.crossVectors(this.fwd, this.up).normalize();
        } else {
            this.fwd.set(0, 0, -1);
            this.right.set(1, 0, 0);
            this.fwd.applyQuaternion(this.rig.object3D.quaternion);
            this.right.applyQuaternion(this.rig.object3D.quaternion);
            this.fwd.y = 0; this.right.y = 0;
            this.fwd.normalize(); this.right.normalize();
        }

        // invert left/right and forward/back: negate x and y contributions
        this.tmp.copy(this.right).multiplyScalar(-x)
            .addScaledVector(this.fwd, y)
            .multiplyScalar(this.data.speed * secs);

        this.rig.object3D.position.add(this.tmp);

        emitXrEvent(this.el, 'locomotion-step', {
            dx: this.tmp.x,
            dy: this.tmp.y,
            dz: this.tmp.z,
            mode: 'smooth-move'
        }, 'smoothmovestep');
    },

    _onThumb: function (e) {
        const axis = coerceAxisEvent(e.detail);
        this.axis.x = axis.x;
        this.axis.y = axis.y;
    },

    _onAxisMove: function (e) {
        const axis = coerceAxisEvent(e.detail);
        this.axis.x = axis.x;
        this.axis.y = axis.y;
    },

    _resolveRig: function () {
        this.rig = resolveRig(this.el, this.data.cameraRig || null);
    },

    _resolveHead: function () {
        this.head = resolveCamera(this.el.sceneEl);
    }
});
