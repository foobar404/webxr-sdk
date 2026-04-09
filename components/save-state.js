import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('save-state', {
  schema: {
    key: { type: 'string', default: '' },
    scope: { type: 'string', default: 'local' },
    loadOnInit: { type: 'boolean', default: true },
    saveEvent: { type: 'string', default: 'xr:save-state' },
    loadEvent: { type: 'string', default: 'xr:load-state' },
    clearEvent: { type: 'string', default: 'xr:clear-state' },
    components: { type: 'array', default: [] }
  },

  init: function () {
    this.storage = this.data.scope === 'session' ? window.sessionStorage : window.localStorage;
    this.key = this.data.key || `${this.el.id || 'entity'}:state`;

    this._onSave = () => this.save();
    this._onLoad = () => this.load();
    this._onClear = () => this.clear();

    this.el.addEventListener(this.data.saveEvent, this._onSave);
    this.el.addEventListener(this.data.loadEvent, this._onLoad);
    this.el.addEventListener(this.data.clearEvent, this._onClear);

    if (this.data.loadOnInit) this.load();
  },

  remove: function () {
    this.el.removeEventListener(this.data.saveEvent, this._onSave);
    this.el.removeEventListener(this.data.loadEvent, this._onLoad);
    this.el.removeEventListener(this.data.clearEvent, this._onClear);
  },

  save: function () {
    try {
      const payload = this._serialize();
      this.storage.setItem(this.key, JSON.stringify(payload));
      emitXrEvent(this.el, 'state-saved', { key: this.key });
      return true;
    } catch (err) {
      emitXrEvent(this.el, 'state-save-failed', { key: this.key, message: String(err) });
      return false;
    }
  },

  load: function () {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return false;

      const data = JSON.parse(raw);
      this._apply(data);
      emitXrEvent(this.el, 'state-loaded', { key: this.key });
      return true;
    } catch (err) {
      emitXrEvent(this.el, 'state-load-failed', { key: this.key, message: String(err) });
      return false;
    }
  },

  clear: function () {
    this.storage.removeItem(this.key);
    emitXrEvent(this.el, 'state-cleared', { key: this.key });
  },

  _serialize: function () {
    const componentNames = this.data.components || [];
    const attrs = {
      position: this.el.getAttribute('position'),
      rotation: this.el.getAttribute('rotation'),
      scale: this.el.getAttribute('scale'),
      dataState: this.el.getAttribute('data-state') || ''
    };

    const components = {};
    for (let i = 0; i < componentNames.length; i++) {
      const name = String(componentNames[i]);
      components[name] = this.el.getAttribute(name);
    }

    return { attrs, components };
  },

  _apply: function (payload) {
    if (!payload) return;

    const attrs = payload.attrs || {};
    if (attrs.position) this.el.setAttribute('position', attrs.position);
    if (attrs.rotation) this.el.setAttribute('rotation', attrs.rotation);
    if (attrs.scale) this.el.setAttribute('scale', attrs.scale);
    if (attrs.dataState) this.el.setAttribute('data-state', attrs.dataState);

    const components = payload.components || {};
    const names = Object.keys(components);
    for (let i = 0; i < names.length; i++) {
      const key = names[i];
      this.el.setAttribute(key, components[key]);
    }
  }
});
