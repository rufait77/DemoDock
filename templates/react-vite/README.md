# Your DemoDock playground

A standalone React + Vite application with a browser-local API, persistent tab state, role switching, resettable scenarios, and a guided tour.

## Run

Use Node.js 22.12+ (Node 24 recommended):

```sh
npm install
npm run dev
```

`npm install` copies MSW's service worker to `public/`. The SDK tarball is included in `vendor/`; no npm publication or paid service is needed.

## Customize

- `src/demo.ts`: fictional data, roles, scenarios, HTTP handlers and tour steps.
- `src/main.tsx`: your frontend. Keep `await demo.start()` (or the supplied promise chain) before mounting network-dependent components.
- `src/style.css`: your application's styling.

The SDK's snapshots are frozen. Use `store.update(draft => { ... })` to mutate state. Enforce simulated role permissions inside every write handler.

## Publish

```sh
npm run build
```

Serve `dist/` from an HTTPS static host. Include `mockServiceWorker.js` at the root and serve that file with `Cache-Control: no-cache`. Local development works on localhost.

Use synthetic data only. Browser code and fixtures are public. Unmatched fetch/XHR requests are blocked after startup, but the demo is not a security sandbox and roles are not production authorization. Loading the site still requires the static host.

[Full documentation](https://demodock.rufaitlabs.cloud/docs) · [Source](https://github.com/rufait77/DemoDock)

MIT licensed. Built with DemoDock by Rufait Islam Nahin.
