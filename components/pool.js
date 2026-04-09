import { emitXrEvent } from './core-utils.js';

AFRAME.registerSystem('pool', {
  init: function () {
    this.pools = new Map();
  },

  register: function (name, entity) {
    if (!this.pools.has(name)) this.pools.set(name, []);
    this.pools.get(name).push({ entity, inUse: false });
  },

  acquire: function (name) {
    const entries = this.pools.get(name) || [];
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].inUse) continue;
      entries[i].inUse = true;
      entries[i].entity.setAttribute('visible', true);
      return entries[i].entity;
    }
    return null;
  },

  release: function (entity) {
    if (!entity) return;
    for (const entries of this.pools.values()) {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].entity !== entity) continue;
        entries[i].inUse = false;
        entries[i].entity.setAttribute('visible', false);
        return;
      }
    }
  }
});

AFRAME.registerComponent('pool-source', {
  schema: {
    name: { type: 'string', default: 'default' },
    size: { type: 'int', default: 8 },
    parent: { type: 'selector', default: null }
  },

  init: function () {
    const poolSystem = this.el.sceneEl?.systems?.pool;
    if (!poolSystem) return;

    const parent = this.data.parent || this.el.sceneEl;
    if (!parent) return;

    this.el.setAttribute('visible', false);

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    this.el.object3D.getWorldPosition(worldPos);
    this.el.object3D.getWorldQuaternion(worldQuat);
    this.el.object3D.getWorldScale(worldScale);

    for (let i = 0; i < this.data.size; i++) {
      const clone = this.el.cloneNode(true);
      clone.removeAttribute('id');
      clone.removeAttribute('pool-source');
      clone.setAttribute('visible', false);
      parent.appendChild(clone);
      clone.object3D.position.copy(worldPos);
      clone.object3D.quaternion.copy(worldQuat);
      clone.object3D.scale.copy(worldScale);
      poolSystem.register(this.data.name, clone);
    }

    emitXrEvent(this.el, 'pool-ready', {
      name: this.data.name,
      size: this.data.size
    });
  }
});

AFRAME.registerComponent('pool-consumer', {
  schema: {
    name: { type: 'string', default: 'default' },
    acquireEvent: { type: 'string', default: 'xr:pool-acquire' },
    releaseEvent: { type: 'string', default: 'xr:pool-release' }
  },

  init: function () {
    const poolSystem = this.el.sceneEl?.systems?.pool;
    if (!poolSystem) return;

    this._onAcquire = () => {
      const entity = poolSystem.acquire(this.data.name);
      if (entity) emitXrEvent(this.el, 'pool-acquired', { name: this.data.name, entity });
    };

    this._onRelease = (e) => {
      poolSystem.release(e?.detail?.entity || null);
    };

    this.el.addEventListener(this.data.acquireEvent, this._onAcquire);
    this.el.addEventListener(this.data.releaseEvent, this._onRelease);
  },

  remove: function () {
    this.el.removeEventListener(this.data.acquireEvent, this._onAcquire);
    this.el.removeEventListener(this.data.releaseEvent, this._onRelease);
  }
});
