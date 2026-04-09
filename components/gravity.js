import { emitXrEvent } from './core-utils.js';

AFRAME.registerSystem('gravity', {
    schema: {
        // entities selected will be affected (default: ".rigid")
        selector: { type: 'string', default: '.rigid' },
        // world gravity (m/s^2); set 0 0 0 for 0G inertial motion
        gravity: { type: 'vec3', default: { x: 0, y: -9.8, z: 0 } },
        // simple linear damping (0..1) applied per second; 0 = none
        damping: { type: 'number', default: 0.00 }
    },
    init() {
        this.bodies = new Set();
        this._tmp = new THREE.Vector3();
    },
    registerBody(el) { this.bodies.add(el); },
    unregisterBody(el) { this.bodies.delete(el); },
    setGravity(x, y, z) {
        this.data.gravity = { x, y, z };
    },
    tick(time, dtMs) {
        const dt = Math.min(0.05, dtMs / 1000); // clamp big frames
        if (dt <= 0) return;

        const g = this.data.gravity;
        const damping = this.data.damping;
        const staleBodies = [];

        // Iterate all registered rigid bodies
        this.bodies.forEach(el => {
            if (!el || !el.isConnected) {
                staleBodies.push(el);
                return;
            }

            const c = el.components['rigid-body'];
            if (!c || !c.data.enabled) return;

            const data = c.data;
            const vel = c.velocity; // THREE.Vector3

            // Integrate acceleration (gravity) -> velocity
            if (data.useGravity) {
                vel.x += g.x * dt;
                vel.y += g.y * dt;
                vel.z += g.z * dt;
            }

            // Apply simple exponential damping per second (optional)
            if (damping > 0) {
                const d = Math.max(0, Math.min(1, damping));
                const factor = Math.pow(1 - d, dt);
                vel.multiplyScalar(factor);
            }

            // Integrate velocity -> position
            const o3d = el.object3D;
            o3d.position.x += vel.x * dt;
            o3d.position.y += vel.y * dt;
            o3d.position.z += vel.z * dt;

            // Very simple collision vs any static-plane at y = offset (normal 0,1,0).
            // Extend with boxes as needed.
            const floor = this.sceneEl.querySelector('[static-body][static-body^="type: plane"]');
            if (floor) {
                const sb = floor.getAttribute('static-body') || {};
                const offset = (sb.offset != null) ? parseFloat(sb.offset) : 0;
                const normal = (sb.normal || '0 1 0').trim();
                // Only handle up-facing plane (0,1,0)
                if (normal === '0 1 0') {
                    const radius = c.getEffectiveRadius();
                    const yMin = offset + radius; // ground contact height
                    if (o3d.position.y < yMin) {
                        // Snap to ground
                        o3d.position.y = yMin;
                        // Bounce with restitution; kill tiny jitter
                        if (vel.y < 0) vel.y = -vel.y * data.restitution;
                        if (Math.abs(vel.y) < 0.01) vel.y = 0;

                        // Very crude friction against ground (tangent damping)
                        vel.x *= (1 - data.friction);
                        vel.z *= (1 - data.friction);

                        emitXrEvent(el, 'physics-ground-contact', {
                            y: o3d.position.y,
                            restitution: data.restitution,
                            friction: data.friction
                        });
                    }
                }
            }
        });

        for (let i = 0; i < staleBodies.length; i++) {
            this.bodies.delete(staleBodies[i]);
        }
    }
});
