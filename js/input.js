/* ═══════════════════════════════════════════════════════════════════════
   input.js — Mouse, drag-paint, and keyboard input handlers.
   Depends on: state.js, render.js, validation.js, timer.js, storage.js
               (all globals available because loaded earlier)
═══════════════════════════════════════════════════════════════════════ */

// ── Mouse handlers ────────────────────────────────────────────────────

function onCellMouseDown(e) {
  if (frozen) return;
  e.preventDefault();
  closeJumpPopover(); // dismiss jump popover if open

  const r = +e.currentTarget.dataset.r;
  const c = +e.currentTarget.dataset.c;

  if (e.button === 2) {
    // Right-click → toggle MARKED (✕) / EMPTY
    toggleMark(r, c);
  } else {
    // Left-click → toggle FILLED / EMPTY; set drag mode for subsequent cells
    dragMode = boardState[r][c] === FILLED ? EMPTY : FILLED;
    dragging = true;
    applyDrag(r, c);
  }
}

function onCellMouseOver(e) {
  if (!dragging || frozen || dragMode === null) return;
  const r = +e.currentTarget.dataset.r;
  const c = +e.currentTarget.dataset.c;
  applyDrag(r, c);
}

/** Suppress the browser context menu so right-click can toggle marks. */
function onCellContext(e) { e.preventDefault(); }

/**
 * Apply the current drag-paint mode to a cell.
 * Skips cells already in the target state, and never overwrites MARKED cells
 * during a fill/erase drag to avoid accidental erasure.
 */
function applyDrag(r, c) {
  if (boardState[r][c] === dragMode) return;
  if (boardState[r][c] === MARKED)   return; // protect X marks during drag
  boardState[r][c] = dragMode;
  onCellChanged(r, c);
}

/** Toggle a cell between MARKED and EMPTY. */
function toggleMark(r, c) {
  boardState[r][c] = boardState[r][c] === MARKED ? EMPTY : MARKED;
  onCellChanged(r, c);
}

/**
 * Called after every cell state change.
 * Runs the full update pipeline: timer → highlights → stats → save → check.
 */
function onCellChanged(r, c) {
  startTimerIfNeeded();
  clearCheckHighlights();
  renderCell(r, c);
  autoMarkCompletedLines(r, c);
  updateClueHighlights();
  updateStats();
  saveProgress();

  if (document.getElementById('autoCheck').checked) {
    runAutoCheck();
  } else {
    if (checkWin()) showWin();
  }
}

// Clear drag state when the mouse button is released anywhere on the page
document.addEventListener('mouseup', () => { dragging = false; dragMode = null; });

// Prevent the browser's native drag-image from appearing over the board
boardEl.addEventListener('dragstart', e => e.preventDefault());

// ── Keyboard navigation ───────────────────────────────────────────────

boardEl.addEventListener('keydown', onBoardKey);

boardEl.addEventListener('focus', () => {
  if (!kbActive) { kbActive = true; renderCell(kbRow, kbCol); }
});

boardEl.addEventListener('blur', () => {
  kbActive = false;
  renderCell(kbRow, kbCol);
});

function onBoardKey(e) {
  if (frozen) return;

  const moves = {
    ArrowUp:    [-1,  0],
    ArrowDown:  [ 1,  0],
    ArrowLeft:  [ 0, -1],
    ArrowRight: [ 0,  1],
  };

  if (e.key in moves) {
    e.preventDefault();
    const prev = [kbRow, kbCol];
    kbRow = Math.max(0, Math.min(rows - 1, kbRow + moves[e.key][0]));
    kbCol = Math.max(0, Math.min(cols - 1, kbCol + moves[e.key][1]));
    renderCell(...prev);
    renderCell(kbRow, kbCol);
    restoreCheckHighlights(); // re-apply error markers cleared by renderCell
    return;
  }

  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    boardState[kbRow][kbCol] = boardState[kbRow][kbCol] === FILLED ? EMPTY : FILLED;
    onCellChanged(kbRow, kbCol);
  } else if (e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    toggleMark(kbRow, kbCol);
  }
}
