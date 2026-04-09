import { emitXrEvent, requireSystem } from './core-utils.js';

AFRAME.registerComponent('target', {
  schema: {
    active: { default: true },
    healthPoints: { default: 1, type: 'float' },
    static: { default: true }
  },

  init: function () {
    this.healthPoints = this.data.healthPoints;
    this._bulletSystem = requireSystem(this.el.sceneEl, 'bullet', 'target', this.el);
    this._registered = false;

    this._onObject3DSet = () => {
      if (this._registered) return;
      this._bulletSystem.registerTarget(this, this.data.static);
      this._registered = true;
    };

    this.el.addEventListener('object3dset', this._onObject3DSet);
    this._onObject3DSet();
  },

  update: function () {
    this.healthPoints = this.data.healthPoints;
  },

  remove: function () {
    this.el.removeEventListener('object3dset', this._onObject3DSet);
    if (this._registered) {
      this._bulletSystem.unregisterTarget(this.el);
      this._registered = false;
    }
  },

  onBulletHit: function (bullet) {
    if (!this.data.active) return;

    this.lastBulletHit = bullet;
    this.healthPoints -= bullet.damagePoints;

    emitXrEvent(this.el, 'target-damaged', {
      healthPoints: this.healthPoints,
      damagePoints: bullet.damagePoints
    });

    if (this.healthPoints <= 0) {
      emitXrEvent(this.el, 'target-destroyed', {
        healthPoints: this.healthPoints
      }, 'die');
    }
  }
});
