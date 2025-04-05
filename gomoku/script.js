const canvas = document.getElementById('gomoku-board');
const ctx = canvas.getContext('2d');
const currentPlayerSpan = document.getElementById('current-player');
const winnerMessageP = document.getElementById('winner-message');
const restartButton = document.getElementById('restart-button');
const gameModeSelect = document.getElementById('game-mode');
const playerColorSelectionDiv = document.getElementById('player-color-selection');
const playerColorSelect = document.getElementById('player-color');

const BOARD_SIZE = 15; // 15x15 grid
const CELL_SIZE = canvas.width / BOARD_SIZE;
const PIECE_RADIUS = CELL_SIZE / 2 * 0.8; // 80% of half cell size

const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

let board = [];
let currentPlayer = BLACK;
let gameOver = false;
let gameMode = 'pvp'; // 'pvp' or 'pve'
let playerColor = BLACK; // Human player's color in PvE
let aiPlayer = WHITE;    // AI's color in PvE
let isAITurn = false;

// --- Initialization ---

function initializeBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(EMPTY));
    currentPlayer = BLACK; // Black always starts
    gameOver = false;
    isAITurn = false;
    winnerMessageP.classList.add('hidden');
    winnerMessageP.textContent = '';

    gameMode = gameModeSelect.value;
    if (gameMode === 'pve') {
        playerColor = (playerColorSelect.value === 'black') ? BLACK : WHITE;
        aiPlayer = (playerColor === BLACK) ? WHITE : BLACK;
        playerColorSelectionDiv.classList.remove('hidden');
        // If AI is Black (starts first)
        if (aiPlayer === BLACK) {
            isAITurn = true;
            currentPlayerSpan.textContent = 'AI (Black)';
            currentPlayerSpan.style.color = 'black';
            // AI makes the first move after a short delay
            setTimeout(makeAIMove, 500);
        } else {
             currentPlayerSpan.textContent = 'You (Black)';
             currentPlayerSpan.style.color = 'black';
        }
    } else {
        playerColorSelectionDiv.classList.add('hidden');
        currentPlayerSpan.textContent = 'Black';
        currentPlayerSpan.style.color = 'black';
    }

    drawBoard();
}

// --- Drawing ---

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#d1b78b'; // Board color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#5c4033'; // Line color
    ctx.lineWidth = 1;

    // Draw grid lines
    for (let i = 0; i < BOARD_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2 + i * CELL_SIZE, CELL_SIZE / 2);
        ctx.lineTo(CELL_SIZE / 2 + i * CELL_SIZE, canvas.height - CELL_SIZE / 2);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(CELL_SIZE / 2, CELL_SIZE / 2 + i * CELL_SIZE);
        ctx.lineTo(canvas.width - CELL_SIZE / 2, CELL_SIZE / 2 + i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw star points
    const starPoints = [
        { r: 3, c: 3 }, { r: 3, c: 11 },
        { r: 7, c: 7 },
        { r: 11, c: 3 }, { r: 11, c: 11 }
    ];
    ctx.fillStyle = '#5c4033';
    starPoints.forEach(p => {
        ctx.beginPath();
        ctx.arc(
            CELL_SIZE / 2 + p.c * CELL_SIZE,
            CELL_SIZE / 2 + p.r * CELL_SIZE,
            PIECE_RADIUS / 3, 0, 2 * Math.PI
        );
        ctx.fill();
    });

    // Redraw existing pieces
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== EMPTY) {
                drawPiece(r, c, board[r][c]);
            }
        }
    }
}

function drawPiece(row, col, player) {
    const x = CELL_SIZE / 2 + col * CELL_SIZE;
    const y = CELL_SIZE / 2 + row * CELL_SIZE;

    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = (player === BLACK) ? 'black' : 'white';
    ctx.fill();
    ctx.strokeStyle = (player === BLACK) ? '#555' : '#ccc'; // Slight border
    ctx.lineWidth = 1;
    ctx.stroke();
}

// --- Game Logic ---

function handleBoardClick(event) {
    if (gameOver || (gameMode === 'pve' && isAITurn)) {
        return; // Ignore clicks if game over or AI's turn
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.round((x - CELL_SIZE / 2) / CELL_SIZE);
    const row = Math.round((y - CELL_SIZE / 2) / CELL_SIZE);

    if (isValidMove(row, col)) {
        makeMove(row, col, currentPlayer);
    }
}

function isValidMove(row, col) {
     return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && board[row][col] === EMPTY;
}

function makeMove(row, col, player) {
    if (!isValidMove(row, col) || gameOver) return;

    board[row][col] = player;
    drawPiece(row, col, player);

    if (checkWin(row, col)) {
        gameOver = true;
        let winnerName = '';
        if (gameMode === 'pvp') {
            winnerName = player === BLACK ? 'Black' : 'White';
        } else {
            winnerName = player === playerColor ? 'You' : 'AI';
        }
        winnerMessageP.textContent = `${winnerName} (${player === BLACK ? 'Black' : 'White'}) wins!`;
        winnerMessageP.style.color = player === BLACK ? 'black' : 'darkred';
        winnerMessageP.classList.remove('hidden');
        return; // End turn
    }

    // --- Switch Player ---
    currentPlayer = (player === BLACK) ? WHITE : BLACK;

    if (gameMode === 'pvp') {
        currentPlayerSpan.textContent = currentPlayer === BLACK ? 'Black' : 'White';
        currentPlayerSpan.style.color = currentPlayer === BLACK ? 'black' : 'darkred';
    } else { // PvE mode
        isAITurn = !isAITurn;
        if (isAITurn) {
            currentPlayerSpan.textContent = `AI (${aiPlayer === BLACK ? 'Black' : 'White'})`;
            currentPlayerSpan.style.color = aiPlayer === BLACK ? 'black' : 'darkred';
            // AI makes its move after a short delay
            setTimeout(makeAIMove, 500);
        } else {
            currentPlayerSpan.textContent = `You (${playerColor === BLACK ? 'Black' : 'White'})`;
            currentPlayerSpan.style.color = playerColor === BLACK ? 'black' : 'darkred';
        }
    }
}


function checkWin(row, col) {
    const player = board[row][col];
    if (player === EMPTY) return false;

    const directions = [
        { dr: 0, dc: 1 },  // Horizontal
        { dr: 1, dc: 0 },  // Vertical
        { dr: 1, dc: 1 },  // Diagonal \
        { dr: 1, dc: -1 }  // Diagonal /
    ];

    for (const { dr, dc } of directions) {
        let count = 1;
        // Check positive direction
        for (let i = 1; i < 5; i++) {
            const nr = row + dr * i;
            const nc = col + dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                count++;
            } else {
                break;
            }
        }
        // Check negative direction
        for (let i = 1; i < 5; i++) {
            const nr = row - dr * i;
            const nc = col - dc * i;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                count++;
            } else {
                break;
            }
        }
        if (count >= 5) {
            return true;
        }
    }
    return false;
}

// --- AI Logic ---

function makeAIMove() {
    if (gameOver || !isAITurn) return;

    const bestMove = findBestMove();

    if (bestMove) {
        makeMove(bestMove.row, bestMove.col, aiPlayer);
    } else {
        // Fallback: place randomly if no good move found (shouldn't happen ideally)
        const emptyCells = getEmptyCells();
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            makeMove(randomCell.row, randomCell.col, aiPlayer);
        } else {
            // Draw condition (board full) - can be handled more formally
            console.log("Draw?");
            gameOver = true;
            winnerMessageP.textContent = "It's a Draw!";
            winnerMessageP.style.color = 'blue';
            winnerMessageP.classList.remove('hidden');
        }
    }
}

function getEmptyCells() {
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) {
                cells.push({ row: r, col: c });
            }
        }
    }
    return cells;
}

function findBestMove() {
    const emptyCells = getEmptyCells();
    let bestScore = -Infinity;
    let move = null;

    // Shuffle empty cells to add some randomness among equally good moves
    emptyCells.sort(() => Math.random() - 0.5);

    for (const cell of emptyCells) {
        // Simulate placing AI piece
        board[cell.row][cell.col] = aiPlayer;
        let score = evaluateBoard(aiPlayer) - evaluateBoard(playerColor) * 1.1; // Prioritize blocking slightly
        // Check for immediate win
        if (checkWin(cell.row, cell.col)) {
             score += 100000; // High score for winning move
        }
        board[cell.row][cell.col] = EMPTY; // Undo simulation

         // Simulate placing Player piece to check for immediate block necessity
        board[cell.row][cell.col] = playerColor;
        if (checkWin(cell.row, cell.col)) {
            score += 50000; // High score for blocking opponent's win
        }
        board[cell.row][cell.col] = EMPTY; // Undo simulation


        if (score > bestScore) {
            bestScore = score;
            move = cell;
        }
    }
    return move;
}


// Basic evaluation function - scores patterns
function evaluateBoard(player) {
    let score = 0;
    const opponent = (player === BLACK) ? WHITE : BLACK;

    // Score rows, columns, and diagonals
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === EMPTY) {
                 // Evaluate potential score if 'player' places here
                 score += evaluateCell(r, c, player, opponent);
            }
        }
    }
    return score;
}

function evaluateCell(row, col, player, opponent) {
     let cellScore = 0;
     const directions = [ { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }, { dr: 1, dc: -1 } ];

     for (const {dr, dc} of directions) {
         // Evaluate line in both positive and negative directions from the cell
         let line = [];
         // Negative direction (up to 4 steps)
         for (let i = 4; i >= 1; i--) {
             const nr = row - dr * i;
             const nc = col - dc * i;
             if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) line.push(board[nr][nc]); else line.push(-1); // -1 for out of bounds
         }
         line.push(player); // The hypothetical piece placed
         // Positive direction (up to 4 steps)
         for (let i = 1; i <= 4; i++) {
             const nr = row + dr * i;
             const nc = col + dc * i;
             if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) line.push(board[nr][nc]); else line.push(-1);
         }

         // Score the line based on patterns of length 5
         for (let i = 0; i <= line.length - 5; i++) {
             cellScore += scorePattern(line.slice(i, i + 5), player, opponent);
         }
     }
     return cellScore;
}

// Scores a 5-cell window
function scorePattern(window, player, opponent) {
    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (const cell of window) {
        if (cell === player) playerCount++;
        else if (cell === opponent) opponentCount++;
        else if (cell === EMPTY) emptyCount++;
        // Ignore -1 (out of bounds) for scoring patterns within the board
    }

    // Basic scoring - needs refinement for better AI
    if (playerCount === 5) return 100000; // Win
    if (playerCount === 4 && emptyCount === 1) return 5000;  // Open 4
    if (playerCount === 3 && emptyCount === 2) return 500;   // Open 3
    if (playerCount === 2 && emptyCount === 3) return 50;    // Open 2

    // Defensive scores (blocking opponent) - apply these when evaluating opponent's potential
    // These scores are added in findBestMove when simulating opponent's potential win
    // if (opponentCount === 4 && emptyCount === 1) return 50000; // Block opponent's Open 4 (handled in findBestMove)
    // if (opponentCount === 3 && emptyCount === 2) return 400;   // Block opponent's Open 3

    return playerCount; // Simple score for fewer pieces
}


// --- Event Listeners ---

canvas.addEventListener('click', handleBoardClick);
restartButton.addEventListener('click', initializeBoard);
gameModeSelect.addEventListener('change', initializeBoard);
playerColorSelect.addEventListener('change', initializeBoard);

// --- Initial Game Start ---
initializeBoard();