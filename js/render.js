/* ═══════════════════════════════════════════════════════════════════════
   render.js — Board construction and cell rendering.
   Depends on: state.js, puzzle.js (runLengthEncode)
═══════════════════════════════════════════════════════════════════════ */

const boardEl = document.getElementById('board');

/**
 * (Re)build the entire CSS Grid board from scratch.
 * Called once per loadPuzzle(); not called on individual cell changes.
 */
function buildBoard() {
  boardEl.innerHTML = '';

  // Clue column width scales with the longest row clue
  const maxRowClueLen = Math.max(...rowClues.map(rc => rc.length));
  const clueColW = `calc(var(--cell-size) * ${maxRowClueLen + 0.6})`;

  boardEl.style.gridTemplateColumns = `${clueColW} repeat(${cols}, var(--cell-size))`;
  boardEl.style.gridTemplateRows    = `auto repeat(${rows}, var(--cell-size))`;

  // ── Top-left corner spacer ──────────────────────────────────────────
  const corner = document.createElement('div');
  corner.className = 'clue-corner';
  boardEl.appendChild(corner);

  // ── Column clue cells (top row) ─────────────────────────────────────
  for (let c = 0; c < cols; c++) {
    const el = document.createElement('div');
    el.className = 'clue-col';
    // Thick separator line every 5 columns aids navigation on large grids
    if (c > 0 && c % 5 === 0) el.classList.add('major-left');
    el.id = `cc-${c}`;
    el.setAttribute('aria-label', `Col ${c + 1}: ${colClues[c].join(' ')}`);
    colClues[c].forEach(n => {
      const span = document.createElement('span');
      span.className = 'clue-num';
      span.textContent = n;
      el.appendChild(span);
    });
    boardEl.appendChild(el);
  }

  // ── Rows: row-clue cell + puzzle cells ──────────────────────────────
  for (let r = 0; r < rows; r++) {
    // Row clue cell
    const rc = document.createElement('div');
    rc.className = 'clue-row';
    rc.id = `rc-${r}`;
    rc.setAttribute('aria-label', `Row ${r + 1}: ${rowClues[r].join(' ')}`);
    rowClues[r].forEach((n, i) => {
      if (i > 0) {
        // Faint vertical separator between numbers in long clues
        const sep = document.createElement('span');
        sep.className = 'clue-sep';
        rc.appendChild(sep);
      }
      const span = document.createElement('span');
      span.className = 'clue-num';
      span.textContent = n;
      rc.appendChild(span);
    });
    boardEl.appendChild(rc);

    // Puzzle cells for this row
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      // Major grid lines every 5 rows / columns
      if (r > 0 && r % 5 === 0) cell.classList.add('major-top');
      if (c > 0 && c % 5 === 0) cell.classList.add('major-left');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `R${r + 1}C${c + 1}`);
      cell.addEventListener('mousedown',   onCellMouseDown);
      cell.addEventListener('mouseover',   onCellMouseOver);
      cell.addEventListener('contextmenu', onCellContext);
      boardEl.appendChild(cell);
    }
  }

  renderAll();
}

/** Re-render every cell (called after buildBoard or reveal). */
function renderAll() {
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      renderCell(r, c);
  updateClueHighlights();
  updateStats();
}

/**
 * Render a single cell from boardState.
 * Preserves major-line classes so they aren't wiped on each re-render.
 * Re-applies error-hold if the cell is in the current error set.
 */
function renderCell(r, c) {
  const cell = getCellEl(r, c);
  if (!cell) return;
  const state = boardState[r][c];

  // Preserve structural border classes
  const hasMajorTop  = cell.classList.contains('major-top');
  const hasMajorLeft = cell.classList.contains('major-left');

  let cls = 'cell';
  if (hasMajorTop)               cls += ' major-top';
  if (hasMajorLeft)              cls += ' major-left';
  if (state === FILLED)          cls += ' filled';
  if (state === MARKED)          cls += ' marked';
  if (kbActive && r === kbRow && c === kbCol) cls += ' kb-focus';
  cell.className = cls;
  cell.textContent = state === MARKED ? '✕' : '';
  cell.setAttribute('aria-pressed', state === FILLED ? 'true' : 'false');

  // Restore error highlight if a check has been run
  if (lastCheckErrors.has(`${r},${c}`)) cell.classList.add('error-hold');
}

/** Look up a puzzle cell element by row and column. */
function getCellEl(r, c) {
  return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
}

/**
 * Mark completed rows/columns green by toggling the "done" class.
 * A line is "done" when the player's filled cells produce the correct clue.
 */
function updateClueHighlights() {
  for (let r = 0; r < rows; r++) {
    const player  = boardState[r].map(v => v === FILLED ? 1 : 0);
    const correct = arraysEqual(runLengthEncode(player), rowClues[r]);
    const el = document.getElementById(`rc-${r}`);
    if (el) el.classList.toggle('done', correct);
  }
  for (let c = 0; c < cols; c++) {
    const player  = boardState.map(row => row[c] === FILLED ? 1 : 0);
    const correct = arraysEqual(runLengthEncode(player), colClues[c]);
    const el = document.getElementById(`cc-${c}`);
    if (el) el.classList.toggle('done', correct);
  }
}

/** Update the "Filled X / Total" progress indicator. */
function updateStats() {
  let filled = 0, total = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (solution[r][c] === 1) total++;
      if (boardState[r][c] === FILLED) filled++;
    }
  document.getElementById('filledCount').textContent = filled;
  document.getElementById('totalCount').textContent  = total;
}

/** Shallow array equality helper used by updateClueHighlights. */
function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}
