# Static deployment

Build with Node 24 and `npm ci && npm run check`. Publish the contents of `dist/`. No Node process, application backend, database, API key, or environment variable is required at runtime.

For the standalone starter, run `npm install && npm run build` and publish its `dist/` instead. Both applications use root-origin service-worker registration. Subpath deployments require adjusting Vite's base path and `serviceWorkerUrl` and are not part of the v0.1.0 verification matrix.

## Nginx on a VPS

The public site uses a dedicated Nginx virtual host at `demodock.rufaitlabs.cloud`. [deploy/nginx-http.conf](../deploy/nginx-http.conf) is the initial configuration; Certbot adds HTTPS and the redirect. Provisioning assumes Nginx, Certbot's Nginx plugin, and DNS already exist.

Upload a tarball containing only `dist/` contents, extract into a new `/var/www/demodock/releases/<release-id>` directory, and atomically change `/var/www/demodock/current` to point at it. Retain the previous release for rollback. Validate with `nginx -t` before reloading Nginx. A content-only deployment does not need a reload.

The virtual host permits static files only. `/api/` returns a JSON 404 on the server; browser MSW handlers provide demo responses. Cache hashed assets for a year, but allow revalidation of HTML and `mockServiceWorker.js`. The Content Security Policy limits application connections to the same origin and disables form submissions and framing.

After deployment, check `/`, `/docs`, `/demo`, `/mockServiceWorker.js`, and `/downloads/demodock-starter.zip`, then run:

```sh
DEMODOCK_URL=https://demodock.rufaitlabs.cloud npm run test:e2e
```

In PowerShell, set `$env:DEMODOCK_URL` before the npm command. Keep certificate renewal enabled and test it with `certbot renew --dry-run --cert-name demodock.rufaitlabs.cloud`.

## Rollback

Point `current` at the retained previous release with an atomic symlink replacement, then check the homepage and playground. The deployment directory must contain only public static assets. Keep SSH configuration, host addresses, account details, and credentials outside the repository.

## Release artifacts

`npm run release:pack` creates the SDK `.tgz` and a ready-to-zip standalone starter directory under `.artifacts/release`. ZIP the starter contents before installing dependencies in it. Publish the SDK, starter ZIP, and SHA-256 checksums with the matching Git tag. The hosted starter ZIP must match the release artifact.

Visual assets can be refreshed with `node scripts/capture-assets.mjs` while the local preview server is running. Rebuild afterward to include the generated social card.
