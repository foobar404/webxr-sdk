AFRAME.registerSystem('nav-obstacle', {
  init: function () {
    this.items = new Set();
  },

  register: function (component) {
    this.items.add(component);
  },

  unregister: function (component) {
    this.items.delete(component);
  }
});

AFRAME.registerComponent('nav-obstacle', {
  schema: {
    radius: { type: 'number', default: 0.6 },
    enabled: { type: 'boolean', default: true }
  },

  init: function () {
    this.system.register(this);
  },

  remove: function () {
    this.system.unregister(this);
  }
});
