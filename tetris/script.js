const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const SHAPES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[1,1,1],[0,1,0]], // T
    [[1,1,1],[1,0,0]], // L
    [[1,1,1],[0,0,1]], // J
    [[1,1,0],[0,1,1]], // S
    [[0,1,1],[1,1,0]]  // Z
];

let board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let currentBlock = null;
let currentPos = {x: 0, y: 0};
let nextBlock = null;
let score = 0;
let level = 1;
let gameLoop = null;
let isFastMode = false;

const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextBlockCanvas = document.getElementById('next-block-canvas');
const nextCtx = nextBlockCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startBtn = document.getElementById('start-btn');

function createBlock() {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    return {
        shape,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
}

function drawBlock(ctx, block, offsetX = 0, offsetY = 0) {
    ctx.fillStyle = block.color;
    block.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillRect(
                    (x + offsetX) * BLOCK_SIZE,
                    (y + offsetY) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制当前方块
    if (currentBlock) {
        drawBlock(ctx, currentBlock, currentPos.x, currentPos.y);
    }
    
    // 绘制已固定的方块
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = value;
                ctx.fillRect(
                    x * BLOCK_SIZE,
                    y * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

function isValidMove(newX, newY, shape) {
    return shape.every((row, dy) => 
        row.every((value, dx) => {
            let posX = newX + dx;
            let posY = newY + dy;
            return (
                value === 0 ||
                (posX >= 0 && posX < BOARD_WIDTH &&
                 posY >= 0 && posY < BOARD_HEIGHT &&
                 !board[posY][posX])
            );
        })
    );
}

function mergeBlock() {
    currentBlock.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[currentPos.y + y][currentPos.x + x] = currentBlock.color;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * level;
        scoreElement.textContent = score;
        if (score >= level * 1000) {
            level++;
            levelElement.textContent = level;
        }
    }
}

function gameOver() {
    clearInterval(gameLoop);
    alert(`游戏结束！得分：${score}`);
}

function update() {
    const newY = currentPos.y + 1;
    if (isValidMove(currentPos.x, newY, currentBlock.shape)) {
        currentPos.y = newY;
    } else {
        mergeBlock();
        clearLines();
        currentBlock = nextBlock;
        nextBlock = createBlock();
        currentPos = {x: Math.floor(BOARD_WIDTH/2) - 1, y: 0};
        drawNextBlock();
        if (!isValidMove(currentPos.x, currentPos.y, currentBlock.shape)) {
            gameOver();
            return;
        }
    }
    drawBoard();
}

function rotateBlock() {
    const rotated = currentBlock.shape[0].map((_, i) =>
        currentBlock.shape.map(row => row[i]).reverse()
    );
    if (isValidMove(currentPos.x, currentPos.y, rotated)) {
        currentBlock.shape = rotated;
        drawBoard();
    }
}

function drawNextBlock() {
    nextCtx.clearRect(0, 0, nextBlockCanvas.width, nextBlockCanvas.height);
    const offsetX = (4 - nextBlock.shape[0].length)/2;
    const offsetY = (4 - nextBlock.shape.length)/2;
    drawBlock(nextCtx, nextBlock, offsetX, offsetY);
}

document.addEventListener('keydown', (e) => {
    if (!currentBlock) return;

    switch(e.key) {
        case 'c':
        case 'C':
            isFastMode = true;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, isFastMode ? 200 : 1000 - (level-1)*50);
            break;
        case 'ArrowLeft':
            if (isValidMove(currentPos.x - 1, currentPos.y, currentBlock.shape)) {
                currentPos.x--;
                drawBoard();
            }
            break;
        case 'ArrowRight':
            if (isValidMove(currentPos.x + 1, currentPos.y, currentBlock.shape)) {
                currentPos.x++;
                drawBoard();
            }
            break;
        // case 'ArrowDown':
        //     update();
        //     break;
        // case 'ArrowUp':
        //     rotateBlock();
        //     break;
        case 'x':
        case 'X':
            rotateBlock();
            break;
        case ' ':
            while(isValidMove(currentPos.x, currentPos.y + 1, currentBlock.shape)) {
                currentPos.y++;
            }
            update();
            break;
        case 'c':
        case 'C':
            isFastMode = !isFastMode;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, isFastMode ? 200 : 1000 - (level-1)*50);
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!currentBlock) return;

    switch(e.key) {
        case 'c':
        case 'C':
            isFastMode = false;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, isFastMode ? 200 : 1000 - (level-1)*50);
            break;
    }
});

startBtn.addEventListener('click', () => {
    board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    score = 0;
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    
    currentBlock = createBlock();
    nextBlock = createBlock();
    currentPos = {x: Math.floor(BOARD_WIDTH/2) - 1, y: 0};
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, isFastMode ? 200 : 1000 - (level-1)*50);
    
    drawNextBlock();
    drawBoard();
});