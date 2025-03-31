import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'; // Import the whole module

let scene, camera, renderer, controls;
let plane, gridHelper;
const objects = []; // To store placed bricks and the plane
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let ghostBrick = null; // To hold the preview mesh

// --- Configuration ---
const gridSize = 16;
const unitSize = 1;
const brickHeight = unitSize * 0.96;
const studRadius = unitSize * 0.24; // Stud dimensions
const studHeight = unitSize * 0.17;
const planeSize = gridSize * unitSize;

// --- UI Elements ---
// const brickTypeSelect = document.getElementById('brick-type'); // Removed
// const brickColorInput = document.getElementById('brick-color'); // Removed
const container = document.getElementById('container');
const brickLibrary = document.getElementById('brick-library'); // Added
const colorPalette = document.getElementById('color-palette'); // Added

// --- State ---
let selectedBrickType = '1x2'; // Default selection, Updated default
let selectedColor = '#ff0000'; // Default color (Red)
let currentRotationY = 0; // Rotation state in radians (0, PI/2, PI, 3PI/2)

// --- Standard Lego Colors --- Added
const standardColors = [
    '#ff0000', // Red
    '#0000ff', // Blue
    '#00ff00', // Green (Bright Green)
    '#ffff00', // Yellow
    '#ffffff', // White
    '#000000', // Black
    '#ffa500', // Orange
    '#a0522d', // Brown (Sienna)
    '#808080', // Gray (Medium Stone Grey)
    '#add8e6'  // Light Blue
];

// --- Function to create detailed brick geometry ---
function createBrickGeometry(width, depth) {
    const geometries = [];

    // Main brick body
    const bodyWidth = width * unitSize;
    const bodyDepth = depth * unitSize;
    const bodyGeometry = new THREE.BoxGeometry(bodyWidth, brickHeight, bodyDepth);
    // Translate body so its base is at y=0
    bodyGeometry.translate(0, brickHeight / 2, 0);
    geometries.push(bodyGeometry);

    // Studs
    const studGeometry = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 16);
    // Position stud geometry so its base is at y=brickHeight
    studGeometry.translate(0, brickHeight + studHeight / 2, 0);

    for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
            const studInstance = studGeometry.clone();
            // Calculate stud position relative to the brick center (which is at 0,0 because of body translation)
            const studX = (x - (width - 1) / 2) * unitSize;
            const studZ = (z - (depth - 1) / 2) * unitSize;
            // Apply the relative position to the stud instance
            studInstance.translate(studX, 0, studZ);
            geometries.push(studInstance);
        }
    }

    // Merge geometries using the imported object
    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
    if (!mergedGeometry) {
        console.error("Failed to merge geometries for brick", width, depth);
        // Fallback to just the body if merge fails
        const fallbackBody = new THREE.BoxGeometry(bodyWidth, brickHeight, bodyDepth);
        fallbackBody.translate(0, brickHeight / 2, 0);
        return fallbackBody;
    }
    // No need to compute bounding sphere manually for merged BufferGeometry usually
    // mergedGeometry.computeBoundingSphere();
    return mergedGeometry;
}

// --- Brick Geometries (Cached, Detailed) ---
const brickGeometries = {
    // '1x1': createBrickGeometry(1, 1), // Removed 1x1
    '1x2': createBrickGeometry(1, 2),
    '1x3': createBrickGeometry(1, 3), // Added
    '1x4': createBrickGeometry(1, 4), // Added
    '2x2': createBrickGeometry(2, 2),
    '2x3': createBrickGeometry(2, 3), // Added
    '2x4': createBrickGeometry(2, 4), // Added
    // Add more brick types here if needed
};

let frameCount = 0; // Declare frameCount before calling animate
init();
animate();

function init() {
    console.log("Initializing scene...");

    // --- Populate Brick Library UI --- Added
    populateBrickLibrary();

    // --- Populate Color Palette UI --- Added
    populateColorPalette();

    // --- Scene ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    // --- Camera ---
    const aspect = (window.innerWidth - 200) / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(planeSize * 0.8, planeSize * 1.3, planeSize * 1.3);
    camera.lookAt(0, 0, 0);

    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 200, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    console.log("Renderer DOM element appended to container.");

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x606060, 1.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(planeSize * 0.7, planeSize * 1.5, planeSize * 0.9);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = planeSize * 5;
    const shadowCamSize = planeSize * 1.5;
    directionalLight.shadow.camera.left = -shadowCamSize;
    directionalLight.shadow.camera.right = shadowCamSize;
    directionalLight.shadow.camera.top = shadowCamSize;
    directionalLight.shadow.camera.bottom = -shadowCamSize;
    scene.add(directionalLight);
    // const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
    // scene.add( helper );

    // --- Base Plate (Plane) ---
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    // plane.position.y = -0.001; // Add a tiny offset just in case of z-fighting (optional)
    scene.add(plane);
    objects.push(plane);
    console.log("Plane added to scene at y=0");

    // --- Add Studs to Base Plate ---
    const baseStudGeometry = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 16);
    const baseStudMaterial = new THREE.MeshStandardMaterial({ color: planeMaterial.color }); // Same color as base

    // Calculate offset to center the grid of studs
    const studOffset = (planeSize - unitSize) / 2;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const stud = new THREE.Mesh(baseStudGeometry, baseStudMaterial);
            stud.position.set(
                i * unitSize - studOffset, // X position
                studHeight / 2,           // Y position (base of stud at y=0)
                j * unitSize - studOffset  // Z position
            );
            stud.castShadow = true;
            stud.receiveShadow = true; // Studs can receive shadows from bricks
            scene.add(stud);
            // Note: We don't add base studs to the 'objects' array for raycasting
            // to ensure clicks always register on the underlying plane first.
        }
    }
    console.log(`Added ${gridSize * gridSize} studs to the base plate.`);


    // --- Grid Helper ---
    gridHelper = new THREE.GridHelper(planeSize, gridSize, 0x000000, 0x888888);
    gridHelper.position.y = studHeight + 0.001; // Position grid slightly above the studs
    scene.add(gridHelper);
    console.log(`GridHelper added to scene at y=${gridHelper.position.y.toFixed(3)}`);

    // --- Controls ---
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = planeSize * 3;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;
    controls.target.set(0, 0, 0); // Explicitly set target
    controls.update();
    console.log("OrbitControls initialized.");

    // --- Ghost Brick Initialization --- Added
    const initialGhostGeometry = brickGeometries[selectedBrickType];
    const initialGhostMaterial = new THREE.MeshStandardMaterial({
        color: selectedColor,
        transparent: true,
        opacity: 0.5,
        depthWrite: false // Avoid z-fighting issues with transparency
    });
    ghostBrick = new THREE.Mesh(initialGhostGeometry, initialGhostMaterial);
    ghostBrick.visible = false; // Start hidden
    ghostBrick.castShadow = false; // Preview shouldn't cast shadows
    scene.add(ghostBrick);
    console.log("Ghost brick initialized.");

    // --- Event Listeners ---
    container.addEventListener('pointerdown', onPointerDown, false);
    container.addEventListener('pointermove', onPointerMove, false); // Added listener for ghost brick
    window.addEventListener('resize', onWindowResize);
    brickLibrary.addEventListener('click', handleBrickSelection); // Added listener for library
    colorPalette.addEventListener('click', handleColorSelection); // Added listener for palette
    window.addEventListener('keydown', onKeyDown); // Added listener for rotation key

    console.log("Initialization complete.");
}

// --- Function to populate the brick library UI --- Added
function populateBrickLibrary() {
    if (!brickLibrary) {
        console.error("Brick library element not found!");
        return;
    }
    brickLibrary.innerHTML = ''; // Clear existing previews

    const previewSize = 60; // Size of the preview canvas
    const previewPadding = 5; // Padding around the brick in the preview

    Object.keys(brickGeometries).forEach(type => {
        const geometry = brickGeometries[type];
        if (!geometry) return;

        const container = document.createElement('div');
        container.classList.add('brick-preview');
        container.dataset.type = type;
        if (type === selectedBrickType) {
            container.classList.add('selected');
        }

        const canvas = document.createElement('canvas');
        canvas.width = previewSize;
        canvas.height = previewSize;
        container.appendChild(canvas);

        // Add dimension label --- Added
        const label = document.createElement('div');
        label.classList.add('brick-label');
        label.textContent = type; // Use the type string "NxM"
        container.appendChild(label);
        // --- End Add dimension label ---

        brickLibrary.appendChild(container);

        // --- Create mini-scene for preview ---
        const previewScene = new THREE.Scene();
        previewScene.background = new THREE.Color(0xeeeeee); // Light background for preview

        const previewCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); // Aspect ratio 1

        const previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        previewRenderer.setSize(previewSize, previewSize);
        previewRenderer.setPixelRatio(window.devicePixelRatio); // For sharper previews

        // Basic lighting for preview
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        previewScene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
        pointLight.position.set(5, 10, 7);
        previewScene.add(pointLight);

        // Create brick mesh for preview
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Default red preview
        const mesh = new THREE.Mesh(geometry, material);

        // Center and scale the brick in the preview
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        mesh.position.sub(center); // Center the mesh

        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        // const scale = (previewSize / maxDim) * 0.4; // Adjust scale factor as needed - Scaling might distort studs, let's adjust camera instead

        previewScene.add(mesh);

        // Position camera to view the brick
        const distance = maxDim * 2.5; // Adjust distance multiplier as needed
        previewCamera.position.set(distance, distance * 0.8, distance);
        previewCamera.lookAt(previewScene.position); // Look at the center of the scene (where the brick is)

        // Render the preview once
        previewRenderer.render(previewScene, previewCamera);

        // Dispose of renderer resources if possible (might not be necessary for few previews)
        // previewRenderer.dispose(); // Be careful if reusing renderers
    });

    console.log("Brick library populated with 3D previews.");
}

// --- Function to handle brick selection from the library --- Added
function handleBrickSelection(event) {
    // Find the closest ancestor which is a brick-preview container
    const targetContainer = event.target.closest('.brick-preview');

    if (targetContainer) {
        const newType = targetContainer.dataset.type;
        if (newType && newType !== selectedBrickType) {
            // Update selected type
            selectedBrickType = newType;
            console.log("Selected brick type:", selectedBrickType);

            // Update UI selection state
            // Remove 'selected' from previously selected item
            const previousSelected = brickLibrary.querySelector('.brick-preview.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
            // Add 'selected' to the clicked item
            targetContainer.classList.add('selected');

            // Update the ghost brick preview
            updateGhostBrick();
        }
    }
}

// --- Function to populate the color palette UI --- Added
function populateColorPalette() {
    if (!colorPalette) {
        console.error("Color palette element not found!");
        return;
    }
    colorPalette.innerHTML = ''; // Clear existing swatches

    standardColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.classList.add('color-swatch');
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color; // Store color in data attribute

        if (color === selectedColor) {
            swatch.classList.add('selected'); // Highlight default selection
        }
        colorPalette.appendChild(swatch);
    });
    console.log("Color palette populated.");
}

// --- Function to handle color selection from the palette --- Added
function handleColorSelection(event) {
    const target = event.target;
    if (target.classList.contains('color-swatch')) {
        const newColor = target.dataset.color;
        if (newColor && newColor !== selectedColor) {
            // Update selected color
            selectedColor = newColor;
            console.log("Selected color:", selectedColor);

            // Update UI selection state
            const previousSelected = colorPalette.querySelector('.color-swatch.selected');
            if (previousSelected) {
                previousSelected.classList.remove('selected');
            }
            target.classList.add('selected');

            // Update the ghost brick preview
            updateGhostBrick();
        }
    }
}


function onWindowResize() {
    const w = window.innerWidth - 200;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

// --- Function to handle key presses (for rotation) --- Added
function onKeyDown(event) {
    // Use 'r' or 'R' to rotate
    if (event.key === 'r' || event.key === 'R') {
        currentRotationY += Math.PI / 2; // Add 90 degrees
        // Wrap rotation around 360 degrees (2 * PI)
        if (currentRotationY >= Math.PI * 2) {
            currentRotationY -= Math.PI * 2;
        }
        // Alternatively, using modulo (handle potential floating point inaccuracies if needed)
        // currentRotationY = (currentRotationY + Math.PI / 2) % (Math.PI * 2);
        console.log(`Brick rotation set to: ${(currentRotationY * 180 / Math.PI).toFixed(0)} degrees`);
        // Update the ghost brick preview to reflect the new rotation
        updateGhostBrick();
    }
}

// --- Function to handle mouse movement for ghost brick --- Added
function onPointerMove(event) {
    if (!ghostBrick) return; // Exit if ghostBrick isn't initialized yet

    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const clickedObject = intersect.object;
        const clickPoint = intersect.point;
        const faceNormal = intersect.face ? intersect.face.normal.clone().applyQuaternion(clickedObject.quaternion) : null;

        let targetBaseY = -Infinity; // Default to invalid

        if (clickedObject === plane) {
            // Hovering over the base plane
            targetBaseY = 0;
        } else if (clickedObject.isMesh && clickedObject !== plane && faceNormal && faceNormal.y > 0.9) {
            // Hovering over the top face of an existing brick
            targetBaseY = clickedObject.position.y + brickHeight;
        }

        if (targetBaseY > -Infinity) {
            // Valid placement spot found, update ghost brick

            // --- Calculate Snapping Position (same logic as placeBrick) ---
            const dimensions = selectedBrickType.split('x').map(Number);
            const originalWidthUnits = dimensions[0] || 1;
            const originalDepthUnits = dimensions[1] || 1;

            let effectiveWidthUnits = originalWidthUnits;
            let effectiveDepthUnits = originalDepthUnits;
            const ninetyDeg = Math.PI / 2;
            const twoSeventyDeg = 3 * Math.PI / 2;
            const tolerance = 0.01;
            if (Math.abs(currentRotationY - ninetyDeg) < tolerance || Math.abs(currentRotationY - twoSeventyDeg) < tolerance) {
                effectiveWidthUnits = originalDepthUnits;
                effectiveDepthUnits = originalWidthUnits;
            }

            const gridX = Math.floor((clickPoint.x + planeSize / 2) / unitSize);
            const gridZ = Math.floor((clickPoint.z + planeSize / 2) / unitSize);

            const cornerX = (gridX * unitSize) - (planeSize / 2);
            const cornerZ = (gridZ * unitSize) - (planeSize / 2);

            const snappedX = cornerX + (effectiveWidthUnits * unitSize / 2);
            const snappedZ = cornerZ + (effectiveDepthUnits * unitSize / 2);

            // Update ghost brick position and rotation
            ghostBrick.position.set(snappedX, targetBaseY, snappedZ);
            ghostBrick.rotation.y = currentRotationY;
            ghostBrick.visible = true;
        } else {
            // Invalid placement spot (e.g., side of a brick)
            ghostBrick.visible = false;
        }

    } else {
        // No intersection (mouse is not over any object)
        ghostBrick.visible = false;
    }
}

// --- Helper function to update ghost brick appearance --- Added
function updateGhostBrick() {
    if (!ghostBrick) return;

    const newGeometry = brickGeometries[selectedBrickType];
    if (!newGeometry) {
        console.error("Invalid geometry for ghost brick type:", selectedBrickType);
        ghostBrick.visible = false; // Hide if geometry is bad
        return;
    }

    // Update geometry
    ghostBrick.geometry.dispose(); // Dispose old geometry to prevent memory leaks
    ghostBrick.geometry = newGeometry;

    // Update material color (keep transparency settings)
    ghostBrick.material.color.set(selectedColor);

    // Apply current rotation (position is handled by onPointerMove)
    ghostBrick.rotation.y = currentRotationY;

    // Visibility is handled by onPointerMove, but ensure it's potentially visible
    // if the mouse happens to be over a valid spot already.
    // We might need to trigger a synthetic pointermove event or recalculate here,
    // but for now, let's rely on the next mouse move.
    console.log("Ghost brick updated for type:", selectedBrickType, " color:", selectedColor, " rotation:", (currentRotationY * 180 / Math.PI).toFixed(0));
}

function onPointerDown(event) {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    // Intersect with all objects (plane and bricks). 'false' means don't check descendants.
    const intersects = raycaster.intersectObjects(objects, false);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const clickedObject = intersect.object;
        const clickPoint = intersect.point;
        // We need face normals to determine if we clicked the top of a brick
        const faceNormal = intersect.face ? intersect.face.normal.clone().applyQuaternion(clickedObject.quaternion) : null;

        // Stop controls from moving camera if we interact with the scene
        event.stopPropagation();

        if (clickedObject === plane) {
            // Clicked on the base plane, place brick at base level (Y=0)
            console.log("Clicked on plane");
            placeBrick(clickPoint, 0); // Target base Y = 0
        } else if (clickedObject.isMesh && clickedObject !== plane && faceNormal && faceNormal.y > 0.9) {
            // Clicked on the top face (normal points mostly up) of an existing brick
            console.log("Clicked on top of brick at y=", clickedObject.position.y);
            // Target base Y is the top surface of the clicked brick.
            // Since brick geometry base is at y=0 relative to the mesh, the top is at y=brickHeight.
            // The world position of the top surface is brick.position.y + brickHeight.
            const targetBaseY = clickedObject.position.y + brickHeight;
            placeBrick(clickPoint, targetBaseY);
        } else {
            // Clicked on the side of a brick or something else unexpected
            console.log("Clicked on side of brick or unknown object", faceNormal ? `Normal: (${faceNormal.x.toFixed(1)}, ${faceNormal.y.toFixed(1)}, ${faceNormal.z.toFixed(1)})` : "");
        }
    }
}

// Uses the detailed brickGeometries cache
// Accepts position (click point) and targetBaseY (the Y level where the base of the new brick should sit)
function placeBrick(position, targetBaseY) {
    // const brickType = brickTypeSelect.value; // Changed
    const brickType = selectedBrickType; // Use the state variable
    const color = selectedColor; // Use the state variable for color

    const geometry = brickGeometries[brickType]; // Use the detailed geometry
    if (!geometry) {
        console.error("Invalid brick type selected:", brickType);
        return;
    }

    const material = new THREE.MeshStandardMaterial({ color: color });
    const brick = new THREE.Mesh(geometry, material);
    brick.castShadow = true;
    brick.receiveShadow = true;

    // Apply current rotation BEFORE calculating snapped position
    brick.rotation.y = currentRotationY;

    // --- Calculate Snapping Position (considering rotation) ---
    // Parse dimensions from brickType string (e.g., "2x4")
    const dimensions = brickType.split('x').map(Number);
    const originalWidthUnits = dimensions[0] || 1;
    const originalDepthUnits = dimensions[1] || 1;

    // Determine effective dimensions based on rotation (approximate check for 90/270 deg)
    let effectiveWidthUnits = originalWidthUnits;
    let effectiveDepthUnits = originalDepthUnits;
    // Check if rotation is close to 90 or 270 degrees
    const ninetyDeg = Math.PI / 2;
    const twoSeventyDeg = 3 * Math.PI / 2;
    const tolerance = 0.01; // Small tolerance for float comparison
    if (Math.abs(currentRotationY - ninetyDeg) < tolerance || Math.abs(currentRotationY - twoSeventyDeg) < tolerance) {
        effectiveWidthUnits = originalDepthUnits; // Swap dimensions
        effectiveDepthUnits = originalWidthUnits;
    }

    // Calculate grid cell index based on click position
    const gridX = Math.floor((position.x + planeSize / 2) / unitSize);
    const gridZ = Math.floor((position.z + planeSize / 2) / unitSize);

    // Calculate the snapped center position of the brick using effective dimensions
    // The center offset depends on whether the effective dimension is odd or even
    const offsetX = (effectiveWidthUnits % 2 === 0) ? 0 : 0.5 * unitSize;
    const offsetZ = (effectiveDepthUnits % 2 === 0) ? 0 : 0.5 * unitSize;

    // Calculate the corner position based on grid index
    const cornerX = (gridX * unitSize) - (planeSize / 2);
    const cornerZ = (gridZ * unitSize) - (planeSize / 2);

    // Calculate snapped center position
    const snappedX = cornerX + (effectiveWidthUnits * unitSize / 2); // Center based on effective width
    const snappedZ = cornerZ + (effectiveDepthUnits * unitSize / 2); // Center based on effective depth

    // Set brick position using the calculated snapped X/Z and the provided targetBaseY
    // The geometry's base is at y=0 relative to the mesh, so setting position.y = targetBaseY places the base correctly.
    brick.position.set(snappedX, targetBaseY, snappedZ);

    console.log(`Placing detailed ${brickType} rotated by ${(currentRotationY * 180 / Math.PI).toFixed(0)} deg at world (${snappedX.toFixed(2)}, ${targetBaseY.toFixed(2)}, ${snappedZ.toFixed(2)})`);

    // TODO: Check for collisions (needs to be more sophisticated with rotation)

    scene.add(brick);
    objects.push(brick); // Add brick for future raycasting
}


function animate() {
    requestAnimationFrame(animate);

    // Log only occasionally to avoid flooding console
    if (frameCount % 300 === 0) { // Log every 300 frames (roughly every 5 seconds)
        // console.log(`Animate loop running (frame ${frameCount}).`); // Commented out for less noise
    }
    frameCount++;

    controls.update(); // Update controls first
    renderer.render(scene, camera); // Then render the scene
}