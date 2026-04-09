import { emitXrEvent } from './core-utils.js';

AFRAME.registerComponent('inventory', {
  schema: {
    size: { type: 'int', default: 8 },
    autoEquip: { type: 'boolean', default: true }
  },

  init: function () {
    this.items = [];
    this.activeSlot = -1;

    this._onAdd = (e) => {
      const item = e?.detail?.item;
      if (!item) return;
      this.add(item, e?.detail?.source || this.el);
    };

    this._onRemove = (e) => {
      const index = typeof e?.detail?.index === 'number' ? e.detail.index : this.activeSlot;
      this.remove(index, e?.detail?.source || this.el);
    };

    this._onUse = (e) => {
      const index = typeof e?.detail?.index === 'number' ? e.detail.index : this.activeSlot;
      this.use(index, e?.detail?.source || this.el);
    };

    this._onSelect = (e) => {
      const index = typeof e?.detail?.index === 'number' ? e.detail.index : -1;
      this.select(index, e?.detail?.source || this.el);
    };

    this.el.addEventListener('xr:inventory-add', this._onAdd);
    this.el.addEventListener('xr:inventory-remove', this._onRemove);
    this.el.addEventListener('xr:inventory-use', this._onUse);
    this.el.addEventListener('xr:inventory-select', this._onSelect);

    this._emitChanged();
  },

  remove: function () {
    this.el.removeEventListener('xr:inventory-add', this._onAdd);
    this.el.removeEventListener('xr:inventory-remove', this._onRemove);
    this.el.removeEventListener('xr:inventory-use', this._onUse);
    this.el.removeEventListener('xr:inventory-select', this._onSelect);
  },

  add: function (item, source = null) {
    if (this.items.length >= this.data.size) {
      emitXrEvent(this.el, 'inventory-full', { size: this.data.size, source });
      return false;
    }

    const normalized = {
      id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: item.name || 'Item',
      data: item.data || {}
    };

    this.items.push(normalized);
    if (this.data.autoEquip && this.activeSlot === -1) this.activeSlot = 0;
    this._emitChanged(source);
    return true;
  },

  remove: function (index, source = null) {
    if (index < 0 || index >= this.items.length) return null;

    const [removed] = this.items.splice(index, 1);
    if (this.items.length === 0) {
      this.activeSlot = -1;
    } else if (this.activeSlot >= this.items.length) {
      this.activeSlot = this.items.length - 1;
    }

    emitXrEvent(this.el, 'inventory-item-removed', { index, item: removed, source });
    this._emitChanged(source);
    return removed;
  },

  use: function (index, source = null) {
    if (index < 0 || index >= this.items.length) return false;
    const item = this.items[index];

    emitXrEvent(this.el, 'inventory-item-used', { index, item, source });
    this.el.emit('xr:item-used', { index, item, source });
    return true;
  },

  select: function (index, source = null) {
    if (index < 0 || index >= this.items.length) return false;
    this.activeSlot = index;
    emitXrEvent(this.el, 'inventory-slot-selected', { index, item: this.items[index], source });
    this._emitChanged(source);
    return true;
  },

  getActiveItem: function () {
    if (this.activeSlot < 0 || this.activeSlot >= this.items.length) return null;
    return this.items[this.activeSlot];
  },

  _emitChanged: function (source = null) {
    emitXrEvent(this.el, 'inventory-changed', {
      items: this.items.slice(),
      activeSlot: this.activeSlot,
      size: this.data.size,
      source
    });
  }
});

AFRAME.registerComponent('inventory-pickup', {
  schema: {
    target: { type: 'selector', default: null },
    event: { type: 'string', default: 'click' },
    itemId: { type: 'string', default: '' },
    itemName: { type: 'string', default: 'Item' },
    consumeOnPickup: { type: 'boolean', default: true }
  },

  init: function () {
    this._onPickup = () => {
      const target = this.data.target || this.el.sceneEl?.querySelector('#rig') || null;
      if (!target || !target.components.inventory) return;

      const ok = target.components.inventory.add({
        id: this.data.itemId || `${this.el.id || 'pickup'}-${Date.now()}`,
        name: this.data.itemName,
        data: { sourceEl: this.el }
      }, this.el);

      if (!ok) return;

      emitXrEvent(this.el, 'pickup-inventory-added', { target, itemName: this.data.itemName });
      if (this.data.consumeOnPickup) this.el.setAttribute('visible', false);
    };

    this.el.addEventListener(this.data.event, this._onPickup);
  },

  remove: function () {
    this.el.removeEventListener(this.data.event, this._onPickup);
  }
});
