// Game elements
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const ball = document.getElementById('ball');
const player1Score = document.getElementById('player1');
const player2Score = document.getElementById('player2');

// Game state
let paddle1Y = 50;
let paddle2Y = 50;
let ballX = 50;
let ballY = 50;
let ballSpeedX = 5;
let ballSpeedY = 5;
let score1 = 0;
let score2 = 0;

// Paddle movement
const paddleSpeed = 1.0;
const keysPressed = {};

document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// Matrix rain effect
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nums = '0123456789';
const alphabet = katakana + latin + nums;

const fontSize = 16;
const columns = canvas.width / fontSize;
const rainDrops = Array(Math.floor(columns)).fill(0);

function drawMatrix() {
    ctx.fillStyle = 'rgba(13, 2, 33, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0aff0a';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
        
        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            rainDrops[i] = 0;
        }
        rainDrops[i]++;
    }
}

// Game loop
function gameLoop() {
    // Update paddles
    if (keysPressed['w']) {
        paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
    }
    if (keysPressed['s']) {
        paddle1Y = Math.min(45, paddle1Y + paddleSpeed);
    }
    if (keysPressed['ArrowUp']) {
        paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
    }
    if (keysPressed['ArrowDown']) {
        paddle2Y = Math.min(45, paddle2Y + paddleSpeed);
    }

    // Update ball position
    ballX += ballSpeedX * speedMultiplier;
    ballY += ballSpeedY * speedMultiplier;

    // Ball collision with top and bottom (60vmin container)
    if (ballY <= 0 || ballY >= 60 - 2) {
        ballSpeedY = -ballSpeedY;
    }

    // Ball collision with paddles
    if (
        (ballX <= 2 && ballY >= paddle1Y && ballY <= paddle1Y + 15) ||
        (ballX >= 78 - 2 && ballY >= paddle2Y && ballY <= paddle2Y + 15)
    ) {
        ballSpeedX = -ballSpeedX;
    }

    // Ball out of bounds (score)
    if (ballX < 0) {
        score2++;
        resetBall();
    }
    if (ballX > 80) {
        score1++;
        resetBall();
    }

    // Update DOM
    paddle1.style.top = paddle1Y + 'vmin';
    paddle2.style.top = paddle2Y + 'vmin';
    ball.style.left = ballX + 'vmin';
    ball.style.top = ballY + 'vmin';
    player1Score.textContent = score1;
    player2Score.textContent = score2;

    // Matrix rain
    drawMatrix();

    requestAnimationFrame(gameLoop);
}

function resetBall() {
    ballX = 40; // 80vmin * 0.5
    ballY = 30; // 60vmin * 0.5
    ballSpeedX = (Math.random() > 0.5 ? 0.4 : -0.4) * speedMultiplier;
    ballSpeedY = (Math.random() * 0.4 - 0.2) * speedMultiplier;
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Speed control
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
let speedMultiplier = 1;

speedSlider.addEventListener('input', (e) => {
    speedMultiplier = parseFloat(e.target.value);
    speedValue.textContent = speedMultiplier.toFixed(1) + 'x';
});

// Start game
resetBall();
gameLoop();