# Performance Tooling

This project includes build-time and runtime performance tooling.

## Bundle Analysis (rollup-plugin-visualizer)

- Build and open treemap: `npm run analyze`
- Output: `dist/stats.html`

Notes:
- The visualizer runs only on `vite build` and does not affect dev.
- macOS uses `open` to launch the HTML report.

## Lighthouse (runtime)

1. Start the dev server: `npm run dev` (default at http://localhost:5173)
2. In another terminal, run: `npm run lighthouse`
   - Command: `lighthouse http://localhost:5173 --view --quiet --chrome-flags='--headless'`

This script assumes `lighthouse` is available on your PATH. If not, install it globally or run via `npx lighthouse`.

