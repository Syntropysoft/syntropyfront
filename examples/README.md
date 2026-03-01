# SyntropyFront Examples

Examples to see the library in action. All use the same API: one import, optional `configure()`, then `addBreadcrumb`, `sendError`, `getBreadcrumbs`, etc.

Pure HTML demos share one stylesheet: **`examples.css`**. Run `pnpm run build` from repo root, then open any `.html` via file://.

## Examples

### Basic (vanilla HTML) — `basic-usage.html`

Single HTML file: import SyntropyFront, configure `onError`, and use buttons to trigger clicks, fetch, errors, and breadcrumbs. No build step.

**Run:** Serve the repo root with any static server (e.g. from project root):

```bash
pnpm exec serve .
# or: npx serve .
# Open http://localhost:3000/examples/basic-usage.html
```

Or open the file directly if your dev setup resolves ES modules (e.g. VS Code Live Server with correct base).

### React — `react-example/`

Full React 18 app with config modes (console / fetch / custom handler), stats, and all capture features.

```bash
cd react-example
pnpm install
pnpm start
# Open http://localhost:3000
```

### Vue — `vue-example/`

Vue 3 + Vite demo.

```bash
cd vue-example
pnpm install
pnpm run dev
```

### Svelte — `svelte-example/`

Svelte 4 + Vite demo.

```bash
cd svelte-example
pnpm install
pnpm run dev
```

## What they show

- **One-line setup** — Import and (optionally) `configure()`. No `init()`.
- **Automatic capture** — Clicks, `fetch`, and uncaught errors are captured by default.
- **Manual API** — `addBreadcrumb()`, `sendError()`, `getBreadcrumbs()`, `clearBreadcrumbs()`, `getStats()`.
- **Configuration** — `endpoint`, `headers`, `onError`, `samplingRate`, `batchSize`, `usePersistentBuffer`, etc.

## Same API everywhere

SyntropyFront is framework-agnostic. Same import and API in React, Vue, Svelte, or vanilla:

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

syntropyFront.configure({ endpoint: 'https://your-api.com/errors' });
syntropyFront.addBreadcrumb('user', 'Did something');
syntropyFront.getBreadcrumbs();
```
