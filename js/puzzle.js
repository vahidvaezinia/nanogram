/* ═══════════════════════════════════════════════════════════════════════
   puzzle.js — PRNG-based level generation + clue computation
   Loaded first; has no dependencies on other project files.
═══════════════════════════════════════════════════════════════════════ */

/**
 * Mulberry32: fast, high-quality 32-bit PRNG.
 * Returns a closure that produces uniformly distributed floats in [0, 1).
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEVELS_PER_SIZE = 1000;
const SIZES = [5, 10, 15];

/**
 * Generate a deterministic 0/1 solution grid for a given size + level (0-based).
 * Seed formula keeps different sizes from colliding.
 * Fill density is sampled once (38–60%) then each cell is drawn independently.
 */
function generateSolution(size, level) {
  const rand = mulberry32(size * 100000 + level + 1); // +1 avoids seed 0
  const density = 0.38 + rand() * 0.22;
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (rand() < density ? 1 : 0))
  );
}

/**
 * Run-length encode a 0/1 array into an array of consecutive-run lengths.
 * e.g. [1,1,0,1] → [2,1].  Empty lines return [0] so the clue is never blank.
 */
function runLengthEncode(arr) {
  const clues = [];
  let run = 0;
  for (const v of arr) {
    if (v === 1) {
      run++;
    } else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length ? clues : [0];
}

/** Compute row and column clues from a 2-D solution grid. */
function computeClues(solution) {
  const rows = solution.length;
  const cols = solution[0].length;
  const rowClues = solution.map(row => runLengthEncode(row));
  const colClues = [];
  for (let c = 0; c < cols; c++) {
    colClues.push(runLengthEncode(solution.map(row => row[c])));
  }
  return { rowClues, colClues };
}

/**
 * Compute fill count for a given PRNG index without allocating a 2-D grid.
 * Used by getLevelOrder to rank all 1000 levels cheaply.
 */
function computeFillCount(size, prngIndex) {
  const rand = mulberry32(size * 100000 + prngIndex + 1);
  const density = 0.38 + rand() * 0.22;
  let count = 0;
  for (let i = 0; i < size * size; i++) {
    if (rand() < density) count++;
  }
  return count;
}

/**
 * Return an array of length LEVELS_PER_SIZE whose value at index i is the
 * PRNG seed that produces the i-th easiest puzzle for the given size.
 * index 0 = easiest (most filled), index 999 = hardest (fewest filled).
 * Result is cached so sorting runs at most once per size per page load.
 */
const _levelOrderCache = {};

function getLevelOrder(size) {
  if (_levelOrderCache[size]) return _levelOrderCache[size];
  const entries = Array.from({ length: LEVELS_PER_SIZE }, (_, i) => ({
    i,
    fill: computeFillCount(size, i),
  }));
  entries.sort((a, b) => b.fill - a.fill); // descending: more fill = easier
  _levelOrderCache[size] = entries.map(e => e.i);
  return _levelOrderCache[size];
}

/**
 * Estimate puzzle difficulty from fill density.
 * More filled cells = less placement ambiguity = easier.
 * Generated density range is 38–60%; thresholds split that into thirds.
 * Returns 'easy' | 'medium' | 'hard'.
 */
const DIFF_EASY_MIN = 0.52; // fill ratio >= this → easy
const DIFF_HARD_MAX = 0.44; // fill ratio <  this → hard

function computeDifficulty(rowClues, colClues, size) {
  const filledCells = rowClues.flat().reduce((s, n) => s + n, 0);
  const fillRatio   = filledCells / (size * size);
  if (fillRatio >= DIFF_EASY_MIN) return 'easy';
  if (fillRatio <  DIFF_HARD_MAX) return 'hard';
  return 'medium';
}

/** Capitalize the first letter of a string. */
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
