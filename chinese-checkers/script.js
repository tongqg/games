const canvas = document.getElementById('checkerboard');
const ctx = canvas.getContext('2d');
const resetButton = document.getElementById('reset-button');
const currentPlayerSpan = document.getElementById('current-player');
const playerCountSelect = document.getElementById('player-count-select');

const canvasSize = 600;
const boardRadius = canvasSize / 2 - 30; // Radius of the board's outer points
const holeRadius = 10; // Radius of the holes for marbles
const marbleRadius = 8; // Radius of the marbles

// Colors for different players/areas (example for 2 players)
const playerColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const emptyColor = '#ccc'; // Color for empty holes
const boardColor = '#f5deb3'; // Board background color

// Board structure definition (simplified for now)
// We need a way to represent the hexagonal grid positions.
// Let's define the center and calculate hole positions relative to it.
const centerX = canvasSize / 2;
const centerY = canvasSize / 2;

// Board state: Array of hole objects { q, r, x, y, player: null | 0 | 1 ... }
// Using axial coordinates (q, r) for the hex grid logic.
// https://www.redblobgames.com/grids/hexagons/#coordinates-axial
let boardState = [];
const holeMap = new Map(); // Map "q,r" string to index in boardState for quick lookup

// Game state
let currentPlayerIndex = 0;
let selectedMarbleIndex = null; // Index in boardState
let possibleMovesIndices = []; // Indices in boardState
let activePlayers = 2; // Store the number of players currently playing

// Constants for hex grid calculations
const hexSize = (boardRadius * 0.95) / 8; // Approximate size of hex cell based on board radius and grid size (max 9 rows from center)
const hexWidth = Math.sqrt(3) * hexSize;
const hexHeight = 2 * hexSize;

// Function to convert axial coordinates (q, r) to pixel coordinates (x, y)
function axialToPixel(q, r) {
    const x = centerX + hexWidth * (q + r / 2);
    const y = centerY + hexHeight * (3 / 4) * r;
    return { x, y };
}
// Axial directions (neighbors)
const axialDirections = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

// Helper function to get hole index from axial coords
function getHoleIndex(q, r) {
    return holeMap.get(`${q},${r}`);
}

// Helper function to check if axial coords are on the board
function isHoleOnBoard(q, r) {
    return holeMap.has(`${q},${r}`);
}

// Function to generate all 121 hole positions using cube coordinates
function calculateHolePositions() {
    console.log("Calculating hole positions using cube coords...");
    boardState = [];
    holeMap.clear();
    let index = 0;

    // Iterate through a bounding box in cube coordinates (x, y, z where x+y+z=0)
    // The board fits within max coordinate magnitude 8.
    for (let x = -8; x <= 8; x++) {
        for (let y = -8; y <= 8; y++) {
            const z = -x - y;
            if (Math.abs(z) > 8) continue; // Early exit if z is out of bounds

            const maxCoord = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

            let isValidHole = false;

            // Condition: Point must be within a hexagon of radius 8
            // max(abs(x), abs(y), abs(z)) <= 8
            if (maxCoord <= 8) {
                 isValidHole = true;
            }

            // If it's a valid hole, add it to the board state
            if (isValidHole) {
                const q = x; // Convert cube x to axial q
                const r = z; // Convert cube z to axial r
                const { x: pixelX, y: pixelY } = axialToPixel(q, r);
                // Store cube coords too, might be useful later
                const hole = { index: index, q: q, r: r, cubeX: x, cubeY: y, cubeZ: z, x: pixelX, y: pixelY, player: null };
                boardState.push(hole);
                // We will build the map after sorting
                index++;
            }
        }
    }

    // Sort boardState for consistent indexing, e.g., top-to-bottom, left-to-right
    boardState.sort((a, b) => {
        if (a.r !== b.r) return a.r - b.r; // Primary sort by axial r (vertical)
        return a.q - b.q; // Secondary sort by axial q
    });

    // Rebuild holeMap and update indices after sorting
    holeMap.clear();
    boardState.forEach((hole, i) => {
        hole.index = i; // Assign final index based on sorted order
        holeMap.set(`${hole.q},${hole.r}`, i);
    });


    // Log the number of holes generated for the hexagonal grid
    console.log(`Generated ${boardState.length} hole positions for hexagonal grid (radius 8).`);
}

// Function to draw the board background (star shape) and grid lines
function drawBoardBackground() {
    // 1. Draw and fill the hexagonal background
    ctx.fillStyle = boardColor;
    ctx.strokeStyle = '#666'; // Darker outline for the hexagon
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Calculate the 6 vertices of the hexagon
    // Use a radius slightly larger than the outermost holes (radius 8)
    const hexBoardRadius = hexSize * (8 + 0.5); // Extend half a hex beyond radius 8
    const hexVertices = [];
    for (let i = 0; i < 6; i++) {
        // Angle starts from the right (0) for standard hex drawing
        const angle = (Math.PI / 3) * i; // 60 degrees per vertex
        hexVertices.push({
            x: centerX + hexBoardRadius * Math.cos(angle),
            y: centerY + hexBoardRadius * Math.sin(angle) // No inversion needed here
        });
    }

    // Draw the hexagon path
    ctx.moveTo(hexVertices[0].x, hexVertices[0].y);
    for (let i = 1; i < 6; i++) {
        ctx.lineTo(hexVertices[i].x, hexVertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke(); // Draw the outline


    // 2. Draw lines connecting adjacent holes to form the grid (on top of the background)
    ctx.strokeStyle = '#aaa'; // Lighter lines for grid
    ctx.lineWidth = 1;
    boardState.forEach(hole => {
        const directionsToCheck = [
            { q: 1, r: 0 }, { q: 0, r: 1 }, { q: -1, r: 1 }
        ];
        directionsToCheck.forEach(dir => {
            const neighborQ = hole.q + dir.q;
            const neighborR = hole.r + dir.r;
            if (isHoleOnBoard(neighborQ, neighborR)) {
                const neighborHole = boardState[getHoleIndex(neighborQ, neighborR)];
                ctx.beginPath();
                ctx.moveTo(hole.x, hole.y);
                ctx.lineTo(neighborHole.x, neighborHole.y);
                ctx.stroke();
            }
        });
    });
}

// Function to draw a single hole
function drawHole(x, y) {
    ctx.fillStyle = emptyColor;
    ctx.beginPath();
    ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Function to draw a marble
function drawMarble(x, y, playerIndex) {
    ctx.fillStyle = playerColors[playerIndex];
    ctx.beginPath();
    ctx.arc(x, y, marbleRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// Function to draw the entire board state
function drawBoard() {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawBoardBackground();

    // Draw all holes first
    boardState.forEach(hole => {
        drawHole(hole.x, hole.y);
    });

    // Draw marbles on top
    boardState.forEach(hole => {
        if (hole.player !== null) {
            drawMarble(hole.x, hole.y, hole.player);
        }
    });

    // Highlight selected marble and possible moves (to be implemented)
    // Highlight selected marble
    if (selectedMarbleIndex !== null) {
        const hole = boardState[selectedMarbleIndex];
        ctx.strokeStyle = 'yellow'; // Highlight color
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, holeRadius + 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Highlight possible moves
    possibleMovesIndices.forEach(index => {
        const hole = boardState[index];
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Semi-transparent green
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, holeRadius, 0, Math.PI * 2);
        ctx.fill();
    });

    console.log("Board drawn");
}

// Function to initialize the game
function initGame(numPlayers) {
    // If numPlayers isn't provided (e.g., initial load), get it from the dropdown
    // Otherwise, use the provided value (e.g., from reset button or dropdown change)
    const playersToStart = numPlayers !== undefined ? numPlayers : parseInt(playerCountSelect.value, 10);
    console.log(`Initializing game for ${playersToStart} players...`);
    calculateHolePositions(); // Calculate where the holes are

    // Reset all holes to empty first
    boardState.forEach(hole => hole.player = null);

    // Define starting and target areas based on axial coordinates
    // Target area is opposite the starting area
    // Define starting/target areas for a HEXAGONAL board (Halma-style)
    // Using 15 pieces in opposite side triangles (size 5) for 2 players.
    // TODO: Define setups for 3, 4, 6 players on hex grid if needed.
    const boardHexRadius = 8; // The radius used in calculateHolePositions
    const playerPieceCount = 15; // Using 15 for hex Halma setup

    const playerAreas = [
        // Player 0 (Red, Top Side): Starts in top triangle (z <= -4), targets bottom (z >= 4)
        {
            start: (hole) => hole.cubeZ <= -(boardHexRadius - 4), // e.g., z <= -4 for radius 8
            target: (hole) => hole.cubeZ >= (boardHexRadius - 4)  // e.g., z >= 4 for radius 8
        },
        // Player 1 (Blue, Bottom Side): Starts in bottom triangle (z >= 4), targets top (z <= -4)
        {
            start: (hole) => hole.cubeZ >= (boardHexRadius - 4),
            target: (hole) => hole.cubeZ <= -(boardHexRadius - 4)
        },
         // Placeholder for other players if needed - adapt coordinates
        { start: (hole) => false, target: (hole) => false }, // Player 2
        { start: (hole) => false, target: (hole) => false }, // Player 3
        { start: (hole) => false, target: (hole) => false }, // Player 4
        { start: (hole) => false, target: (hole) => false }, // Player 5
    ];
    window.playerAreas = playerAreas;
    window.playerPieceCount = playerPieceCount; // Make piece count global for win check

    // Assign marbles for the selected number of players
    // ... (rest of the player setup logic remains the same, using playerAreas[playerIdx].start)

    // Assign marbles for the selected number of players
    // Standard 2-player uses areas 0 and 1
    // Standard 3-player uses areas 0, 2, 4
    // Standard 4-player uses areas 2, 3, 4, 5 (corners)
    // Standard 6-player uses all areas
    let playersToSetup = [];
    if (playersToStart === 2) playersToSetup = [0, 1];
    else if (playersToStart === 3) playersToSetup = [0, 2, 4];
    else if (playersToStart === 4) playersToSetup = [2, 3, 4, 5]; // Using corners for 4 players
    else if (playersToStart === 6) playersToSetup = [0, 1, 2, 3, 4, 5];
    else { // Should not happen with dropdown, but good fallback
        console.warn(`Invalid number of players (${playersToStart}), defaulting to 2.`);
        playersToSetup = [0, 1];
        playersToStart = 2;
    }


    // Place the required number of pieces (e.g., 15) for each active player
    playersToSetup.forEach(playerIdx => {
        const isPlayerStartArea = playerAreas[playerIdx].start;
        let piecesPlaced = 0;
        // Iterate through sorted boardState to place pieces consistently
        boardState.forEach(hole => {
            if (isPlayerStartArea(hole) && piecesPlaced < playerPieceCount) {
                hole.player = playerIdx;
                piecesPlaced++;
            }
        });
    });


    activePlayers = playersToStart; // Store the number of players for this game instance
    currentPlayerIndex = 0;
    selectedMarbleIndex = null;
    possibleMovesIndices = [];
    currentPlayerSpan.textContent = `玩家 ${currentPlayerIndex + 1} (${playerColors[currentPlayerIndex]})`;
    drawBoard();
    console.log("Game Initialized.");
}
// --- Game Logic Functions ---

// Calculate possible moves for the marble at startIndex
function calculatePossibleMoves(startIndex) {
    const startHole = boardState[startIndex];
    if (!startHole || startHole.player !== currentPlayerIndex) {
        return [];
    }

    let possibleMoves = new Set(); // Use a Set to avoid duplicates
    let jumpDestinations = new Set(); // Keep track of where jumps land in this turn
    let visitedDuringJump = new Set(); // Track visited holes within a single jump sequence

    // 1. Find single step moves
    axialDirections.forEach(dir => {
        const neighborQ = startHole.q + dir.q;
        const neighborR = startHole.r + dir.r;
        const neighborIndex = getHoleIndex(neighborQ, neighborR);

        if (neighborIndex !== undefined && boardState[neighborIndex].player === null) {
            possibleMoves.add(neighborIndex);
        }
    });

    // 2. Find jump moves recursively
    function findJumps(currentQ, currentR) {
        visitedDuringJump.add(`${currentQ},${currentR}`); // Mark current hole as visited for this jump sequence

        axialDirections.forEach(dir => {
            const jumpOverQ = currentQ + dir.q;
            const jumpOverR = currentR + dir.r;
            const jumpOverIndex = getHoleIndex(jumpOverQ, jumpOverR);

            // Check if there's a marble to jump over
            if (jumpOverIndex !== undefined && boardState[jumpOverIndex].player !== null) {
                const landQ = jumpOverQ + dir.q;
                const landR = jumpOverR + dir.r;
                const landIndex = getHoleIndex(landQ, landR);

                // Check if landing spot is valid, empty, and not visited in this jump sequence
                if (landIndex !== undefined && boardState[landIndex].player === null && !visitedDuringJump.has(`${landQ},${landR}`)) {
                    // Only add landing spots as possible moves, not intermediate jump points
                     if (!jumpDestinations.has(landIndex)) {
                        possibleMoves.add(landIndex);
                        jumpDestinations.add(landIndex); // Track landing spot
                        findJumps(landQ, landR); // Recursively find more jumps from landing spot
                    }
                }
            }
        });
    }

    // Start jump search from the original marble position
    findJumps(startHole.q, startHole.r);

    // Convert Set to Array
    return Array.from(possibleMoves);
}

// Function to perform a move
function makeMove(fromIndex, toIndex) {
    if (selectedMarbleIndex !== fromIndex || !possibleMovesIndices.includes(toIndex)) {
        console.error("Invalid move attempted.");
        return;
    }

    const fromHole = boardState[fromIndex];
    const toHole = boardState[toIndex];

    // Move the marble
    toHole.player = fromHole.player;
    fromHole.player = null;

    // Reset selection and possible moves
    selectedMarbleIndex = null;
    possibleMovesIndices = [];

    // Switch player
    // TODO: Need to know the actual number of players playing
    const numActivePlayers = activePlayers; // Use the stored number of players
    const previousPlayerIndex = toHole.player; // The player who just moved
    currentPlayerIndex = (previousPlayerIndex + 1) % numActivePlayers;
    currentPlayerSpan.textContent = `玩家 ${currentPlayerIndex + 1} (${playerColors[currentPlayerIndex]})`;

    // Check for win condition for the player who just moved
    if (checkWinCondition(previousPlayerIndex)) {
        // Use requestAnimationFrame to ensure the board draws before the alert
        requestAnimationFrame(() => {
             setTimeout(() => { // Add a small delay for visual clarity
                alert(`玩家 ${previousPlayerIndex + 1} (${playerColors[previousPlayerIndex]}) 获胜!`);
                // Optionally disable further moves or reset
             }, 100);
        });
    }

    console.log(`Player ${toHole.player} moved from ${fromIndex} to ${toIndex}`);
    drawBoard(); // Draw the board after the move
}

// Function to check if a player has won
function checkWinCondition(playerIndex) {
    if (!window.playerAreas) return false; // Ensure areas are defined

    const targetAreaCheck = window.playerAreas[playerIndex].target;
    let marblesInTarget = 0;
    const expectedMarbles = window.playerPieceCount || 10; // Use global count or default

    boardState.forEach(hole => {
        // Pass the whole hole object to the check function
        if (targetAreaCheck(hole) && hole.player === playerIndex) {
            marblesInTarget++;
        }
    });

    console.log(`Player ${playerIndex} has ${marblesInTarget} marbles in target area.`);
    return marblesInTarget === expectedMarbles;
}



// Event Listeners
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // console.log(`Canvas clicked at: (${x}, ${y})`);
    handleCanvasClick(x, y);
});

resetButton.addEventListener('click', () => initGame(activePlayers)); // Reset with the current number of players

playerCountSelect.addEventListener('change', (event) => {
    const selectedPlayers = parseInt(event.target.value, 10);
    initGame(selectedPlayers); // Start a new game when selection changes
});

// Function to handle clicks on the canvas
function handleCanvasClick(clickX, clickY) {
    // Find the closest hole to the click
    let closestHoleIndex = -1;
    let minDistSq = Infinity;

    boardState.forEach((hole, index) => {
        const distSq = (clickX - hole.x) ** 2 + (clickY - hole.y) ** 2;
        if (distSq < minDistSq && distSq < (holeRadius * 1.5) ** 2) { // Click within 1.5 radius
            minDistSq = distSq;
            closestHoleIndex = index;
        }
    });

    if (closestHoleIndex === -1) {
        console.log("Clicked outside any hole.");
        selectedMarbleIndex = null; // Deselect if clicking empty space
        possibleMovesIndices = [];
        drawBoard();
        return;
    }

    const clickedHole = boardState[closestHoleIndex];
    console.log(`Clicked hole index: ${closestHoleIndex}, q: ${clickedHole.q}, r: ${clickedHole.r}, player: ${clickedHole.player}`);

    // --- Click Handling Logic ---

    // 1. Check if clicking on a possible move destination
    if (selectedMarbleIndex !== null && possibleMovesIndices.includes(closestHoleIndex)) {
        console.log(`Moving marble from ${selectedMarbleIndex} to ${closestHoleIndex}`);
        makeMove(selectedMarbleIndex, closestHoleIndex);
        // makeMove handles deselection and redraw
        return; // Move completed, exit handler
    }

    // 2. Check if clicking on the current player's own marble
    if (clickedHole.player === currentPlayerIndex) {
        if (selectedMarbleIndex === closestHoleIndex) {
            // Clicking the already selected marble deselects it
            console.log(`Deselecting marble at index ${closestHoleIndex}`);
            selectedMarbleIndex = null;
            possibleMovesIndices = [];
        } else {
            // Selecting a new marble
            console.log(`Selecting marble at index ${closestHoleIndex}`);
            selectedMarbleIndex = closestHoleIndex;
            possibleMovesIndices = calculatePossibleMoves(selectedMarbleIndex);
            console.log("Possible moves:", possibleMovesIndices.map(i => boardState[i])); // Log coords for easier debug
        }
    }
    // 3. Clicking on opponent marble, empty space (not a possible move), or outside board
    else {
        console.log("Clicked opponent marble or empty invalid spot. Deselecting.");
        selectedMarbleIndex = null;
        possibleMovesIndices = [];
    }

    drawBoard(); // Redraw to show selection/deselection
}


// Initial game setup (e.g., for 2 players)
initGame(); // Initial call will now read from the dropdown