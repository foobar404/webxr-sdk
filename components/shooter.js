import { assertDependency, emitXrEvent, requireSystem } from './core-utils.js';

AFRAME.registerComponent('shooter', {
  schema: {
    activeBulletType: { type: 'string', default: 'normal' },
    bulletTypes: { type: 'array', default: ['normal'] },
    cycle: { default: false }
  },

  init: function () {
    this._onShoot = this.onShoot.bind(this);
    this._onChangeBullet = this.onChangeBullet.bind(this);

    this.bulletSystem = requireSystem(this.el.sceneEl, 'bullet', 'shooter', this.el);
    assertDependency(
      this.data.bulletTypes && this.data.bulletTypes.length > 0,
      'shooter',
      'bulletTypes must contain at least one bullet type.',
      { el: this.el, dependency: 'bulletTypes' }
    );

    this.el.addEventListener('shoot', this._onShoot);
    this.el.addEventListener('changebullet', this._onChangeBullet);
  },

  remove: function () {
    this.el.removeEventListener('shoot', this._onShoot);
    this.el.removeEventListener('changebullet', this._onChangeBullet);
  },

  onShoot: function () {
    const bullet = this.bulletSystem.shoot(this.data.activeBulletType, this.el.object3D);
    assertDependency(
      !!bullet,
      'shooter',
      `No bullet pool found for type \"${this.data.activeBulletType}\". Add an entity with bullet=\"name: ${this.data.activeBulletType}\".`,
      { el: this.el, dependency: `bullet:${this.data.activeBulletType}` }
    );

    emitXrEvent(this.el, 'shoot-fired', {
      bulletType: this.data.activeBulletType
    });
  },

  onChangeBullet: function (e) {
    const detail = e.detail;
    const config = this.data;

    if (detail === 'next' || detail === 'prev') {
      let index = config.bulletTypes.indexOf(config.activeBulletType);
      if (index === -1) return;

      if (detail === 'next') {
        index = config.cycle
          ? (index + 1) % config.bulletTypes.length
          : Math.min(config.bulletTypes.length - 1, index + 1);
      } else {
        index = config.cycle
          ? (index - 1 + config.bulletTypes.length) % config.bulletTypes.length
          : Math.max(0, index - 1);
      }

      this.el.setAttribute('shooter', 'activeBulletType', config.bulletTypes[index]);
      emitXrEvent(this.el, 'bullet-type-changed', {
        bulletType: config.bulletTypes[index]
      });
      return;
    }

    this.el.setAttribute('shooter', 'activeBulletType', detail);
    emitXrEvent(this.el, 'bullet-type-changed', { bulletType: detail });
  }
});
