# @rufait77/demodock

Resettable, browser-local product demos with stateful HTTP mocks, simulated roles, scenarios, and an optional React dock.

[Playground](https://demodock.rufaitlabs.cloud/demo) · [Documentation](https://demodock.rufaitlabs.cloud/docs) · [Source](https://github.com/rufait77/DemoDock)

## Install

Requires Node.js 22.12+ for tooling, MSW 3, and a modern browser. v0.1.0 is distributed as a GitHub Release tarball, not an npm registry release.

```sh
npm install https://github.com/rufait77/DemoDock/releases/download/v0.1.0/rufait77-demodock-0.1.0.tgz msw@^3
npx msw init public --save
```

Use the [standalone starter](https://demodock.rufaitlabs.cloud/downloads/demodock-starter.zip) for a complete runnable example.

## Controller

```ts
import { createDemo } from '@rufait77/demodock';
import { http, HttpResponse } from 'msw/http';

const demo = createDemo({
  id: 'example', version: 1,
  roles: [{ id: 'editor', label: 'Editor' }],
  scenarios: [{ id: 'fresh', label: 'Fresh start', seed: () => ({ count: 0 }) }],
  handlers: store => [
    http.get('/api/count', () => HttpResponse.json(store.getSnapshot().data)),
    http.post('/api/count', () => {
      store.update(draft => { draft.count++; });
      return HttpResponse.json(store.getSnapshot().data);
    }),
  ],
});
await demo.start(); // Mount your app only after this succeeds.
```

`start()` starts MSW and is idempotent until `stop()`. `await demo.stop()` disables interception; do not call it while the demo app can still issue requests. Initialization errors must stop application startup rather than fall back to a real backend.

| Option | Meaning |
| --- | --- |
| `id` | Required stable storage namespace; letters, digits, dots, dashes, underscores |
| `version` | Storage schema version, default `1`; increase after incompatible data changes |
| `roles` | Non-empty array of unique `{ id, label, description? }` |
| `scenarios` | Non-empty array of unique `{ id, label, description?, seed }` |
| `initialRole`, `initialScenario` | Default to the first entries |
| `handlers` | Function receiving the store and returning MSW HTTP handlers |
| `storage` | Defaults to `sessionStorage`; `false` for memory; or `getItem/setItem/removeItem` adapter |
| `validateState` | Optional type guard for persisted state and updates |
| `tour` | Array of `{ target, title, description }`; target is a CSS selector |
| `serviceWorkerUrl` | Defaults to `/mockServiceWorker.js` |

Use plain JSON-serializable objects and arrays for state. Seed functions must return valid state and should be deterministic. Corrupt, incompatible, or invalid saved data falls back to the seed. Storage write failures fall back to memory. Browser tabs opened from another tab may start with a copy of its session storage.

## Store and subscriptions

`getSnapshot()` returns stable `{ data, role, scenario, revision, requests, storage }` until a change. `data` is recursively frozen. Never mutate a snapshot directly.

- `update(draft => { ... })`: mutate a clone, or return a replacement. Increments `revision`.
- `setRole(id)`: changes the simulated role and increments `revision`.
- `setScenario(id)`: replaces edits with that seed; resets the request counter.
- `reset()`: reseeds the current scenario, keeping the role.
- `clear()`: removes saved state and restores the initial role and scenario.
- `subscribe(listener)`: returns an unsubscribe function.
- `recordRequest()`: increments the response counter without incrementing the data revision; the controller calls this for MSW mocked responses.

For store-only use, including Node tests:

```ts
import { createDemoStore } from '@rufait77/demodock/store';
```

## React

```tsx
import { DemoDock, useDemo } from '@rufait77/demodock/react';
import '@rufait77/demodock/styles.css';

function Example() {
  const { role, revision } = useDemo(demo);
  // Refetch your API data when revision changes.
  return <DemoDock demo={demo} title="My product demo" />;
}
```

The dock reserves no page space automatically: give your app enough bottom padding for the fixed controls, especially on mobile. It includes reset confirmation, scenario/role selects, and optional tour controls. See exported TypeScript declarations for component props.

## Network behavior and boundaries

After successful startup, unhandled HTTP requests reject with a network error and unhandled WebSocket connections fail. Same-origin GET page navigation and recognized static assets pass through. Asset detection considers request metadata and common file extensions; it is intentionally not a security sandbox. Explicit MSW passthrough handlers and pre-start requests can still reach a server. Use synthetic data, no production secrets, a dedicated origin, and a suitable Content Security Policy.

Implement role checks in every mutating mock handler. The role selector itself is not authentication. Root-origin static deployment over HTTPS is the tested configuration; the complete application is not cached for offline use.

MIT © Rufait Islam Nahin. Uses [MSW](https://mswjs.io/) for interception.
