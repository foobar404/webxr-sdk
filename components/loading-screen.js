import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('loading-screen', {
  schema: {
    text: { type: 'string', default: 'Loading...' },
    hideOnSceneLoaded: { type: 'boolean', default: true }
  },

  init: function () {
    this._overlay = document.createElement('div');
    this._overlay.style.position = 'fixed';
    this._overlay.style.inset = '0';
    this._overlay.style.background = 'rgba(0,0,0,0.88)';
    this._overlay.style.color = '#f3f7ff';
    this._overlay.style.fontFamily = 'Segoe UI, sans-serif';
    this._overlay.style.fontSize = '20px';
    this._overlay.style.display = 'flex';
    this._overlay.style.alignItems = 'center';
    this._overlay.style.justifyContent = 'center';
    this._overlay.style.zIndex = '99999';
    this._overlay.textContent = this.data.text;
    document.body.appendChild(this._overlay);

    this._onLoaded = () => {
      if (!this.data.hideOnSceneLoaded) return;
      this.hide();
    };

    this.el.sceneEl?.addEventListener('loaded', this._onLoaded);
  },

  update: function () {
    if (this._overlay) this._overlay.textContent = this.data.text;
  },

  remove: function () {
    this.el.sceneEl?.removeEventListener('loaded', this._onLoaded);
    if (this._overlay && this._overlay.parentNode) this._overlay.parentNode.removeChild(this._overlay);
  },

  show: function (text = '') {
    if (!this._overlay) return;
    if (text) this._overlay.textContent = text;
    this._overlay.style.display = 'flex';
    emitXrEvent(this.el, 'loading-screen-show', {});
  },

  hide: function () {
    if (!this._overlay) return;
    this._overlay.style.display = 'none';
    emitXrEvent(this.el, 'loading-screen-hide', {});
  }
});
