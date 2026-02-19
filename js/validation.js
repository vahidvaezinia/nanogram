/* ═══════════════════════════════════════════════════════════════════════
   validation.js — Win detection, manual check, auto-check, and reveal.
   Depends on: state.js, render.js, timer.js, storage.js
═══════════════════════════════════════════════════════════════════════ */

/**
 * Win check: every cell must match — FILLED iff solution is 1.
 * MARKED cells at solution=1 positions still count as wrong.
 */
function checkWin() {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if ((boardState[r][c] === FILLED) !== (solution[r][c] === 1))
        return false;
  return true;
}

/**
 * Manual "Check" button handler.
 * Highlights ALL mismatched cells (both wrong fills and missing fills)
 * with a pulse animation then a persistent red tint.
 */
function runCheck() {
  clearCheckHighlights();
  lastCheckErrors = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pFill = boardState[r][c] === FILLED;
      const sFill = solution[r][c] === 1;
      if (pFill !== sFill) {
        lastCheckErrors.add(`${r},${c}`);
        const el = getCellEl(r, c);
        if (el) {
          el.classList.add('error');
          // After the pulse animation ends, switch to a static hold style
          el.addEventListener('animationend', () => {
            el.classList.remove('error');
            el.classList.add('error-hold');
          }, { once: true });
        }
      }
    }
  }

  if (lastCheckErrors.size === 0) showWin();
}

/**
 * Auto-check (runs after every cell change when the toggle is ON).
 * Only flags filled-but-wrong cells — missing cells are NOT shown,
 * so the player can still discover where to fill without a spoiler.
 * New errors (cells not previously wrong) increment the mistake counter.
 */
function runAutoCheck() {
  const prevErrors = new Set(lastCheckErrors);
  clearCheckHighlights();
  lastCheckErrors = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pFill = boardState[r][c] === FILLED;
      const sFill = solution[r][c] === 1;
      if (pFill && !sFill) {
        lastCheckErrors.add(`${r},${c}`);
        if (!prevErrors.has(`${r},${c}`)) {
          mistakeCount++;
          document.getElementById('mistakeCount').textContent = mistakeCount;
        }
      }
    }
  }

  restoreCheckHighlights();
  if (checkWin()) showWin();
}

/** Remove all error / error-hold classes from every cell. */
function clearCheckHighlights() {
  boardEl.querySelectorAll('.cell.error, .cell.error-hold').forEach(el => {
    el.classList.remove('error', 'error-hold');
  });
}

/**
 * Re-apply error-hold to all cells in lastCheckErrors.
 * Also restores the keyboard focus ring, which renderCell wipes.
 */
function restoreCheckHighlights() {
  lastCheckErrors.forEach(key => {
    const [r, c] = key.split(',').map(Number);
    const el = getCellEl(r, c);
    if (el) el.classList.add('error-hold');
  });
  if (kbActive) {
    const el = getCellEl(kbRow, kbCol);
    if (el) el.classList.add('kb-focus');
  }
}

/**
 * After a cell changes, check if its row and/or column is now fully solved.
 * If so, mark every remaining EMPTY cell in that line with MARKED (✕).
 * Only EMPTY → MARKED transitions are made; FILLED and existing marks are untouched.
 * Completion is based on FILLED patterns only, so no cascading is possible.
 */
function autoMarkCompletedLines(changedRow, changedCol) {
  // Row check
  const rowPlayer = boardState[changedRow].map(v => v === FILLED ? 1 : 0);
  if (arraysEqual(runLengthEncode(rowPlayer), rowClues[changedRow])) {
    for (let c = 0; c < cols; c++) {
      if (boardState[changedRow][c] === EMPTY) {
        boardState[changedRow][c] = MARKED;
        renderCell(changedRow, c);
      }
    }
  }
  // Column check
  const colPlayer = boardState.map(row => row[changedCol] === FILLED ? 1 : 0);
  if (arraysEqual(runLengthEncode(colPlayer), colClues[changedCol])) {
    for (let r = 0; r < rows; r++) {
      if (boardState[r][changedCol] === EMPTY) {
        boardState[r][changedCol] = MARKED;
        renderCell(r, changedCol);
      }
    }
  }
}

/** Show the win modal and freeze input. Called by both checkWin paths. */
function showWin() {
  frozen = true;
  stopTimer();
  document.getElementById('winTime').textContent     = formatTime(timerElapsed);
  document.getElementById('winMistakes').textContent = mistakeCount;
  document.getElementById('winSub').textContent      =
    `${currentSize}×${currentSize} · Level ${currentLevel + 1} · ${capitalize(currentDifficulty)}`;
  document.getElementById('winModal').classList.add('active');
  document.getElementById('btnModalNext').focus();
  recordHistory();
  clearProgress();
}

/**
 * Reveal the solution after user confirmation.
 * Fills the board to match the solution, then freezes input.
 */
function reveal() {
  if (!confirm('Reveal the full solution? This will end the current game.')) return;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      boardState[r][c] = solution[r][c] === 1 ? FILLED : EMPTY;
  clearCheckHighlights();
  lastCheckErrors = new Set();
  frozen = true;
  stopTimer();
  renderAll();
  clearProgress();
}
