import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('basic-geometry', {
  schema: {
    primitive: { type: 'string', default: 'box' },
    width: { type: 'number', default: 1 },
    height: { type: 'number', default: 1 },
    depth: { type: 'number', default: 1 },
    radius: { type: 'number', default: 0.5 },
    radiusTop: { type: 'number', default: 0.5 },
    radiusBottom: { type: 'number', default: 0.5 },
    color: { type: 'color', default: '#4cc9f0' },
    roughness: { type: 'number', default: 0.7 },
    metalness: { type: 'number', default: 0.1 }
  },

  init: function () {
    this.applyGeometry();
  },

  update: function () {
    this.applyGeometry();
  },

  applyGeometry: function () {
    const d = this.data;
    if (d.primitive === 'sphere') {
      this.el.setAttribute('geometry', { primitive: 'sphere', radius: d.radius });
    } else if (d.primitive === 'cylinder') {
      this.el.setAttribute('geometry', {
        primitive: 'cylinder',
        radius: d.radius,
        height: d.height
      });
    } else if (d.primitive === 'cone') {
      this.el.setAttribute('geometry', {
        primitive: 'cone',
        radiusBottom: d.radiusBottom,
        radiusTop: d.radiusTop,
        height: d.height
      });
    } else if (d.primitive === 'plane') {
      this.el.setAttribute('geometry', {
        primitive: 'plane',
        width: d.width,
        height: d.height
      });
    } else if (d.primitive === 'torus') {
      this.el.setAttribute('geometry', {
        primitive: 'torus',
        radius: d.radius,
        radiusTubular: Math.max(0.01, d.depth * 0.15)
      });
    } else {
      this.el.setAttribute('geometry', {
        primitive: 'box',
        width: d.width,
        height: d.height,
        depth: d.depth
      });
    }

    this.el.setAttribute('material', {
      color: d.color,
      roughness: d.roughness,
      metalness: d.metalness
    });

    emitXrEvent(this.el, 'basic-geometry-applied', { primitive: d.primitive });
  }
});

AFRAME.registerComponent('geometry-row', {
  schema: {
    count: { type: 'int', default: 6 },
    spacing: { type: 'number', default: 1.25 },
    primitives: { type: 'array', default: ['box', 'sphere', 'cylinder', 'cone'] },
    randomColors: { type: 'boolean', default: true }
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
      const child = this._children[i];
      if (child.parentNode) child.parentNode.removeChild(child);
    }
    this._children.length = 0;
  },

  build: function () {
    this.clear();

    const count = Math.max(0, this.data.count);
    if (!count) return;

    const baseX = -((count - 1) * this.data.spacing) * 0.5;
    for (let i = 0; i < count; i++) {
      const primitive = this.data.primitives[i % this.data.primitives.length] || 'box';
      const child = document.createElement('a-entity');
      child.setAttribute('position', `${baseX + i * this.data.spacing} 0 0`);
      child.setAttribute('basic-geometry', {
        primitive,
        color: this.data.randomColors ? randomColor() : '#4cc9f0'
      });
      this.el.appendChild(child);
      this._children.push(child);
    }

    emitXrEvent(this.el, 'geometry-row-built', { count });
  }
});

function randomColor() {
  const c = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `#${c}`;
}
