import { emitXrEvent, resolveRig } from './core-utils.js';

AFRAME.registerComponent('swing-movement', {
  schema: {
    cameraRig: { type: 'selector', default: null },
    leftHand: { type: 'selector', default: null },
    rightHand: { type: 'selector', default: null },
    gain: { type: 'number', default: 1.4 },
    maxSpeed: { type: 'number', default: 4.5 }
  },

  init: function () {
    this.rig = resolveRig(this.el, this.data.cameraRig || null);
    this._leftPrev = new THREE.Vector3();
    this._rightPrev = new THREE.Vector3();
    this._leftNow = new THREE.Vector3();
    this._rightNow = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._started = false;
  },

  tick: function (time, dtMs) {
    if (!dtMs || !this.rig || !this.data.leftHand || !this.data.rightHand) return;

    this.data.leftHand.object3D.getWorldPosition(this._leftNow);
    this.data.rightHand.object3D.getWorldPosition(this._rightNow);

    if (!this._started) {
      this._leftPrev.copy(this._leftNow);
      this._rightPrev.copy(this._rightNow);
      this._started = true;
      return;
    }

    const leftSpeed = this._leftNow.distanceTo(this._leftPrev) / (dtMs / 1000);
    const rightSpeed = this._rightNow.distanceTo(this._rightPrev) / (dtMs / 1000);
    const swing = Math.min(this.data.maxSpeed, (leftSpeed + rightSpeed) * 0.5 * this.data.gain);

    const camera = this.el.sceneEl?.querySelector('[camera]') || this.el.sceneEl?.querySelector('a-camera');
    if (!camera) return;

    camera.object3D.getWorldDirection(this._forward);
    this._forward.y = 0;
    if (this._forward.lengthSq() <= 0.0001) return;

    this._forward.normalize();
    this.rig.object3D.position.addScaledVector(this._forward, swing * (dtMs / 1000));

    this._leftPrev.copy(this._leftNow);
    this._rightPrev.copy(this._rightNow);
    emitXrEvent(this.el, 'swing-step', { speed: swing });
  }
});
