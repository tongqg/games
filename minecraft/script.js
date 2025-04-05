// Three.js Minecraft Clone
// Phase 2: Core Rendering & Controls (Completed)
// Phase 3: Block Interaction (Current)
// Phase 4: Procedural World Generation (Current)

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6; // Player eye level

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5f0b });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Player controls
const controls = new THREE.PointerLockControls(camera, document.body);

// Movement variables
const moveSpeed = 0.1;
const keys = {};

// Current selected block type
let selectedBlockType = 'dirt';

// Event listeners for controls
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (e.code === 'Space' && controls.isLocked) {
        // Simple jump (no physics yet)
        camera.position.y += 0.5;
    }
    
    if (e.code === 'Escape' && controls.isLocked) {
        controls.unlock();
    }

    // Block type selection hotkeys
    if (e.code === 'Digit1') selectedBlockType = 'grass';
    if (e.code === 'Digit2') selectedBlockType = 'dirt';
    if (e.code === 'Digit3') selectedBlockType = 'stone';
    if (e.code === 'Digit4') selectedBlockType = 'wood';
    if (e.code === 'Digit5') selectedBlockType = 'building';
    if (e.code === 'Digit6') selectedBlockType = 'road';
    if (e.code === 'Digit7') selectedBlockType = 'tree';
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

document.addEventListener('click', () => {
    if (!controls.isLocked) {
        controls.lock();
    }
});

// Block Library System
const blockSize = 1;
const blocks = [];
const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
const textureLoader = new THREE.TextureLoader();

// Define block types
const blockTypes = {
    grass: {
        top: 'grass_block_top.png',
        side: 'grass_block_side.png',
        bottom: 'dirt.png'
    },
    dirt: {
        all: 'dirt.png'
    },
    stone: {
        all: 'stone.png'
    },
    wood: {
        top: 'oak_log_top.png',
        side: 'oak_log.png'
    },
    building: {
        all: 'stone.png' // Temporary - should be replaced with building texture
    },
    road: {
        all: 'stone.png'  // Temporary - should be replaced with road texture
    },
    tree: {
        side: 'oak_log.png',
        top: 'oak_log_top.png'
    }
};

// Create materials for each block type
const blockMaterials = {};
for (const [type, textures] of Object.entries(blockTypes)) {
    if (textures.all) {
        blockMaterials[type] = new THREE.MeshStandardMaterial({
            map: textureLoader.load(`textures/${textures.all}`)
        });
    } else {
        const materials = [
            new THREE.MeshStandardMaterial({ map: textureLoader.load(`textures/${textures.side}`) }), // right
            new THREE.MeshStandardMaterial({ map: textureLoader.load(`textures/${textures.side}`) }), // left
            new THREE.MeshStandardMaterial({ map: textureLoader.load(`textures/${textures.top}`) }),  // top
            new THREE.MeshStandardMaterial({ map: textureLoader.load(`textures/${textures.bottom || textures.side}`) }), // bottom
            new THREE.MeshStandardMaterial({ map: textureLoader.load(`textures/${textures.side}`) }), // front
            new THREE.MeshStandardMaterial({ map: textureLoader.load(`textures/${textures.side}`) })  // back
        ];
        blockMaterials[type] = materials;
    }
}

// Add initial test blocks (grass with dirt underneath)
for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
        if (x === 0 && z === 0) continue; // Skip player position
        
        // Grass block
        const grassBlock = new THREE.Mesh(
            blockGeometry,
            Array.isArray(blockMaterials.grass) ? blockMaterials.grass : blockMaterials.grass
        );
        grassBlock.position.set(x * blockSize, 0, z * blockSize);
        grassBlock.blockType = 'grass';
        scene.add(grassBlock);
        blocks.push(grassBlock);
        
        // Dirt underneath
        const dirtBlock = new THREE.Mesh(
            blockGeometry,
            Array.isArray(blockMaterials.dirt) ? blockMaterials.dirt : blockMaterials.dirt
        );
        dirtBlock.position.set(x * blockSize, -blockSize, z * blockSize);
        dirtBlock.blockType = 'dirt';
        scene.add(dirtBlock);
        blocks.push(dirtBlock);
    }
}

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getBlockAtPosition(position) {
    return blocks.find(block =>
        block.position.x === position.x &&
        block.position.y === position.y &&
        block.position.z === position.z
    );
}

function addBlock(position, type = selectedBlockType) {
    if (getBlockAtPosition(position)) return; // Block already exists
    
    const newBlock = new THREE.Mesh(
        blockGeometry,
        Array.isArray(blockMaterials[type]) ? blockMaterials[type] : blockMaterials[type]
    );
    newBlock.position.copy(position);
    newBlock.blockType = type;
    scene.add(newBlock);
    blocks.push(newBlock);
    return newBlock;
}

function removeBlock(position) {
    const index = blocks.findIndex(block =>
        block.position.x === position.x &&
        block.position.y === position.y &&
        block.position.z === position.z
    );
    if (index !== -1) {
        const block = blocks[index];
        scene.remove(block);
        blocks.splice(index, 1);
        return block;
    }
    return null;
}

// Block interaction handlers
document.addEventListener('mousedown', (e) => {
    if (!controls.isLocked) return;
    
    // Prevent default context menu on right click
    if (e.button === 2) e.preventDefault();
    
    // Calculate mouse position in normalized device coordinates
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the ray
    const intersects = raycaster.intersectObjects(blocks);
    
    if (intersects.length > 0) {
        const intersect = intersects[0];
        
        if (e.button === 0) { // Left click - remove block
            removeBlock(intersect.object.position);
        } else if (e.button === 2) { // Right click - place block
            // Calculate position for new block
            const normal = intersect.face.normal;
            const newPosition = intersect.object.position.clone();
            newPosition.x += normal.x;
            newPosition.y += normal.y;
            newPosition.z += normal.z;
            addBlock(newPosition, selectedBlockType);
            console.log('Placing block of type:', selectedBlockType);
        }
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Movement
    if (controls.isLocked) {
        if (keys['KeyW']) controls.moveForward(moveSpeed);
        if (keys['KeyS']) controls.moveForward(-moveSpeed);
        if (keys['KeyA']) controls.moveRight(-moveSpeed);
        if (keys['KeyD']) controls.moveRight(moveSpeed);
    }

    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});