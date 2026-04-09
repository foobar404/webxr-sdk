#!/usr/bin/env node

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import inquirer from "inquirer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const components = [
    "ability", "ai-agent", "area", "audio-event", "basic-geometry", "bullet", "checkpoint", "climbable", "collision", "confetti", "cooldown", "csg-primitives", "damage", "decal",
    "faction", "fly", "fog-volume", "follow", "geometry-animation", "grab", "grab-point", "gravity", "groups", "haptics", "health", "highlight", "interactable", "inventory", "joints", "jump", "keyboard", "loading-screen",
    "melee-hit", "nav-agent", "nav-obstacle", "nav-path", "objective", "origin", "particle-burst", "passthrough-toggle", "path-follow", "phone-controls", "pickup", "pool", "projectile", "pushable",
    "ray-interactor", "rigid-body", "save-game", "save-state", "score", "shooter", "snap-zones", "softbody", "spawner", "sprite", "smooth-move", "smooth-turn", "swing-movement",
    "snap-turn", "special-shaders", "state-machine", "static-body", "status-effects", "super-keyboard", "target", "teleport", "timed-spawner",
    "ui-overlay", "vignette", "wasd-plus", "weapon", "world-building", "world-grab", "zone-trigger"
];

const runtimeDependencies = {
    shooter: ["bullet"],
    target: ["bullet"],
    "rigid-body": ["gravity"],
    "ray-interactor": ["interactable"],
    "grab-point": ["grab"],
    projectile: ["damage"],
    "nav-agent": ["nav-path"],
    "save-game": ["save-state"],
    weapon: ["shooter"],
    "swing-movement": ["smooth-move"]
};

const componentSet = new Set(components);

const isAddCommand = process.argv[2] === "add";

if (isAddCommand) {
    await handleAddCommand();
} else {
    await handleCreateProject();
}

async function handleCreateProject() {
    const projectNameArg = process.argv[2];

    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "projectName",
            message: "Project name:",
            default: "my-xr-app",
            when: !projectNameArg
        },
        {
            type: "checkbox",
            name: "components",
            message: "Select components:",
            choices: components,
            default: components
        }
    ]);

    const projectName = projectNameArg || answers.projectName;
    const selectedComponents = answers.components;
    const targetDir = path.resolve(projectName);
    const templateDir = path.join(__dirname, "template");
    const componentsDir = path.join(__dirname, "..", "components");

    const { publicComponents, fileComponents } = await resolveComponentSelection(selectedComponents, componentsDir);

    console.log(`Loading ${publicComponents.length} components (${fileComponents.length} files with dependencies)...`);

    await fs.copy(templateDir, targetDir, { overwrite: false });

    const libDir = path.join(targetDir, "src", "lib");
    await fs.ensureDir(libDir);

    await new Promise(resolve => setTimeout(resolve, 500));

    for (const comp of fileComponents) {
        const srcFile = path.join(componentsDir, `${comp}.js`);
        const destFile = path.join(libDir, `${comp}.js`);
        await fs.copy(srcFile, destFile);
    }

    const indexContent = publicComponents
        .map(comp => `import './lib/${comp}.js';`)
        .join('\n');

    const indexFile = path.join(targetDir, "src", "index.js");
    const existingContent = await fs.readFile(indexFile, "utf-8").catch(() => "");
    const newContent = existingContent + (existingContent ? "\n" : "") + indexContent;
    await fs.writeFile(indexFile, newContent);

    console.log(`Project created in ${targetDir}`);
}

async function handleAddCommand() {
    const targetDir = process.cwd();
    const componentsToAdd = process.argv.slice(3);

    if (componentsToAdd.length === 0) {
        const answers = await inquirer.prompt([
            {
                type: "checkbox",
                name: "components",
                message: "Select components to add:",
                choices: components
            }
        ]);
        componentsToAdd.push(...answers.components);
    }

    const libDir = path.join(targetDir, "src", "lib");
    const componentsDir = path.join(__dirname, "..", "components");
    await fs.ensureDir(libDir);

    const { publicComponents, fileComponents } = await resolveComponentSelection(componentsToAdd, componentsDir);

    console.log(`Adding ${publicComponents.length} components (${fileComponents.length} files with dependencies)...`);

    for (const comp of fileComponents) {
        const srcFile = path.join(componentsDir, `${comp}.js`);
        const destFile = path.join(libDir, `${comp}.js`);
        await fs.copy(srcFile, destFile);
    }

    const indexFile = path.join(targetDir, "src", "index.js");
    let indexContent = await fs.readFile(indexFile, "utf-8");

    for (const comp of publicComponents) {
        const importLine = `import './lib/${comp}.js';`;
        if (!indexContent.includes(importLine)) {
            indexContent += `\n${importLine}`;
        }
    }

    await fs.writeFile(indexFile, indexContent);
    console.log(`Added components: ${publicComponents.join(", ")}`);
}

async function resolveComponentSelection(initialSelection, componentsDir) {
    const normalized = normalizePublicComponents(initialSelection);
    const publicSet = expandRuntimeDependencies(normalized);

    const fileSet = new Set();
    for (const comp of publicSet) {
        await collectImportedFiles(comp, componentsDir, fileSet);
    }

    const publicComponents = components.filter(name => publicSet.has(name));
    const fileComponents = Array.from(fileSet).sort((a, b) => a.localeCompare(b));
    return { publicComponents, fileComponents };
}

function normalizePublicComponents(selection) {
    const valid = [];
    for (let i = 0; i < selection.length; i++) {
        const name = String(selection[i] || "").trim();
        if (!name) continue;
        if (!componentSet.has(name)) {
            console.warn(`Skipping unknown component: ${name}`);
            continue;
        }
        valid.push(name);
    }
    return valid;
}

function expandRuntimeDependencies(initialComponents) {
    const out = new Set();
    const stack = [...initialComponents];

    while (stack.length) {
        const current = stack.pop();
        if (out.has(current)) continue;
        out.add(current);

        const deps = runtimeDependencies[current] || [];
        for (let i = 0; i < deps.length; i++) {
            const dep = deps[i];
            if (!out.has(dep)) stack.push(dep);
        }
    }

    return out;
}

async function collectImportedFiles(componentName, componentsDir, outSet) {
    if (outSet.has(componentName)) return;
    outSet.add(componentName);

    const sourceFile = path.join(componentsDir, `${componentName}.js`);
    const exists = await fs.pathExists(sourceFile);
    if (!exists) {
        console.warn(`Missing source file for component: ${componentName}`);
        return;
    }

    const source = await fs.readFile(sourceFile, "utf-8");
    const importRegex = /import\s+(?:.+?from\s+)?["']\.\/(.+?)\.js["']/g;

    let match = null;
    while ((match = importRegex.exec(source)) !== null) {
        const dep = match[1];
        await collectImportedFiles(dep, componentsDir, outSet);
    }
}