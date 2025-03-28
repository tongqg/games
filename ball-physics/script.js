// 初始化物理引擎
const Engine = Matter.Engine,
    Render = Matter.Render,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Events = Matter.Events,
    Body = Matter.Body;

// 创建引擎和渲染器
const engine = Engine.create();
const world = engine.world;
const render = Render.create({
    element: document.body,
    engine: engine,
    canvas: document.getElementById('gameCanvas'),
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#f0f0f0' // Match body background
    }
});

// --- Game State ---
let currentLevel = 0;
let isDrawing = false;
let startPos = null;
let planks = [];
const levelDisplay = document.getElementById('level');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// --- Level Configurations ---
const levels = [
    { ballStart: { x: 100, y: 100 }, holePos: { x: 700, y: 550 }, ballRadius: 20, holeRadius: 30 }, // Level 1
    { ballStart: { x: 700, y: 100 }, holePos: { x: 100, y: 550 }, ballRadius: 20, holeRadius: 30 }, // Level 2
    { ballStart: { x: 400, y: 50 }, holePos: { x: 400, y: 550 }, ballRadius: 15, holeRadius: 25 },  // Level 3
    { ballStart: { x: 50, y: 500 }, holePos: { x: 750, y: 100 }, ballRadius: 25, holeRadius: 35 }   // Level 4
];

// --- Game Objects ---
// Create objects with initial placeholder positions/sizes
const ball = Bodies.circle(0, 0, 20, {
    restitution: 0.7,
    render: { fillStyle: '#F35e66' }
});
const hole = Bodies.circle(0, 0, 30, {
    isStatic: true,
    isSensor: true, // Detect collision without physical interaction
    render: { fillStyle: '#4CAF50', opacity: 0.8 }
});

// Create boundaries (slightly inside canvas)
const wallOptions = { isStatic: true, render: { fillStyle: '#333' } };
const walls = [
    Bodies.rectangle(400, 0, 800, 10, wallOptions),   // Top
    Bodies.rectangle(400, 600, 800, 10, wallOptions), // Bottom
    Bodies.rectangle(0, 300, 10, 600, wallOptions),   // Left
    Bodies.rectangle(800, 300, 10, 600, wallOptions)  // Right
];
Composite.add(world, [ball, hole, ...walls]);

// --- Mouse Interaction for Drawing ---
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, { // Keep for potential future interaction? Or remove if only drawing.
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});
// Composite.add(world, mouseConstraint); // Disable direct object dragging
render.mouse = mouse; // Still needed for coordinates

// --- Plank Drawing Logic ---
function clearPlanks() {
    Composite.remove(world, planks);
    planks = [];
}

// Helper to get position from mouse or touch event
function getEventPosition(event) {
    // Get canvas bounding box once
    const rect = render.canvas.getBoundingClientRect();

    if (event.touches && event.touches.length > 0) {
        const touch = event.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        // Use changedTouches for touchend
        const touch = event.changedTouches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    } else if (event.clientX !== undefined && event.clientY !== undefined) {
         // Standard mouse event properties
         return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    } else {
        // Fallback or if using Matter's mouse object directly elsewhere
        return { x: mouse.position.x, y: mouse.position.y };
    }
}

let lastMovePos = null; // Store the last position during move for preview

function handleDown(position) {
    // Only allow drawing if the engine is not running (before clicking start)
    if (engine.enabled) return;
    isDrawing = true;
    startPos = position;
    lastMovePos = position; // Initialize lastMovePos
}

function handleMove(position) {
    if (!isDrawing || engine.enabled) return;
    lastMovePos = position; // Update last position on move
    // The actual drawing preview happens in 'afterRender'
}

function handleUp(position) {
    if (!isDrawing || engine.enabled) return;
    isDrawing = false;
    const endPos = position;

    if (!startPos) return; // Should not happen, but safety check

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const plankHeight = 10; // Fixed height for planks

    // Ensure minimum length
    if (length > 10) {
        const centerX = (startPos.x + endPos.x) / 2;
        const centerY = (startPos.y + endPos.y) / 2;

        const plank = Bodies.rectangle(centerX, centerY, length, plankHeight, {
            isStatic: true,
            angle: angle, // Use calculated angle
            friction: 0.5,
            render: { fillStyle: '#654321' } // Brown planks
        });
        planks.push(plank);
        Composite.add(world, plank);
    }
    startPos = null;
    lastMovePos = null; // Reset last move position
}

// --- Event Listeners ---
// Mouse Events
render.canvas.addEventListener('mousedown', (event) => {
    const position = getEventPosition(event);
    // Update Matter's mouse position manually for consistency if needed elsewhere
    Mouse.setOffset(mouse, { x: position.x - mouse.offset.x, y: position.y - mouse.offset.y }); // Adjust offset based on click
    Mouse.setAbsolute(mouse, position); // Set absolute position
    handleDown(position);
});

render.canvas.addEventListener('mousemove', (event) => {
    const position = getEventPosition(event);
    Mouse.setAbsolute(mouse, position); // Keep Matter's mouse updated
    handleMove(position);
});

render.canvas.addEventListener('mouseup', (event) => {
    const position = getEventPosition(event);
    Mouse.setAbsolute(mouse, position); // Update on mouseup too
    handleUp(position);
});

// Touch Events
render.canvas.addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevent scrolling/zooming
    const position = getEventPosition(event);
    // Removed Matter.Mouse updates
    // Mouse.setOffset(mouse, { x: position.x - mouse.offset.x, y: position.y - mouse.offset.y });
    // Mouse.setAbsolute(mouse, position);
    handleDown(position);
}, { passive: false }); // Need passive: false to call preventDefault

render.canvas.addEventListener('touchmove', (event) => {
    event.preventDefault(); // Prevent scrolling/zooming
    const position = getEventPosition(event);
    // Removed Matter.Mouse update
    // Mouse.setAbsolute(mouse, position);
    handleMove(position);
}, { passive: false });

render.canvas.addEventListener('touchend', (event) => {
    event.preventDefault(); // Prevent potential unwanted actions
    const position = getEventPosition(event);
    // Removed Matter.Mouse update
    // Mouse.setAbsolute(mouse, position);
    handleUp(position);
}, { passive: false });


// --- Visual Feedback for Drawing ---
Events.on(render, 'afterRender', () => {
    if (isDrawing && startPos && lastMovePos) { // Check lastMovePos too
        const context = render.context;
        const endPos = lastMovePos; // Use the stored last position

        context.beginPath();
        context.moveTo(startPos.x, startPos.y);
        // Draw directly to the last known pointer position
        context.lineTo(endPos.x, endPos.y);
        context.strokeStyle = 'rgba(101, 67, 33, 0.5)'; // Semi-transparent brown
        context.lineWidth = 10; // Match plank height
        context.lineCap = 'round'; // Nicer ends for angled lines
        context.stroke();
    }
});


// --- Level Loading ---
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        alert('Congratulations! You completed all levels!');
        currentLevel = 0; // Restart from level 1
    } else {
        currentLevel = levelIndex;
    }

    const levelData = levels[currentLevel];
    levelDisplay.textContent = `关卡 ${currentLevel + 1}`;

    // Reset game state
    engine.enabled = false; // Stop physics
    clearPlanks();          // Remove old planks

    // Update ball properties
    Body.setStatic(ball, true); // Make ball static initially
    Body.setPosition(ball, levelData.ballStart);
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);
    // Update ball size (optional, based on level data)
    const scaleFactorBall = levelData.ballRadius / ball.circleRadius;
    Body.scale(ball, scaleFactorBall, scaleFactorBall);
    ball.circleRadius = levelData.ballRadius; // Update internal radius tracking

    // Update hole properties
    Body.setPosition(hole, levelData.holePos);
    // Update hole size (optional, based on level data)
     const scaleFactorHole = levelData.holeRadius / hole.circleRadius;
    Body.scale(hole, scaleFactorHole, scaleFactorHole);
    hole.circleRadius = levelData.holeRadius; // Update internal radius tracking


    // Show start screen / instructions
    startScreen.style.display = 'block';
}

// --- Game Start Logic ---
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    Body.setStatic(ball, false); // Make ball dynamic
    engine.enabled = true; // Start physics simulation
    // Drawing is automatically disabled by checks in event listeners
});

// --- Collision Detection (Win Condition) ---
Events.on(engine, 'collisionStart', (event) => {
    if (!engine.enabled) return; // Don't process collisions if game hasn't started

    event.pairs.forEach(pair => {
        const isBallHoleCollision = (pair.bodyA === ball && pair.bodyB === hole) ||
                                    (pair.bodyA === hole && pair.bodyB === ball);

        if (isBallHoleCollision) {
            // Brief delay to see the ball in the hole
            setTimeout(() => {
                alert(`成功进洞！准备进入关卡 ${currentLevel + 2}!`);
                loadLevel(currentLevel + 1); // Load the next level
            }, 100); // 100ms delay
        }
    });
});

// --- Initialization ---
window.onload = () => {
    loadLevel(0); // Load the first level (index 0)

    // Run the renderer and engine
    Engine.run(engine);
    Render.run(render);

    // Initially disable the engine until start is pressed
    engine.enabled = false;
};