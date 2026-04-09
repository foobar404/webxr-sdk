import { emitXrEvent, resolveRig } from './core-utils.js';

AFRAME.registerComponent('jump', {
  schema: {
    event:       {type: 'string', default: 'abuttondown'},
    impulse:     {type: 'number', default: 3.5},   // m/s
    gravity:     {type: 'number', default: -9.8},  // m/s^2
    cameraRig:   {type: 'selector', default: null},
    ground:      {type: 'selectorAll', default: []}, // optional: surfaces to raycast
    groundY:     {type: 'number', default: 0},     // fallback plane if no ground selector
    snapTol:     {type: 'number', default: 0.03}   // snap threshold to ground
  },

  init() {
    this.vy = 0;
    this._ray = new THREE.Raycaster();
    this._down = new THREE.Vector3(0,-1,0);
    this._rayOrigin = new THREE.Vector3();
    this._onJump = this._onJump.bind(this);
    this._resolveRig();
    this.el.addEventListener(this.data.event, this._onJump);
  },

  update(old) {
    if (old.event !== this.data.event) {
      this.el.removeEventListener(old.event || 'abuttondown', this._onJump);
      this.el.addEventListener(this.data.event, this._onJump);
    }
    this._resolveRig();
  },

  remove() { this.el.removeEventListener(this.data.event, this._onJump); },

  tick(t, dtMs) {
    if (!this.rig) return;
    if (!dtMs) return;
    const dt = Math.min(0.05, dtMs / 1000);

    const pos = this.rig.object3D.position;
    const groundHit = this._groundHit(pos);

    if (groundHit && this.vy <= 0) {
      // stick to ground
      pos.y = groundHit.y;
      this.vy = 0;
    } else {
      // integrate
      this.vy += this.data.gravity * dt;
      pos.y += this.vy * dt;
      // snap if we crossed the ground
      const hitAfter = this._groundHit(pos);
      if (hitAfter && pos.y - hitAfter.y <= this.data.snapTol && this.vy <= 0) {
        pos.y = hitAfter.y; this.vy = 0;
        emitXrEvent(this.el, 'landed', { y: pos.y }, 'landed');
      }
    }
  },

  _onJump() {
    if (!this.rig) return;
    const pos = this.rig.object3D.position;
    const grounded = !!this._groundHit(pos);
    if (!grounded) return;
    this.vy = this.data.impulse;
    emitXrEvent(this.el, 'jumped', { impulse: this.data.impulse }, 'jumped');
  },

  _groundHit(pos) {
    // raycast if ground selector provided
    if (this.data.ground && this.data.ground.length) {
      this._rayOrigin.set(pos.x, pos.y + 0.05, pos.z);
      this._ray.set(this._rayOrigin, this._down);
      const meshes = [];
      for (let i = 0; i < this.data.ground.length; i++) {
        const obj = this.data.ground[i].object3D;
        if (obj) obj.traverse(o => { if (o.isMesh) meshes.push(o); });
      }
      const hits = this._ray.intersectObjects(meshes, true);
      if (hits.length) return {y: hits[0].point.y};
      return null;
    }
    // fallback flat plane
    return {y: this.data.groundY};
  },

  _resolveRig() {
    this.rig = resolveRig(this.el, this.data.cameraRig || null);
  }
});
