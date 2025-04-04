import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { createNoise2D, createNoise3D } from 'simplex-noise';

// Block Types
const BLOCK_TYPES = {
    DIRT: {
        id: 0,
        name: 'Dirt',
        color: 0x8B4513, // Brown
        hardness: 1
    },
    STONE: {
        id: 1,
        name: 'Stone',
        color: 0x808080, // Gray
        hardness: 2
    },
    WOOD: {
        id: 2,
        name: 'Wood',
        color: 0x8B4513, // Brown
        hardness: 1.5
    },
    GRASS: {
        id: 3,
        name: 'Grass',
        topColor: 0x4CAF50, // Green
        sideColor: 0x8B4513, // Brown
        hardness: 1
    },
    COBBLESTONE: {
        id: 4,
        name: 'Cobblestone',
        color: 0x808080, // Gray
        hardness: 2.5
    }
};

// Selected Block Type
let selectedBlockType = BLOCK_TYPES.DIRT;

// Inventory UI
function createInventoryUI() {
    const inventory = document.createElement('div');
    inventory.id = 'inventory';

    Object.values(BLOCK_TYPES).forEach(type => {
        const item = document.createElement('div');
        item.className = 'inventory-item';
        if (type.id === selectedBlockType.id) {
            item.classList.add('selected');
        }
        item.dataset.typeId = type.id;

        const preview = document.createElement('div');
        preview.className = 'block-preview';
        // Use topColor for grass, color for other blocks
        const color = type === BLOCK_TYPES.GRASS ? type.topColor : type.color;
        preview.style.backgroundColor = `#${color.toString(16).padStart(6, '0')}`;
        item.appendChild(preview);

        item.addEventListener('click', () => {
            selectedBlockType = BLOCK_TYPES[type.name];
            document.querySelectorAll('.inventory-item').forEach(el => {
                el.classList.remove('selected');
            });
            item.classList.add('selected');
        });

        inventory.appendChild(item);
    });

    document.body.appendChild(inventory);
}


// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera (First Person)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5); // Eye level, slightly back

// Renderer
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

// Controls (Pointer Lock)
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject()); // Add camera holder to scene

// Pointer Lock Interaction
const blocker = document.createElement('div');
blocker.id = 'blocker';
blocker.style.position = 'absolute';
blocker.style.width = '100%';
blocker.style.height = '100%';
blocker.style.background = 'rgba(0,0,0,0.5)';
blocker.style.display = 'flex';
blocker.style.justifyContent = 'center';
blocker.style.alignItems = 'center';
blocker.style.color = 'white';
blocker.style.fontSize = '24px';
blocker.innerHTML = 'Click to Play';
document.body.appendChild(blocker);

blocker.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    blocker.style.display = 'flex';
    keys = {}; // Reset keys on unlock

    // Remove highlight when game is paused
    if (highlightMesh) {
        scene.remove(highlightMesh);
        if (highlightMesh.userData.edgesGeometry) {
            highlightMesh.userData.edgesGeometry.dispose(); // Dispose edges geometry when removing
        }
        highlightMesh = null;
    }
    targetedBlock = null;
});

// Keyboard Movement State
const keys = {};
document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});
document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// World Data & Block Geometry/Material
const worldData = new Map(); // Using a Map: "x,y,z" -> blockMesh
const blockSize = 1;
const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
const blockMaterial = new THREE.MeshStandardMaterial({ color: BLOCK_TYPES.DIRT.color }); // Default to dirt

// Function to add a block to the scene and world data
function addBlock(x, y, z, type = BLOCK_TYPES.DIRT) {
    let material;
    if (type === BLOCK_TYPES.GRASS) {
        // Grass has green top and brown sides
        material = new THREE.MeshStandardMaterial({
            color: type.sideColor,
            map: null
        });
        // Clone material for top face
        const topMaterial = new THREE.MeshStandardMaterial({
            color: type.topColor
        });
        // Create array of materials for each face (order: [x+,x-,y+,y-,z+,z-])
        const materials = [
            new THREE.MeshStandardMaterial({color: type.sideColor}), // Right
            new THREE.MeshStandardMaterial({color: type.sideColor}), // Left
            new THREE.MeshStandardMaterial({color: type.topColor}),  // Top
            new THREE.MeshStandardMaterial({color: type.sideColor}), // Bottom
            new THREE.MeshStandardMaterial({color: type.sideColor}), // Front
            new THREE.MeshStandardMaterial({color: type.sideColor})  // Back
        ];
        material = materials;
    } else {
        // Standard single-color material
        material = new THREE.MeshStandardMaterial({ color: type.color });
    }
    const block = new THREE.Mesh(blockGeometry, material);
    // Position based on center of the block
    block.position.set(
        x * blockSize + blockSize / 2,
        y * blockSize + blockSize / 2,
        z * blockSize + blockSize / 2
    );
    block.userData = { x, y, z }; // Store grid coordinates
    scene.add(block);
    worldData.set(`${x},${y},${z}`, block);
    return block;
}

// Function to remove a block
function removeBlock(x, y, z) {
    const key = `${x},${y},${z}`;
    const block = worldData.get(key);
    if (block) {
        scene.remove(block);
        block.geometry.dispose(); // Clean up geometry
        // block.material.dispose(); // Don't dispose shared material yet
        worldData.delete(key);
        return true;
    }
    return false;
}

// World Generation Configuration
const WORLD_SIZE = 32; // 32x32 area
const CHUNK_SIZE = 16; // Generate in 16x16 chunks
const noise2D = createNoise2D();
const noise3D = createNoise3D();

// Biome Types
const BIOMES = {
    PLAINS: {
        baseHeight: 4,
        heightVariation: 3,
        primaryBlock: BLOCK_TYPES.GRASS,
        secondaryBlock: BLOCK_TYPES.DIRT
    },
    MOUNTAINS: {
        baseHeight: 8,
        heightVariation: 10,
        primaryBlock: BLOCK_TYPES.STONE,
        secondaryBlock: BLOCK_TYPES.COBBLESTONE
    },
    DESERT: {
        baseHeight: 5,
        heightVariation: 2,
        primaryBlock: BLOCK_TYPES.DIRT,
        secondaryBlock: BLOCK_TYPES.STONE
    }
};

// Get biome at coordinates
function getBiome(x, z) {
    const biomeNoise = noise2D(x * 0.01, z * 0.01);
    if (biomeNoise > 0.5) return BIOMES.MOUNTAINS;
    if (biomeNoise < -0.3) return BIOMES.DESERT;
    return BIOMES.PLAINS;
}

// Generate terrain height at coordinates
function getTerrainHeight(x, z, biome) {
    const noise = noise2D(x * 0.1, z * 0.1);
    return biome.baseHeight + Math.floor(noise * biome.heightVariation);
}

// Check if position should be a cave
function isCave(x, y, z) {
    const caveNoise = noise3D(x * 0.2, y * 0.2, z * 0.2);
    return caveNoise > 0.3 && y < 5; // Only caves below surface level
}

// Generate a chunk of terrain
function generateChunk(chunkX, chunkZ) {
    for (let x = chunkX; x < chunkX + CHUNK_SIZE; x++) {
        for (let z = chunkZ; z < chunkZ + CHUNK_SIZE; z++) {
            const biome = getBiome(x, z);
            const height = getTerrainHeight(x, z, biome);
            
            // Generate terrain column
            for (let y = 0; y <= height; y++) {
                if (!isCave(x, y, z)) {
                    const blockType = y === height ? biome.primaryBlock : biome.secondaryBlock;
                    addBlock(x, y, z, blockType);
                }
            }
        }
    }
}

// Initial World Generation (Procedural Terrain)
for (let x = -WORLD_SIZE/2; x < WORLD_SIZE/2; x += CHUNK_SIZE) {
    for (let z = -WORLD_SIZE/2; z < WORLD_SIZE/2; z += CHUNK_SIZE) {
        generateChunk(x, z);
    }
}

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // Always use center of screen for raycasting
let targetedBlock = null;
let highlightMesh = null;
const highlightMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, depthTest: false, linewidth: 2 }); // White outline, disable depth test

// Event Listeners for Block Interaction
window.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;

    // Normalize mouse coords to center (for raycasting from camera center)
    mouse.x = 0;
    mouse.y = 0;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Array.from(worldData.values())); // Check only world blocks

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const block = intersection.object;
        const pos = block.userData; // Get grid coords {x, y, z}

        if (event.button === 0) { // Left Click - Break
            console.log(`Breaking block at ${pos.x}, ${pos.y}, ${pos.z}`);
            removeBlock(pos.x, pos.y, pos.z);
        } else if (event.button === 2) { // Right Click - Place
            const normal = intersection.face.normal;
            // Calculate position for the new block based on the face normal
            const placePos = {
                x: pos.x + normal.x,
                y: pos.y + normal.y,
                z: pos.z + normal.z
            };
            console.log(`Placing block at ${placePos.x}, ${placePos.y}, ${placePos.z}`);
            // Check if the space is empty before placing
            if (!worldData.has(`${placePos.x},${placePos.y},${placePos.z}`)) {
                 // Basic collision check: Don't place inside player
                 const playerPos = controls.getObject().position;
                 const playerGridPos = {
                    x: Math.floor(playerPos.x / blockSize),
                    y: Math.floor(playerPos.y / blockSize),
                    z: Math.floor(playerPos.z / blockSize)
                 };
                 const playerHeadGridPos = {
                    x: Math.floor(playerPos.x / blockSize),
                    y: Math.floor((playerPos.y + 0.6) / blockSize), // Approx head height
                    z: Math.floor(playerPos.z / blockSize)
                 };

                 if (
                    (placePos.x === playerGridPos.x && placePos.y === playerGridPos.y && placePos.z === playerGridPos.z) ||
                    (placePos.x === playerHeadGridPos.x && placePos.y === playerHeadGridPos.y && placePos.z === playerHeadGridPos.z)
                 ) {
                    console.log("Cannot place block inside player.");
                 } else {
                    addBlock(placePos.x, placePos.y, placePos.z, selectedBlockType); // Use selected block type
                 }
            } else {
                console.log("Space occupied.");
            }
        }
    }
});

// Prevent context menu on right click
window.addEventListener('contextmenu', (event) => event.preventDefault());

// Animation Loop
const clock = new THREE.Clock();
const moveSpeed = 5.0;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // --- Raycasting for Highlighting ---
    if (controls.isLocked) {
        updateTargetedBlock(); // Call the dedicated function

        // --- Movement ---
        const moveDirection = new THREE.Vector3();
        if (keys['KeyW']) moveDirection.z = -1;
        if (keys['KeyS']) moveDirection.z = 1;
        if (keys['KeyA']) moveDirection.x = -1;
        if (keys['KeyD']) moveDirection.x = 1;

        moveDirection.normalize(); // Ensure consistent speed diagonally

        if (keys['KeyW'] || keys['KeyS']) {
            controls.moveForward(moveDirection.z * moveSpeed * delta);
        }
        if (keys['KeyA'] || keys['KeyD']) {
            controls.moveRight(moveDirection.x * moveSpeed * delta);
        }

        // Simple gravity/jump placeholder (no collision yet)
        // controls.getObject().position.y -= 9.8 * delta * delta * 0.5; // basic gravity
        // if (controls.getObject().position.y < 1.6) {
        //     controls.getObject().position.y = 1.6;
        // }

    } else {
         // Ensure highlight is removed if controls become unlocked unexpectedly (e.g., Esc pressed)
         if (highlightMesh) {
             scene.remove(highlightMesh);
             if (highlightMesh.userData.edgesGeometry) {
                 highlightMesh.userData.edgesGeometry.dispose(); // Dispose edges geometry
             }
             highlightMesh = null;
         }
         targetedBlock = null;
    }
    renderer.render(scene, camera);
}

// --- Function for Raycasting and Highlighting ---
function updateTargetedBlock() {
    raycaster.setFromCamera(mouse, camera); // mouse is always (0,0) for center screen
    const blockMeshes = Array.from(worldData.values());
    const intersects = raycaster.intersectObjects(blockMeshes, false); // Don't check recursively

    let newTarget = null;
    if (intersects.length > 0) {
        const intersection = intersects[0];
        // Check distance - only highlight blocks within reach (e.g., 10 units)
        if (intersection.distance < 10) {
             newTarget = intersection.object;
        }
    }

    // Check if the target has changed
    if (newTarget !== targetedBlock) {
        // Remove previous highlight
        if (highlightMesh) {
            scene.remove(highlightMesh);
            // Dispose the specific EdgesGeometry created for the previous highlight
            if (highlightMesh.userData.edgesGeometry) {
                highlightMesh.userData.edgesGeometry.dispose();
            }
            highlightMesh = null;
        }

        // Add new highlight if a valid target is found
        if (newTarget) {
            // Use EdgesGeometry for outline
            const edges = new THREE.EdgesGeometry(newTarget.geometry); // Create edges for the specific block's geometry
            highlightMesh = new THREE.LineSegments(edges, highlightMaterial);
            highlightMesh.position.copy(newTarget.position);
            highlightMesh.scale.copy(newTarget.scale); // Match scale
            highlightMesh.quaternion.copy(newTarget.quaternion); // Match rotation
            highlightMesh.userData.edgesGeometry = edges; // Store for disposal
            scene.add(highlightMesh);
        }
        targetedBlock = newTarget; // Update the currently targeted block
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create inventory UI
createInventoryUI();

// Start the animation loop
animate();