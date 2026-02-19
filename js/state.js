/* ═══════════════════════════════════════════════════════════════════════
   state.js — Cell-state constants and all mutable game state variables.
   Loaded after puzzle.js; no other project dependencies.
═══════════════════════════════════════════════════════════════════════ */

// ── Cell state enum ──────────────────────────────────────────────────
const EMPTY  = 0; // unknown / untouched
const FILLED = 1; // player filled
const MARKED = 2; // player marked as known-empty (✕)

// ── Current puzzle identity ──────────────────────────────────────────
let currentSize  = 10;  // active grid dimension (5 | 10 | 15)
let currentLevel = 0;   // 0-based level index; displayed as level+1

// ── Active puzzle data (populated by loadPuzzle) ─────────────────────
let solution   = null;  // 2-D array of 0/1
let rowClues   = [];    // array of clue arrays, one per row
let colClues   = [];    // array of clue arrays, one per column
let boardState = [];    // 2-D array of EMPTY/FILLED/MARKED
let rows = 0;
let cols = 0;

// ── Game flags ───────────────────────────────────────────────────────
let frozen       = false;       // true after win or reveal — blocks input
let mistakeCount = 0;           // incremented by auto-check on new errors
let lastCheckErrors = new Set(); // "r,c" string keys of currently highlighted cells

// ── Keyboard navigation ──────────────────────────────────────────────
let kbRow    = 0;
let kbCol    = 0;
let kbActive = false; // true when the board has keyboard focus

// ── Drag-paint ───────────────────────────────────────────────────────
let dragMode = null;  // FILLED | EMPTY — the paint value for the current drag
let dragging = false; // true while mouse button is held
