import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('joint-button', {
  schema: {
    event: { type: 'string', default: 'xr:interact-use' },
    pressDepth: { type: 'number', default: 0.02 }
  },

  init: function () {
    this._originY = this.el.object3D.position.y;
    this._onPress = () => {
      this.el.object3D.position.y = this._originY - this.data.pressDepth;
      emitXrEvent(this.el, 'joint-button-pressed', {});
      setTimeout(() => {
        this.el.object3D.position.y = this._originY;
      }, 90);
    };
    this.el.addEventListener(this.data.event, this._onPress);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onPress);
  }
});

AFRAME.registerComponent('joint-joystick', {
  schema: {
    event: { type: 'string', default: 'thumbstickmoved' },
    maxTilt: { type: 'number', default: 15 }
  },

  init: function () {
    this._onMove = (e) => {
      const x = e?.detail?.x || 0;
      const y = e?.detail?.y || 0;
      this.el.object3D.rotation.x = THREE.MathUtils.degToRad(this.data.maxTilt * y);
      this.el.object3D.rotation.z = THREE.MathUtils.degToRad(-this.data.maxTilt * x);
      emitXrEvent(this.el, 'joint-joystick-move', { x, y });
    };
    this.el.addEventListener(this.data.event, this._onMove);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onMove);
  }
});

AFRAME.registerComponent('joint-lever', {
  schema: {
    value: { type: 'number', default: 0 },
    min: { type: 'number', default: -1 },
    max: { type: 'number', default: 1 },
    axis: { type: 'string', default: 'x' },
    angleDeg: { type: 'number', default: 45 }
  },

  update: function () {
    const t = THREE.MathUtils.clamp((this.data.value - this.data.min) / (this.data.max - this.data.min || 1), 0, 1);
    const deg = -this.data.angleDeg + (this.data.angleDeg * 2) * t;
    this.el.object3D.rotation[this.data.axis] = THREE.MathUtils.degToRad(deg);
    emitXrEvent(this.el, 'joint-lever-change', { value: this.data.value });
  }
});

AFRAME.registerComponent('joint-slider', {
  schema: {
    value: { type: 'number', default: 0 },
    min: { type: 'number', default: 0 },
    max: { type: 'number', default: 1 },
    axis: { type: 'string', default: 'x' },
    length: { type: 'number', default: 0.3 }
  },

  update: function () {
    const t = THREE.MathUtils.clamp((this.data.value - this.data.min) / (this.data.max - this.data.min || 1), 0, 1);
    this.el.object3D.position[this.data.axis] = -this.data.length * 0.5 + this.data.length * t;
    emitXrEvent(this.el, 'joint-slider-change', { value: this.data.value });
  }
});
