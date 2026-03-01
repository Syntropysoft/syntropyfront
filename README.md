<p align="center">
  <img src="./assets/syntropysoft-logo.png" alt="SyntropySoft Logo" width="170"/>
</p>

<h1 align="center">SyntropyFront</h1>

<p align="center">
  <strong>Capture frontend errors and user actions. One line. ~34 KB. Zero dependencies.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@syntropysoft/syntropyfront"><img src="https://img.shields.io/npm/v/@syntropysoft/syntropyfront.svg" alt="NPM Version"></a>
  <a href="https://github.com/Syntropysoft/syntropyfront/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@syntropysoft/syntropyfront.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-ready%20for%20production-brightgreen.svg" alt="Ready for Production"></a>
  <a href="#"><img src="https://img.shields.io/badge/test%20coverage-87%25-brightgreen.svg" alt="Test Coverage"></a>
  <a href="#"><img src="https://img.shields.io/badge/bundle%20size-34%20KB-brightgreen.svg" alt="Bundle Size"></a>
  <a href="https://socket.dev/npm/package/@syntropysoft/syntropyfront"><img src="https://socket.dev/api/badge/npm/package/@syntropysoft/syntropyfront" alt="Socket Badge"></a>
</p>

---

## What it does

When something breaks in production, you get **what broke** and **what the user did before it**. No giant platform, no per-seat pricing. One import and it starts capturing:

- **Errors** — uncaught exceptions and unhandled promise rejections  
- **Clicks** — on buttons, links, and interactive elements (throttled)  
- **HTTP** — `fetch` calls (URL, method; no sensitive headers)  
- **Breadcrumbs** — timeline you can extend with `addBreadcrumb()`

Optional: PII masking, sampling, offline retry (IndexedDB), and sending to your endpoint or `onError` callback. **That’s it.** It’s not a full APM; it’s enough to stop debugging blind.

---

## Why use it

| Who | What they get |
|-----|----------------|
| **Developers** | One import, no config. No excuse to ship with zero visibility. |
| **PM / Tech Lead** | Visibility from day one. No long “observability” projects. |
| **Management** | Low cost, no SaaS lock-in. Fewer outages, less firefighting. |

**Network:** Data is sent only to the endpoint or callback you configure. No third parties, no telemetry. See [SECURITY.md](SECURITY.md).

---

## Quick Start

```bash
pnpm add @syntropysoft/syntropyfront
```

In your app entry (e.g. `main.jsx` or `index.js`):

```javascript
import syntropyFront from '@syntropysoft/syntropyfront';
// Done. Errors and breadcrumbs go to the console by default.
```

To send to your backend or handle in code:

```javascript
syntropyFront.configure({
  endpoint: 'https://your-api.com/errors',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  // optional: samplingRate, batchSize, batchTimeout, usePersistentBuffer, onError
});
```

---

## Main API

| Method | Description |
|--------|-------------|
| `configure(config)` | Set endpoint, headers, sampling, batching, `onError`, etc. |
| `addBreadcrumb(category, message, data?)` | Add a step to the timeline. |
| `sendError(error, context?)` | Send an error manually (e.g. from `catch`). |
| `getBreadcrumbs()` | Current breadcrumbs. |
| `clearBreadcrumbs()` | Clear the list. |
| `getStats()` | Queue length, retry status. |
| `flush()` | Send pending data now. |
| `destroy()` | Stop capturing and clean up. |

---

## Optional: PII masking

Sensitive data is masked before leaving the client (emails, tokens, cards, SSN/phone patterns). You can add custom rules via `configure({ maskingRules: [...] })`. See the [full config example](#advanced-configuration) below.

---

## Advanced configuration

```javascript
syntropyFront.configure({
  endpoint: 'https://your-api.com/v1/telemetry',
  headers: { 'Authorization': 'Bearer token', 'X-Environment': 'production' },
  samplingRate: 0.1,           // send 10% of events
  batchSize: 10,
  batchTimeout: 5000,
  usePersistentBuffer: true,   // retry when offline (IndexedDB)
  onError: (payload) => {
    console.warn('Error captured:', payload.type);
    return payload;
  },
  context: { device: true, window: ['url', 'title'], storage: false }
});
```

**Context fields** (when enabled): `device`, `window`, `network`, `session`, `ui`, `performance`, `storage`. See docs in the repo for the full list.

---

## Design (short)

Built to be predictable and safe: SOLID-style modules, pure functions where it matters, PII masking by default. Data goes only to your endpoint or callback—see [SECURITY.md](SECURITY.md).

---

## Quality

- **87%** test coverage  
- **Zero** runtime dependencies  
- **Mutation testing** (Stryker) >71%

---

## Examples

**[examples/README.md](examples/README.md)** — Overview and how to run each demo.

| Example | Description |
|---------|-------------|
| [basic-usage.html](examples/basic-usage.html) | Vanilla HTML, no build. Run `pnpm run build` then open file:// or use a static server. |
| [HTML demos](examples/README.md#examples) | More: circular-references, worker, presets, proxy-tracking, lazy-loading, lazy-initialization, custom-objects. |
| [react-example](examples/react-example/) | React 18. `cd react-example && pnpm install && pnpm start` |
| [vue-example](examples/vue-example/) | Vue 3 + Vite. `cd vue-example && pnpm install && pnpm run dev` |
| [svelte-example](examples/svelte-example/) | Svelte 4 + Vite. `cd svelte-example && pnpm install && pnpm run dev` |

## Contributing / local dev

```bash
git clone https://github.com/Syntropysoft/syntropyfront.git
cd syntropyfront
pnpm install
pnpm test
pnpm run build
```

---

## License

**Apache-2.0** — use in commercial and open-source projects.

**Developed for a clearer and more stable web.**
