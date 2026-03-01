# React + SyntropyFront

React 18 example app with SyntropyFront: one import, optional `configure`, then breadcrumbs, errors, and stats.

## What’s included

- **React 18** with hooks
- **SyntropyFront** wired in (import + optional `configure`)
- **Config modes** — console, fetch, or custom handler to see the flow
- **Stats** — `getStats()` with `stats.agent` and `stats.config`
- **Styling** with modern CSS (grid, flexbox, variables)

## Run it

```bash
cd react-example
pnpm install
pnpm start
```

Open http://localhost:3000.

## Structure

```
src/
├── components/       # Header, Actions, Breadcrumbs, Errors
├── hooks/            # useAppReady, useSyntropyFront
├── config/
├── utils/
└── App.js
```

Each component has a single responsibility; the hooks handle “app ready” and library usage.

## Using SyntropyFront

The library initializes on import; no `init()` needed.

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';

// Optional: endpoint, onError, samplingRate, etc.
syntropyFront.configure({ endpoint: 'https://your-api.com/errors' });

syntropyFront.addBreadcrumb('user', 'Something happened');
syntropyFront.getBreadcrumbs();
syntropyFront.sendError(error, context);
syntropyFront.getStats(); // { agent, config, ... }
```

In this example, the `useSyntropyFront` hook exposes the instance and a “ready” state for the UI.

## Scripts

```bash
pnpm start     # Development
pnpm test      # Tests
pnpm run build # Production build
```

## License

Apache 2.0 — see [LICENSE](LICENSE).
