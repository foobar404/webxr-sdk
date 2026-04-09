import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('snappable', {
  schema: {
    enabled: { type: 'boolean', default: true }
  }
});

AFRAME.registerComponent('snap-zone', {
  schema: {
    radius: { type: 'number', default: 0.4 },
    autoSnap: { type: 'boolean', default: true },
    selector: { type: 'string', default: '[snappable]' },
    snapRotation: { type: 'boolean', default: true }
  },

  init: function () {
    this._zonePos = new THREE.Vector3();
    this._itemPos = new THREE.Vector3();
    this._onAttempt = (e) => {
      const item = e?.detail?.item || null;
      if (item) this.trySnap(item);
    };

    this.el.addEventListener('xr:snap-attempt', this._onAttempt);
  },

  remove: function () {
    this.el.removeEventListener('xr:snap-attempt', this._onAttempt);
  },

  tick: function () {
    if (!this.data.autoSnap) return;
    const candidates = this.el.sceneEl?.querySelectorAll(this.data.selector) || [];
    for (let i = 0; i < candidates.length; i++) {
      this.trySnap(candidates[i]);
    }
  },

  trySnap: function (itemEl) {
    if (!itemEl || !itemEl.isConnected) return false;
    const snappable = itemEl.components.snappable;
    if (!snappable || !snappable.data.enabled) return false;

    this.el.object3D.getWorldPosition(this._zonePos);
    itemEl.object3D.getWorldPosition(this._itemPos);
    if (this._zonePos.distanceTo(this._itemPos) > this.data.radius) return false;

    itemEl.object3D.position.copy(this._zonePos);
    if (this.data.snapRotation) {
      itemEl.object3D.quaternion.copy(this.el.object3D.quaternion);
    }

    emitXrEvent(this.el, 'snap-zone-snapped', { item: itemEl, zone: this.el });
    emitXrEvent(itemEl, 'snapped', { zone: this.el });
    return true;
  }
});
