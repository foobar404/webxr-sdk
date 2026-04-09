import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('toon-shader', {
  schema: {
    color: { type: 'color', default: '#ffffff' },
    levels: { type: 'int', default: 4 },
    emissive: { type: 'color', default: '#111111' },
    restoreOnRemove: { type: 'boolean', default: true }
  },

  init: function () {
    this._original = new Map();
    this._onObjectSet = () => this.apply();
    this.el.addEventListener('object3dset', this._onObjectSet);
    this.apply();
  },

  update: function () {
    this.apply();
  },

  remove: function () {
    this.el.removeEventListener('object3dset', this._onObjectSet);
    if (!this.data.restoreOnRemove) return;

    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((node) => {
      if (!node.isMesh || !this._original.has(node.uuid)) return;
      node.material = this._original.get(node.uuid);
    });
  },

  apply: function () {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    const gradientMap = createGradientMap(Math.max(2, this.data.levels));
    mesh.traverse((node) => {
      if (!node.isMesh) return;
      if (!this._original.has(node.uuid)) this._original.set(node.uuid, node.material);
      node.material = new THREE.MeshToonMaterial({
        color: this.data.color,
        emissive: this.data.emissive,
        gradientMap
      });
      node.material.needsUpdate = true;
    });

    emitXrEvent(this.el, 'shader-toon-applied', { levels: this.data.levels });
  }
});

AFRAME.registerComponent('normals-shader', {
  schema: {
    wireframe: { type: 'boolean', default: false },
    flatShading: { type: 'boolean', default: false },
    restoreOnRemove: { type: 'boolean', default: true }
  },

  init: function () {
    this._original = new Map();
    this._onObjectSet = () => this.apply();
    this.el.addEventListener('object3dset', this._onObjectSet);
    this.apply();
  },

  update: function () {
    this.apply();
  },

  remove: function () {
    this.el.removeEventListener('object3dset', this._onObjectSet);
    if (!this.data.restoreOnRemove) return;

    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((node) => {
      if (!node.isMesh || !this._original.has(node.uuid)) return;
      node.material = this._original.get(node.uuid);
    });
  },

  apply: function () {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh) return;
      if (!this._original.has(node.uuid)) this._original.set(node.uuid, node.material);
      node.material = new THREE.MeshNormalMaterial({
        wireframe: this.data.wireframe,
        flatShading: this.data.flatShading
      });
      node.material.needsUpdate = true;
    });

    emitXrEvent(this.el, 'shader-normals-applied', {
      wireframe: this.data.wireframe,
      flatShading: this.data.flatShading
    });
  }
});

function createGradientMap(levels) {
  const size = Math.max(2, levels);
  const data = new Uint8Array(size * 3);
  for (let i = 0; i < size; i++) {
    const v = Math.floor((i / (size - 1)) * 255);
    data[i * 3 + 0] = v;
    data[i * 3 + 1] = v;
    data[i * 3 + 2] = v;
  }

  const texture = new THREE.DataTexture(data, size, 1, THREE.RGBFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
