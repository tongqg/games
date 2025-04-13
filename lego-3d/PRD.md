# Product Requirements Document: 3D Lego Simulator

## 1. Overview

A web-based 3D simulator that allows users to place virtual Lego-style bricks onto a base plate to build structures.

## 2. Current Features

*   **3D Environment:** Renders a 3D scene using Three.js.
*   **Base Plate:** Provides a gridded base plate with studs.
*   **Camera Controls:** Uses OrbitControls for zooming and panning (disabled). Rotation is controlled via an on-screen virtual joystick operated by touch/mouse; direct touch/mouse rotation on the main view is disabled.
*   **Brick Types:** Supports predefined brick sizes (1x2, 1x3, 1x4, 2x2, 2x3, 2x4).
*   **Color Selection:** Allows users to choose the color of the bricks from a fixed palette of 10 standard colors.
*   **Brick Placement:**
    *   Users select a brick type from a 3D preview panel.
    *   Users select a color from a palette.
    *   Users click on the base plate or the top surface of existing bricks to place the selected brick.
    *   Bricks snap to the grid.
    *   Bricks stack vertically.
    *   **Brick Rotation:** Users can rotate the selected brick (e.g., using the 'R' key) before placing it. Rotation occurs in 90-degree increments around the vertical axis.
    *   **Placement Preview:** A semi-transparent "ghost" brick follows the mouse cursor over valid placement surfaces (base plate, top of other bricks). This preview shows the selected brick type, color, and current rotation, snapping to the grid.
*   **Lighting & Shadows:** Basic ambient and directional lighting with shadows for realism.
*   **Undo Placement:** Allows users to remove the last placed brick via an "Undo" button.

## 3. User Interface

*   **Main View:** Displays the 3D scene.
*   **Control Panel (Left Side):**
    *   Displays project title and basic instructions.
    *   Provides a panel with 3D previews of available brick types for selection.
    *   Provides a palette of 10 standard colors for selection.
