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
