import { emitXrEvent } from './core-utils.js';

AFRAME.registerSystem('save-game', {
  schema: {
    key: { type: 'string', default: 'webxr-sdk:profile' },
    scope: { type: 'string', default: 'local' }
  },

  init: function () {
    this.storage = this.data.scope === 'session' ? window.sessionStorage : window.localStorage;
  },

  save: function (payload) {
    this.storage.setItem(this.data.key, JSON.stringify(payload));
  },

  load: function () {
    const raw = this.storage.getItem(this.data.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clear: function () {
    this.storage.removeItem(this.data.key);
  }
});

AFRAME.registerComponent('save-game-profile', {
  schema: {
    include: { type: 'string', default: '[save-state]' },
    saveEvent: { type: 'string', default: 'xr:save-game' },
    loadEvent: { type: 'string', default: 'xr:load-game' },
    clearEvent: { type: 'string', default: 'xr:clear-game' }
  },

  init: function () {
    this._onSave = () => this.save();
    this._onLoad = () => this.load();
    this._onClear = () => this.clear();

    this.el.addEventListener(this.data.saveEvent, this._onSave);
    this.el.addEventListener(this.data.loadEvent, this._onLoad);
    this.el.addEventListener(this.data.clearEvent, this._onClear);
  },

  remove: function () {
    this.el.removeEventListener(this.data.saveEvent, this._onSave);
    this.el.removeEventListener(this.data.loadEvent, this._onLoad);
    this.el.removeEventListener(this.data.clearEvent, this._onClear);
  },

  save: function () {
    const entities = this.el.querySelectorAll(this.data.include);
    const keys = [];

    for (let i = 0; i < entities.length; i++) {
      const comp = entities[i].components['save-state'];
      if (!comp) continue;
      comp.save();
      keys.push(comp.key);
    }

    this.el.sceneEl.systems['save-game']?.save({
      savedAt: Date.now(),
      count: keys.length,
      keys
    });

    emitXrEvent(this.el, 'save-game-complete', { count: keys.length, keys });
  },

  load: function () {
    const meta = this.el.sceneEl.systems['save-game']?.load();
    if (!meta) return false;

    const entities = this.el.querySelectorAll(this.data.include);
    let loaded = 0;
    for (let i = 0; i < entities.length; i++) {
      const comp = entities[i].components['save-state'];
      if (!comp) continue;
      if (comp.load()) loaded += 1;
    }

    emitXrEvent(this.el, 'save-game-loaded', { loaded, meta });
    return true;
  },

  clear: function () {
    this.el.sceneEl.systems['save-game']?.clear();
    emitXrEvent(this.el, 'save-game-cleared', {});
  }
});
