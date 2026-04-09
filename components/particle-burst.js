AFRAME.registerComponent('particle-burst', {
  schema: {
    event: { type: 'string', default: 'xr:target-destroyed' },
    count: { type: 'int', default: 14 },
    speed: { type: 'number', default: 1.5 },
    spread: { type: 'number', default: 0.8 },
    life: { type: 'int', default: 700 },
    size: { type: 'number', default: 0.05 },
    color: { type: 'color', default: '#ffd166' }
  },

  init: function () {
    this._timers = [];
    this._onBurst = () => {
      this.burst();
    };
    this.el.addEventListener(this.data.event, this._onBurst);
  },

  update: function (oldData) {
    if (oldData.event && oldData.event !== this.data.event) {
      this.el.removeEventListener(oldData.event, this._onBurst);
      this.el.addEventListener(this.data.event, this._onBurst);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onBurst);
    for (let i = 0; i < this._timers.length; i++) {
      clearTimeout(this._timers[i]);
    }
    this._timers.length = 0;
  },

  burst: function () {
    const scene = this.el.sceneEl;
    if (!scene) return;

    const origin = new THREE.Vector3();
    this.el.object3D.getWorldPosition(origin);

    for (let i = 0; i < this.data.count; i++) {
      const p = document.createElement('a-entity');
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * this.data.spread,
        Math.random() * this.data.spread,
        (Math.random() - 0.5) * this.data.spread
      ).normalize();

      const distance = this.data.speed * (this.data.life / 1000);
      const tx = origin.x + dir.x * distance;
      const ty = origin.y + dir.y * distance;
      const tz = origin.z + dir.z * distance;

      p.setAttribute('geometry', `primitive: sphere; radius: ${this.data.size}`);
      p.setAttribute('material', `color: ${this.data.color}; transparent: true; opacity: 0.95`);
      p.setAttribute('position', `${origin.x} ${origin.y} ${origin.z}`);
      p.setAttribute('animation__move', `property: position; to: ${tx} ${ty} ${tz}; dur: ${this.data.life}; easing: easeOutQuad`);
      p.setAttribute('animation__fade', `property: material.opacity; to: 0; dur: ${this.data.life}; easing: linear`);
      scene.appendChild(p);

      const id = setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
        const idx = this._timers.indexOf(id);
        if (idx !== -1) this._timers.splice(idx, 1);
      }, this.data.life + 25);
      this._timers.push(id);
    }
  }
});
