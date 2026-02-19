/* ═══════════════════════════════════════════════════════════════════════
   timer.js — Puzzle timer: start on first move, pause on win/reveal.
   Depends on: (none from project — reads DOM directly)
═══════════════════════════════════════════════════════════════════════ */

let timerStart    = null;  // Date.now() timestamp when current run began
let timerElapsed  = 0;     // ms accumulated across all paused runs
let timerRunning  = false;
let timerInterval = null;

/** Start the timer on the first cell interaction, if not already running. */
function startTimerIfNeeded() {
  if (timerRunning || frozen) return;
  timerStart   = Date.now();
  timerRunning = true;
  timerInterval = setInterval(tickTimer, 500);
}

/** Pause the timer and accumulate elapsed time. */
function stopTimer() {
  if (!timerRunning) return;
  timerElapsed += Date.now() - timerStart;
  clearInterval(timerInterval);
  timerRunning = false;
}

/** Reset the timer to zero and clear the display. */
function resetTimer() {
  stopTimer();
  timerElapsed = 0;
  timerStart   = null;
  document.getElementById('timerDisplay').textContent = '0:00';
}

/** Called every 500 ms to refresh the displayed time. */
function tickTimer() {
  const total = timerElapsed + (Date.now() - timerStart);
  document.getElementById('timerDisplay').textContent = formatTime(total);
}

/**
 * Format milliseconds as "m:ss" (or "h:mm:ss" for long sessions).
 * Uses tabular digits via font-variant-numeric in CSS.
 */
function formatTime(ms) {
  const s   = Math.floor(ms / 1000);
  const sec = s % 60;
  const min = Math.floor(s / 60) % 60;
  const hr  = Math.floor(s / 3600);
  const p   = n => String(n).padStart(2, '0');
  return hr > 0 ? `${hr}:${p(min)}:${p(sec)}` : `${min}:${p(sec)}`;
}
