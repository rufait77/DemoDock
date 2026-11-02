# DemoDock v0.1.0

Make a frontend into a resettable product demo that deploys as static files.

- TypeScript store with per-session state, role simulation, seeded scenarios, and reset.
- MSW 3 HTTP integration with unhandled-request rejection after startup.
- React dock with scenario/role controls, reset confirmation, and a guided tour.
- Folio CRM example with deal and contact management, search, activity, and data export.
- Standalone React/Vite starter with the SDK bundled in `vendor/`.
- Documentation, contributor guide, MIT license, and automated checks.

Try it: https://demodock.rufaitlabs.cloud/demo

Download `demodock-starter.zip`, extract, then run `npm install` and `npm run dev`. Requires Node 22.12+; Node 24 recommended. To add the SDK to another app, install the `.tgz` asset and `msw@^3`. `SHA256SUMS.txt` lists the release artifact digests.

v0.1.0 targets client-rendered HTTP demos. Tests cover desktop Chromium and mobile Chromium emulation. Roles are simulated, fixtures must be publishable, and DemoDock is not a network security sandbox or an offline app cache. The package is distributed through this GitHub Release rather than the npm registry.
