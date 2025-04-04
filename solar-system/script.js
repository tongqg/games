import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Helper Function to Create Text Sprites ---
function createTextSprite(message, parameters) {
    const fontface = parameters.fontface || 'Arial';
    const fontsize = parameters.fontsize || 18;
    const borderThickness = parameters.borderThickness || 2;
    const borderColor = parameters.borderColor || { r: 0, g: 0, b: 0, a: 1.0 };
    const backgroundColor = parameters.backgroundColor || { r: 255, g: 255, b: 255, a: 0.0 }; // Transparent background
    const textColor = parameters.textColor || { r: 0, g: 0, b: 0, a: 1.0 }; // Black text for white background

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `Bold ${fontsize}px ${fontface}`;

    // Get text metrics
    const metrics = context.measureText(message);
    const textWidth = metrics.width;

    // Background
    context.fillStyle = `rgba(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${backgroundColor.a})`;
    // Border
    context.strokeStyle = `rgba(${borderColor.r}, ${borderColor.g}, ${borderColor.b}, ${borderColor.a})`;
    context.lineWidth = borderThickness;

    // Draw rounded rectangle (optional, for background/border)
    // roundRect(context, borderThickness / 2, borderThickness / 2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);

    // Text color
    context.fillStyle = `rgba(${textColor.r}, ${textColor.g}, ${textColor.b}, ${textColor.a})`;
    context.fillText(message, borderThickness, fontsize + borderThickness);

    // Canvas texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Scale sprite based on text size
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize); // Adjust scaling as needed
    return sprite;
}

// --- Basic Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - 60), 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const sceneContainer = document.getElementById('scene-container');

renderer.setClearColor(0xffffff); // Set background to white
renderer.setSize(window.innerWidth, window.innerHeight - 60);
sceneContainer.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x666666); // Slightly brighter ambient for white bg
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 2, 600); // Adjust intensity/range if needed
scene.add(pointLight);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 500;

// --- Sun ---
const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 }); // Slightly less intense yellow
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);
pointLight.position.set(0, 0, 0);

// --- Planets Data (Colors) ---
const planetsData = [
    // name, radius, distance, color, orbitalPeriod (Earth days)
    { name: 'Mercury', radius: 0.5, distance: 10, color: 0x999999, orbitalPeriod: 88 },
    { name: 'Venus', radius: 0.8, distance: 15, color: 0xffe4b5, orbitalPeriod: 225 },
    { name: 'Earth', radius: 1, distance: 20, color: 0x4682b4, orbitalPeriod: 365 },
    { name: 'Mars', radius: 0.7, distance: 25, color: 0xff7f50, orbitalPeriod: 687 },
    { name: 'Jupiter', radius: 3, distance: 40, color: 0xdeb887, orbitalPeriod: 4333 },
    { name: 'Saturn', radius: 2.5, distance: 55, color: 0xf4a460, orbitalPeriod: 10759, ringColor: 0xcccccc },
    { name: 'Uranus', radius: 1.8, distance: 70, color: 0xadd8e6, orbitalPeriod: 30687 },
    { name: 'Neptune', radius: 1.7, distance: 85, color: 0x4169e1, orbitalPeriod: 60190 }
];

const planetMeshes = [];
const planetOrbits = [];
const planetLabels = []; // Array to hold label sprites

planetsData.forEach(pData => {
    // Planet Mesh
    const geometry = new THREE.SphereGeometry(pData.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        color: pData.color,
        roughness: 0.8,
        metalness: 0.2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = pData;
    scene.add(mesh);
    planetMeshes.push(mesh);

    // Orbit Line
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absellipse(0, 0, pData.distance, pData.distance, 0, Math.PI * 2, false).getPoints(100)
    );
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.7 });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = Math.PI / 2;
    scene.add(orbitLine);
    planetOrbits.push(orbitLine);

    // Saturn's Ring (Colored)
    if (pData.ringColor) {
        const ringGeometry = new THREE.RingGeometry(pData.radius * 1.2, pData.radius * 2.2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: pData.ringColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.rotation.y = 0.2;
        mesh.add(ringMesh); // Add ring as child
    }

    // Planet Label Sprite
    const labelSprite = createTextSprite(pData.name, {
        fontsize: 32, // Adjust size as needed
        textColor: { r: 0, g: 0, b: 0, a: 1.0 }, // Black text
        // borderColor: { r: 0, g: 0, b: 0, a: 1.0 }, // Optional border
        // borderThickness: 1
    });
    labelSprite.position.set(0, pData.radius + 2, 0); // Position slightly above the planet (relative to planet)
    mesh.add(labelSprite); // Add label as child of planet mesh
    planetLabels.push(labelSprite); // Keep track if needed later, though adding as child handles position
});

// --- Date Input & Position Calculation ---
const dateInput = document.getElementById('date-input');
let baseDate = new Date(2020, 0, 1); // More recent base date for better accuracy
let currentDate = new Date();

function updatePlanetPositions(targetDate) {
    const timeDiff = targetDate.getTime() - baseDate.getTime();
    const daysPassed = timeDiff / (1000 * 60 * 60 * 24);

    planetMeshes.forEach(mesh => {
        const pData = mesh.userData;
        const angle = (2 * Math.PI * daysPassed / pData.orbitalPeriod) % (2 * Math.PI);
        mesh.position.x = Math.cos(angle) * pData.distance;
        mesh.position.z = Math.sin(angle) * pData.distance;
        // Label position is updated automatically as it's a child of the mesh
    });
}

dateInput.addEventListener('change', (event) => {
    currentDate = new Date(event.target.value);
    currentDate.setHours(12, 0, 0, 0);
    updatePlanetPositions(currentDate);
});

dateInput.valueAsDate = currentDate;
updatePlanetPositions(currentDate);

// --- Camera Position ---
camera.position.set(0, 70, 120);
camera.lookAt(scene.position);

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    planetMeshes.forEach(mesh => {
        mesh.rotation.y += 0.005;
    });
    sunMesh.rotation.y += 0.001;

    controls.update();
    renderer.render(scene, camera);
}

// --- Resize Handler ---
window.addEventListener('resize', () => {
    const newHeight = window.innerHeight - 60;
    camera.aspect = window.innerWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, newHeight);
});

// --- Start Animation ---
animate();

// Optional: Helper function for rounded rectangle (if using borders/backgrounds)
// function roundRect(ctx, x, y, w, h, r) {
//     ctx.beginPath();
//     ctx.moveTo(x + r, y);
//     ctx.lineTo(x + w - r, y);
//     ctx.quadraticCurveTo(x + w, y, x + w, y + r);
//     ctx.lineTo(x + w, y + h - r);
//     ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
//     ctx.lineTo(x + r, y + h);
//     ctx.quadraticCurveTo(x, y + h, x, y + h - r);
//     ctx.lineTo(x, y + r);
//     ctx.quadraticCurveTo(x, y, x + r, y);
//     ctx.closePath();
//     ctx.fill();
//     ctx.stroke();
// }