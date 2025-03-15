document.addEventListener('DOMContentLoaded', () => {
    const chessboard = document.getElementById('chessboard');
    let currentPlayer = 'white'; // Track current player's turn
    let gameActive = true;
    
    // Add container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'none';
    buttonContainer.classList.add('button-container');
    document.body.appendChild(buttonContainer);

    function createGameOverButtons() {
        buttonContainer.innerHTML = `
            <div class="game-over-message">${currentPlayer === 'white' ? 'White' : 'Black'} wins!</div>
            <button class="restart-btn">Restart Game</button>
            <button class="exit-btn">Exit Game</button>
        `;
        
        buttonContainer.style.display = 'flex';
        
        // Add event listeners to buttons
        document.querySelector('.restart-btn').addEventListener('click', restartGame);
        document.querySelector('.exit-btn').addEventListener('click', exitGame);
    }

    function restartGame() {
        gameActive = true;
        currentPlayer = 'white';
        buttonContainer.style.display = 'none';
        // Clear the board
        chessboard.innerHTML = '';
        // Reinitialize the game
        initializeGame();
    }

    function exitGame() {
        // You can modify this to handle the exit action
        window.close();
        // Alternative: redirect to another page
        // window.location.href = 'exit.html';
    }

    function initializeGame() {
        const pieces = [
            '♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜',
            '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟',
            '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '',
            '', '', '', '', '', '', '', '',
            '♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙',
            '♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'
        ];

        pieces.forEach((piece, index) => {
            const square = document.createElement('div');
            square.classList.add('square');
            square.textContent = piece;
            square.dataset.index = index;
            square.dataset.piece = piece;
            // Set color property for pieces
            if (index < 16) square.dataset.color = 'black';
            if (index > 47) square.dataset.color = 'white';
            square.addEventListener('click', () => gameActive && selectSquare(square));
            chessboard.appendChild(square);
        });
    }

    let selectedSquare = null;

    function selectSquare(square) {
        // If no piece is selected and clicked square has a piece of current player's color
        if (!selectedSquare && square.textContent && square.dataset.color === currentPlayer) {
            selectedSquare = square;
            square.classList.add('selected');
            // Add visual feedback for valid moves
            highlightValidMoves(square);
        }
        // If a piece is selected
        else if (selectedSquare) {
            if (isValidMove(selectedSquare, square)) {
                movePiece(selectedSquare, square);
                currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
                // Remove all highlights
                removeHighlights();
            }
            selectedSquare.classList.remove('selected');
            selectedSquare = null;
        }
    }

    function highlightValidMoves(square) {
        const squares = document.querySelectorAll('.square');
        squares.forEach(targetSquare => {
            if (isValidMove(square, targetSquare)) {
                targetSquare.classList.add('valid-move');
            }
        });
    }

    function removeHighlights() {
        const squares = document.querySelectorAll('.square');
        squares.forEach(square => {
            square.classList.remove('valid-move');
        });
    }

    function isValidMove(fromSquare, toSquare) {
        const fromIndex = parseInt(fromSquare.dataset.index);
        const toIndex = parseInt(toSquare.dataset.index);
        const piece = fromSquare.textContent;
        const pieceColor = fromSquare.dataset.color;
        
        // Can't capture your own pieces
        if (toSquare.dataset.color === pieceColor) return false;

        // Get row and column for both squares
        const fromRow = Math.floor(fromIndex / 8);
        const fromCol = fromIndex % 8;
        const toRow = Math.floor(toIndex / 8);
        const toCol = toIndex % 8;

        // Check if path is clear (except for knights)
        if (!isPathClear(fromRow, fromCol, toRow, toCol, piece)) return false;

        // Movement rules for each piece
        switch (piece) {
            case '♟': // Black pawn
                if (pieceColor === 'black') {
                    if (toCol === fromCol && toRow === fromRow + 1 && !toSquare.textContent) return true;
                    if (fromRow === 1 && toCol === fromCol && toRow === fromRow + 2 && !toSquare.textContent) return true;
                    if (toRow === fromRow + 1 && Math.abs(toCol - fromCol) === 1 && toSquare.textContent) return true;
                }
                break;

            case '♙': // White pawn
                if (pieceColor === 'white') {
                    if (toCol === fromCol && toRow === fromRow - 1 && !toSquare.textContent) return true;
                    if (fromRow === 6 && toCol === fromCol && toRow === fromRow - 2 && !toSquare.textContent) return true;
                    if (toRow === fromRow - 1 && Math.abs(toCol - fromCol) === 1 && toSquare.textContent) return true;
                }
                break;

            case '♜': case '♖': // Rook
                if (toRow === fromRow || toCol === fromCol) return true;
                break;

            case '♝': case '♗': // Bishop
                if (Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) return true;
                break;

            case '♛': case '♕': // Queen
                if (toRow === fromRow || toCol === fromCol || 
                    Math.abs(toRow - fromRow) === Math.abs(toCol - fromCol)) return true;
                break;

            case '♚': case '♔': // King
                if (Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1) return true;
                break;

            case '♞': case '♘': // Knight
                const rowDiff = Math.abs(toRow - fromRow);
                const colDiff = Math.abs(toCol - fromCol);
                if ((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2)) return true;
                break;
        }

        return false;
    }

    function isPathClear(fromRow, fromCol, toRow, toCol, piece) {
        // Knights can jump over pieces
        if (piece === '♞' || piece === '♘') return true;

        const rowStep = fromRow === toRow ? 0 : (toRow - fromRow) / Math.abs(toRow - fromRow);
        const colStep = fromCol === toCol ? 0 : (toCol - fromCol) / Math.abs(toCol - fromCol);

        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;

        while (currentRow !== toRow || currentCol !== toCol) {
            const index = currentRow * 8 + currentCol;
            const square = document.querySelector(`[data-index="${index}"]`);
            if (square.textContent !== '') return false;
            currentRow += rowStep;
            currentCol += colStep;
        }

        return true;
    }

    function movePiece(fromSquare, toSquare) {
        const capturedPiece = toSquare.textContent;
        toSquare.textContent = fromSquare.textContent;
        toSquare.dataset.color = fromSquare.dataset.color;
        fromSquare.textContent = '';
        fromSquare.dataset.color = '';

        // Check if a king was captured
        if (capturedPiece === '♔' || capturedPiece === '♚') {
            gameActive = false;
            createGameOverButtons();
        }
    }

    // Initialize the game
    initializeGame();
});