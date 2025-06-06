const playerEl = document.getElementById("player");
let turn;
const COLS = 8, ROWS = 8;
const initialBoard = 
[
    ['BR', 'BN', 'BB', 'BK', 'BQ', 'BB', 'BN', 'BR'],
    Array(COLS).fill('BP'),
    Array(COLS).fill(null),
    Array(COLS).fill(null),
    Array(COLS).fill(null),
    Array(COLS).fill(null),
    Array(COLS).fill('WP'),
    ['WR', 'WN', 'WB', 'WK', 'WQ', 'WB', 'WN', 'WR']
]
const pieceMap = {
  WP: 'wp.svg',
  WR: 'wr.svg',
  WN: 'wn.svg',
  WB: 'wb.svg',
  WQ: 'wq.svg',
  WK: 'wk.svg',
  BP: 'bp.svg',
  BR: 'br.svg',
  BN: 'bn.svg',
  BB: 'bb.svg',
  BQ: 'bq.svg',
  BK: 'bk.svg',
};
const boardEl = document.getElementById("board");
let boardSquaresEl;

function setupBoard() {
    for(let row = 0; row < ROWS; row++){
        for(let col = 0; col < COLS; col++){
            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add(((row + col) % 2 === 0) ? 'light' : 'dark');
            square.setAttribute("data-c-pos", (col + (row * COLS)));
            const piece = initialBoard[row][col];
            if(piece) {
                const img = document.createElement("img");
                img.src = `assets/images/${pieceMap[piece]}`;
                img.alt = piece;
                img.classList.add("piece");
                img.setAttribute("data-c-color", piece[0] === 'B' ? 'black' : 'white');
                img.setAttribute("data-c-piece", piece[1]);
                img.addEventListener('dragstart', (e)=>handleDragStart(e));
                square.appendChild(img);
            }
            square.addEventListener('dragover', (e)=>handleDragOver(e));
            square.addEventListener('drop', (e)=>handleDrop(e));
            board.appendChild(square);
        }
    }
    boardSquaresEl = document.querySelectorAll('#board div.square');
}

function nextTurn() {
    if(turn === undefined) {
        turn = 'white'; //white first
    }
    else {
        turn = turn === 'white' ? 'black' : 'white';
    }
    
    document.querySelectorAll(".piece").forEach((piece) => {
        if(piece.getAttribute("data-c-color") === turn) {
            piece.setAttribute("draggable", true);
        }
        else {
            piece.setAttribute("draggable", false);
        }
    });

    playerEl.innerText = captializeString(turn);
}

function captializeString(str) {
    if(!str) return '';
    return str[0].toUpperCase() + str.slice(1);
}

let dragStartEl;
function handleDragStart(e) {
    dragStartEl = e.target;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    let startPos = dragStartEl.parentElement.getAttribute("data-c-pos");
    let piece = dragStartEl.getAttribute("data-c-piece");
    let color = dragStartEl.getAttribute("data-c-color");

    if(e.target.tagName === 'DIV') {
        let endPos = e.target.getAttribute("data-c-pos");
        if(!isValidMove(startPos, endPos, piece, color)) return;
        e.target.appendChild(dragStartEl);
    }
    else if(e.target.tagName === 'IMG') {
        let endPos = e.target.parentElement.getAttribute("data-c-pos");
        if(!isValidMove(startPos, endPos, piece, color)) return;
        e.target.parentElement.appendChild(dragStartEl);
        e.target.remove();
    }
    if(isGameOver()) {
        alert(`${captializeString(turn)} won!`);
    }
    nextTurn();
}

function isValidMove(startPos, endPos, piece, color) {
    //cant move same square
    if(startPos === endPos) return false;

    switch(piece) {
        case 'P':
            return isValidPawnMove(startPos, endPos, color);
        case 'R':
            return isValidRookMove(startPos, endPos, color);
        case 'K':
            return isValidKingMove(startPos, endPos, color);
        case 'N':
            return isValidKnightMove(startPos, endPos, color);
        case 'B':
            return isValidBishopMove(startPos, endPos, color);
        case 'Q':
            return isValidRookMove(startPos, endPos, color) || isValidBishopMove(startPos, endPos, color);
    }

    return false;
}

function isValidPawnMove(startPos, endPos, color) {
    const start = toRowCol(startPos);
    const end = toRowCol(endPos);
    const direction = color === 'white' ? -1 : 1; //white moves up, black moves down
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;
    const targetPiece = boardSquaresEl[endPos].firstChild;
    const targetPieceColor = targetPiece?.getAttribute("data-c-color");

    //1. move fwd (1 square)
    if(colDiff === 0 && rowDiff === direction && targetPiece === null) return true;

    //2. move fwd first move (2 squares)
    const startingRow = color === 'white' ? 6 : 1;
    const betweenPos = (start.row + direction) * 8 + start.col;
    if(
        start.row === startingRow && 
        colDiff === 0 && 
        rowDiff === direction * 2 &&
        targetPiece === null &&
        boardSquaresEl[betweenPos].firstChild === null
    ) {
        return true;
    }

    //3. diagonal capture
    if(
        Math.abs(colDiff) === 1 &&
        rowDiff === direction &&
        targetPiece !== null &&
        color !== targetPieceColor
    ) {
        return true;
    }

    //TODO: 4. en passant
}

function isValidRookMove(startPos, endPos, color) {
    const start = toRowCol(startPos);
    const end = toRowCol(endPos);
    const targetPiece = boardSquaresEl[endPos].firstChild;
    const targetPieceColor = targetPiece?.getAttribute("data-c-color");

    //must be straight line
    if(start.row !== end.row &&
        start.col !== end.col
    ) {
        return false;
    }

    //cant capture same color
    if(targetPiece && targetPieceColor === color) {
        return false;
    }

    //path is clear (no piece in between)
    const rowStep = end.row > start.row ? 1 : end.row < start.row ? -1 : 0;
    const colStep = end.col > start.col ? 1 : end.col < start.col ? -1 : 0;

    let currentRow = start.row + rowStep;
    let currentCol = start.col + colStep;

    while (currentRow !== end.row || currentCol !== end.col) {
        const intermediatePos = currentRow * 8 + currentCol;
        const squareEl = boardSquaresEl[intermediatePos];
        if (squareEl.firstChild) {
            return false; // Something is blocking the path
        }

        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}

function isValidBishopMove(startPos, endPos, color) {
    const start = toRowCol(startPos);
    const end = toRowCol(endPos);
    const targetPiece = boardSquaresEl[endPos].firstChild;
    const targetPieceColor = targetPiece?.getAttribute("data-c-color");

    //must move diagonally
    if (Math.abs(start.row - end.row) !== Math.abs(start.col - end.col)) {
        return false;
    }

    //cant capture same color
    if (targetPiece && targetPieceColor === color) {
        return false;
    }

    //check path is clear
    const rowStep = end.row > start.row ? 1 : -1;
    const colStep = end.col > start.col ? 1 : -1;

    let currentRow = start.row + rowStep;
    let currentCol = start.col + colStep;

    while (currentRow !== end.row && currentCol !== end.col) {
        const intermediatePos = currentRow * 8 + currentCol;
        const squareEl = boardSquaresEl[intermediatePos];
        if (squareEl.firstChild) {
            return false;
        }

        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}

function isValidKingMove(startPos, endPos, color) {
    const start = toRowCol(startPos);
    const end = toRowCol(endPos);
    const targetPiece = boardSquaresEl[endPos].firstChild;
    const targetColor = targetPiece?.getAttribute("data-c-color");

    const rowDiff = Math.abs(start.row - end.row);
    const colDiff = Math.abs(start.col - end.col);

    //1. move 1 square any direction
    if (rowDiff > 1 || colDiff > 1) {
        return false;
    }

    //cant capture same color
    if (targetPiece && targetColor === color) {
        return false;
    }

    return true;
}

function isValidKnightMove(startPos, endPos, color) {
    const start = toRowCol(startPos);
    const end = toRowCol(endPos);
    const targetPiece = boardSquaresEl[endPos].firstChild;
    const targetColor = targetPiece?.getAttribute("data-c-color");

    const rowDiff = Math.abs(start.row - end.row);
    const colDiff = Math.abs(start.col - end.col);

    //move L shape (2x1 or 1x2)
    const isLShape = (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    if (!isLShape) {
        return false;
    }

    //cant capture same color
    if (targetPiece && targetColor === color) {
        return false;
    }

    return true;
}

function toRowCol(pos) {
    return {
        row: Math.floor(pos / 8),
        col: pos % 8
    };
}

function toPos(row, col) {
    return row * COLS + col;
}

document.getElementById("reset").addEventListener('click', function () {
    window.location.reload();
});

//is king missing
function isGameOver() {
    for (let squareEl of boardSquaresEl) {
        if(
            squareEl.firstChild &&
            (squareEl.firstChild.getAttribute("data-c-color") === (turn === 'white' ? 'black' : 'white')) &&
            (squareEl.firstChild.getAttribute("data-c-piece") === 'K')
        ){
            return false;
        }
    };

    return true;
}

setupBoard();
nextTurn();