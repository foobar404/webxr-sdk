import { emitXrEvent, requireSystem } from './core-utils.js';

AFRAME.registerSystem('score', {
  init: function () {
    this.value = 0;
  },

  set: function (value, source = null) {
    this.value = value;
    this._emit(source);
  },

  add: function (points, source = null) {
    if (!points) return;
    this.value += points;
    this._emit(source);
  },

  reset: function (source = null) {
    this.value = 0;
    this._emit(source);
  },

  _emit: function (source) {
    emitXrEvent(this.sceneEl, 'score-changed', {
      value: this.value,
      source
    }, 'scorechanged');
  }
});

AFRAME.registerComponent('score-listener', {
  schema: {
    event: { type: 'string', default: 'xr:target-destroyed' },
    points: { type: 'number', default: 1 },
    target: { type: 'selector', default: null }
  },

  init: function () {
    this.scoreSystem = requireSystem(this.el.sceneEl, 'score', 'score-listener', this.el);
    this._source = this.data.target || this.el.sceneEl;
    this._onEvent = (e) => {
      const bonus = typeof e?.detail?.points === 'number' ? e.detail.points : 0;
      this.scoreSystem.add(this.data.points + bonus, e?.target || this.el);
    };
    this._source.addEventListener(this.data.event, this._onEvent);
  },

  remove: function () {
    if (this._source) {
      this._source.removeEventListener(this.data.event, this._onEvent);
    }
  }
});

AFRAME.registerComponent('score-display', {
  schema: {
    prefix: { type: 'string', default: 'Score: ' },
    value: { type: 'string', default: '' }
  },

  init: function () {
    this.scoreSystem = requireSystem(this.el.sceneEl, 'score', 'score-display', this.el);
    this._onScoreChanged = (e) => {
      const value = e?.detail?.value ?? 0;
      this._render(value);
    };

    this.el.sceneEl.addEventListener('xr:score-changed', this._onScoreChanged);
    this._render(this.scoreSystem.value || 0);
  },

  remove: function () {
    this.el.sceneEl.removeEventListener('xr:score-changed', this._onScoreChanged);
  },

  _render: function (value) {
    const textValue = `${this.data.prefix}${value}`;
    if (this.el.components.text) {
      this.el.setAttribute('text', 'value', textValue);
      return;
    }
    this.el.setAttribute('text', `value: ${textValue}; align: center; width: 4`);
  }
});
