/* ═══════════════════════════════════════════════════════════════════════
   history.js — History modal UI: render, filter, open/close.
   Depends on: storage.js (getHistory, clearHistory),
               timer.js (formatTime),
               game.js (loadPuzzle) — called on row click, available at runtime
═══════════════════════════════════════════════════════════════════════ */

let historyFilter = 'all'; // 'all' | '5' | '10' | '15'

function openHistory() {
  renderHistoryList();
  document.getElementById('historyModal').classList.add('active');
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('active');
}

/**
 * Build and inject the history list into #historyList.
 * Shows a header row, then one row per solved puzzle (filtered by size if set).
 * Clicking any row navigates to that puzzle.
 */
function renderHistoryList() {
  const list    = document.getElementById('historyList');
  const history = getHistory();
  const filtered = historyFilter === 'all'
    ? history
    : history.filter(e => String(e.size) === historyFilter);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="history-empty">No puzzles solved yet${
      historyFilter !== 'all' ? ' for this size' : ''
    }.</div>`;
    return;
  }

  list.innerHTML = '';

  // Column header
  const header = document.createElement('div');
  header.className = 'hi-header';
  header.innerHTML = `
    <span class="hi-size">Size</span>
    <span class="hi-level">Level</span>
    <span class="hi-time">Time</span>
    <span class="hi-mistakes">✗</span>
  `;
  list.appendChild(header);

  // Data rows
  filtered.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.setAttribute('role', 'listitem');
    row.setAttribute('aria-label',
      `${entry.size}×${entry.size} Level ${entry.level + 1}, solved in ${formatTime(entry.timeMs)}`);

    const sizeLabel = `${entry.size}×${entry.size}`;
    const dateStr = new Date(entry.solvedAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric',
    });

    row.innerHTML = `
      <span class="hi-size hi-size-${entry.size}">${sizeLabel}</span>
      <span class="hi-level">Level ${entry.level + 1}</span>
      <span class="hi-time">${formatTime(entry.timeMs)}</span>
      <span class="hi-mistakes">${entry.mistakes}</span>
      <span class="hi-date">${dateStr}</span>
      <span class="hi-go">›</span>
    `;

    row.addEventListener('click', () => {
      closeHistoryModal();
      loadPuzzle(entry.size, entry.level);
    });

    list.appendChild(row);
  });
}

// ── Filter tab event listeners ────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    historyFilter = btn.dataset.filter;
    renderHistoryList();
  });
});
