import { emitXrEvent } from './core-utils.js';

AFRAME.registerSystem('objective', {
  init: function () {
    this.states = new Map();
  },

  setState: function (id, state) {
    this.states.set(id, state);
  },

  getState: function (id) {
    return this.states.get(id) || null;
  }
});

AFRAME.registerComponent('objective', {
  schema: {
    id: { type: 'string', default: '' },
    title: { type: 'string', default: 'Objective' },
    targetCount: { type: 'int', default: 1 },
    incrementEvent: { type: 'string', default: 'xr:objective-increment' },
    completeEvent: { type: 'string', default: 'xr:objective-complete' }
  },

  init: function () {
    this.id = this.data.id || this.el.id || `objective-${Date.now()}`;
    this.progress = 0;
    this.completed = false;

    this._onIncrement = (e) => {
      const amount = typeof e?.detail?.amount === 'number' ? e.detail.amount : 1;
      this.increment(amount, e?.detail?.source || this.el);
    };

    this._onComplete = (e) => {
      this.complete(e?.detail?.source || this.el);
    };

    this.el.addEventListener(this.data.incrementEvent, this._onIncrement);
    this.el.addEventListener(this.data.completeEvent, this._onComplete);
    this._sync();
  },

  remove: function () {
    this.el.removeEventListener(this.data.incrementEvent, this._onIncrement);
    this.el.removeEventListener(this.data.completeEvent, this._onComplete);
  },

  increment: function (amount = 1, source = null) {
    if (this.completed) return;
    this.progress = Math.min(this.data.targetCount, this.progress + Math.max(0, amount));

    emitXrEvent(this.el, 'objective-progress', {
      id: this.id,
      title: this.data.title,
      progress: this.progress,
      targetCount: this.data.targetCount,
      source
    });

    if (this.progress >= this.data.targetCount) {
      this.complete(source);
      return;
    }

    this._sync();
  },

  complete: function (source = null) {
    if (this.completed) return;
    this.completed = true;
    this.progress = this.data.targetCount;

    emitXrEvent(this.el, 'objective-completed', {
      id: this.id,
      title: this.data.title,
      source
    });

    this._sync();
  },

  _sync: function () {
    this.system.setState(this.id, {
      id: this.id,
      title: this.data.title,
      progress: this.progress,
      targetCount: this.data.targetCount,
      completed: this.completed
    });
  }
});

AFRAME.registerComponent('quest', {
  schema: {
    objectiveIds: { type: 'array', default: [] },
    completeEvent: { type: 'string', default: 'xr:quest-completed' }
  },

  init: function () {
    this.completed = false;
    this._onObjectiveComplete = () => this.checkComplete();
    this.el.sceneEl.addEventListener('xr:objective-completed', this._onObjectiveComplete);
    this.checkComplete();
  },

  remove: function () {
    this.el.sceneEl.removeEventListener('xr:objective-completed', this._onObjectiveComplete);
  },

  checkComplete: function () {
    if (this.completed) return;
    const ids = (this.data.objectiveIds || []).map(String);
    if (!ids.length) return;

    for (let i = 0; i < ids.length; i++) {
      const st = this.el.sceneEl.systems.objective?.getState(ids[i]);
      if (!st || !st.completed) return;
    }

    this.completed = true;
    this.el.emit(this.data.completeEvent, { objectiveIds: ids, source: this.el });
    emitXrEvent(this.el, 'quest-completed', { objectiveIds: ids, source: this.el });
  }
});
