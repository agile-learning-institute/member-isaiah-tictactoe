const Gameboard = (function () {
    const AIR = 0;
    const MARKER_P1 = 1;
    const MARKER_P2 = 2;
    const SIZE = 3;
    const COLUMNS = SIZE;
    const ROWS = SIZE;

    const board = [];
    for (let r = 0; r < ROWS; r++) {
        board[r] = new Array(COLUMNS).fill(0);
    }

    const getBoard = () => board;
    const updateBoard = (marker, row, col) => {
        if (row >= ROWS || col >= COLUMNS)
            return;

        board[row][col] = marker;
    }
    const printBoard = () => {
        for (row of board) {
            console.log(row);
        }
    }
    const resetBoard = () => {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLUMNS; c++) {
                updateBoard(AIR, r, c);
            }
        }
    }

    return {
        getBoard,
        updateBoard,
        printBoard,
        resetBoard,
        AIR,
        MARKER_P1,
        MARKER_P2,
        COLUMNS,
        ROWS,
        SIZE,
    }
})();

const GameController = (function () {
    const MUST_MATCH = 3;
    let currentMarker = Gameboard.MARKER_P1;
    const ST_PLAY = "play";
    const ST_HASTIE = "has tie";
    const ST_HASWINNER = "has winner";
    let status = ST_PLAY;
    let winner = null;
    let winningCells = [];

    let scores = {
        "p1": 0,
        "p2": 0,
        "ties": 0,
    }

    const play = (row, col) => {
        if (status === ST_PLAY) {
            const isValidMove = placeMarker(row, col);

            if (isValidMove) {
                winner = checkWinner(Gameboard.getBoard(), currentMarker);
                if (winner !== null) {
                    status = ST_HASWINNER;
                    winner = currentMarker;
                    addScore();
                }
                else {
                    if (!hasFreeSpace()) {
                        status = ST_HASTIE;
                        addScore();
                    }

                    switchMarker();
                }
            }
        }
    }

    const checkWinner = (board, currentMarker) => {
        const size = Gameboard.SIZE;
        const rows = Gameboard.ROWS;
        const cols = Gameboard.COLUMNS;
    
        const checkLine = (cells) => {
            let matches = 0;
            winningCells = [];
    
            for (const [r, c] of cells) {
                if (board[r][c] === currentMarker) {
                    matches++;
                    winningCells.push([r, c]);
                } else {
                    winningCells = [];
                    break;
                }
            }
    
            return matches === MUST_MATCH;
        };
    
        for (let c = 0; c < cols; c++) {
            const cells = Array.from({ length: rows }, (_, r) => [r, c]);
            if (checkLine(cells)) return currentMarker;
        }
    
        for (let r = 0; r < rows; r++) {
            const cells = Array.from({ length: cols }, (_, c) => [r, c]);
            if (checkLine(cells)) return currentMarker;
        }

        const mainDiagonal = Array.from({ length: size }, (_, i) => [i, i]);
        if (checkLine(mainDiagonal)) return currentMarker;
    
        const antiDiagonal = Array.from({ length: size }, (_, i) => [i, size - 1 - i]);
        if (checkLine(antiDiagonal)) return currentMarker;
    
        return null;
    };
    

    const hasFreeSpace = () => {
        for (const col of Gameboard.getBoard()) {
            if (col.includes(Gameboard.AIR))
                return true;
            else
                continue;
        }

        return false;
    }

    const switchMarker = () => {
        currentMarker = currentMarker === Gameboard.MARKER_P1
            ? Gameboard.MARKER_P2
            : Gameboard.MARKER_P1;
    }

    const placeMarker = (row, col) => {
        if (Gameboard.getBoard()[row][col] === Gameboard.AIR) {
            Gameboard.updateBoard(currentMarker, row, col);
            return true;
        }
        else {
            return false;
        }
    };

    const addScore = () => {
        switch (status) {
            case ST_HASWINNER:
                winner === Gameboard.MARKER_P1 ? scores["p1"]++ : scores["p2"]++;
                break;
            case ST_HASTIE:
                scores["ties"]++;
                break;
        }
    }

    const reset = () => {
        winner = null;
        status = ST_PLAY;
        currentMarker = Gameboard.MARKER_P1;
        Gameboard.resetBoard();
        clearWinningCells();
    }

    const resetScores = () => {
        scores["p1"] = 0;
        scores["p2"] = 0;
        scores["ties"] = 0;
    }

    const getScore = (query) => {
        return scores[query];
    }

    const getStatus = () => {
        return status;
    }

    const getWinner = () => {
        return winner;
    }

    const getWinningCells = () => {
        return winningCells;
    }

    const clearWinningCells = () => {
        winningCells = [];
    }

    return {
        play,
        getStatus,
        getWinner,
        getScore,
        getWinningCells,
        reset,
        resetScores,
        ST_PLAY,
        ST_HASTIE,
        ST_HASWINNER,
    }
})();

const GUIHandler = (() => {
    const P1_TEXT = "close";
    const P2_TEXT = "circle";
    const container = document.querySelector("#board");

    let alreadyInit = false;
    let p1Name, p2Name;

    const $ = (selector) => document.querySelector(selector);

    const initialize = () => {
        $("form>button").addEventListener("click", (e) => {
            e.preventDefault();

            p1Name = $("#p1_name").value || "Player 1";
            p2Name = $("#p2_name").value || "Player 2";

            $("#nameP1").textContent = p1Name;
            $("#nameP2").textContent = p2Name;
            $("#start").classList.add("hidden");
            $("#game").classList.remove("hidden");

            if (!alreadyInit) {
                alreadyInit = true;
                createGrid();
                createResetButton();
            }
        });

        $("#reset").addEventListener("click", () => {
            $("#p1_name").value = "";
            $("#p2_name").value = "";
            $("#start").classList.remove("hidden");
            $("#game").classList.add("hidden");

            reset();
            GameController.resetScores();
            updateScores();
        });
    };

    const listenToGameController = () => {
        const status = GameController.getStatus();
        const winnerText = $("#winner");

        if (status === GameController.ST_HASTIE) {
            showResetButton(true);
            winnerText.textContent = "Tie!";
        }

        if (status === GameController.ST_HASWINNER) {
            showResetButton(true);
            const winner = GameController.getWinner();
            const marker = winner === Gameboard.MARKER_P1 ? 'X' : 'O';
            const name = winner === Gameboard.MARKER_P1 ? p1Name : p2Name;
            winnerText.textContent = `${name} won!`;
            displayWinningCells();
        }

        updateScores();
    };

    const displayWinningCells = () => {
        GameController.getWinningCells().forEach(([row, col]) => {
            $(`[data-row="${row}"][data-col="${col}"]`).classList.add("highlight");
        });
    };

    const updateScores = () => {
        $("#scoreP1").textContent = GameController.getScore("p1");
        $("#scoreP2").textContent = GameController.getScore("p2");
        $("#ties").textContent = GameController.getScore("ties");
    };

    const createGrid = () => {
        for (let r = 0; r < Gameboard.ROWS; r++) {
            for (let c = 0; c < Gameboard.COLUMNS; c++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.row = r;
                cell.dataset.col = c;

                const symbol = document.createElement("p");
                symbol.className = "material-symbols-outlined";
                cell.append(symbol);

                container.append(cell);
            }
        }

        container.addEventListener("click", (e) => {
            const cell = e.target.closest(".cell");
            if (!cell) return;

            GameController.play(cell.dataset.row, cell.dataset.col);
            reflectGrid();
            listenToGameController();
        });
    };

    const reflectGrid = () => {
        Array.from(container.children).forEach((cell) => {
            const { row, col } = cell.dataset;
            const para = cell.querySelector("p");
            const mark = Gameboard.getBoard()[row][col];

            para.textContent = mark === Gameboard.MARKER_P1 ? P1_TEXT : mark === Gameboard.MARKER_P2 ? P2_TEXT : "";
            para.className = "material-symbols-outlined";
            if (mark === Gameboard.MARKER_P1) para.classList.add("player-1");
            if (mark === Gameboard.MARKER_P2) para.classList.add("player-2");
        });
    };

    const reset = () => {
        GameController.reset();
        reflectGrid();
        showResetButton(false);
        $("#winner").textContent = "";
        clearCellColors();
    };

    const createResetButton = () => {
        $("#play-again").addEventListener("click", reset);
    };

    const clearCellColors = () => {
        Array.from(container.children).forEach((cell) => {
            const para = cell.querySelector("p");
            para.classList.remove("player-1", "player-2");
            cell.classList.remove("highlight");
        });
    };

    const showResetButton = (show) => {
        $("#play-again").classList.toggle("hidden-vis-only", !show);
    };

    return { initialize };
})();

GUIHandler.initialize();
