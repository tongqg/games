# Product Requirements Document: Minecraft Clone

## 1. Overview

This document outlines the requirements for a simple Minecraft clone built using HTML, CSS, and JavaScript with a canvas element for rendering, utilizing the Three.js library.

## 2. Goals

- Create a basic 3D block-based world.
- Allow the player to navigate the world using first-person controls.
- Render simple blocks.
- Allow the player to place and break blocks.

## 3. Phase 1: Initial Setup (Completed)

- **Directory Structure:**
    - `minecraft/`
        - `index.html`: Main HTML file.
        - `style.css`: CSS for styling.
        - `script.js`: JavaScript for game logic.
        - `PRD.md`: This document.
- **`index.html`:**
    - Basic HTML5 structure.
    - Title: "Minecraft Clone".
    - Link to `style.css`.
    - Link to `script.js` (deferred).
    - A `<canvas>` element for game rendering.
- **`style.css`:** Basic styles for body and canvas.
- **`script.js`:** Empty initially.

## 4. Phase 2: Core Rendering & Controls (Completed)

- **Technology:** Utilize Three.js library for 3D rendering.
- **`index.html` Updates:**
    - Include Three.js library (via CDN).
    - Ensure canvas element has an ID (e.g., `gameCanvas`).
- **`script.js` Implementation:**
    - **Scene Setup:**
        - `THREE.Scene`
        - `THREE.PerspectiveCamera`
        - `THREE.WebGLRenderer` attached to the canvas.
        - Basic lighting (`THREE.AmbientLight`, `THREE.DirectionalLight`).
        - Simple ground plane (`THREE.PlaneGeometry`).
    - **Player Controls:**
        - First-person mouse look (`PointerLockControls`).
        - Keyboard movement: WASD for horizontal movement, Space for jump (basic implementation, no physics yet), Shift for crouch (adjust camera height).
    - **Block Rendering:**
        - Simple cube geometry (`THREE.BoxGeometry`).
        - Basic material/color (`THREE.MeshStandardMaterial`).
        - Render a small test area of static blocks.
- **`style.css` Updates:**
    - Ensure canvas fills the viewport or a designated area.
    - Basic body styling (margin removal).

## 5. Phase 3: Block Interaction (Current)

- **Block Placement/Breaking Mechanics:**
    - Implement raycasting from the camera to detect targeted blocks.
    - Add event listeners for mouse clicks (left-click: break, right-click: place).
    - Create functions to add/remove block meshes from the scene.
    - Update an internal representation of the world state (e.g., a 3D array) when blocks are added/removed.

## 6. Phase 4: Procedural World Generation (Current)

- **Technology:** Simplex noise algorithm for natural terrain variation
- **Features:**
  - Height-based terrain with mountains and valleys
  - Basic cave systems underground
  - 3 distinct biome types (plains, mountains, desert)
  - Maintains existing block placement/removal functionality
- **Implementation Guidelines:**
  - Modular world generation code
  - Preserve Three.js rendering optimizations
  - Keep existing player controls and UI
  - Document new functions clearly

## 7. Future Features (Beyond Phase 4)

- Collision detection.
- Inventory system (optional).
- Textures (optional).
- Physics-based jumping/gravity.
- Sound effects.