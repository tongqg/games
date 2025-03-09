document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.cell');
    const messageDisplay = document.getElementById('message');
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let xPieces = [];
    let oPieces = [];
    let gameActive = true;
    let moves = 0; // Track total moves

    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    function initGame() {
        cells.forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });
    }

    let gameMode = 'single'; // Default mode is two-player

    function handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.dataset.index);

        if (!gameActive || board[clickedCellIndex] !== '') {
            return;
        }

        placePiece(clickedCell, clickedCellIndex, currentPlayer);
        moves++; // Increment moves

        if (checkWin()) {
            updateMessage(`${currentPlayer} 赢了!`);
            gameActive = false;
            document.getElementById('thinking-indicator').style.display = 'none'; // Hide thinking indicator
            return;
        }

        if (checkDraw()) {
            updateMessage(`平局!`);
            gameActive = false;
            document.getElementById('thinking-indicator').style.display = 'none'; // Hide thinking indicator
            return;
        }

        switchPlayer();

        if (gameMode === 'single' && currentPlayer === 'O') {
            // Computer's turn
            document.getElementById('thinking-indicator').style.display = 'block';
            setTimeout(computerMove, 700); // Slightly longer delay to show thinking state
        }
    }

    function placePiece(cell, index, player) {
        board[index] = player;
        cell.classList.add(player.toLowerCase());

        const pieceArray = (player === 'X') ? xPieces : oPieces;
        pieceArray.push(index);

        if (pieceArray.length >= 3) {
            highlightOldestPieceToRemove(player);
        }

        if (pieceArray.length > 3) {
            removeOldestPiece(player);
        }
    }

    function highlightOldestPieceToRemove(player) {
        clearHighlights(); // Clear any existing highlights
        const pieceArray = (player === 'X') ? xPieces : oPieces;
        if (pieceArray.length >= 3) {
            const oldestPieceIndex = pieceArray[0]; // Get the oldest piece index
            cells.forEach(cell => {
                if (parseInt(cell.dataset.index) === oldestPieceIndex) {
                    cell.classList.add('remove-highlight'); // Add highlight class
                }
            });
        }
    }

    function clearHighlights() {
        cells.forEach(cell => {
            cell.classList.remove('remove-highlight'); // Remove highlight class
        });
    }


    function removeOldestPiece(player) {
        const pieceArray = (player === 'X') ? xPieces : oPieces;
        const oldestPieceIndex = pieceArray.shift(); // Remove and return first element
        board[oldestPieceIndex] = ''; // Clear from board array

        cells.forEach(cell => {
            if (parseInt(cell.dataset.index) === oldestPieceIndex) {
                cell.classList.remove((player === 'X' ? 'x' : 'o')); // Remove piece visual
                cell.classList.remove('remove-highlight'); // Remove highlight
            }
        });
    }


    function checkWin() {
        return winningConditions.some(condition => {
            return condition.every(index => {
                return board[index] === currentPlayer;
            });
        });
    }

    function checkDraw() {
        return false;
    }

    function switchPlayer() {
        clearHighlights(); // Clear previous highlights
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        highlightOldestPieceToRemove(currentPlayer); // Highlight for the next player
    }

    function computerMove() {
        if (!gameActive) return;

        // First check for immediate win
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                const testBoard = [...board];
                testBoard[i] = 'O';
                if (checkWinForMinimax('O', testBoard)) {
                    return executeComputerMove(i);
                }
            }
        }

        // Then block player win
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                const testBoard = [...board];
                testBoard[i] = 'X';
                if (checkWinForMinimax('X', testBoard)) {
                    return executeComputerMove(i);
                }
            }
        }

        // Check potential threats after piece removal
        const threatPositions = checkPotentialThreats();
        if (threatPositions.length > 0) {
            return executeComputerMove(threatPositions[0]);
        }

        // Updated heuristic: center first, then threats, then corners, then others
        const movePriority = [4, ...threatPositions, 0, 2, 6, 8, 1, 3, 5, 7];
        for (const i of movePriority) {
            if (board[i] === '') {
                return executeComputerMove(i);
            }
        }

        const computerCell = cells[bestMove];
        placePiece(computerCell, bestMove, 'O');
        moves++;

        if (checkWin()) {
            updateMessage(`电脑 赢了!`);
            gameActive = false;
            document.getElementById('thinking-indicator').style.display = 'none'; // Hide thinking indicator
            return;
        }

        if (checkDraw()) {
            updateMessage(`平局!`);
            gameActive = false;
            document.getElementById('thinking-indicator').style.display = 'none'; // Hide thinking indicator
            return;
        }

        switchPlayer();
    }

    function executeComputerMove(index) {
        const computerCell = cells[index];
        placePiece(computerCell, index, 'O');
        moves++;

        if (checkWin()) {
            updateMessage(`电脑 赢了!`);
            gameActive = false;
            document.getElementById('thinking-indicator').style.display = 'none'; // Hide thinking indicator
            return;
        }

        if (checkDraw()) {
            updateMessage(`平局!`);
            gameActive = false;
            document.getElementById('thinking-indicator').style.display = 'none'; // Hide thinking indicator
            return;
        }

        switchPlayer();
        document.getElementById('thinking-indicator').style.display = 'none';
    }

    function checkWinForMinimax(player, board) {
        return winningConditions.some(condition => {
            return condition.every(index => {
                return board[index] === player;
            });
        });
    }

    function checkPotentialThreats() {
        const threats = new Set();
        
        // Simulate removal of each existing X piece
        xPieces.forEach((index) => {
            const simulatedBoard = [...board];
            simulatedBoard[index] = ''; // Remove this X piece
            
            // Check what moves would create wins for X in this state
            for (let i = 0; i < simulatedBoard.length; i++) {
                if (simulatedBoard[i] === '') {
                    const testBoard = [...simulatedBoard];
                    testBoard[i] = 'X';
                    if (checkWinForMinimax('X', testBoard)) {
                        threats.add(i); // This position needs to be blocked
                    }
                }
            }
        });

        return Array.from(threats);
    }

    function isBoardFull(board) {
        return board.every(cell => cell !== '');
    }

    function updateMessage(message) {
        const overlay = document.getElementById('game-message-overlay');
        const messageDisplay = document.getElementById('message');
        if (message.includes('赢了') || message === '平局!') {
            overlay.textContent = message;
            overlay.classList.add('show'); // 显示覆盖层 for game end messages
            messageDisplay.textContent = ''; // Clear original message area when overlay is shown
        } else {
            overlay.classList.remove('show'); // 确保覆盖层隐藏 for other messages
            messageDisplay.textContent = message; // Display other messages in the original message area
        }
    }


    initGame();
    updateMessage('单人模式');

    // Restart Button Functionality
    const restartButton = document.getElementById('restart-button');
    restartButton.addEventListener('click', restartGame);

    function restartGame() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        xPieces = [];
        oPieces = [];
        gameActive = true;
        moves = 0; // Reset moves
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'remove-highlight');
        });
        updateMessage(``);
        const overlay = document.getElementById('game-message-overlay'); // Get overlay element
        overlay.classList.remove('show'); // Ensure overlay is hidden on restart
        initGame(); // Re-initialize the game to attach event listeners
    }

    // Mode Selection Buttons
    const modeSelect = document.getElementById('mode-select');

    modeSelect.addEventListener('change', () => {
        gameMode = modeSelect.value;
        restartGame();
        updateMessage(gameMode === 'single' ? '单人模式' : '双人模式');
    });
});