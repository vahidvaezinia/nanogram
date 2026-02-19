# Nonogram · Picross

A fully playable **Nonogram (Picross)** puzzle game that runs directly in the browser — no server, no build step, no dependencies. Just open `index.html`.

## Features

- **3000 unique puzzles** — 1000 levels each for 5×5, 10×10, and 15×15 grids, generated on-the-fly with a seeded PRNG (same level always gives the same puzzle)
- **Level navigation** — previous/next buttons, size selector, and a jump-to-level popover
- **Clue highlighting** — completed rows and columns turn green automatically
- **Check & Auto-check** — manual check highlights wrong/missing cells with a pulse animation; auto-check mode marks errors after every move and counts mistakes
- **Reveal** — fills the solution after confirmation
- **Timer** — starts on first move, pauses on win
- **Completion history** — every solved puzzle is recorded with time, mistakes, and date; filterable by size; click any entry to replay the puzzle
- **Dark mode** — toggle persisted to localStorage
- **Progress persistence** — in-progress board state saved to localStorage per puzzle
- **Keyboard support** — arrow keys to move, Space to fill, X to mark, focus ring visible
- **Responsive** — works on small screens; major grid lines every 5 cells on larger grids

## Project Structure

```
nanogram/
├── index.html        ← HTML shell (markup + script/link tags only)
├── css/
│   └── style.css     ← All styling (CSS custom properties, dark mode, animations)
└── js/
    ├── puzzle.js     ← Mulberry32 PRNG, level generation, run-length clue encoding
    ├── state.js      ← Cell-state constants and all mutable game state
    ├── timer.js      ← Timer start/stop/reset/format
    ├── storage.js    ← localStorage: progress save/load and history read/write
    ├── render.js     ← Board construction and cell rendering
    ├── input.js      ← Mouse drag-paint and keyboard navigation
    ├── validation.js ← Win check, manual check, auto-check, reveal
    ├── history.js    ← History modal UI and filter tabs
    └── game.js       ← Puzzle loading, UI event wiring, boot
```

## How to Play

1. Open `index.html` in any modern browser.
2. The numbers on the **top** are column clues; numbers on the **left** are row clues.
3. Each number represents a consecutive run of filled cells in that line, separated by at least one empty cell.
4. **Left-click** a cell to fill it; **right-click** to mark it with ✕ (known empty).
5. Click and drag to paint multiple cells at once.
6. Use **Check** to see mistakes, or enable **Auto-check** for live feedback.
7. Complete a puzzle to see your time and mistake count.

## Controls

| Action | Mouse | Keyboard |
|---|---|---|
| Fill cell | Left-click | Space |
| Mark cell (✕) | Right-click | X |
| Move focus | — | Arrow keys |
| Check | — | Check button |

## License

MIT
