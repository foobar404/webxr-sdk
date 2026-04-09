import { emitXrEvent } from './core-utils.js';

AFRAME.registerSystem('bullet', {
  init: function () {
    const containerEntity = document.createElement('a-entity');
    containerEntity.id = 'superShooterBulletContainer';
    this.el.sceneEl.appendChild(containerEntity);

    this.container = containerEntity.object3D;
    this.pool = {};
    this.targets = new Set();

    this._bulletBox = new THREE.Box3();
    this._targetBox = new THREE.Box3();
    this._step = new THREE.Vector3();
  },

  registerBullet: function (component) {
    const object3D = component.el.object3D;
    if (!object3D) return;

    const data = component.data;
    if (!this.pool[data.name]) this.pool[data.name] = [];

    for (let i = 0; i < data.poolSize; i++) {
      const clone = object3D.clone();
      clone.damagePoints = data.damagePoints;
      clone.direction = new THREE.Vector3(0, 0, -1);
      clone.maxTime = data.maxTime * 1000;
      clone.name = `${data.name}${i}`;
      clone.speed = data.speed;
      clone.time = 0;
      clone.visible = false;
      this.pool[data.name].push(clone);
    }
  },

  registerTarget: function (component, useStaticBounds) {
    this.targets.add(component.el);
    if (!useStaticBounds) return;

    const object3D = component.el.object3D;
    object3D.boundingBox = new THREE.Box3().setFromObject(object3D);
  },

  unregisterTarget: function (targetEl) {
    this.targets.delete(targetEl);
  },

  shoot: function (typeName, sourceObject3D) {
    const bullets = this.pool[typeName];
    if (!bullets || bullets.length === 0) return null;

    let oldestVisible = bullets[0];
    for (let i = 0; i < bullets.length; i++) {
      const bullet = bullets[i];
      if (!bullet.visible) {
        return this._spawnBullet(bullet, sourceObject3D);
      }
      if (bullet.time > oldestVisible.time) oldestVisible = bullet;
    }

    return this._spawnBullet(oldestVisible, sourceObject3D);
  },

  _spawnBullet: function (bullet, sourceObject3D) {
    bullet.visible = true;
    bullet.time = 0;
    sourceObject3D.getWorldPosition(bullet.position);
    sourceObject3D.getWorldDirection(bullet.direction);
    bullet.direction.multiplyScalar(-bullet.speed);
    this.container.add(bullet);
    return bullet;
  },

  tick: function (time, dtMs) {
    const dt = dtMs / 850;
    if (!dt || !this.container || this.container.children.length === 0) return;

    for (let i = 0; i < this.container.children.length; i++) {
      const bullet = this.container.children[i];
      if (!bullet.visible) continue;

      bullet.time += dtMs;
      if (bullet.time >= bullet.maxTime) {
        this.killBullet(bullet);
        continue;
      }

      this._step.copy(bullet.direction).multiplyScalar(dt);
      bullet.position.add(this._step);
      this._bulletBox.setFromObject(bullet);

      for (const targetEl of this.targets) {
        const target = targetEl.components.target;
        if (!target || !target.data.active) continue;

        const targetObj = targetEl.object3D;
        if (!targetObj.visible) continue;

        const intersects = targetObj.boundingBox
          ? targetObj.boundingBox.intersectsBox(this._bulletBox)
          : this._targetBox.setFromObject(targetObj).intersectsBox(this._bulletBox);

        if (!intersects) continue;

        this.killBullet(bullet);
        target.onBulletHit(bullet);
        emitXrEvent(targetEl, 'target-hit', {
          damagePoints: bullet.damagePoints,
          bulletName: bullet.name
        }, 'hit');
        break;
      }
    }
  },

  killBullet: function (bullet) {
    bullet.visible = false;
  }
});

AFRAME.registerComponent('bullet', {
  dependencies: ['material'],
  schema: {
    damagePoints: { default: 1, type: 'float' },
    maxTime: { default: 4, type: 'float' },
    name: { default: 'normal', type: 'string' },
    poolSize: { default: 10, type: 'int', min: 0 },
    speed: { default: 8, type: 'float' }
  },

  init: function () {
    const el = this.el;
    el.object3D.visible = false;

    this._onObject3DSet = () => {
      if (!el.sceneEl || !el.sceneEl.systems || !el.sceneEl.systems.bullet) return;
      el.sceneEl.systems.bullet.registerBullet(this);
    };

    el.addEventListener('object3dset', this._onObject3DSet);
    this._onObject3DSet();
  },

  remove: function () {
    this.el.removeEventListener('object3dset', this._onObject3DSet);
  }
});
