import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
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

// Create Roads
const roadMaterial = new THREE.MeshStandardMaterial({ color: roadColor });

// Roads along Z-axis
for (let i = -gridSize; i <= gridSize; i++) {
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, groundSize);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(i * blockSize - roadWidth / 2, roadElevation, 0); // Offset by half width
    road.receiveShadow = true;
    scene.add(road);

    // Add another parallel segment for thicker roads if needed, or adjust roadWidth
    const road2 = new THREE.Mesh(roadGeometry, roadMaterial);
    road2.rotation.x = -Math.PI / 2;
    road2.position.set(i * blockSize + roadWidth / 2, roadElevation, 0); // Offset by half width
    road2.receiveShadow = true;
    scene.add(road2);
}

// Roads along X-axis
for (let i = -gridSize; i <= gridSize; i++) {
    const roadGeometry = new THREE.PlaneGeometry(groundSize, roadWidth);
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, roadElevation, i * blockSize - roadWidth / 2); // Offset by half width
    road.receiveShadow = true;
    scene.add(road);

     // Add another parallel segment for thicker roads if needed, or adjust roadWidth
    const road2 = new THREE.Mesh(roadGeometry, roadMaterial);
    road2.rotation.x = -Math.PI / 2;
    road2.position.set(0, roadElevation, i * blockSize + roadWidth / 2); // Offset by half width
    road2.receiveShadow = true;
    scene.add(road2);
}


// Function to create a simple building
function createBuilding(width, height, depth, x, z) {
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const buildingMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(Math.random() * 0.3 + 0.5, Math.random() * 0.3 + 0.5, Math.random() * 0.3 + 0.5) // Shades of gray
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    // Position base slightly above ground to avoid z-fighting with roads
    building.position.set(x, height / 2 + roadElevation, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    return building;
}

// Add buildings within blocks
const buildingPadding = 1.5; // Padding from the road edge

for (let i = -gridSize; i < gridSize; i++) {
    for (let j = -gridSize; j < gridSize; j++) {
        // Calculate block center
        const blockCenterX = (i + 0.5) * blockSize;
        const blockCenterZ = (j + 0.5) * blockSize;

        // Randomly decide whether to place a building in this block
        if (Math.random() > 0.3) { // 70% chance to place a building
            const buildingWidth = Math.random() * (blockSize - roadWidth - buildingPadding * 2) * 0.6 + (blockSize - roadWidth - buildingPadding * 2) * 0.2; // Min 20% of available space
            const buildingDepth = Math.random() * (blockSize - roadWidth - buildingPadding * 2) * 0.6 + (blockSize - roadWidth - buildingPadding * 2) * 0.2;
            const buildingHeight = Math.random() * 25 + 8; // Random height between 8 and 33

            // Random position within the block, respecting padding
            const buildingX = blockCenterX + (Math.random() - 0.5) * (blockSize - roadWidth - buildingPadding * 2 - buildingWidth);
            const buildingZ = blockCenterZ + (Math.random() - 0.5) * (blockSize - roadWidth - buildingPadding * 2 - buildingDepth);

            createBuilding(buildingWidth, buildingHeight, buildingDepth, buildingX, buildingZ);
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