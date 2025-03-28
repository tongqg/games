const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const messageElement = document.createElement('div'); // For game over/level message
messageElement.style.position = 'absolute';
messageElement.style.top = '50%';
messageElement.style.left = '50%';
messageElement.style.transform = 'translate(-50%, -50%)';
messageElement.style.color = 'red';
messageElement.style.fontSize = '48px';
messageElement.style.textAlign = 'center'; // Center text
messageElement.style.display = 'none'; // Hidden initially
document.body.appendChild(messageElement);


// Game state
let gameRunning = false;
let animationFrameId = null;
let gameOver = false;
let score = 0;
let enemiesNeeded = 100;
let nextEnemyId = 0;
let escapedTanks = 0;

// Game constants
const TANK_WIDTH = 40;
const TANK_HEIGHT = 40;
const PLAYER_TANK_SPEED = 3;
const ENEMY_TANK_SPEED = 1;
const BULLET_SPEED = 10; // Doubled speed
const BULLET_RADIUS = 3;
const ENEMY_FIRE_RATE = 0.01; // Probability *per enemy* to attempt firing
const SCORE_PER_LEVEL = 10;
const MAX_TOTAL_ENEMY_BULLETS = 10000; // 100 enemies × 100 bullets each

// Player tank initial state
let playerTank = {
    x: canvas.width / 2 - TANK_WIDTH / 2,
    y: canvas.height - TANK_HEIGHT - 10,
    width: TANK_WIDTH,
    height: TANK_HEIGHT,
    color: 'green',
    dx: 0,
    dy: 0
};

// Enemies array
let enemyTanks = [];

let playerBullets = [];
let enemyBullets = [];
let keys = {};

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameRunning && !gameOver && (e.key === ' ' || e.key === 'Spacebar')) {
        shootPlayerBullet();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function createEnemy() {
    const enemyId = nextEnemyId++; // Assign unique ID
    const newEnemy = {
        id: enemyId, // Store the ID
        x: Math.random() * (canvas.width - TANK_WIDTH),
        y: -TANK_HEIGHT,
        width: TANK_WIDTH,
        height: TANK_HEIGHT,
        color: 'blue',
        dx: 0, // Start with zero horizontal speed
        dy: ENEMY_TANK_SPEED, // Start moving down initially
        bulletCount: 0, // Initialize bullet count for this enemy
        changeDirectionInterval: Math.random() * 3000 + 2000, // Change direction every 2-5 seconds (in ms)
        changeDirectionTimer: Math.random() * 1000, // Initial random delay before first change
        movingHorizontally: false // Track current movement axis
    };
    return newEnemy;
}

function spawnEnemies() {
    if (enemyTanks.length < enemiesNeeded) {
        enemyTanks.push(createEnemy());
    }
}

function drawTank(tank) {
    ctx.fillStyle = tank.color;
    ctx.fillRect(tank.x, tank.y, tank.width, tank.height);

    ctx.fillStyle = 'darkgrey';
    if (tank.color === 'green') {
        ctx.fillRect(tank.x + tank.width / 2 - 5, tank.y - 10, 10, 10);
        ctx.fillRect(tank.x + tank.width / 2 - 2, tank.y - 20, 4, 15);
    } else {
        ctx.fillRect(tank.x + tank.width / 2 - 5, tank.y + tank.height, 10, 10);
        ctx.fillRect(tank.x + tank.width / 2 - 2, tank.y + tank.height + 5, 4, 15);
    }
}

function movePlayerTank() {
    if (gameOver) return;

    playerTank.dx = 0;
    playerTank.dy = 0;

    if (keys['ArrowLeft'] || keys['a']) playerTank.dx = -PLAYER_TANK_SPEED;
    if (keys['ArrowRight'] || keys['d']) playerTank.dx = PLAYER_TANK_SPEED;
    if (keys['ArrowUp'] || keys['w']) playerTank.dy = -PLAYER_TANK_SPEED;
    if (keys['ArrowDown'] || keys['s']) playerTank.dy = PLAYER_TANK_SPEED;

    playerTank.x += playerTank.dx;
    playerTank.y += playerTank.dy;

    if (playerTank.x < 0) playerTank.x = 0;
    if (playerTank.x + playerTank.width > canvas.width) playerTank.x = canvas.width - playerTank.width;
    if (playerTank.y < 0) playerTank.y = 0;
    if (playerTank.y + playerTank.height > canvas.height) playerTank.y = canvas.height - playerTank.height;
}

function moveEnemyTanks() {
    if (gameOver) return;

    const deltaTime = 16; // Approximate ms per frame (adjust if needed)

    for (let i = enemyTanks.length - 1; i >= 0; i--) { // Iterate backwards for safe removal
        const enemy = enemyTanks[i];

        // Update position
        enemy.x += enemy.dx;
        enemy.y += enemy.dy;

        let changedDirectionDueToWall = false;

        // Boundary checks
        // Left/Right Walls
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            enemy.x = Math.max(0, Math.min(enemy.x, canvas.width - enemy.width)); // Clamp position
            if (enemy.movingHorizontally) { // Only switch if moving into the wall
                enemy.movingHorizontally = false;
                enemy.dy = (Math.random() < 0.5 ? -1 : 1) * ENEMY_TANK_SPEED;
                enemy.dx = 0;
                enemy.changeDirectionTimer = enemy.changeDirectionInterval; // Reset timer after wall turn
                changedDirectionDueToWall = true;
            } else {
                 enemy.dx *= -1; // If moving vertically, just bounce horizontally if pushed
            }
        }

        // Top Wall
        if (enemy.y <= 0) {
            enemy.y = 0; // Clamp position
            if (!enemy.movingHorizontally) { // Only switch if moving into the wall
                enemy.movingHorizontally = true;
                enemy.dx = (Math.random() < 0.5 ? -1 : 1) * ENEMY_TANK_SPEED;
                enemy.dy = 0;
                enemy.changeDirectionTimer = enemy.changeDirectionInterval; // Reset timer after wall turn
                changedDirectionDueToWall = true;
            } else {
                 enemy.dy *= -1; // If moving horizontally, just bounce vertically if pushed
            }
        }

        // Bottom Wall (Escape Condition)
        if (enemy.y >= canvas.height) {
            enemyTanks.splice(i, 1); // Remove enemy
            escapedTanks++;
            console.log(`Tank escaped! Total escaped: ${escapedTanks}`);
            if (escapedTanks >= 3) {
                endGame(false); // Player loses
                return; // Stop processing other tanks as game is over
            }
            continue; // Skip rest of loop for this removed tank
        }


        // Random direction change logic (only if not just changed by wall)
        if (!changedDirectionDueToWall) {
            enemy.changeDirectionTimer -= deltaTime;
            if (enemy.changeDirectionTimer <= 0) {
                if (enemy.movingHorizontally) {
                    // Switch to vertical
                    enemy.movingHorizontally = false;
                    enemy.dy = (Math.random() < 0.5 ? -1 : 1) * ENEMY_TANK_SPEED;
                    enemy.dx = 0;
                } else {
                    // Switch to horizontal
                    enemy.movingHorizontally = true;
                    enemy.dx = (Math.random() < 0.5 ? -1 : 1) * ENEMY_TANK_SPEED;
                    enemy.dy = 0;
                }
                // Reset timer for next change
                enemy.changeDirectionTimer = enemy.changeDirectionInterval;
            }
        }

        // Enemy firing logic
        if (Math.random() < ENEMY_FIRE_RATE) {
            shootEnemyBullet(enemy);
        }
    }
}

function shootPlayerBullet() {
    const bullet = {
        x: playerTank.x + playerTank.width / 2,
        y: playerTank.y - 20,
        radius: BULLET_RADIUS,
        color: 'red',
        dy: -BULLET_SPEED,
        owner: 'player'
    };
    playerBullets.push(bullet);
}

function shootEnemyBullet(enemy) {
    // Check the INDIVIDUAL enemy's bullet count
    if (enemy.bulletCount < 100) { // Increased to 100 bullets per enemy
        const bullet = {
            ownerId: enemy.id, // Link bullet to the enemy that fired it
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height + 20,
            radius: BULLET_RADIUS,
            color: 'purple',
            dy: BULLET_SPEED,
            owner: 'enemy' // Keep this for general collision logic if needed
        };
        enemyBullets.push(bullet);
        enemy.bulletCount++; // Increment this enemy's bullet count
    }
}

function updatePlayerBullets() {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.y += bullet.dy;

        let bulletRemoved = false;
        for (let j = enemyTanks.length - 1; j >= 0; j--) {
            const enemy = enemyTanks[j];
            if (
                !gameOver &&
                bullet.y - bullet.radius < enemy.y + enemy.height &&
                bullet.y + bullet.radius > enemy.y &&
                bullet.x - bullet.radius < enemy.x + enemy.width &&
                bullet.x + bullet.radius > enemy.x
            ) {
                playerBullets.splice(i, 1);
                enemyTanks.splice(j, 1);
                score++;
                checkLevelUp();
                bulletRemoved = true;
                break;
            }
        }

        if (!bulletRemoved && bullet.y + bullet.radius < 0) {
             playerBullets.splice(i, 1);
        }
    }
}

function checkLevelUp() {
    const currentLevelBasedOnScore = Math.floor(score / SCORE_PER_LEVEL) + 1;
    if (currentLevelBasedOnScore > level) {
        level = currentLevelBasedOnScore;
        enemiesNeeded = level;
        console.log("Level Up! Reached Level: " + level);
    }
}


function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.y += bullet.dy;

        let bulletRemoved = false;

        // Check collision with player
        if (
            !gameOver &&
            bullet.y - bullet.radius < playerTank.y + playerTank.height &&
            bullet.y + bullet.radius > playerTank.y &&
            bullet.x - bullet.radius < playerTank.x + playerTank.width &&
            bullet.x + bullet.radius > playerTank.x
        ) {
            // Find owner tank and decrement its count
            const ownerTank = enemyTanks.find(tank => tank.id === bullet.ownerId);
            if (ownerTank) {
                ownerTank.bulletCount = Math.max(0, ownerTank.bulletCount - 1); // Decrement, ensure not negative
            }

            enemyBullets.splice(i, 1);
            bulletRemoved = true;
            endGame(false); // Player loses when hit
            continue; // Skip off-screen check if hit player
        }

        // Check if bullet went off-screen
        if (bullet.y - bullet.radius > canvas.height) {
            // Find owner tank and decrement its count
            const ownerTank = enemyTanks.find(tank => tank.id === bullet.ownerId);
            if (ownerTank) {
                ownerTank.bulletCount = Math.max(0, ownerTank.bulletCount - 1); // Decrement, ensure not negative
            }

            enemyBullets.splice(i, 1);
            bulletRemoved = true;
        }
    }
}

function drawBullets(bullets) {
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
        ctx.closePath();
    });
}

function drawScoreAndLevel() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 25);
    ctx.fillText('Level: ' + level, 10, 50);
}

function endGame(playerWon = false) { // Default to player losing
    gameOver = true;
    gameRunning = false;

    let endMessage = '';
    if (playerWon) {
        // This condition isn't currently triggered, but we add the structure
        endMessage = `YOU WIN!\nFinal Score: ${score}\nLevel: ${level}`;
        console.log(`Game Over - Player Wins! Final Score: ${score}, Level: ${level}`);
    } else {
        if (escapedTanks >= 3) {
            endMessage = `GAME OVER!\n3 Tanks Escaped!\nFinal Score: ${score}\nLevel: ${level}`;
            console.log(`Game Over - Player Loses (3 tanks escaped)! Final Score: ${score}, Level: ${level}`);
        } else {
            endMessage = `GAME OVER!\nTank Destroyed!\nFinal Score: ${score}\nLevel: ${level}`;
            console.log(`Game Over - Player Loses (tank destroyed)! Final Score: ${score}, Level: ${level}`);
        }
    }

    messageElement.innerText = endMessage;
    messageElement.style.display = 'block';
    startButton.innerText = 'Restart Game';
    startButton.style.display = 'block';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}


// Game loop
function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    spawnEnemies();

    movePlayerTank();
    moveEnemyTanks();
    updatePlayerBullets();
    updateEnemyBullets();

    drawTank(playerTank);
    enemyTanks.forEach(enemy => drawTank(enemy));
    drawBullets(playerBullets);
    drawBullets(enemyBullets);
    drawScoreAndLevel();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
    if (gameRunning) return;

    gameOver = false;
    gameRunning = true;
    score = 0;
    level = 1;
    enemiesNeeded = 1;
    escapedTanks = 0;
    // Removed nextEnemyId reset
    messageElement.style.display = 'none';
    startButton.style.display = 'none';
    canvas.style.display = 'block';

    playerTank.x = canvas.width / 2 - TANK_WIDTH / 2;
    playerTank.y = canvas.height - TANK_HEIGHT - 10;
    enemyTanks = [];
    playerBullets = [];
    enemyBullets = [];
    keys = {};

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    gameLoop();
    console.log("Tank Battle game started.");
}

startButton.addEventListener('click', startGame);

console.log("Tank Battle game script loaded. Press Start Game to play.");