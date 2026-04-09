import { emitXrEvent } from './core-utils.js';

const PLANE_NORMAL = new THREE.Vector3(0, 0, 1);

AFRAME.registerComponent('crosshair', {
  schema: {
    enabled: { type: 'boolean', default: true },
    selector: { type: 'string', default: '' },
    maxDistance: { type: 'number', default: 12 },
    size: { type: 'number', default: 0.06 },
    offset: { type: 'number', default: 0.002 },
    color: { type: 'color', default: '#24CAFF' },
    opacity: { type: 'number', default: 0.95 },
    showRay: { type: 'boolean', default: true },
    rayColor: { type: 'color', default: '#24CAFF' },
    rayOpacity: { type: 'number', default: 0.65 }
  },

  init: function () {
    this._origin = new THREE.Vector3();
    this._direction = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._endpoint = new THREE.Vector3();
    this._endNoHit = new THREE.Vector3();
    this._normalMatrix = new THREE.Matrix3();
    this._quat = new THREE.Quaternion();
    this._raycaster = new THREE.Raycaster();

    this._decalMaterial = new THREE.MeshBasicMaterial({
      color: this.data.color,
      transparent: true,
      opacity: this.data.opacity,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -10
    });
    this._decal = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this._decalMaterial);
    this._decal.scale.set(this.data.size, this.data.size, this.data.size);
    this._decal.visible = false;
    this.el.sceneEl.object3D.add(this._decal);

    this._line = null;
    if (this.data.showRay) this._createLine();
  },

  update: function (oldData) {
    if (!this._decalMaterial) return;

    this._decal.scale.set(this.data.size, this.data.size, this.data.size);
    this._decalMaterial.color.set(this.data.color);
    this._decalMaterial.opacity = this.data.opacity;

    if (oldData.showRay !== this.data.showRay) {
      if (this.data.showRay) this._createLine();
      else this._destroyLine();
    }

    if (this._lineMaterial) {
      this._lineMaterial.color.set(this.data.rayColor);
      this._lineMaterial.opacity = this.data.rayOpacity;
      this._lineMaterial.transparent = this.data.rayOpacity < 1;
    }
  },

  remove: function () {
    this._destroyLine();

    if (this._decal) {
      if (this._decal.parent) this._decal.parent.remove(this._decal);
      if (this._decal.geometry) this._decal.geometry.dispose();
      if (this._decal.material) this._decal.material.dispose();
      this._decal = null;
    }
  },

  tick: function () {
    if (!this.data.enabled || !this.el.sceneEl) {
      if (this._decal) this._decal.visible = false;
      if (this._line) this._line.visible = false;
      return;
    }

    if (this._line) this._line.visible = true;

    this.el.object3D.getWorldPosition(this._origin);
    this.el.object3D.getWorldDirection(this._direction);
    this._direction.normalize();

    this._raycaster.far = Math.max(0.001, this.data.maxDistance);
    this._raycaster.set(this._origin, this._direction);

    const hit = this._findHit();
    if (hit) {
      this._applyHit(hit);
      emitXrEvent(this.el, 'crosshair-hit', { target: this._resolveTargetEl(hit), point: hit.point });
    } else {
      this._clearHit();
      emitXrEvent(this.el, 'crosshair-miss', {});
    }

    this._updateRay(hit);
  },

  _createLine: function () {
    if (this._line) return;

    this._lineMaterial = new THREE.LineBasicMaterial({
      color: this.data.rayColor,
      transparent: this.data.rayOpacity < 1,
      opacity: this.data.rayOpacity
    });

    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, -1)
    ]);

    this._line = new THREE.Line(lineGeom, this._lineMaterial);
    this.el.sceneEl.object3D.add(this._line);
  },

  _destroyLine: function () {
    if (!this._line) return;
    if (this._line.parent) this._line.parent.remove(this._line);
    if (this._line.geometry) this._line.geometry.dispose();
    if (this._line.material) this._line.material.dispose();
    this._line = null;
    this._lineMaterial = null;
  },

  _findHit: function () {
    const root = this.el.sceneEl.object3D;
    if (!root) return null;

    const hits = this._raycaster.intersectObject(root, true);
    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      if (!hit || !hit.object) continue;
      if (hit.object === this._decal || hit.object === this._line) continue;

      const targetEl = this._resolveTargetEl(hit);
      if (!targetEl) continue;
      if (targetEl === this.el || this.el.contains(targetEl)) continue;
      if (this.data.selector && !this._matchesSelector(targetEl)) continue;

      return hit;
    }

    return null;
  },

  _resolveTargetEl: function (hit) {
    let node = hit.object;
    while (node && !node.el) node = node.parent;
    return node ? node.el : null;
  },

  _matchesSelector: function (el) {
    if (!el || !this.data.selector) return true;
    if (el.matches(this.data.selector)) return true;
    return !!el.closest(this.data.selector);
  },

  _applyHit: function (hit) {
    if (!this._decal) return;

    this._decal.visible = true;
    this._endpoint.copy(hit.point);

    if (hit.face) {
      this._normal.copy(hit.face.normal);
      this._normalMatrix.getNormalMatrix(hit.object.matrixWorld);
      this._normal.applyMatrix3(this._normalMatrix).normalize();
    } else {
      this._normal.copy(this._direction).multiplyScalar(-1);
    }

    this._decal.position.copy(this._endpoint).addScaledVector(this._normal, this.data.offset);
    this._quat.setFromUnitVectors(PLANE_NORMAL, this._normal);
    this._decal.quaternion.copy(this._quat);
  },

  _clearHit: function () {
    if (this._decal) this._decal.visible = false;
  },

  _updateRay: function (hit) {
    if (!this._line || !this._line.geometry) return;

    if (hit) {
      this._endNoHit.copy(hit.point);
    } else {
      this._endNoHit.copy(this._direction).multiplyScalar(this.data.maxDistance).add(this._origin);
    }

    this._line.geometry.setFromPoints([this._origin, this._endNoHit]);
    this._line.geometry.computeBoundingSphere();
  }
});
