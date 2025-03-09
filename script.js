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
        updateMessage(`轮到 ${currentPlayer}`);
    }

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
        updateMessage(`轮到 ${currentPlayer}`);
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
        return false; // 平局 removed
    }

    function switchPlayer() {
        clearHighlights(); // Clear previous highlights
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        highlightOldestPieceToRemove(currentPlayer); // Highlight for the next player
    }

    function updateMessage(message) {
        messageDisplay.textContent = message;
    }


    initGame();
});