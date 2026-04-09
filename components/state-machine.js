import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('state-machine', {
  schema: {
    initial: { type: 'string', default: 'idle' },
    event: { type: 'string', default: 'xr:set-state' }
  },

  init: function () {
    this.state = this.data.initial;
    this.el.setAttribute('data-state', this.state);

    this._onSetState = (e) => {
      const next = typeof e?.detail === 'string' ? e.detail : e?.detail?.state;
      if (!next) return;
      this.set(next, e?.detail?.source || this.el);
    };

    this.el.addEventListener(this.data.event, this._onSetState);
    emitXrEvent(this.el, 'state-enter', { state: this.state, from: null });
  },

  update: function (oldData) {
    if (oldData.event && oldData.event !== this.data.event) {
      this.el.removeEventListener(oldData.event, this._onSetState);
      this.el.addEventListener(this.data.event, this._onSetState);
    }
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onSetState);
  },

  set: function (next, source = null) {
    if (!next || this.state === next) return false;

    const from = this.state;
    emitXrEvent(this.el, 'state-exit', { state: from, to: next, source });

    this.state = next;
    this.el.setAttribute('data-state', next);

    emitXrEvent(this.el, 'state-enter', { state: next, from, source });
    emitXrEvent(this.el, 'state-changed', { from, to: next, source }, 'statechanged');
    return true;
  },

  is: function (value) {
    return this.state === value;
  }
});
