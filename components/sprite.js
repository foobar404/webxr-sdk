AFRAME.registerComponent('sprite', {
  schema: {
    src: { type: 'asset', default: '' },
    width: { type: 'number', default: 1 },
    height: { type: 'number', default: 1 },
    billboard: { type: 'boolean', default: true }
  },

  init: function () {
    if (this.data.src) {
      this.el.setAttribute('material', { src: this.data.src, transparent: true, side: 'double' });
    }
    this.el.setAttribute('geometry', { primitive: 'plane', width: this.data.width, height: this.data.height });
  },

  tick: function () {
    if (!this.data.billboard) return;
    const cam = this.el.sceneEl?.querySelector('[camera]') || this.el.sceneEl?.querySelector('a-camera');
    if (!cam) return;
    this.el.object3D.lookAt(cam.object3D.getWorldPosition(new THREE.Vector3()));
  }
});
