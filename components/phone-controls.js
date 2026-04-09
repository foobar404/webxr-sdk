AFRAME.registerComponent('phone-controls', {
    schema: {
        enabled: { default: true },
        smoothing: { type: 'number', default: 0.12 }, // 0 = snap, 0.1..0.2 = gentle
        yawOffset: { type: 'number', default: 0 }     // degrees
    },
    init() {
        this._alpha = 0; this._beta = 0; this._gamma = 0; this._orient = 0;
        this._gotData = false;

        this._qTarget = new THREE.Quaternion();
        this._qCurrent = new THREE.Quaternion();
        this._zee = new THREE.Vector3(0, 0, 1);
        this._euler = new THREE.Euler();
        this._q0 = new THREE.Quaternion();
        this._qOffset = new THREE.Quaternion(); // yaw offset
        this._sensorsBound = false;

        this._onOrient = () => { this._orient = (screen.orientation && screen.orientation.angle) ? THREE.MathUtils.degToRad(screen.orientation.angle) : 0; };
        window.addEventListener('orientationchange', this._onOrient);
        this._onOrient();

        this._onDO = (e) => {
            this._gotData = true;
            // DeviceOrientation gives degrees
            this._alpha = e.alpha || 0; // z
            this._beta = e.beta || 0; // x
            this._gamma = e.gamma || 0; // y
        };

        // Permission flow (iOS 13+)
        const btn = document.getElementById('enable');
        const gate = document.getElementById('perm');
        this._bindSensors = () => {
            if (typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(state => {
                    if (state === 'granted') {
                        if (this._sensorsBound) return;
                        window.addEventListener('deviceorientation', this._onDO, true);
                        this._sensorsBound = true;
                        if (gate) gate.style.display = 'none';
                    }
                }).catch(() => { /* ignored */ });
            } else {
                // Android / desktop with sensors
                if (this._sensorsBound) return;
                window.addEventListener('deviceorientation', this._onDO, true);
                this._sensorsBound = true;
                if (gate) gate.style.display = 'none';
            }
        };

        if (btn) {
            btn.addEventListener('click', this._bindSensors);
        } else {
            this._bindSensors();
        }
    },
    remove() {
        window.removeEventListener('orientationchange', this._onOrient);
        window.removeEventListener('deviceorientation', this._onDO, true);
        this._sensorsBound = false;
        const btn = document.getElementById('enable');
        if (btn && this._bindSensors) {
            btn.removeEventListener('click', this._bindSensors);
        }
    },
    update(oldData) {
        // yaw offset in radians -> quaternion about Y
        const y = THREE.MathUtils.degToRad(this.data.yawOffset || 0);
        this._qOffset.setFromAxisAngle(new THREE.Vector3(0, 1, 0), y);
    },
    // Convert device alpha/beta/gamma (+ screen orient) -> quaternion
    _computeQuaternion(q, alpha, beta, gamma, orient) {
        const euler = this._euler;
        const q0 = this._q0;
        const zee = this._zee;

        // Convert degrees to radians
        const _a = THREE.MathUtils.degToRad(alpha);
        const _b = THREE.MathUtils.degToRad(beta);
        const _g = THREE.MathUtils.degToRad(gamma);

        // Device frame -> world (YXZ is important)
        euler.set(_b, _a, -_g, 'YXZ');
        q.setFromEuler(euler);
        // Rotate from device space to world space
        q.multiply(q0.setFromAxisAngle(zee, -Math.PI / 2));
        // Apply screen orientation
        q.multiply(q0.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -orient || 0));
    },
    tick(t, dt) {
        if (!this.data.enabled || !this._gotData) return;

        // Target orientation from sensors
        this._computeQuaternion(this._qTarget, this._alpha, this._beta, this._gamma, this._orient);

        // Apply user yaw offset (e.g., recenter)
        this._qTarget.premultiply(this._qOffset);

        // Smoothly slerp camera’s quaternion to target
        const el = this.el.object3D;
        this._qCurrent.copy(el.quaternion);
        const s = THREE.MathUtils.clamp(this.data.smoothing, 0, 1);
        const lerpFactor = (dt > 0 ? 1 - Math.pow(1 - s, dt / 16.7) : s); // frame-rate independent-ish
        this._qCurrent.slerp(this._qTarget, lerpFactor);
        el.quaternion.copy(this._qCurrent);
    }
});
