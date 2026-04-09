import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('projectile', {
  schema: {
    speed: { type: 'number', default: 10 },
    lifeMs: { type: 'int', default: 2500 },
    gravity: { type: 'number', default: 0 },
    damage: { type: 'number', default: 1 },
    hitSelector: { type: 'string', default: '[damage-receiver], [health], [target]' }
  },

  init: function () {
    this.velocity = new THREE.Vector3();
    this._lastPos = new THREE.Vector3();
    this._rayDir = new THREE.Vector3();
    this._ray = new THREE.Raycaster();
    this._bornAt = performance.now();

    this.el.object3D.getWorldDirection(this.velocity);
    this.velocity.multiplyScalar(-this.data.speed);
    this.el.object3D.getWorldPosition(this._lastPos);
  },

  tick: function (time, dtMs) {
    if (!dtMs) return;
    if (time - this._bornAt > this.data.lifeMs) {
      this.destroy();
      return;
    }

    const dt = dtMs / 1000;
    if (this.data.gravity) this.velocity.y -= this.data.gravity * dt;

    this.el.object3D.position.addScaledVector(this.velocity, dt);

    const nowPos = this.el.object3D.position;
    this._rayDir.copy(nowPos).sub(this._lastPos);
    const len = this._rayDir.length();
    if (len > 0.0001) {
      this._rayDir.normalize();
      this._ray.set(this._lastPos, this._rayDir);
      this._ray.far = len;

      const targets = this.el.sceneEl?.querySelectorAll(this.data.hitSelector) || [];
      const meshes = [];
      for (let i = 0; i < targets.length; i++) {
        const obj = targets[i].object3D;
        if (obj) meshes.push(obj);
      }

      const hits = this._ray.intersectObjects(meshes, true);
      if (hits.length) {
        const hitObj = hits[0].object;
        let node = hitObj;
        while (node && !node.el) node = node.parent;
        const targetEl = node?.el || null;
        if (targetEl && targetEl !== this.el) {
          targetEl.emit('xr:damage', { amount: this.data.damage, source: this.el, reason: 'projectile' });
          emitXrEvent(this.el, 'projectile-hit', { target: targetEl, damage: this.data.damage });
          this.destroy();
          return;
        }
      }
    }

    this._lastPos.copy(this.el.object3D.position);
  },

  destroy: function () {
    if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
});

AFRAME.registerComponent('projectile-launcher', {
  schema: {
    prefab: { type: 'selector', default: null },
    fireEvent: { type: 'string', default: 'shoot' }
  },

  init: function () {
    this._onFire = () => this.fire();
    this._worldPos = new THREE.Vector3();
    this._worldQuat = new THREE.Quaternion();
    this.el.addEventListener(this.data.fireEvent, this._onFire);
  },

  remove: function () {
    this.el.removeEventListener(this.data.fireEvent, this._onFire);
  },

  fire: function () {
    const prefab = this.data.prefab;
    if (!prefab) return;

    const clone = prefab.cloneNode(true);
    clone.removeAttribute('id');
    this.el.sceneEl.appendChild(clone);

    this.el.object3D.getWorldPosition(this._worldPos);
    this.el.object3D.getWorldQuaternion(this._worldQuat);
    clone.object3D.position.copy(this._worldPos);
    clone.object3D.quaternion.copy(this._worldQuat);

    if (!clone.hasAttribute('projectile')) {
      clone.setAttribute('projectile', '');
    }

    emitXrEvent(this.el, 'projectile-fired', { projectile: clone });
  }
});
