/* ═══════════════════════════════════════════════════════════════════════
   storage.js — localStorage persistence for in-progress boards and history.
   Depends on: state.js (currentSize, currentLevel, boardState, …),
               timer.js (timerElapsed, timerRunning, timerStart)
   Key scheme:
     Progress : "nng_prog_<size>_<level>"
     History  : "nng_history"
     Theme    : "nng_theme"
═══════════════════════════════════════════════════════════════════════ */

const HISTORY_KEY = 'nng_history';
const HISTORY_MAX = 200; // oldest entries trimmed when this cap is exceeded

/** Build the localStorage key for the current puzzle's progress. */
function progressKey() {
  return `nng_prog_${currentSize}_${currentLevel}`;
}

/** Persist the current board state, elapsed time, and mistake count. */
function saveProgress() {
  try {
    localStorage.setItem(progressKey(), JSON.stringify({
      board:    boardState,
      elapsed:  timerElapsed + (timerRunning ? Date.now() - timerStart : 0),
      mistakes: mistakeCount,
    }));
  } catch (_) {}
}

/**
 * Restore a previously saved board for the current puzzle.
 * Returns true if valid saved data was found and applied, false otherwise.
 */
function loadProgress() {
  try {
    const raw = localStorage.getItem(progressKey());
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.board || data.board.length !== rows || data.board[0].length !== cols) return false;
    boardState   = data.board;
    timerElapsed = data.elapsed  || 0;
    mistakeCount = data.mistakes || 0;
    document.getElementById('mistakeCount').textContent = mistakeCount;
    document.getElementById('timerDisplay').textContent = formatTime(timerElapsed);
    return true;
  } catch (_) { return false; }
}

/** Remove the saved progress for the current puzzle (called on win or reset). */
function clearProgress() {
  try { localStorage.removeItem(progressKey()); } catch (_) {}
}

/**
 * Append a solved-puzzle record to the history list.
 * Entries are stored newest-first and capped at HISTORY_MAX.
 */
function recordHistory() {
  try {
    const history = getHistory();
    history.unshift({
      size:     currentSize,
      level:    currentLevel, // 0-based
      timeMs:   timerElapsed,
      mistakes: mistakeCount,
      solvedAt: Date.now(),
    });
    if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (_) {}
}

/** Return the full history array (newest first), or [] on error. */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch (_) { return []; }
}

/** Wipe the entire history from localStorage. */
function clearHistory() {
  try { localStorage.removeItem(HISTORY_KEY); } catch (_) {}
}
