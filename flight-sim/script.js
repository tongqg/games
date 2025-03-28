import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Optional: For camera control during development

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background
scene.fog = new THREE.Fog(0x87CEEB, 50, 150); // Add fog for depth perception

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Initial camera position will be updated in animate() to follow the plane

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Adjusted intensity
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Adjusted intensity
directionalLight.position.set(15, 30, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024; // default
directionalLight.shadow.mapSize.height = 1024; // default
directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 500; // default
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);
// const helper = new THREE.CameraHelper( directionalLight.shadow.camera ); // Optional: Shadow camera helper
// scene.add( helper );


// Ground plane
const groundGeometry = new THREE.PlaneGeometry(200, 200); // Larger ground
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide }); // Forest green
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
ground.position.y = -1; // Position slightly below the plane origin
ground.receiveShadow = true; // Allow ground to receive shadows
scene.add(ground);

// --- Scenery ---
const sceneryGroup = new THREE.Group();
const buildingGeometry = new THREE.BoxGeometry(2, 1, 2); // Base size
const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa }); // Gray

for (let i = 0; i < 50; i++) { // Add 50 "buildings"
    const height = Math.random() * 10 + 2; // Random height
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    const x = (Math.random() - 0.5) * 180; // Spread within ground bounds
    const z = (Math.random() - 0.5) * 180;

    building.scale.y = height; // Scale based on random height
    building.position.set(x, height / 2 - 1, z); // Position base on ground
    building.castShadow = true;
    building.receiveShadow = false; // Buildings typically don't receive shadows on themselves in this simple setup
    sceneryGroup.add(building);
}
scene.add(sceneryGroup);
// --- End Scenery ---

// --- Plane Creation Function ---
function createPlane(color) {
    const planeGroup = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 3);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const planeBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    planeBody.castShadow = true;
    planeGroup.add(planeBody);

    const wingGeometry = new THREE.BoxGeometry(5, 0.1, 1);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = -0.5;
    wings.castShadow = true;
    planeGroup.add(wings);

    const tailGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.2);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0.5, 1.4);
    tail.castShadow = true;
    planeGroup.add(tail);

    // Add a bounding box for collision detection
    planeGroup.userData.boundingBox = new THREE.Box3().setFromObject(planeGroup);

    return planeGroup;
}
// --- End Plane Creation ---

// Player Plane
const playerPlane = createPlane(0xff0000); // Red
playerPlane.position.y = 5; // Start plane higher
scene.add(playerPlane);

// Player Plane movement state
const playerState = {
    speed: 0.15,
    velocity: new THREE.Vector3(0, 0, 0),
    rotationSpeed: 0.02,
    roll: 0,
    pitch: 0,
    yaw: 0,
    lift: 0.001
};

// Controls state
const controls = {
    throttleUp: false,
    throttleDown: false,
    moveLeft: false, // Yaw
    moveRight: false, // Yaw
    rollLeft: false,
    rollRight: false,
    pitchUp: false,
    pitchDown: false,
    shooting: false
};

// --- Enemy Planes ---
const enemies = [];
const enemySpeed = 0.05; // Slower than player
const enemyTurnSpeed = 0.005; // How fast enemies turn towards player
const numberOfEnemies = 5;

function spawnEnemy() {
    const enemyPlane = createPlane(0x0000ff); // Blue
    const spawnRadius = 50;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * spawnRadius;
    const z = Math.sin(angle) * spawnRadius;
    const y = Math.random() * 10 + 5; // Random altitude

    enemyPlane.position.set(x, y, z);
    enemyPlane.lookAt(playerPlane.position); // Initial orientation towards player (approx)

    // Add simple AI state
    enemyPlane.userData.ai = {
        targetPosition: new THREE.Vector3() // Will update later
    };
    // Add bounding box helper (optional for debugging)
    // const boxHelper = new THREE.Box3Helper( enemyPlane.userData.boundingBox, 0xffff00 );
    // scene.add( boxHelper );
    // enemyPlane.userData.boxHelper = boxHelper;


    enemies.push(enemyPlane);
    scene.add(enemyPlane);
}

for (let i = 0; i < numberOfEnemies; i++) {
    spawnEnemy();
}
// --- End Enemy Planes ---


// --- Shooting Mechanics ---
const bullets = [];
const bulletGeometry = new THREE.SphereGeometry(0.15, 8, 8); // Slightly larger bullets
const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const bulletSpeed = 0.8; // Adjusted speed
const bulletRange = 100;

let lastShotTime = 0;
const fireRate = 150; // Milliseconds between shots

function shoot() {
    const now = performance.now();
    if (now - lastShotTime < fireRate) return;
    lastShotTime = now;

    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    const planePosition = playerPlane.position.clone();
    const planeQuaternion = playerPlane.quaternion.clone();

    const offset = new THREE.Vector3(0, 0, -2);
    offset.applyQuaternion(planeQuaternion);
    bullet.position.copy(planePosition).add(offset);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(planeQuaternion);
    bullet.velocity = direction.multiplyScalar(bulletSpeed);

    bullet.userData.startPosition = bullet.position.clone();
    // Add bounding sphere for collision
    bullet.userData.boundingSphere = new THREE.Sphere(bullet.position, 0.15);


    bullets.push(bullet);
    scene.add(bullet);
}
// --- End Shooting Mechanics ---

// Camera follow settings
const cameraOffset = new THREE.Vector3(0, 4, 12); // Adjusted camera offset
const cameraLookAtOffset = new THREE.Vector3(0, 1, -5);

// Animation loop
const clock = new THREE.Clock(); // For delta time if needed

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Time since last frame (useful for framerate independence, not fully implemented here)

    // --- Update Player Plane Physics ---
    let currentSpeed = 0;
    if (controls.throttleUp) currentSpeed = playerState.speed;
    if (controls.throttleDown) currentSpeed = -playerState.speed * 0.5;

    if (controls.rollLeft) playerState.roll += playerState.rotationSpeed;
    if (controls.rollRight) playerState.roll -= playerState.rotationSpeed;
    if (controls.pitchUp) playerState.pitch += playerState.rotationSpeed;
    if (controls.pitchDown) playerState.pitch -= playerState.rotationSpeed;
    if (controls.moveLeft) playerState.yaw += playerState.rotationSpeed;
    if (controls.moveRight) playerState.yaw -= playerState.rotationSpeed;

    playerPlane.rotation.set(playerState.pitch, playerState.yaw, playerState.roll, 'YXZ');

    const forwardDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(playerPlane.quaternion);
    playerState.velocity.copy(forwardDirection).multiplyScalar(currentSpeed);

    const speedSq = Math.max(0, currentSpeed) * Math.max(0, currentSpeed);
    const liftForce = speedSq * playerState.lift * Math.cos(playerState.pitch);
    const gravityForce = 0.005;
    playerState.velocity.y += (liftForce - gravityForce);

    playerPlane.position.add(playerState.velocity);
    playerPlane.userData.boundingBox.setFromObject(playerPlane); // Update bounding box

    if (playerPlane.position.y < 0.2) {
        playerPlane.position.y = 0.2;
        playerState.velocity.y = Math.max(0, playerState.velocity.y);
    }

    // --- Update Enemy Planes ---
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Simple AI: Fly forward and slowly turn towards player
        const enemyForward = new THREE.Vector3(0, 0, -1).applyQuaternion(enemy.quaternion);
        enemy.position.add(enemyForward.multiplyScalar(enemySpeed));

        // Turn towards player (simplified)
        const directionToPlayer = playerPlane.position.clone().sub(enemy.position).normalize();
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1), directionToPlayer);
        enemy.quaternion.slerp(targetQuaternion, enemyTurnSpeed); // Smoothly rotate towards target

        enemy.userData.boundingBox.setFromObject(enemy); // Update bounding box
        // if (enemy.userData.boxHelper) enemy.userData.boxHelper.update(); // Update helper if exists


        // Keep enemy above ground
        if (enemy.position.y < 0.2) {
            enemy.position.y = 0.2;
        }
        // Optional: Remove enemies that fly too far away?
    }


    // --- Update Bullets & Collision Detection ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity);
        bullet.userData.boundingSphere.center.copy(bullet.position); // Update sphere center

        let bulletRemoved = false;

        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            // Check if bullet's bounding sphere intersects enemy's bounding box
            if (bullet.userData.boundingSphere.intersectsBox(enemy.userData.boundingBox)) {
                // Collision!
                scene.remove(enemy);
                // if (enemy.userData.boxHelper) scene.remove(enemy.userData.boxHelper); // Remove helper
                enemies.splice(j, 1);

                scene.remove(bullet);
                bullets.splice(i, 1);
                bulletRemoved = true;
                break; // Bullet hit one enemy, stop checking for this bullet
            }
        }

        if (bulletRemoved) continue; // Go to next bullet if this one was removed

        // Check distance traveled
        const distance = bullet.position.distanceTo(bullet.userData.startPosition);
        if (distance > bulletRange) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }

    // --- Trigger Shooting ---
    if (controls.shooting) {
        shoot();
    }

    // --- Update Camera ---
    const desiredCameraPosition = playerPlane.position.clone().add(cameraOffset.clone().applyQuaternion(playerPlane.quaternion));
    const desiredLookAt = playerPlane.position.clone().add(cameraLookAtOffset.clone().applyQuaternion(playerPlane.quaternion));
    camera.position.lerp(desiredCameraPosition, 0.1);
    camera.lookAt(desiredLookAt);

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// --- Keyboard Controls ---
function handleKeyDown(event) {
    if (event.key === ' ') event.preventDefault();

    switch (event.key.toLowerCase()) {
        case 'w': controls.throttleUp = true; break;
        case 's': controls.throttleDown = true; break;
        case 'a': controls.moveLeft = true; break;
        case 'd': controls.moveRight = true; break;
        case 'q': controls.rollLeft = true; break;
        case 'e': controls.rollRight = true; break;
        case 'arrowup': controls.pitchDown = true; break;
        case 'arrowdown': controls.pitchUp = true; break;
        case ' ': controls.shooting = true; break;
    }
}

function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w': controls.throttleUp = false; break;
        case 's': controls.throttleDown = false; break;
        case 'a': controls.moveLeft = false; break;
        case 'd': controls.moveRight = false; break;
        case 'q': controls.rollLeft = false; break;
        case 'e': controls.rollRight = false; break;
        case 'arrowup': controls.pitchDown = false; break;
        case 'arrowdown': controls.pitchUp = false; break;
        case ' ': controls.shooting = false; break;
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Start animation
animate();