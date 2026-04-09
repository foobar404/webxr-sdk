export const COMPONENT_DEPENDENCY_MAP = {
  fly: {
    required: [],
    optional: ['haptics'],
    role: 'locomotion'
  },
  'smooth-move': {
    required: [],
    optional: ['haptics'],
    role: 'locomotion'
  },
  'smooth-turn': {
    required: [],
    optional: [],
    role: 'locomotion'
  },
  'snap-turn': {
    required: [],
    optional: [],
    role: 'locomotion'
  },
  jump: {
    required: [],
    optional: ['static-body'],
    role: 'locomotion'
  },
  'world-grab': {
    required: [],
    optional: [],
    role: 'locomotion'
  },
  bullet: {
    required: [],
    optional: [],
    role: 'interaction'
  },
  shooter: {
    required: ['bullet-system'],
    optional: ['haptics'],
    role: 'interaction'
  },
  target: {
    required: ['bullet-system'],
    optional: [],
    role: 'interaction'
  },
  gravity: {
    required: [],
    optional: ['static-body'],
    role: 'physics-lite'
  },
  'rigid-body': {
    required: ['gravity-system'],
    optional: ['static-body'],
    role: 'physics-lite'
  },
  'static-body': {
    required: [],
    optional: [],
    role: 'physics-lite'
  },
  haptics: {
    required: [],
    optional: [],
    role: 'feedback'
  }
};
