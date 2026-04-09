import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('melee-hitbox', {
  schema: {
    event: { type: 'string', default: 'xr:melee-attack' },
    targets: { type: 'string', default: '[damage-receiver], [health], [target]' },
    range: { type: 'number', default: 1.5 },
    arcDeg: { type: 'number', default: 110 },
    damage: { type: 'number', default: 1 },
    maxHits: { type: 'int', default: 4 }
  },

  init: function () {
    this._selfPos = new THREE.Vector3();
    this._targetPos = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._toTarget = new THREE.Vector3();

    this._onAttack = (e) => {
      this.attack(e?.detail?.source || this.el);
    };

    this.el.addEventListener(this.data.event, this._onAttack);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onAttack);
  },

  attack: function (source = null) {
    const scene = this.el.sceneEl;
    if (!scene) return;

    const candidates = scene.querySelectorAll(this.data.targets);
    if (!candidates || !candidates.length) return;

    this.el.object3D.getWorldPosition(this._selfPos);
    this.el.object3D.getWorldDirection(this._forward).normalize().multiplyScalar(-1);

    const maxAngle = THREE.MathUtils.degToRad(this.data.arcDeg * 0.5);
    let hits = 0;

    for (let i = 0; i < candidates.length; i++) {
      const target = candidates[i];
      if (target === this.el) continue;

      target.object3D.getWorldPosition(this._targetPos);
      this._toTarget.copy(this._targetPos).sub(this._selfPos);

      const dist = this._toTarget.length();
      if (dist > this.data.range || dist <= 0.0001) continue;

      this._toTarget.normalize();
      const angle = this._forward.angleTo(this._toTarget);
      if (angle > maxAngle) continue;

      target.emit('xr:damage', {
        amount: this.data.damage,
        source: source || this.el,
        reason: 'melee'
      });

      emitXrEvent(this.el, 'melee-hit', { target, damage: this.data.damage, source: source || this.el });
      hits += 1;
      if (hits >= this.data.maxHits) break;
    }

    emitXrEvent(this.el, 'melee-attack-complete', { hits, source: source || this.el });
  }
});
