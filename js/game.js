/* ═══════════════════════════════════════════════════════════════════════
   game.js — Top-level orchestration: puzzle loading, UI event wiring, boot.
   Loaded last; depends on all other project files.
═══════════════════════════════════════════════════════════════════════ */

// ── Puzzle loading ────────────────────────────────────────────────────

/**
 * Load and display a puzzle identified by (size, level).
 * Resets all game state, attempts to restore saved progress, then renders.
 * @param {number} size  - Grid dimension: 5, 10, or 15.
 * @param {number} level - 0-based level index (wraps into [0, LEVELS_PER_SIZE)).
 */
function loadPuzzle(size, level) {
  // Wrap level into valid range (supports negative values from prev button)
  level = ((level % LEVELS_PER_SIZE) + LEVELS_PER_SIZE) % LEVELS_PER_SIZE;

  currentSize  = size;
  currentLevel = level;
  rows = size;
  cols = size;

  const prngSeed = getLevelOrder(size)[level];
  solution = generateSolution(size, prngSeed);
  const { rowClues: rc, colClues: cc } = computeClues(solution);
  rowClues = rc;
  colClues = cc;

  // Compute and display difficulty rating
  currentDifficulty = computeDifficulty(rowClues, colClues, size);
  const diffBadge = document.getElementById('diffBadge');
  diffBadge.textContent = capitalize(currentDifficulty);
  diffBadge.className   = `diff-badge diff-${currentDifficulty}`;

  // Reset game flags
  frozen          = false;
  mistakeCount    = 0;
  lastCheckErrors = new Set();
  kbRow = 0; kbCol = 0; kbActive = false;

  document.getElementById('mistakeCount').textContent = 0;
  document.getElementById('mistakesPill').style.display =
    document.getElementById('autoCheck').checked ? '' : 'none';

  // Start with a blank board, then overwrite with saved progress if any
  boardState = Array.from({ length: rows }, () => Array(cols).fill(EMPTY));
  resetTimer();
  loadProgress();

  // Sync UI controls to the new puzzle identity
  document.getElementById('lbNum').textContent    = level + 1;
  document.getElementById('sizeSelect').value     = size;

  buildBoard();
  document.getElementById('winModal').classList.remove('active');
  closeJumpPopover();
}

// ── Jump popover (level badge click → inline number input) ────────────

function openJumpPopover() {
  const pop = document.getElementById('jumpPopover');
  pop.classList.add('open');
  document.getElementById('jumpInput').value = '';
  document.getElementById('jumpInput').focus();
}

function closeJumpPopover() {
  document.getElementById('jumpPopover').classList.remove('open');
}

document.getElementById('levelBadge').addEventListener('click', () => {
  const pop = document.getElementById('jumpPopover');
  pop.classList.contains('open') ? closeJumpPopover() : openJumpPopover();
});

document.getElementById('levelBadge').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openJumpPopover(); }
});

document.getElementById('btnJumpGo').addEventListener('click', () => {
  const val = parseInt(document.getElementById('jumpInput').value, 10);
  if (val >= 1 && val <= LEVELS_PER_SIZE) {
    loadPuzzle(currentSize, val - 1); // UI is 1-based; internal is 0-based
  }
});

document.getElementById('jumpInput').addEventListener('keydown', e => {
  if (e.key === 'Enter')  document.getElementById('btnJumpGo').click();
  if (e.key === 'Escape') closeJumpPopover();
});

// Close the jump popover when clicking anywhere outside it
document.addEventListener('click', e => {
  const wrap = document.querySelector('.level-badge-wrap');
  if (wrap && !wrap.contains(e.target)) closeJumpPopover();
});

// ── Level navigation buttons ──────────────────────────────────────────

document.getElementById('btnPrev').addEventListener('click', () => {
  loadPuzzle(currentSize, currentLevel - 1);
});

document.getElementById('btnNext').addEventListener('click', () => {
  loadPuzzle(currentSize, currentLevel + 1);
});

// ── Size selector ─────────────────────────────────────────────────────

document.getElementById('sizeSelect').addEventListener('change', function () {
  loadPuzzle(+this.value, currentLevel);
});

// ── Game action buttons ───────────────────────────────────────────────

document.getElementById('btnReset').addEventListener('click', () => {
  if (!confirm('Reset the board?')) return;
  clearProgress();
  loadPuzzle(currentSize, currentLevel);
});

document.getElementById('btnCheck').addEventListener('click', runCheck);

document.getElementById('btnReveal').addEventListener('click', reveal);

// ── Win modal buttons ─────────────────────────────────────────────────

document.getElementById('btnModalNext').addEventListener('click', () => {
  loadPuzzle(currentSize, currentLevel + 1);
});

document.getElementById('btnModalContinue').addEventListener('click', () => {
  document.getElementById('winModal').classList.remove('active');
  frozen = false; // allow the player to inspect the solved board
});

// ── Auto-check toggle ─────────────────────────────────────────────────

document.getElementById('autoCheck').addEventListener('change', function () {
  document.getElementById('mistakesPill').style.display = this.checked ? '' : 'none';
  if (!this.checked) {
    clearCheckHighlights();
    lastCheckErrors = new Set();
  }
});

// ── History modal ─────────────────────────────────────────────────────

document.getElementById('btnHistory').addEventListener('click', openHistory);
document.getElementById('btnHistoryClose').addEventListener('click', closeHistoryModal);
document.getElementById('btnHistoryClose2').addEventListener('click', closeHistoryModal);

document.getElementById('btnClearHistory').addEventListener('click', () => {
  if (!confirm('Clear all history?')) return;
  clearHistory();
  renderHistoryList();
});

// Close the history modal when clicking the backdrop
document.getElementById('historyModal').addEventListener('click', function (e) {
  if (e.target === this) closeHistoryModal();
});

// ── Dark mode toggle ──────────────────────────────────────────────────

document.getElementById('btnDark').addEventListener('click', () => {
  const isDark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = isDark ? '' : 'dark';
  document.getElementById('btnDark').textContent = isDark ? '🌙 Dark' : '☀️ Light';
  try { localStorage.setItem('nng_theme', isDark ? 'light' : 'dark'); } catch (_) {}
});

// ── Boot ──────────────────────────────────────────────────────────────

// Restore saved theme preference before first paint
(function restoreTheme() {
  try {
    const t = localStorage.getItem('nng_theme');
    if (t === 'dark') {
      document.documentElement.dataset.theme = 'dark';
      document.getElementById('btnDark').textContent = '☀️ Light';
    }
  } catch (_) {}
})();

// Start the game on the default puzzle: 10×10, Level 1
loadPuzzle(10, 0);
