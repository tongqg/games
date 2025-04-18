import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'; // Import the whole module

let scene, camera, renderer, controls;
let plane, gridHelper;
const objects = []; // To store placed bricks and the plane for raycasting
const placedBricksHistory = []; // To store placed bricks for undo functionality
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let ghostBrick = null; // To hold the preview mesh
let joystickThumb = null; // Added for visualizer
let brickPreviewData = {}; // Added to store preview scene data { scene, camera, renderer, mesh }
 
 // --- Virtual Joystick State --- Added
 let isJoystickDragging = false;
let joystickStartX = 0;
let joystickStartY = 0;
let joystickVector = { x: 0, y: 0 }; // Normalized vector (-1 to 1)
const joystickBaseRadius = 40; // Half the width/height of #joystick-visualizer (80px / 2)
const joystickThumbRadius = 15; // Half the width/height of #joystick-thumb (30px / 2)
const virtualJoystickRotationSpeed = 0.03; // Sensitivity for virtual joystick rotation
 
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
const undoButton = document.getElementById('undo-button'); // Added for undo

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
    controls.enableRotate = false; // Disable mouse/touch rotation
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
 
    // --- Get References for Virtual Joystick --- Added
    const joystickVisualizer = document.getElementById('joystick-visualizer');
    joystickThumb = document.getElementById('joystick-thumb');
 
    // --- Add Virtual Joystick Event Listeners --- Added
    if (joystickVisualizer) {
        joystickVisualizer.addEventListener('pointerdown', joystickPointerDown, false);
        // Add move/up listeners to the window to capture events even if pointer leaves the joystick area
        window.addEventListener('pointermove', joystickPointerMove, false);
        window.addEventListener('pointerup', joystickPointerUp, false);
        window.addEventListener('pointercancel', joystickPointerUp, false); // Treat cancel like up
    } else {
        console.error("Joystick visualizer element not found!");
    }

    // --- Add Undo Button Listener --- Added
    if (undoButton) {
        undoButton.addEventListener('click', undoLastBrick);
    } else {
        console.error("Undo button element not found!");
    }
    // --- End Undo Button Listener ---

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
 
        // --- Store preview data for later updates --- Added
        brickPreviewData[type] = {
            scene: previewScene,
            camera: previewCamera,
            renderer: previewRenderer,
            mesh: mesh
        };
 
        // Render the preview once (with initial color)
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
 
            // --- Update Brick Library Previews --- Added
            for (const type in brickPreviewData) {
                const data = brickPreviewData[type];
                if (data && data.mesh && data.mesh.material) {
                    data.mesh.material.color.set(selectedColor);
                    data.renderer.render(data.scene, data.camera); // Re-render this preview
                }
            }
            // --- End Update Previews ---
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

// --- Helper function to calculate brick footprint in grid coordinates ---
function getBrickFootprint(brick) {
    const position = brick.position;
    const rotationY = brick.rotation.y;
    // Attempt to find the brick type string by comparing geometry references
    const brickType = Object.keys(brickGeometries).find(key => brick.geometry === brickGeometries[key]);
    if (!brickType) {
        console.warn("Could not determine brick type from geometry for footprint calculation.", brick);
        return null; // Cannot calculate footprint without type
    }

    const dimensions = brickType.split('x').map(Number);
    const originalWidthUnits = dimensions[0] || 1;
    const originalDepthUnits = dimensions[1] || 1;

    let effectiveWidthUnits = originalWidthUnits;
    let effectiveDepthUnits = originalDepthUnits;
    const ninetyDeg = Math.PI / 2;
    const twoSeventyDeg = 3 * Math.PI / 2;
    const tolerance = 0.01;
    if (Math.abs(rotationY - ninetyDeg) < tolerance || Math.abs(rotationY - twoSeventyDeg) < tolerance) {
        effectiveWidthUnits = originalDepthUnits;
        effectiveDepthUnits = originalWidthUnits;
    }

    const halfWidthWorld = effectiveWidthUnits * unitSize / 2;
    const halfDepthWorld = effectiveDepthUnits * unitSize / 2;

    // Calculate world bounds
    const minXWorld = position.x - halfWidthWorld;
    const maxXWorld = position.x + halfWidthWorld;
    const minZWorld = position.z - halfDepthWorld;
    const maxZWorld = position.z + halfDepthWorld;

    // Convert world bounds to grid indices
    // Add planeSize / 2 to shift origin from (-planeSize/2, -planeSize/2) to (0,0) before dividing by unitSize
    const minGridX = Math.floor((minXWorld + planeSize / 2) / unitSize);
    const maxGridX = Math.floor((maxXWorld - 0.001 + planeSize / 2) / unitSize); // Epsilon for edge cases
    const minGridZ = Math.floor((minZWorld + planeSize / 2) / unitSize);
    const maxGridZ = Math.floor((maxZWorld - 0.001 + planeSize / 2) / unitSize); // Epsilon for edge cases

    return { minGridX, maxGridX, minGridZ, maxGridZ };
}


// --- Helper function to calculate correct placement height considering overlaps ---
function calculatePlacementHeight(snappedX, snappedZ, effectiveWidthUnits, effectiveDepthUnits) {
    const halfWidthWorld = effectiveWidthUnits * unitSize / 2;
    const halfDepthWorld = effectiveDepthUnits * unitSize / 2;

    // Calculate potential new brick's world bounds
    const newMinXWorld = snappedX - halfWidthWorld;
    const newMaxXWorld = snappedX + halfWidthWorld;
    const newMinZWorld = snappedZ - halfDepthWorld;
    const newMaxZWorld = snappedZ + halfDepthWorld;

    // Convert to grid indices for the new brick
    const newMinGridX = Math.floor((newMinXWorld + planeSize / 2) / unitSize);
    const newMaxGridX = Math.floor((newMaxXWorld - 0.001 + planeSize / 2) / unitSize);
    const newMinGridZ = Math.floor((newMinZWorld + planeSize / 2) / unitSize);
    const newMaxGridZ = Math.floor((newMaxZWorld - 0.001 + planeSize / 2) / unitSize);

    let maxOverlappingY = -Infinity;

    objects.forEach(obj => {
        if (obj.isMesh && obj !== plane) { // Check only existing bricks
            const existingFootprint = getBrickFootprint(obj);
            if (!existingFootprint) return; // Skip if footprint calculation failed

            // Check for overlap using grid indices
            const overlaps =
                newMinGridX <= existingFootprint.maxGridX &&
                newMaxGridX >= existingFootprint.minGridX &&
                newMinGridZ <= existingFootprint.maxGridZ &&
                newMaxGridZ >= existingFootprint.minGridZ;

            if (overlaps) {
                maxOverlappingY = Math.max(maxOverlappingY, obj.position.y);
            }
        }
    });

    // If overlap found, place on top; otherwise, place on base (Y=0)
    return maxOverlappingY > -Infinity ? maxOverlappingY + brickHeight : 0;
}


function onPointerDown(event) {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(objects, false); // Intersect plane and bricks

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const clickPoint = intersect.point; // Use the precise click point for grid calculation

        // Stop controls from moving camera if we interact with the scene
        event.stopPropagation();

        // --- Calculate potential placement details ---
        const brickType = selectedBrickType;
        const dimensions = brickType.split('x').map(Number);
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

        // Calculate grid cell index based on click position
        const gridX = Math.floor((clickPoint.x + planeSize / 2) / unitSize);
        const gridZ = Math.floor((clickPoint.z + planeSize / 2) / unitSize);

        // Calculate the snapped center position of the brick
        const cornerX = (gridX * unitSize) - (planeSize / 2);
        const cornerZ = (gridZ * unitSize) - (planeSize / 2);
        const snappedX = cornerX + (effectiveWidthUnits * unitSize / 2);
        const snappedZ = cornerZ + (effectiveDepthUnits * unitSize / 2);

        // --- Determine the correct placement height using the new helper ---
        const targetBaseY = calculatePlacementHeight(snappedX, snappedZ, effectiveWidthUnits, effectiveDepthUnits);

        console.log(`Attempting placement. Snapped Center: (${snappedX.toFixed(2)}, ${snappedZ.toFixed(2)}), Calculated Target Y: ${targetBaseY.toFixed(2)}`);

        // --- Place the brick using the calculated height ---
        // Pass the original clickPoint for potential use inside placeBrick, but the Y is now correct.
        placeBrick(clickPoint, targetBaseY);

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
    placedBricksHistory.push(brick); // Add to history for undo
}
// --- Function to undo the last placed brick --- Added
function undoLastBrick() {
    if (placedBricksHistory.length === 0) {
        console.log("No bricks to undo.");
        return;
    }

    const lastBrick = placedBricksHistory.pop(); // Remove from history

    // Remove from scene
    scene.remove(lastBrick);

    // Remove from raycasting objects array
    const indexInObjects = objects.indexOf(lastBrick);
    if (indexInObjects > -1) {
        objects.splice(indexInObjects, 1);
    }

    // Optional: Dispose geometry and material if needed for memory management
    // Note: Be careful with disposing if geometries/materials are shared or reused.
    // In this simple case, assuming unique instances per placed brick.
    if (lastBrick.geometry) lastBrick.geometry.dispose();
    if (lastBrick.material) lastBrick.material.dispose();

    console.log("Undid last brick placement.");
    // No need to update ghost brick here, it updates on mouse move
}
// --- End Undo Function ---

// --- Virtual Joystick Event Handlers --- Added
// --- Virtual Joystick Event Handlers --- Added

function getPointerPosition(event) {
    // Helper to get consistent clientX/clientY for mouse and touch
    if (event.changedTouches && event.changedTouches.length > 0) {
        return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
}

function joystickPointerDown(event) {
    const joystickVisualizer = event.currentTarget; // The element the listener is attached to
    joystickVisualizer.setPointerCapture(event.pointerId); // Capture pointer events
    isJoystickDragging = true;
    const pos = getPointerPosition(event);
    joystickStartX = pos.x;
    joystickStartY = pos.y;
    joystickVisualizer.style.cursor = 'grabbing'; // Change cursor
    // console.log("Joystick Down");
    // Prevent default behavior like text selection or page scrolling on touch
    event.preventDefault();
}

function joystickPointerMove(event) {
    if (!isJoystickDragging) return;

    const joystickVisualizer = document.getElementById('joystick-visualizer'); // Need the element ref
    if (!joystickVisualizer) return;

    const rect = joystickVisualizer.getBoundingClientRect();
    const centerX = rect.left + joystickBaseRadius; // Center X of the base
    const centerY = rect.top + joystickBaseRadius;  // Center Y of the base

    const pos = getPointerPosition(event);
    let deltaX = pos.x - centerX;
    let deltaY = pos.y - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = joystickBaseRadius - joystickThumbRadius; // Max distance thumb can move from center

    // Clamp the thumb position within the base
    if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * maxDistance;
        deltaY = Math.sin(angle) * maxDistance;
    }

    // Update thumb visual position (relative to base center)
    if (joystickThumb) {
        joystickThumb.style.left = `calc(50% + ${deltaX}px)`;
        joystickThumb.style.top = `calc(50% + ${deltaY}px)`;
    }

    // Update normalized joystick vector for rotation control
    joystickVector.x = deltaX / maxDistance;
    joystickVector.y = deltaY / maxDistance; // We might only use X for rotation

    // console.log(`Joystick Move: x=${joystickVector.x.toFixed(2)}, y=${joystickVector.y.toFixed(2)}`);
    event.preventDefault(); // Prevent scrolling while dragging joystick
}

function joystickPointerUp(event) {
    if (!isJoystickDragging) return;

    const joystickVisualizer = document.getElementById('joystick-visualizer');
    if (joystickVisualizer) {
        joystickVisualizer.releasePointerCapture(event.pointerId);
        joystickVisualizer.style.cursor = 'grab'; // Reset cursor
    }

    isJoystickDragging = false;
    joystickVector.x = 0;
    joystickVector.y = 0;

    // Reset thumb position to center
    if (joystickThumb) {
        joystickThumb.style.left = '50%';
        joystickThumb.style.top = '50%';
    }
    // console.log("Joystick Up");
}

// --- End Virtual Joystick Event Handlers ---


function animate() {
    requestAnimationFrame(animate);

    // Log only occasionally to avoid flooding console
    if (frameCount % 300 === 0) { // Log every 300 frames (roughly every 5 seconds)
        // console.log(`Animate loop running (frame ${frameCount}).`); // Commented out for less noise
    }
    frameCount++;
 
    // --- Apply Virtual Joystick Rotation & Tilt --- Updated
    if (joystickVector.x !== 0 || joystickVector.y !== 0) {
        const target = controls.target;
        const offset = camera.position.clone().sub(target);
 
        // Calculate current spherical coordinates
        const distance = offset.length();
        let theta = Math.atan2(offset.x, offset.z); // Azimuthal angle
        let phi = Math.acos(offset.y / distance);   // Polar angle (from +Y)
 
        // Calculate change based on joystick input
        const deltaTheta = -joystickVector.x * virtualJoystickRotationSpeed;
        const deltaPhi = joystickVector.y * virtualJoystickRotationSpeed; // Positive Y = move down
 
        // Apply changes
        theta += deltaTheta;
        phi += deltaPhi;
 
        // Clamp polar angle (phi)
        const minPolarAngle = 0.1; // Prevent looking straight down
        const maxPolarAngle = Math.PI / 2 - 0.01; // Prevent going below horizon
        phi = Math.max(minPolarAngle, Math.min(maxPolarAngle, phi));
 
        // Calculate new offset vector from spherical coordinates
        offset.x = distance * Math.sin(phi) * Math.sin(theta);
        offset.y = distance * Math.cos(phi);
        offset.z = distance * Math.sin(phi) * Math.cos(theta);
 
        // Apply new position
        camera.position.copy(target).add(offset);
    }
 
    controls.update(); // Update controls (handles damping, zoom, AND camera lookAt target)
    renderer.render(scene, camera); // Render the scene
}