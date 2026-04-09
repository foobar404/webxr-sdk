import { assertDependency, emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('rigid-body', {
    schema: {
        enabled: { default: true },
        mass: { type: 'number', default: 1 },
        useGravity: { default: true },
        restitution: { type: 'number', default: 0.2 }, // bounciness
        friction: { type: 'number', default: 0.05 },// ground slide damping
        // optional initial velocity
        velocity: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
        // simple shape hint for radius/extent (used for ground contact)
        radius: { type: 'number', default: 0 }     // if 0, infer from geometry
    },
    _gravitySystem() {
        return this.el.sceneEl.systems.gravity;
    },
    init() {
        assertDependency(
            !!this.el.sceneEl.systems.gravity,
            'rigid-body',
            'Missing required gravity system. Ensure components/gravity.js is loaded before rigid-body.',
            { el: this.el, dependency: 'gravity-system' }
        );

        this.velocity = new THREE.Vector3(
            this.data.velocity.x, this.data.velocity.y, this.data.velocity.z
        );

        // Register with gravity system
        this._gravitySystem().registerBody(this.el);

        // Public API: applyImpulse event
        this.onImpulse = (e) => {
            const imp = e.detail && e.detail.impulse;
            if (!imp) return;
            this.applyImpulse(new THREE.Vector3(imp.x || 0, imp.y || 0, imp.z || 0));
        };
        this.el.addEventListener('impulse', this.onImpulse);
        this.el.addEventListener('xr:physics-impulse', this.onImpulse);
    },
    remove() {
        this._gravitySystem().unregisterBody(this.el);
        this.el.removeEventListener('impulse', this.onImpulse);
        this.el.removeEventListener('xr:physics-impulse', this.onImpulse);
    },
    getEffectiveRadius() {
        if (this.data.radius > 0) return this.data.radius;
        // Try infer from geometry bounding sphere
        const mesh = this.el.getObject3D('mesh');
        if (mesh && mesh.geometry) {
            if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
            return mesh.geometry.boundingSphere.radius;
        }
        // Fallback
        return 0.5;
    },
    applyImpulse(impulseVec3) {
        // dv = J / m
        const invMass = (this.data.mass > 0) ? (1 / this.data.mass) : 0;
        this.velocity.x += impulseVec3.x * invMass;
        this.velocity.y += impulseVec3.y * invMass;
        this.velocity.z += impulseVec3.z * invMass;

        emitXrEvent(this.el, 'physics-impulse-applied', {
            x: impulseVec3.x,
            y: impulseVec3.y,
            z: impulseVec3.z,
            mass: this.data.mass
        });
    }
});