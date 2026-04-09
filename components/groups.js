import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('group', {
  schema: {
    name: { type: 'string', default: 'default' }
  },

  init: function () {
    this.el.setAttribute('data-group', this.data.name);
  }
});

AFRAME.registerComponent('group-toggle', {
  schema: {
    group: { type: 'string', default: 'default' },
    visible: { type: 'boolean', default: true },
    event: { type: 'string', default: 'xr:group-toggle' }
  },

  init: function () {
    this._onEvent = (e) => {
      const detailGroup = e?.detail?.group || this.data.group;
      const detailVisible = typeof e?.detail?.visible === 'boolean' ? e.detail.visible : this.data.visible;
      this.apply(detailGroup, detailVisible);
    };

    this.el.addEventListener(this.data.event, this._onEvent);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onEvent);
  },

  apply: function (groupName, visible) {
    const nodes = this.el.sceneEl?.querySelectorAll('[group]') || [];
    let count = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].components.group?.data.name !== groupName) continue;
      nodes[i].setAttribute('visible', visible);
      count += 1;
    }
    emitXrEvent(this.el, 'group-toggled', { group: groupName, visible, count });
  }
});
