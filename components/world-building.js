import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('world-ground', {
  schema: {
    width: { type: 'number', default: 40 },
    depth: { type: 'number', default: 40 },
    color: { type: 'color', default: '#24313d' },
    withStaticBody: { type: 'boolean', default: true }
  },

  init: function () {
    this.el.setAttribute('geometry', {
      primitive: 'plane',
      width: this.data.width,
      height: this.data.depth
    });
    this.el.setAttribute('rotation', '-90 0 0');
    this.el.setAttribute('material', {
      color: this.data.color,
      roughness: 0.9,
      metalness: 0.05
    });

    if (this.data.withStaticBody) {
      this.el.setAttribute('static-body', {
        type: 'plane',
        normal: { x: 0, y: 1, z: 0 },
        offset: 0
      });
    }

    emitXrEvent(this.el, 'world-ground-built', {
      width: this.data.width,
      depth: this.data.depth
    });
  }
});

AFRAME.registerComponent('world-platforms', {
  schema: {
    countX: { type: 'int', default: 4 },
    countZ: { type: 'int', default: 4 },
    spacing: { type: 'number', default: 3 },
    minHeight: { type: 'number', default: 0.3 },
    maxHeight: { type: 'number', default: 2.4 },
    color: { type: 'color', default: '#4cc9f0' }
  },

  init: function () {
    this._children = [];
    this.build();
  },

  update: function () {
    this.build();
  },

  remove: function () {
    this.clear();
  },

  clear: function () {
    for (let i = 0; i < this._children.length; i++) {
      const el = this._children[i];
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    this._children.length = 0;
  },

  build: function () {
    this.clear();

    const d = this.data;
    const ox = -((d.countX - 1) * d.spacing) * 0.5;
    const oz = -((d.countZ - 1) * d.spacing) * 0.5;

    for (let x = 0; x < d.countX; x++) {
      for (let z = 0; z < d.countZ; z++) {
        const h = THREE.MathUtils.lerp(d.minHeight, d.maxHeight, Math.random());
        const p = document.createElement('a-entity');
        p.setAttribute('geometry', {
          primitive: 'box',
          width: 1.8,
          depth: 1.8,
          height: h
        });
        p.setAttribute('material', { color: d.color, roughness: 0.7, metalness: 0.08 });
        p.setAttribute('position', `${ox + x * d.spacing} ${h * 0.5} ${oz + z * d.spacing}`);
        p.setAttribute('static-body', {
          type: 'box',
          size: { x: 0.9, y: h * 0.5, z: 0.9 },
          center: { x: 0, y: 0, z: 0 }
        });

        this.el.appendChild(p);
        this._children.push(p);
      }
    }

    emitXrEvent(this.el, 'world-platforms-built', {
      count: this._children.length
    });
  }
});

AFRAME.registerComponent('world-scatter', {
  schema: {
    count: { type: 'int', default: 24 },
    radius: { type: 'number', default: 16 },
    minScale: { type: 'number', default: 0.4 },
    maxScale: { type: 'number', default: 1.8 },
    y: { type: 'number', default: 0 },
    color: { type: 'color', default: '#6d597a' }
  },

  init: function () {
    this._children = [];
    this.build();
  },

  update: function () {
    this.build();
  },

  remove: function () {
    for (let i = 0; i < this._children.length; i++) {
      const el = this._children[i];
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    this._children.length = 0;
  },

  build: function () {
    this.remove();

    const shapes = ['box', 'sphere', 'cone', 'cylinder'];
    for (let i = 0; i < this.data.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * this.data.radius;
      const scale = THREE.MathUtils.lerp(this.data.minScale, this.data.maxScale, Math.random());
      const shape = shapes[i % shapes.length];

      const e = document.createElement('a-entity');
      e.setAttribute('basic-geometry', {
        primitive: shape,
        width: scale,
        height: scale,
        depth: scale,
        radius: Math.max(0.2, scale * 0.5),
        color: this.data.color
      });
      e.setAttribute('position', `${Math.cos(angle) * r} ${this.data.y + scale * 0.5} ${Math.sin(angle) * r}`);
      this.el.appendChild(e);
      this._children.push(e);
    }

    emitXrEvent(this.el, 'world-scatter-built', { count: this._children.length });
  }
});
