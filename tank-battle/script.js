class TankGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.gameObjects = [];
        this.score = 0;
        
        this.player = {
            x: 400,
            y: 300,
            width: 40,
            height: 30,
            speed: 5,
            lastShot: 0,
            direction: 0
        };

        this.spawnEnemy();
        this.setupControls();
        this.gameLoop();
    }

    setupControls() {
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);
    }

    spawnEnemy() {
        this.gameObjects.push({
            type: 'enemy',
            x: Math.random() * this.canvas.width,
            y: -50,
            width: 35,
            height: 35,
            speed: 2,
            health: 2
        });
    }

    handleInput() {
        // Tank movement
        if (this.keys.ArrowUp) this.player.y -= this.player.speed;
        if (this.keys.ArrowDown) this.player.y += this.player.speed;
        if (this.keys.ArrowLeft) this.player.x -= this.player.speed;
        if (this.keys.ArrowRight) this.player.x += this.player.speed;

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));

        // Shooting
        if (this.keys[' '] && Date.now() - this.player.lastShot > 500) {
            this.gameObjects.push({
                type: 'bullet',
                x: this.player.x + this.player.width/2,
                y: this.player.y,
                width: 5,
                height: 10,
                speed: -8
            });
            this.player.lastShot = Date.now();
        }
    }

    update() {
        // Update game objects
        this.gameObjects.forEach((obj, index) => {
            if (obj.type === 'enemy') {
                obj.y += obj.speed;
                if (obj.y > this.canvas.height) this.gameObjects.splice(index, 1);
            }
            
            if (obj.type === 'bullet') {
                obj.y += obj.speed;
                if (obj.y < -10) this.gameObjects.splice(index, 1);
            }

            // Collision detection
            if (obj.type === 'enemy' && this.checkCollision(this.player, obj)) {
                this.gameOver();
            }

            if (obj.type === 'bullet' && this.gameObjects.some((enemy, enemyIndex) => {
                if (enemy.type === 'enemy' && this.checkCollision(obj, enemy)) {
                    this.score += 100;
                    this.gameObjects.splice(index, 1); // Remove the bullet
                    this.gameObjects.splice(enemyIndex, 1); // Remove the enemy
                    return true; // Stop iterating after the first collision
                }
                return false;
            })) {}
        });

        // Spawn new enemies periodically
        if (Math.random() < 0.02) this.spawnEnemy();
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw game objects
        this.gameObjects.forEach(obj => {
            this.ctx.fillStyle = obj.type === 'enemy' ? '#e74c3c' : '#f1c40f';
            this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        });

        // Draw score
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    }

    gameOver() {
        alert(`Game Over! Score: ${this.score}`);
        window.location.reload();
    }

    gameLoop() {
        this.handleInput();
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game
new TankGame();