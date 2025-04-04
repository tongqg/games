# Product Requirements Document: 3D City Simulation

## 1. Introduction

This document outlines the requirements for the 3D City Simulation project, a web-based application built using HTML, CSS, and JavaScript with the Three.js library.

## 2. Goals

*   Create a visually engaging 3D representation of a city environment.
*   Provide a foundation for potential future simulation features (e.g., traffic, population).
*   Allow users to explore the 3D city scene.

## 3. Current Features (as of 2025-04-02 - Updated 2)

*   **3D Scene Setup:** Initializes a Three.js scene, camera, and WebGL renderer. Includes a `TextureLoader`.
*   **Lighting:** Implements ambient and directional lighting to illuminate the scene, including basic shadow support.
*   **Ground Plane:** A large, flat plane represents the ground (colored green).
*   **Textured Road Grid:** Generates a grid of intersecting roads using `THREE.PlaneGeometry`.
    *   Roads are slightly elevated above the ground.
    *   An asphalt-like texture (placeholder) is loaded and applied to the roads, with appropriate repetition.
*   **Textured Procedural Buildings:** Randomly generates procedural buildings within the blocks defined by the road grid.
    *   Buildings consist of a base `THREE.BoxGeometry` and an optional smaller top structure.
    *   A brick-like texture (placeholder) is loaded and applied to building surfaces, with approximate repetition scaling.
    *   Building dimensions (width, height, depth) and positions within blocks are randomized.
    *   Buildings cast and receive shadows.
*   **Procedural Trees:** Randomly places simple procedural trees within city blocks.
    *   Trees consist of a cylindrical trunk (`THREE.CylinderGeometry`) and a spherical canopy (`THREE.SphereGeometry`).
    *   Tree dimensions are randomized slightly.
    *   Trees cast shadows.
*   **Camera Controls:** Implements `OrbitControls` allowing users to pan, zoom, and rotate the camera to view the scene.
*   **Responsive Canvas:** The renderer canvas resizes automatically with the browser window.

## 4. Requested Enhancements (Addressed with Procedural + Textures)

The following improvements were requested and have been addressed using procedural generation combined with basic texturing:

*   **Detailed Building Models:** Addressed by implementing textured procedural buildings with base and optional top structures. Further detail could involve more complex geometries/models or varied textures.
*   **Detailed Road Models:** Addressed by applying textures to `PlaneGeometry` roads. Further detail could involve more realistic textures (lane markings, wear) or curb models.
*   **Tree Models:** Addressed by implementing procedural trees (trunk and canopy). Further detail could involve more realistic tree models (e.g., using GLTF format) or textures.

## 5. Future Considerations (Optional)

*   Traffic simulation (vehicles moving along roads).
*   Day/night cycle with changing lighting.
*   More varied environment elements (e.g., parks, water bodies, streetlights, different building styles/textures).
*   Loading external 3D models (e.g., GLTF) for buildings, trees, vehicles.
*   User interaction (e.g., ability to place or modify city elements).
*   Performance optimization for larger cities.
*   Providing actual texture files instead of relying on external URLs.