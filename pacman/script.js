document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const scoreDisplay = document.querySelector('.score span');
    const startButton = document.getElementById('start-button'); // Get start button
    const width = 28; // 28 x 28 grid
    let score = 0;
    let squares = [];
    let pacmanCurrentIndex = 489; // Starting position
    let ghosts = [];
    let scaredTimer;
    let pacmanDirection = 1; // Start moving right (-1 left, 1 right, -width up, width down)
    let nextDirection = 1;   // Buffer for next intended direction change
    let gameIntervalId;      // To store the interval ID for the game loop
    let isMouthOpen = true; // Track Pac-Man's mouth state for animation

    // 0 - pac-dot
    // 1 - wall
    // 2 - ghost-lair
    // 3 - power-pellet
    // 4 - empty
    const layout = [
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1,
        1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1,
        1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,
        1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,1,
        4,4,4,4,4,4,0,0,0,4,1,2,2,2,2,2,2,1,4,0,0,0,4,4,4,4,4,4,
        1,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,1,
        1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,
        1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,
        1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,
        1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,
        1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
    ];

    // Create board
    function createBoard() {
        for (let i = 0; i < layout.length; i++) {
            const square = document.createElement('div');
            grid.appendChild(square);
            squares.push(square);

            if (layout[i] === 0) {
                squares[i].classList.add('pac-dot');
            } else if (layout[i] === 1) {
                squares[i].classList.add('wall');
            } else if (layout[i] === 2) {
                squares[i].classList.add('ghost-lair');
            } else if (layout[i] === 3) {
                squares[i].classList.add('power-pellet');
            }
        }
    }
    createBoard();

    // Add initial pacman class and direction
    squares[pacmanCurrentIndex].classList.add('pacman', 'pacman-right');

    // Function to update Pacman's visual state (class and rotation)
    function updatePacmanVisuals() {
        // Remove previous direction and mouth state classes
        squares[pacmanCurrentIndex].classList.remove('pacman-left', 'pacman-right', 'pacman-up', 'pacman-down', 'pacman-open', 'pacman-closed');

        // Add current direction class
        if (pacmanDirection === -1) squares[pacmanCurrentIndex].classList.add('pacman-left');
        else if (pacmanDirection === 1) squares[pacmanCurrentIndex].classList.add('pacman-right');
        else if (pacmanDirection === -width) squares[pacmanCurrentIndex].classList.add('pacman-up');
        else if (pacmanDirection === width) squares[pacmanCurrentIndex].classList.add('pacman-down');

        // Add current mouth state class
        if (isMouthOpen) squares[pacmanCurrentIndex].classList.add('pacman-open');
        else squares[pacmanCurrentIndex].classList.add('pacman-closed'); // Assuming default is closed or we add specific closed style
    }

    // Function to move Pacman automatically based on pacmanDirection
    function movePacmanAuto() {
        // Remove pacman class from current square BEFORE calculating next move
        squares[pacmanCurrentIndex].classList.remove('pacman', 'pacman-left', 'pacman-right', 'pacman-up', 'pacman-down', 'pacman-open', 'pacman-closed');

        const potentialNextIndex = pacmanCurrentIndex + pacmanDirection;

        // Check for walls and ghost lair at the potential next index
        if (
            squares[potentialNextIndex] && // Ensure potentialNextIndex is valid
            !squares[potentialNextIndex].classList.contains('wall') &&
            !squares[potentialNextIndex].classList.contains('ghost-lair')
        ) {
            // Check for tunnels
            if (pacmanDirection === -1 && pacmanCurrentIndex % width === 0) { // Going left into left tunnel
                 pacmanCurrentIndex = pacmanCurrentIndex + (width - 1);
            } else if (pacmanDirection === 1 && pacmanCurrentIndex % width === width - 1) { // Going right into right tunnel
                 pacmanCurrentIndex = pacmanCurrentIndex - (width - 1);
            } else {
                pacmanCurrentIndex = potentialNextIndex; // Normal move
            }
        }
        // If moving into a wall, Pacman stops but stays facing the wall direction (index doesn't change)

        // Add pacman class to the new/current square
        squares[pacmanCurrentIndex].classList.add('pacman');

        // Update visuals (direction rotation and mouth) AFTER setting the new index
        updatePacmanVisuals();

        // Toggle mouth state for the next frame
        isMouthOpen = !isMouthOpen;

        // Note: Eating dots/pellets and checking game state are now handled in gameLoop
    }


    function pacDotEaten() {
        if (squares[pacmanCurrentIndex].classList.contains('pac-dot')) {
            score++;
            scoreDisplay.textContent = score;
            squares[pacmanCurrentIndex].classList.remove('pac-dot');
            squares[pacmanCurrentIndex].style.backgroundColor = '';
            squares[pacmanCurrentIndex].style.border = '';
        }
    }

    function powerPelletEaten() {
        if (squares[pacmanCurrentIndex].classList.contains('power-pellet')) {
            score += 10;
            scoreDisplay.textContent = score;
            squares[pacmanCurrentIndex].classList.remove('power-pellet');
            squares[pacmanCurrentIndex].style.backgroundColor = '';
            squares[pacmanCurrentIndex].style.border = '';
            ghosts.forEach(ghost => ghost.isScared = true);
            clearTimeout(scaredTimer);
            scaredTimer = setTimeout(unScareGhosts, 10000);
        }
    }

    function unScareGhosts() {
        ghosts.forEach(ghost => ghost.isScared = false);
    }

    class Ghost {
        constructor(className, startIndex, speed) {
            this.className = className;
            this.startIndex = startIndex;
            this.speed = speed;
            this.currentIndex = startIndex;
            this.isScared = false;
            this.timerId = NaN;
        }
    }

    ghosts = [
        new Ghost('blinky', 348, 250),
        new Ghost('pinky', 376, 400),
        new Ghost('inky', 351, 300),
        new Ghost('clyde', 379, 500)
    ];

    ghosts.forEach(ghost => {
        squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');
    });

    function moveGhost(ghost) {
        ghost.timerId = setInterval(function() {
            const directions = [-1, +1, -width, +width];
            let direction = directions[Math.floor(Math.random() * directions.length)];
            let nextIndex = ghost.currentIndex + direction;

            // Check if nextIndex is valid and not a wall or another ghost
            if (squares[nextIndex] &&
                !squares[nextIndex].classList.contains('wall') &&
                !squares[nextIndex].classList.contains('ghost')) {

                squares[ghost.currentIndex].classList.remove(ghost.className, 'ghost', 'scared-ghost');
                ghost.currentIndex = nextIndex;
                squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');

                if (ghost.isScared) {
                    squares[ghost.currentIndex].classList.add('scared-ghost');
                }

                // Check for collision with Pacman after moving
                if (ghost.isScared && squares[ghost.currentIndex].classList.contains('pacman')) {
                    squares[ghost.currentIndex].classList.remove(ghost.className, 'ghost', 'scared-ghost');
                    score += 100;
                    scoreDisplay.textContent = score;
                    ghost.currentIndex = ghost.startIndex; // Reset ghost position
                    squares[ghost.currentIndex].classList.add(ghost.className, 'ghost'); // Re-add ghost class at start index
                }
                checkForGameOver(); // Check game over after ghost moves
            }
        }, ghost.speed);
    }


    function checkForGameOver() {
        if (squares[pacmanCurrentIndex].classList.contains('ghost') &&
            !squares[pacmanCurrentIndex].classList.contains('scared-ghost')) {
            ghosts.forEach(ghost => clearInterval(ghost.timerId));
            document.removeEventListener('keydown', control); // Remove direction control listener
            clearInterval(gameIntervalId); // Stop the game loop
            scoreDisplay.innerHTML = ' GAME OVER! Final Score: ' + score;
        }
    }

     function checkForWin() {
        // Check if there are any squares left that contain the 'pac-dot' class
        if (!squares.some(square => square.classList.contains('pac-dot'))) {
             ghosts.forEach(ghost => clearInterval(ghost.timerId));
             document.removeEventListener('keydown', control); // Remove direction control listener
             clearInterval(gameIntervalId); // Stop the game loop
             scoreDisplay.innerHTML = ' YOU WIN! Final Score: ' + score;
        }
    }
    // Function to handle key presses for direction change
    function control(e) {
        switch(e.keyCode) {
            case 37: // Left
                nextDirection = -1;
                break;
            case 38: // Up
                nextDirection = -width;
                break;
            case 39: // Right
                nextDirection = 1;
                break;
            case 40: // Down
                nextDirection = width;
                break;
        }
    }

    // Game loop function
    function gameLoop() {
        // Try to change direction based on buffered input
        const potentialNextDirIndex = pacmanCurrentIndex + nextDirection;
        if (squares[potentialNextDirIndex] && // Ensure potential index is valid
            !squares[potentialNextDirIndex].classList.contains('wall') &&
            !squares[potentialNextDirIndex].classList.contains('ghost-lair')) {
            pacmanDirection = nextDirection;
        }

        // Move Pacman automatically (includes visual updates now)
        movePacmanAuto();

        // Check game state AFTER Pacman moves
        pacDotEaten();
        powerPelletEaten();
        checkForGameOver(); // Check game over after Pacman moves
        checkForWin(); // Check for win condition in the loop
    }


    // Function to start the game
    function startGame() {
        // Reset score and display
        score = 0;
        scoreDisplay.textContent = score;
        // Clear any previous game over/win message
        // scoreDisplay.innerHTML = `Score: <span>${score}</span>`; // If you want to reset to initial format

        // Reset Pacman position and direction
        squares[pacmanCurrentIndex].classList.remove('pacman', 'pacman-left', 'pacman-right', 'pacman-up', 'pacman-down', 'pacman-open', 'pacman-closed');
        pacmanCurrentIndex = 489;
        pacmanDirection = 1;
        nextDirection = 1;
        isMouthOpen = true;
        squares[pacmanCurrentIndex].classList.add('pacman', 'pacman-right');

        // Reset ghosts
        ghosts.forEach(ghost => {
            clearInterval(ghost.timerId); // Clear any existing interval
            squares[ghost.currentIndex].classList.remove(ghost.className, 'ghost', 'scared-ghost');
            ghost.currentIndex = ghost.startIndex;
            ghost.isScared = false;
            squares[ghost.currentIndex].classList.add(ghost.className, 'ghost');
        });

        // Re-create board state (dots, pellets) - might be needed if game modifies layout visually
        // This example assumes layout is static, but if dots are removed visually, they need reset
        // A more robust reset would re-run createBoard or reset classes based on layout array

        // Start ghost movement
        ghosts.forEach(ghost => moveGhost(ghost));
        // Add Pacman direction controls
        document.addEventListener('keydown', control);
        // Start the game loop for automatic movement
        // Clear any existing game loop before starting a new one
        clearInterval(gameIntervalId);
        gameIntervalId = setInterval(gameLoop, 200); // Adjust speed as needed (e.g., 200ms)

        // Re-enable and set text for the start button (optional, depends on desired flow)
        // startButton.disabled = false;
        // startButton.textContent = 'Restart Game';

        // Or keep it disabled after first start
         startButton.disabled = true;
         startButton.textContent = 'Game Running';
    }

    // Add event listener to the start button
    startButton.addEventListener('click', startGame);

});