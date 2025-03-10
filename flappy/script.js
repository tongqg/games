const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const scoreElement = document.getElementById('score');

let gameState = 'start'; // start | playing | gameover
let score = 0;

// 小鸟属性
const bird = {
    x: 50,
    y: 150,
    velocity: 0,
    gravity: 0.5,
    jump: -10,
    size: 10
};

// 管道属性
const pipes = [];
const pipeGap = 150;
const pipeWidth = 40;
const pipeSpacing = 200;

function drawBird() {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipes() {
    ctx.fillStyle = '#2ecc71';
    pipes.forEach(pipe => {
        // 上管道
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        // 下管道
        ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height - pipe.top - pipeGap);
    });
}

function updateGame() {
    if (gameState !== 'playing') {
        return;
    }

    // 更新小鸟位置
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // 边界检测
    if (bird.y < 0 || bird.y > canvas.height) {
        gameState = 'gameover';
    }

    // 更新管道位置
    pipes.forEach(pipe => {
        pipe.x -= 2;
        if (pipe.x + pipeWidth < 0) {
            pipes.shift();
            score++;
            scoreElement.textContent = score;
        }
    });

    // 生成新管道
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
        generatePipes();
    }

    checkCollisions();
    draw();
    requestAnimationFrame(updateGame);
}

function generatePipes() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const top = Math.random() * (maxHeight - minHeight) + minHeight;

    pipes.push({
        x: canvas.width,
        top: top
    });
}

function checkCollisions() {
    pipes.forEach(pipe => {
        if (
            bird.x + bird.size > pipe.x &&
            bird.x - bird.size < pipe.x + pipeWidth &&
            (bird.y - bird.size < pipe.top || bird.y + bird.size > pipe.top + pipeGap)
        ) {
            gameState = 'gameover';
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBird();
    drawPipes();
}

function startGame() {
    pipes.length = 0;
    score = 0;
    scoreElement.textContent = score;
    bird.y = 150;
    bird.velocity = 0;
    gameState = 'playing';
    updateGame();
}

// 事件监听
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        bird.velocity = bird.jump;
    }
});

canvas.addEventListener('click', () => {
    if (gameState === 'start' || gameState === 'gameover') {
        startGame();
    }
});

// 初始化
generatePipes();
gameState = 'start';
