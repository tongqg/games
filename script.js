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
            return;
        }

        if (checkDraw()) {
            updateMessage(`平局!`);
            gameActive = false;
            return;
        }

        switchPlayer();

        if (gameMode === 'single' && currentPlayer === 'O') {
            // Computer's turn
            setTimeout(computerMove, 500); // Delay computer move for better UX
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

        let bestMove;
        let bestScore = -Infinity;

        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O'; // Simulate computer placing 'O'
                let score = minimax(board, 0, -Infinity, Infinity, false);
                board[i] = ''; // Undo move
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        const computerCell = cells[bestMove];
        placePiece(computerCell, bestMove, 'O');
        moves++;

        if (checkWin()) {
            updateMessage(`电脑 赢了!`);
            gameActive = false;
            return;
        }

        if (checkDraw()) {
            updateMessage(`平局!`);
            gameActive = false;
            return;
        }

        switchPlayer();
    }

    function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
            let scores = {
                'X': -10,
                'O': 10,
                'draw': 0
            };
    
            if (checkWinForMinimax('O', board)) {
                return scores['O'];
            }
            if (checkWinForMinimax('X', board)) {
                return scores['X'];
            }
            if (isBoardFull(board)) {
                return scores['draw'];
            }
    
            if (isMaximizingPlayer) {
                let bestScore = -Infinity;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === '') {
                        board[i] = 'O';
                        let score = minimax(board, depth + 1, alpha, beta, false);
                        board[i] = '';
                        bestScore = Math.max(score, bestScore);
                        alpha = Math.max(alpha, bestScore); // Alpha-beta pruning line
                        if (beta <= alpha) {         // Beta cut-off
                            break;
                        }
                    }
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === '') {
                        board[i] = 'X';
                        let score = minimax(board, depth + 1, alpha, beta, true);
                        board[i] = '';
                        bestScore = Math.min(score, bestScore);
                        beta = Math.min(beta, bestScore);  // Beta update
                        if (beta <= alpha) {         // Alpha cut-off
                            break;
                        }
                    }
                }
                return bestScore;
            }
        }

    function checkWinForMinimax(player, board) {
        return winningConditions.some(condition => {
            return condition.every(index => {
                return board[index] === player;
            });
        });
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