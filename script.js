// --- state ---
const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));
const statusEl = document.getElementById("status");

const modeBtns = {
  pvp: document.getElementById("modePVP"),
  aiEasy: document.getElementById("modeAIEasy"),
  aiHard: document.getElementById("modeAIHard"),
};
const resetBtn = document.getElementById("resetBtn");

let board, currentPlayer, gameOver, mode;

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diagonals
];

// --- init ---
function init(selectedMode = mode || "pvp") {
  board = Array(9).fill(null);
  currentPlayer = "X"; // human always starts
  gameOver = false;
  mode = selectedMode;

  cells.forEach(c => {
    c.textContent = "";
    c.disabled = false;
    c.classList.remove("x","o","win","dim");
  });

  updateModeButtons();
  setStatus(`Player ${currentPlayer}’s turn${modeLabel()}`);
}

function updateModeButtons() {
  Object.values(modeBtns).forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-pressed","false");
  });
  if (mode === "pvp") {
    modeBtns.pvp.classList.add("active"); modeBtns.pvp.setAttribute("aria-pressed","true");
  } else if (mode === "aiEasy") {
    modeBtns.aiEasy.classList.add("active"); modeBtns.aiEasy.setAttribute("aria-pressed","true");
  } else {
    modeBtns.aiHard.classList.add("active"); modeBtns.aiHard.setAttribute("aria-pressed","true");
  }
}

function modeLabel() {
  if (mode === "pvp") return " — 2 Players";
  if (mode === "aiEasy") return " — vs AI (Easy)";
  return " — vs AI (Hard)";
}

// --- UI helpers ---
function setStatus(msg){ statusEl.textContent = msg; }
function renderCell(i, player) {
  const el = cells[i];
  el.textContent = player;
  el.classList.add(player.toLowerCase());
  el.disabled = true;
}

// --- game logic ---
function emptyIndices(b = board) {
  const arr = [];
  for (let i=0;i<b.length;i++) if (!b[i]) arr.push(i);
  return arr;
}

function checkWinner(b = board) {
  for (const [a,bIdx,c] of WIN_LINES) {
    if (board[a] && board[a] === board[bIdx] && board[a] === board[c]) {
      return { winner: board[a], line: [a,bIdx,c] };
    }
  }
  if (emptyIndices(b).length === 0) return { winner: "draw", line: [] };
  return null;
}

function endGame(result) {
  gameOver = true;
  cells.forEach(c => c.disabled = true);

  if (result.winner === "draw") {
    setStatus("It’s a draw! 🤝" + modeLabel());
    return;
  }
  // highlight win
  cells.forEach((c, idx) => {
    if (result.line.includes(idx)) c.classList.add("win");
    else c.classList.add("dim");
  });
  setStatus(`Player ${result.winner} wins! 🎉` + modeLabel());
}

function handleTurn(i) {
  if (gameOver || board[i]) return;

  board[i] = currentPlayer;
  renderCell(i, currentPlayer);

  const result = checkWinner();
  if (result) return endGame(result);

  // swap turn
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  setStatus(`Player ${currentPlayer}’s turn` + modeLabel());

  // AI move if needed
  if (!gameOver && mode !== "pvp" && currentPlayer === "O") {
    setTimeout(aiMove, 220); // tiny delay for UX
  }
}

// --- AI ---
function aiMove() {
  if (mode === "aiEasy") {
    const choices = emptyIndices();
    const pick = choices[Math.floor(Math.random() * choices.length)];
    handleTurn(pick);
  } else {
    const best = minimax(board.slice(), "O");
    handleTurn(best.index);
  }
}

// Minimax algorithm (optimal play for 3x3 Tic-Tac-Toe)
function minimax(newBoard, player) {
  const avail = [];
  for (let i=0;i<newBoard.length;i++) if (!newBoard[i]) avail.push(i);

  const winnerCheck = (() => {
    for (const [a,b,c] of WIN_LINES) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a];
      }
    }
    if (avail.length === 0) return "draw";
    return null;
  })();

  if (winnerCheck === "X") return { score: -10 };
  if (winnerCheck === "O") return { score: 10 };
  if (winnerCheck === "draw") return { score: 0 };

  const moves = [];
  for (const spot of avail) {
    const move = { index: spot };
    newBoard[spot] = player;

    const result = minimax(newBoard, player === "O" ? "X" : "O");
    move.score = result.score;

    newBoard[spot] = null;
    moves.push(move);
  }

  // choose best move for current player
  let bestMove, bestScore;
  if (player === "O") {
    bestScore = -Infinity;
    for (const m of moves) if (m.score > bestScore) { bestScore = m.score; bestMove = m; }
  } else {
    bestScore = Infinity;
    for (const m of moves) if (m.score < bestScore) { bestScore = m.score; bestMove = m; }
  }
  return bestMove;
}

// --- events ---
cells.forEach(cell => {
  cell.addEventListener("click", e => {
    const i = Number(e.currentTarget.dataset.index);
    handleTurn(i);
  });
});

modeBtns.pvp.addEventListener("click", () => init("pvp"));
modeBtns.aiEasy.addEventListener("click", () => init("aiEasy"));
modeBtns.aiHard.addEventListener("click", () => init("aiHard"));
resetBtn.addEventListener("click", () => init(mode));

// boot
init("pvp");
