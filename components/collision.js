import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('collision', {
  schema: {
    selector: { type: 'string', default: '[collision-body]' },
    eventPrefix: { type: 'string', default: 'xr:collision' }
  },

  init: function () {
    this._boxA = new THREE.Box3();
    this._boxB = new THREE.Box3();
    this._inside = new Set();
  },

  tick: function () {
    const others = this.el.sceneEl?.querySelectorAll(this.data.selector) || [];
    this._boxA.setFromObject(this.el.object3D);

    const now = new Set();
    for (let i = 0; i < others.length; i++) {
      const other = others[i];
      if (other === this.el) continue;
      this._boxB.setFromObject(other.object3D);
      if (!this._boxA.intersectsBox(this._boxB)) continue;

      now.add(other);
      if (!this._inside.has(other)) {
        this.el.emit(`${this.data.eventPrefix}-enter`, { other });
        emitXrEvent(this.el, 'collision-enter', { other });
      } else {
        this.el.emit(`${this.data.eventPrefix}-stay`, { other });
      }
    }

    for (const other of this._inside) {
      if (now.has(other)) continue;
      this.el.emit(`${this.data.eventPrefix}-exit`, { other });
      emitXrEvent(this.el, 'collision-exit', { other });
    }

    this._inside = now;
  }
});

AFRAME.registerComponent('collision-body', {
  schema: {
    enabled: { type: 'boolean', default: true }
  }
});
