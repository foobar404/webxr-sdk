# 😎 Hello XR - <a href="https://foobar404.github.io/webxr-sdk/">Demo</a>
[![npm version](https://img.shields.io/npm/v/create-xr.svg)](https://www.npmjs.com/package/create-xr) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![npm downloads](https://img.shields.io/npm/dm/create-xr.svg)](https://www.npmjs.com/package/create-xr)

This repository is meant to be an *easy to use* starter kit of the best / most current 3D and XR libraries on the web, with some of my own contributions as well. Packages such as **AFRAME**, **THREE.js**, the **IWSDK** by Meta, and a few others, all bundled using **Vite**, with a simple `npm create xr` command to generate a template project with all the functionality you would expect from a *modern day game engine*, like physics, locomotion, controller/hand tracking, skyboxes, gltf model rendering, scene editor, XR emulator, and many more. 

<a href="https://foobar404.github.io/webxr-sdk/" target="_blank"><img src="./assets/demo.png" /></a>

# Getting Started
Get up and running with web xr development with just a few commands!

## Template
To create a new Web XR project using the template, use:
```
npm create xr
```
You'll be prompted to name your project and select which components to include.

To run the project use:
```
npm run dev
```

## Adding Components
To add components to an existing project, run inside your project directory:
```
xr add
```
Or pass component names directly:
```
xr add grab ray-interactor health
```
Dependencies are resolved automatically.

## Components
To import all **AFRAME** components into your project (done automatically when using the template), use:
```
<script src="https://cdn.skypack.dev/pin/gh@v2.8.9-pbIyFCSRoTBr23wffpcU/mode=raw,min/foobar404/webxr-sdk@main/components/index.js"></script>
```
To import individual components into your **AFRAME** project use:
```
<script src="https://cdn.jsdelivr.net/gh/foobar404/webxr-sdk@main/components/component.js"></script>
```
Replace `component` with your desired component, for example the **fly** component would be:
```
<script src="https://cdn.jsdelivr.net/gh/foobar404/webxr-sdk@main/components/fly.js"></script>
```

# Components
**AFRAME.js** provides the scaffolding to build a powerful XR app, such as **geometry**, **materials** / **textures**, gltf model rendering, **animations**, and more. This project aims to fill the gaps and create a *cohesive development experience*, *similar* to a modern game development workflow that one would have with **Unity** or **Unreal**. *Crucial* missing features for quick **webxr** development include things like **locomotion**, VR UI for things like menus, basic object interactions, **performance** optimization such as model compression, LOD controls, foveated rendering, and many other components one would expect that have for a streamlined XR development workflow.

## Current Components
- **ability**: Manage *entity abilities* with cooldowns and activation logic
- **ai-agent**: Basic *AI behavior* with state-driven movement and decision making
- **area**: Defines a *spatial area* that can trigger events on enter/exit
- **audio-event**: Plays *audio clips* in response to entity events
- **basic-geometry**: Helpers for common *procedural geometry* shapes
- **bullet**: Manages bullet projectiles with *collision detection*, *pooling*, and *target interaction*
- **checkpoint**: *Checkpoint system* for tracking progress through a level
- **climbable**: Makes surfaces *climbable* with hand/controller input
- **collision**: Emits events on *physics collisions* between entities
- **confetti**: Creates a *confetti effect* with falling particles in waves
- **cooldown**: Attaches a *cooldown timer* to any action or ability
- **csg-primitives**: Constructive solid geometry *primitive shapes*
- **damage**: Applies *damage* to entities with health components
- **decal**: Adds *decals* (stickers) to surfaces at specified points with texture support
- **faction**: Tags entities with a *faction* for team-based logic
- **fly**: Provides *flying movement controls* using VR controllers
- **fog-volume**: Adds a *volumetric fog* effect to a region of the scene
- **follow**: Makes an entity *follow* a target with configurable speed and offset
- **geometry-animation**: Animates *geometry properties* like scale, morph targets, etc.
- **grab**: Allows entities to be *grabbed and held* with controllers or hands
- **grab-point**: Defines a *grab attachment point* on an entity
- **gravity**: Applies *gravity* and *damping* to rigid bodies
- **groups**: Organizes entities into *named groups* for batch operations
- **haptics**: Enables *haptic feedback* (vibration) for VR controllers
- **health**: Tracks *health points* with damage and death events
- **highlight**: Applies a *highlight effect* to hovered or selected entities
- **interactable**: Marks an entity as *interactable* for ray or hand input
- **inventory**: Manages a *player inventory* for picked-up items
- **joints**: Creates *physics joints* between entities
- **jump**: Implements *jumping mechanics* for entities
- **keyboard**: Maps *keyboard keys* to custom events or actions
- **loading-screen**: Shows a *loading screen* while assets are fetched
- **melee-hit**: Detects *melee swing hits* and applies damage
- **nav-agent**: Moves an entity along a *navigation mesh* path
- **nav-obstacle**: Marks an entity as a *navigation obstacle*
- **nav-path**: Computes a *path* across a navigation mesh between two points
- **objective**: Defines *mission objectives* with completion tracking
- **origin**: Sets the *origin* or reset position for the scene
- **particle-burst**: Emits a *burst of particles* as a one-shot effect
- **passthrough-toggle**: Toggles AR *passthrough mode* for mixed reality experiences
- **path-follow**: Moves an entity along a predefined *waypoint path*
- **phone-controls**: Provides controls optimized for *mobile phone input*
- **pickup**: Makes an entity *pickable* and tracks the carrying entity
- **pool**: Generic *object pool* for reusing entities and reducing GC pressure
- **projectile**: Fires a *projectile* with velocity, gravity, and damage
- **pushable**: Allows physics *pushing* of entities with controller/hand contact
- **ray-interactor**: Casts a *ray* from a controller to interact with interactables
- **rigid-body**: Defines *physics rigid bodies* with velocity and collision properties
- **save-game**: High-level *save/load* system backed by save-state components
- **save-state**: Serializes and restores *entity state* to/from persistent storage
- **score**: Tracks and displays a *score* with increment/reset events
- **shooter**: Handles *shooting mechanics* and projectile spawning
- **smooth-move**: Enables *smooth movement controls* for locomotion
- **smooth-turn**: Provides *smooth turning controls* for camera rotation
- **snap-turn**: Implements *snap turning* for VR locomotion
- **snap-zones**: Defines *magnetic snap zones* that attract held objects
- **softbody**: Simple *softbody simulation* using vertex displacement
- **spawner**: Periodically *spawns* entities from a template
- **special-shaders**: Collection of *custom GLSL shaders* (hologram, dissolve, etc.)
- **sprite**: Renders a *billboard sprite* with optional animation frames
- **state-machine**: Drives entity behavior with a *finite state machine*
- **static-body**: Defines *static physics bodies* that don't move but can collide
- **status-effects**: Applies timed *status effects* (burn, slow, stun, etc.) to entities
- **super-keyboard**: Enhanced *keyboard controls* with additional features
- **swing-movement**: *Arm-swinging* locomotion using controller motion
- **target**: Creates *interactive targets* for shooting or other interactions
- **teleport**: *Teleport locomotion* with arc pointer and blink transition
- **timed-spawner**: Spawns entities on a *timed schedule* with configurable intervals
- **ui-overlay**: Renders a *2D HTML overlay* panel in world space for menus and HUDs
- **vignette**: Applies a *vignette visual effect* to the scene
- **wasd-plus**: WASD movement controls with *additional locomotion features*
- **weapon**: Combines *shooter*, ammo, reload, and weapon switching logic
- **world-building**: Tools for *procedural world generation* and block placement
- **world-grab**: Allows *grabbing and manipulating* objects in the world
- **zone-trigger**: Fires events when entities *enter or exit* a defined zone

# References
To take full advantage of the project it's *necessary* to understand the basics of **aframe.js**, and **THREE.js** to some degree, so here are some links to *important resources*.

- **AFRAME** - https://aframe.io/docs/master/introduction/
- **THREE.js** - https://threejs.org/manual/#en/installation
- **IWSDK** - https://developers.meta.com/horizon/documentation/web/iwsdk-overview

# License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

