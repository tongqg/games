import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Constants ---
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BOARD_DEPTH = 10; // Added depth for 3D
const CUBE_SIZE = 1; // Size of each block

// --- Tetromino Shapes (relative coordinates from pivot) ---
// Each shape is an array of [x, y, z] coordinates for its blocks
// Pivot is generally the center block or a defined point for rotation
const TETROMINOES = {
    'I': { color: 0x00ffff, shape: [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [2, 0, 0]] },
    'O': { color: 0xffff00, shape: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]] }, // O is often 2x2x1 or 2x2x2 in 3D
    'T': { color: 0x800080, shape: [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [0, 1, 0]] },
    'S': { color: 0x00ff00, shape: [[0, 0, 0], [-1, 0, 0], [0, 1, 0], [1, 1, 0]] },
    'Z': { color: 0xff0000, shape: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [-1, 1, 0]] },
    'J': { color: 0x0000ff, shape: [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [1, -1, 0]] }, // Adjusted J/L for consistency
    'L': { color: 0xffa500, shape: [[0, 0, 0], [-1, 0, 0], [1, 0, 0], [-1, -1, 0]] }
    // Note: These are 2D shapes extruded. We'll need 3D rotations later.
};
const TETROMINO_TYPES = Object.keys(TETROMINOES);

// --- Game State ---
// Represents the static blocks on the board. Using Map for potentially sparse board.
// Key: "x,y,z", Value: THREE.Mesh (or color/type)
let staticBlocks = new Map();

let currentTetrominoMesh = null; // THREE.Group containing the blocks
let currentTetrominoType = null;
let currentPosition = new THREE.Vector3(); // Position of the pivot
let currentRotation = new THREE.Euler(); // Rotation of the tetromino

// --- Timing ---
let clock = new THREE.Clock(); // Use Three.js clock for delta time
let timeSinceLastDrop = 0;
const dropInterval = 1; // seconds (adjust for desired speed)

// Get container
const container = document.getElementById('game-container');
if (!container) {
    throw new Error("Game container not found!");
}

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(5, 10, 15); // Adjust camera position for a better view

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Grid Helper (visual aid for the playfield)
const size = 10;
const divisions = 10;
const gridHelper = new THREE.GridHelper(size, divisions, 0x888888, 0x444444);
gridHelper.position.y = 0; // Align grid with the base plane (Y=0)
scene.add(gridHelper);

// --- Coordinate Conversion ---
// Converts logical board coordinates (0 to width-1, 0 to height-1, 0 to depth-1)
// to visual Three.js coordinates centered around the grid.
function getVisualPosition(logicalX, logicalY, logicalZ) {
    return new THREE.Vector3(
        (logicalX - BOARD_WIDTH / 2 + CUBE_SIZE / 2) * CUBE_SIZE,
        logicalY * CUBE_SIZE + CUBE_SIZE / 2, // Center block vertically on its Y coordinate
        (logicalZ - BOARD_DEPTH / 2 + CUBE_SIZE / 2) * CUBE_SIZE
    );
}

// Geometry and Material for Tetromino blocks (reusable)
const blockGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
// Add edge geometry for better visibility
const edgeGeometry = new THREE.EdgesGeometry(blockGeometry);
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });

// --- Functions ---

function createTetrominoMesh(type) {
    const tetrominoData = TETROMINOES[type];
    if (!tetrominoData) {
        console.error("Unknown Tetromino type:", type);
        return null;
    }

    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: tetrominoData.color });

    tetrominoData.shape.forEach(coords => {
        const blockMesh = new THREE.Mesh(blockGeometry, material);
        blockMesh.position.set(
            coords[0] * CUBE_SIZE,
            coords[1] * CUBE_SIZE,
            coords[2] * CUBE_SIZE // Assuming 2D shapes initially, z=0
        );

        // Add edges for visibility
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        blockMesh.add(edges);

        group.add(blockMesh);
    });

    return group;
}

function spawnNewTetromino() {
    // Clear previous tetromino if exists
    if (currentTetrominoMesh) {
        scene.remove(currentTetrominoMesh);
    }

    // Select random type
    currentTetrominoType = TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];

    // Create mesh
    currentTetrominoMesh = createTetrominoMesh(currentTetrominoType);
    if (!currentTetrominoMesh) return; // Handle error case

    // Set initial position (top center)
    // Adjust x/z based on BOARD_WIDTH/DEPTH, y based on BOARD_HEIGHT
    currentPosition.set(
        Math.floor(BOARD_WIDTH / 2),
        BOARD_HEIGHT - 2, // Start near the top
        Math.floor(BOARD_DEPTH / 2)
    );
    currentRotation.set(0, 0, 0); // Reset rotation
    
        // Apply initial position and rotation to the mesh group
        // Use the helper function to convert logical position to visual position
        currentTetrominoMesh.position.copy(getVisualPosition(currentPosition.x, currentPosition.y, currentPosition.z));
        currentTetrominoMesh.rotation.copy(currentRotation);
    
        // Check for immediate collision upon spawning (Game Over condition)
    if (checkCollision(currentPosition, currentRotation)) {
        console.error("GAME OVER - Cannot spawn new piece.");
        // TODO: Implement proper game over handling (e.g., stop loop, show message)
        scene.remove(currentTetrominoMesh); // Remove the colliding piece
        currentTetrominoMesh = null;
        currentTetrominoType = null;
        // Maybe stop the animation loop:
        // cancelAnimationFrame(animationFrameId); // Need to store the request ID
        alert("Game Over!"); // Simple alert for now
        return; // Stop the function
    }

    scene.add(currentTetrominoMesh);

    console.log(`Spawned: ${currentTetrominoType} at`, currentPosition);
}
    
    // Checks collision for the current tetromino at a given position and rotation
    // Returns true if collision occurs, false otherwise
    function checkCollision(position, rotation) {
        if (!currentTetrominoMesh || !currentTetrominoType) return false; // Should not happen
    
        const tetrominoData = TETROMINOES[currentTetrominoType];
    
        // Create a temporary matrix for rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(rotation);
    
        for (const localCoords of tetrominoData.shape) {
            // Apply rotation to local coordinates
            const rotatedCoords = new THREE.Vector3(localCoords[0], localCoords[1], localCoords[2]).applyMatrix4(rotationMatrix);
    
            // Calculate world coordinates (integer grid positions)
            const worldX = Math.round(position.x + rotatedCoords.x);
            const worldY = Math.round(position.y + rotatedCoords.y);
            const worldZ = Math.round(position.z + rotatedCoords.z);
    
            // 1. Check boundaries
            if (worldX < 0 || worldX >= BOARD_WIDTH ||
                worldY < 0 || // Check bottom boundary
                worldZ < 0 || worldZ >= BOARD_DEPTH) {
                // console.log("Collision: Boundary", { worldX, worldY, worldZ });
                return true;
            }
    
            // 2. Check against static blocks
            const key = `${worldX},${worldY},${worldZ}`;
            if (staticBlocks.has(key)) {
                // console.log("Collision: Static Block", { worldX, worldY, worldZ });
                return true;
            }
        }
    
        return false; // No collision detected
    }
    
    // Transfers blocks from the current tetromino to the static board
    // Returns a Set of Y levels occupied by the solidified piece
    function solidifyPiece() {
        if (!currentTetrominoMesh || !currentTetrominoType) return new Set();
    
        const occupiedYLevels = new Set();
        const tetrominoData = TETROMINOES[currentTetrominoType];
        const material = new THREE.MeshStandardMaterial({ color: tetrominoData.color }); // Use the correct color
    
        // Create a temporary matrix for rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(currentRotation);
    
        tetrominoData.shape.forEach(localCoords => {
            // Apply rotation to local coordinates
            const rotatedCoords = new THREE.Vector3(localCoords[0], localCoords[1], localCoords[2]).applyMatrix4(rotationMatrix);
    
            // Calculate final world coordinates (integer grid positions)
            const worldX = Math.round(currentPosition.x + rotatedCoords.x);
            const worldY = Math.round(currentPosition.y + rotatedCoords.y);
            const worldZ = Math.round(currentPosition.z + rotatedCoords.z);
    
            // Add Y level to the set
            occupiedYLevels.add(worldY);
    
            // Create a new mesh for the static block
            const staticBlockMesh = new THREE.Mesh(blockGeometry, material.clone()); // Clone material
            // Use the helper function to set the visual position
            staticBlockMesh.position.copy(getVisualPosition(worldX, worldY, worldZ));

            // Add edges for visibility
            const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial.clone()); // Clone edge material
            staticBlockMesh.add(edges);
    
            // Add to scene
            scene.add(staticBlockMesh);
    
            // Add to staticBlocks map
            const key = `${worldX},${worldY},${worldZ}`;
            staticBlocks.set(key, staticBlockMesh);
            // console.log("Solidified block at:", key);
        });
    
        // Remove the active tetromino group
        scene.remove(currentTetrominoMesh);
        currentTetrominoMesh = null;
        // Keep currentTetrominoType and currentRotation temporarily for checkAndClearPlanes if needed,
        // or pass necessary info directly. Let's pass occupiedYLevels.
    
        // Check for completed planes using the Y levels just occupied
        checkAndClearPlanes(occupiedYLevels);
    
        // Now null the type
        currentTetrominoType = null;
    
        return occupiedYLevels; // Return the levels (might be useful later)
    }
    
    // Checks for and clears completed horizontal planes based on affected Y levels
    function checkAndClearPlanes(occupiedYLevels) {
        if (!occupiedYLevels || occupiedYLevels.size === 0) return;
    
        // Sort the levels to check from bottom up
        const sortedYLevels = Array.from(occupiedYLevels).sort((a, b) => a - b);
        const clearedYLevels = [];
    
        for (const y of sortedYLevels) {
            if (y < 0) continue; // Ignore levels below the board
    
            let isPlaneComplete = true;
            for (let x = 0; x < BOARD_WIDTH; x++) {
                for (let z = 0; z < BOARD_DEPTH; z++) {
                    const key = `${x},${y},${z}`;
                    if (!staticBlocks.has(key)) {
                        isPlaneComplete = false;
                        break; // Exit inner loop
                    }
                }
                if (!isPlaneComplete) break; // Exit middle loop
            }
    
            if (isPlaneComplete) {
                console.log(`Plane complete at Y = ${y}`);
                clearedYLevels.push(y);
    
                // Remove blocks in this plane
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    for (let z = 0; z < BOARD_DEPTH; z++) {
                        const key = `${x},${y},${z}`;
                        const blockMesh = staticBlocks.get(key);
                        if (blockMesh) {
                            scene.remove(blockMesh);
                            // Consider disposing geometry/material if performance becomes an issue
                            // blockMesh.geometry.dispose();
                            // blockMesh.material.dispose();
                        }
                        staticBlocks.delete(key);
                    }
                }
            }
        }
    
        if (clearedYLevels.length > 0) {
            console.log(`Cleared ${clearedYLevels.length} planes at Y=[${clearedYLevels.join(', ')}].`);
            // Shift blocks down, passing the sorted list of cleared levels
            shiftBlocksDown(clearedYLevels);
        }
    }
    
    // Shifts blocks down after planes are cleared
    function shiftBlocksDown(clearedYLevels) {
        if (!clearedYLevels || clearedYLevels.length === 0) return;
    
        // Sort cleared levels descending to process shifts correctly from top down
        clearedYLevels.sort((a, b) => b - a);
    
        // Iterate through all Y levels above the highest cleared plane down to the lowest
        // Or more simply, iterate all blocks and shift based on cleared planes below them
        const blocksToMove = [];
        for (const [key, blockMesh] of staticBlocks.entries()) {
            const [x, y, z] = key.split(',').map(Number);
    
            let shiftAmount = 0;
            for (const clearedY of clearedYLevels) {
                if (y > clearedY) { // If the block is above a cleared plane
                    shiftAmount++;
                }
            }
    
            if (shiftAmount > 0) {
                blocksToMove.push({ oldKey: key, blockMesh, newY: y - shiftAmount });
            }
        }
    
        // Apply the moves after identifying all shifts to avoid conflicts
        blocksToMove.forEach(({ oldKey, blockMesh, newY }) => {
            const [x, , z] = oldKey.split(',').map(Number); // Get x and z from old key
            const newKey = `${x},${newY},${z}`;

            // Update mesh position using the helper function
            blockMesh.position.copy(getVisualPosition(x, newY, z));

            // Update map: add new key first, then delete old key
            staticBlocks.set(newKey, blockMesh);
            staticBlocks.delete(oldKey);
            // console.log(`Shifted block from ${oldKey} to ${newKey}`);
        });
    
         console.log(`Shifted ${blocksToMove.length} blocks down.`);
    }
    
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

    // --- Game Logic Update ---
    const deltaTime = clock.getDelta();
    timeSinceLastDrop += deltaTime;

    if (timeSinceLastDrop >= dropInterval) {
        if (currentTetrominoMesh) {
            const nextPosition = currentPosition.clone();
            nextPosition.y -= CUBE_SIZE;

            if (!checkCollision(nextPosition, currentRotation)) {
                // No collision below, move down
                currentPosition.copy(nextPosition);
                // Update visual position using the helper function
                currentTetrominoMesh.position.copy(getVisualPosition(currentPosition.x, currentPosition.y, currentPosition.z));
                // console.log("Piece moved down to Y:", currentPosition.y);
            } else {
                // Collision detected below! Solidify piece and spawn next one
                console.log("Collision detected below at Y:", nextPosition.y);
                solidifyPiece(); // We'll define this function next
                spawnNewTetromino();
            }
        }
        timeSinceLastDrop = 0; // Reset timer
    }

    renderer.render(scene, camera);
}

// --- Initial Setup ---
spawnNewTetromino(); // Spawn the first piece

// --- Start Animation Loop ---
animate();

console.log("3D Tetris initialized");

// --- Keyboard Controls ---
document.addEventListener('keydown', onKeyDown, false);

function onKeyDown(event) {
    if (!currentTetrominoMesh) return; // No active piece

    let moved = false;
    const nextPosition = currentPosition.clone();

    switch (event.key) { // or event.keyCode
        case 'ArrowLeft': // Move Left (negative X)
            nextPosition.x -= CUBE_SIZE;
            if (!checkCollision(nextPosition, currentRotation)) {
                currentPosition.copy(nextPosition);
                moved = true;
            }
            break;
        case 'ArrowRight': // Move Right (positive X)
            nextPosition.x += CUBE_SIZE;
            if (!checkCollision(nextPosition, currentRotation)) {
                currentPosition.copy(nextPosition);
                moved = true;
            }
            break;
        case 'ArrowDown': // Move Forward (positive Z - towards camera in default view)
            nextPosition.z += CUBE_SIZE;
             if (!checkCollision(nextPosition, currentRotation)) {
                currentPosition.copy(nextPosition);
                moved = true;
            }
            break;
        case 'ArrowUp': // Move Backward (negative Z - away from camera)
             nextPosition.z -= CUBE_SIZE;
             if (!checkCollision(nextPosition, currentRotation)) {
                currentPosition.copy(nextPosition);
                moved = true;
            }
            break;
       case 'q': // Rotate Y Counter-Clockwise (Yaw Left)
       case 'Q':
           {
               const nextRotation = currentRotation.clone();
               nextRotation.y -= Math.PI / 2;
               if (!checkCollision(currentPosition, nextRotation)) {
                   currentRotation.copy(nextRotation);
                   currentTetrominoMesh.rotation.copy(currentRotation);
               }
           }
           break;
       case 'e': // Rotate Y Clockwise (Yaw Right)
       case 'E':
           {
               const nextRotation = currentRotation.clone();
               nextRotation.y += Math.PI / 2;
                if (!checkCollision(currentPosition, nextRotation)) {
                   currentRotation.copy(nextRotation);
                   currentTetrominoMesh.rotation.copy(currentRotation);
               }
           }
           break;
        case 'w': // Rotate X Clockwise (Pitch Down)
        case 'W':
            {
                const nextRotation = currentRotation.clone();
                nextRotation.x += Math.PI / 2;
                if (!checkCollision(currentPosition, nextRotation)) {
                    currentRotation.copy(nextRotation);
                    currentTetrominoMesh.rotation.copy(currentRotation);
                }
            }
            break;
        case 's': // Rotate X Counter-Clockwise (Pitch Up)
        case 'S':
            {
                const nextRotation = currentRotation.clone();
                nextRotation.x -= Math.PI / 2;
                if (!checkCollision(currentPosition, nextRotation)) {
                    currentRotation.copy(nextRotation);
                    currentTetrominoMesh.rotation.copy(currentRotation);
                }
            }
            break;
        case 'a': // Rotate Z Counter-Clockwise (Roll Left)
        case 'A':
            {
                const nextRotation = currentRotation.clone();
                nextRotation.z -= Math.PI / 2;
                if (!checkCollision(currentPosition, nextRotation)) {
                    currentRotation.copy(nextRotation);
                    currentTetrominoMesh.rotation.copy(currentRotation);
                }
            }
            break;
        case 'd': // Rotate Z Clockwise (Roll Right)
        case 'D':
            {
                const nextRotation = currentRotation.clone();
                nextRotation.z += Math.PI / 2;
                if (!checkCollision(currentPosition, nextRotation)) {
                    currentRotation.copy(nextRotation);
                    currentTetrominoMesh.rotation.copy(currentRotation);
                }
            }
            break;
       // TODO: Add fast drop (Spacebar)
   }

   if (moved) { // Only update position if movement keys were pressed
        // Update visual position using the helper function
        currentTetrominoMesh.position.copy(getVisualPosition(currentPosition.x, currentPosition.y, currentPosition.z));
        // console.log("Piece moved by key to:", currentPosition);
    }
}