import { COMPONENT_DEPENDENCY_MAP } from './dependency-map.js';

export const XR_EVENT_PREFIX = 'xr:';
export const CORE_DEPENDENCIES = COMPONENT_DEPENDENCY_MAP;

export function eventName(name) {
  return `${XR_EVENT_PREFIX}${name}`;
}

export function emitXrEvent(el, name, detail = {}, legacyEventName = null) {
  const evt = eventName(name);
  el.emit(evt, detail);
  if (legacyEventName) {
    el.emit(legacyEventName, detail);
  }
}

export function resolveCamera(sceneEl) {
  if (!sceneEl) return null;
  return sceneEl.querySelector('[camera]') || sceneEl.querySelector('a-camera') || null;
}

export function resolveRig(el, explicitRig = null) {
  if (explicitRig) return explicitRig;
  const cam = resolveCamera(el.sceneEl);
  return cam ? cam.parentEl : null;
}

export function applyDeadzone(value, deadzone) {
  return Math.abs(value) < deadzone ? 0 : value;
}

export function coerceAxisEvent(detail) {
  if (!detail) return { x: 0, y: 0 };
  if (typeof detail.x === 'number' || typeof detail.y === 'number') {
    return { x: detail.x || 0, y: detail.y || 0 };
  }
  const axis = detail.axis || detail.axes || [];
  return { x: axis[0] || 0, y: axis[1] || 0 };
}

export function assertDependency(condition, owner, message, detail = {}) {
  if (condition) return;

  const formatted = `[${owner}] ${message}`;
  if (detail.el) {
    emitXrEvent(detail.el, 'dependency-missing', {
      owner,
      message,
      dependency: detail.dependency || null
    });
  }

  throw new Error(formatted);
}

export function requireSystem(sceneEl, systemName, owner, elForEvent = null) {
  const system = sceneEl && sceneEl.systems ? sceneEl.systems[systemName] : null;
  assertDependency(
    !!system,
    owner,
    `Missing required system \"${systemName}\".`,
    { el: elForEvent, dependency: systemName }
  );
  return system;
}

export function listenForRigReady(component, onReady) {
  const scene = component.el.sceneEl;
  if (!scene) return () => {};

  const check = () => {
    component.rig = resolveRig(component.el, component.data.cameraRig || null);
    component.head = resolveCamera(scene);
    if (component.rig && component.head) {
      onReady();
    }
  };

  const onLoaded = () => check();
  const onObject3D = () => check();

  scene.addEventListener('loaded', onLoaded);
  scene.addEventListener('object3dset', onObject3D);

  check();

  return () => {
    scene.removeEventListener('loaded', onLoaded);
    scene.removeEventListener('object3dset', onObject3D);
  };
}
