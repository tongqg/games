import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// Texture Loader
const textureLoader = new THREE.TextureLoader();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 25, 30); // Adjusted initial camera position for better view
camera.lookAt(0, 0, 0);

// Renderer
const canvas = document.getElementById('cityCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Slightly brighter ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Slightly stronger directional
directionalLight.position.set(60, 80, 70);
directionalLight.castShadow = true;
// Configure shadow properties
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 250; // Adjusted far plane
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);
// Optional: Helpers
// const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(lightHelper);
// const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
// scene.add(shadowCameraHelper);

// Ground Plane
const groundSize = 200;
const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide }); // Forest green
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.receiveShadow = true; // Allow ground to receive shadows
scene.add(ground);

// Road Grid Parameters
const roadWidth = 4;
const roadColor = 0x444444; // Dark grey
const roadElevation = 0.05; // Slightly above ground
const gridSize = 10; // Number of blocks in each direction from center
const blockSize = groundSize / (gridSize * 2); // Size of one city block

// Load Textures (Using placeholders - replace with your own textures)
const roadTextureUrl = 'https://threejs.org/examples/textures/hardwood2_diffuse.jpg'; // Placeholder asphalt
const buildingTextureUrl = 'https://threejs.org/examples/textures/brick_diffuse.jpg'; // Placeholder brick

const roadTexture = textureLoader.load(roadTextureUrl);
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, groundSize / roadWidth); // Repeat along the length

const buildingTexture = textureLoader.load(buildingTextureUrl);
buildingTexture.wrapS = THREE.RepeatWrapping;
buildingTexture.wrapT = THREE.RepeatWrapping;


// Create Roads (Using PlaneGeometry for easier texture mapping)
const roadMaterial = new THREE.MeshStandardMaterial({ map: roadTexture, color: 0xaaaaaa }); // Apply texture, slightly greyish base

// Roads along Z-axis (Vertical)
for (let i = -gridSize; i <= gridSize; i++) {
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, groundSize);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(i * blockSize, roadElevation, 0); // Position slightly above ground
    road.receiveShadow = true;
    scene.add(road);
}

// Roads along X-axis (Horizontal)
// Need a separate texture instance for horizontal roads to set repeat differently
const roadTextureHorizontal = textureLoader.load(roadTextureUrl);
roadTextureHorizontal.wrapS = THREE.RepeatWrapping;
roadTextureHorizontal.wrapT = THREE.RepeatWrapping;
roadTextureHorizontal.repeat.set(groundSize / roadWidth, 1); // Repeat along the length

const roadMaterialHorizontal = new THREE.MeshStandardMaterial({ map: roadTextureHorizontal, color: 0xaaaaaa });

for (let i = -gridSize; i <= gridSize; i++) {
    const roadGeometry = new THREE.PlaneGeometry(groundSize, roadWidth);
    const road = new THREE.Mesh(roadGeometry, roadMaterialHorizontal);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, roadElevation, i * blockSize); // Position slightly above ground
    road.receiveShadow = true;
    scene.add(road);
}


// Function to create a slightly more detailed procedural building
function createBuilding(baseWidth, baseDepth, maxHeight, x, z) {
    const buildingGroup = new THREE.Group();

    // Base structure
    const baseHeight = Math.random() * (maxHeight * 0.6) + (maxHeight * 0.2); // 20% to 80% of max height
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    // Clone texture for independent repeat settings if needed, or use shared
    const buildingMatTexture = buildingTexture.clone();
    // Adjust texture repeat based on building face size (approximate)
    buildingMatTexture.repeat.set(baseWidth / 5, baseHeight / 5); // Adjust '5' based on texture scale

    const baseMaterial = new THREE.MeshStandardMaterial({
        map: buildingMatTexture,
        color: 0xffffff // Use white base color to not tint texture too much
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.castShadow = true;
    base.receiveShadow = true;
    buildingGroup.add(base);

    // Optional: Add a smaller top structure
    if (Math.random() > 0.4 && maxHeight > 10) { // 60% chance for taller buildings
        const topHeight = Math.random() * (maxHeight - baseHeight) * 0.7 + (maxHeight - baseHeight) * 0.2;
        const topWidth = baseWidth * (Math.random() * 0.3 + 0.5); // 50% to 80% of base width
        const topDepth = baseDepth * (Math.random() * 0.3 + 0.5); // 50% to 80% of base depth
        const topGeometry = new THREE.BoxGeometry(topWidth, topHeight, topDepth);
        // Clone texture for independent repeat settings if needed
        const topBuildingMatTexture = buildingTexture.clone();
        topBuildingMatTexture.repeat.set(topWidth / 5, topHeight / 5); // Adjust '5' based on texture scale

        const topMaterial = new THREE.MeshStandardMaterial({
             map: topBuildingMatTexture,
             color: 0xffffff // Use white base color
        });
        const topPart = new THREE.Mesh(topGeometry, topMaterial);
        topPart.position.set(0, baseHeight / 2 + topHeight / 2, 0); // Position on top of the base
        topPart.castShadow = true;
        topPart.receiveShadow = true;
        buildingGroup.add(topPart);
    }

    // Position the entire building group
    // Group's origin is at the center of the base
    buildingGroup.position.set(x, baseHeight / 2 + roadElevation, z);
    scene.add(buildingGroup);
    return buildingGroup; // Return the group
}

// Function to create a simple procedural tree
function createTree(x, z) {
    const treeGroup = new THREE.Group();

    // Trunk
    const trunkHeight = Math.random() * 2 + 1.5; // Height between 1.5 and 3.5
    const trunkRadius = trunkHeight * 0.15;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius * 0.8, trunkRadius, trunkHeight, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // SaddleBrown
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = false; // Trunk less likely to receive distinct shadows
    treeGroup.add(trunk);

    // Canopy (Sphere)
    const canopyRadius = trunkHeight * 0.6 + 0.5;
    const canopyGeometry = new THREE.SphereGeometry(canopyRadius, 16, 12);
    const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // ForestGreen
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = trunkHeight / 2 + canopyRadius * 0.6; // Position canopy above trunk
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    treeGroup.add(canopy);

    // Position the entire tree group
    treeGroup.position.set(x, trunkHeight / 2 + roadElevation, z); // Base of the trunk at ground level
    scene.add(treeGroup);
    return treeGroup;
}


// Add buildings and trees within blocks
const elementPadding = 1.5; // Padding from the road edge for buildings/trees
const treeProbability = 0.15; // Chance to place a tree instead of trying for a building

for (let i = -gridSize; i < gridSize; i++) {
    for (let j = -gridSize; j < gridSize; j++) {
        // Calculate block boundaries
        const blockStartX = i * blockSize + roadWidth / 2;
        const blockStartZ = j * blockSize + roadWidth / 2;
        const blockEndX = (i + 1) * blockSize - roadWidth / 2;
        const blockEndZ = (j + 1) * blockSize - roadWidth / 2;
        const availableWidth = blockEndX - blockStartX - 2 * elementPadding;
        const availableDepth = blockEndZ - blockStartZ - 2 * elementPadding;

        if (availableWidth <= 0 || availableDepth <= 0) continue; // Skip if block is too small

        // Randomly decide placement within the block
        const placeX = blockStartX + elementPadding + Math.random() * availableWidth;
        const placeZ = blockStartZ + elementPadding + Math.random() * availableDepth;

        if (Math.random() < treeProbability) {
            // Place a tree
             if (Math.random() < 0.7) { // 70% chance to actually place a tree here
                 createTree(placeX, placeZ);
             }
        } else {
            // Try to place a building
            if (Math.random() > 0.35) { // 65% chance to place a building
                const buildingWidth = Math.random() * availableWidth * 0.5 + availableWidth * 0.2; // Min 20% width
                const buildingDepth = Math.random() * availableDepth * 0.5 + availableDepth * 0.2; // Min 20% depth
                const buildingHeight = Math.random() * 25 + 8; // Random height between 8 and 33

                // Adjust placement coords to be center of building base
                const buildingX = blockStartX + elementPadding + buildingWidth / 2 + Math.random() * (availableWidth - buildingWidth);
                const buildingZ = blockStartZ + elementPadding + buildingDepth / 2 + Math.random() * (availableDepth - buildingDepth);


                createBuilding(buildingWidth, buildingDepth, buildingHeight, buildingX, buildingZ);
            }
        }
    }
}


// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 10; // Adjusted min distance
controls.maxDistance = 180; // Adjusted max distance

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();