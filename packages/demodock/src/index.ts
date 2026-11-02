import { setupWorker } from 'msw/browser';
import { HttpNetworkFrame } from 'msw/experimental';
import type { HttpHandler } from 'msw/http';
import { createDemoStore, type StoreOptions, type DemoStore } from './store.js';
export { createDemoStore } from './store.js';
export type { DemoRole, DemoScenario, DemoSnapshot, DemoStore, DemoStorage, StoreOptions, TourStep } from './store.js';

export interface DemoOptions<T extends object> extends StoreOptions<T> {
  handlers: (store: DemoStore<T>) => HttpHandler[];
  serviceWorkerUrl?: string;
}
export interface DemoController<T extends object> extends DemoStore<T> {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/** Start before mounting the app. Unhandled API requests fail instead of reaching a backend. */
export function createDemo<T extends object>(options: DemoOptions<T>): DemoController<T> {
  const store = createDemoStore(options);
  const worker = setupWorker(...options.handlers(store));
  let started: Promise<void> | undefined;
  worker.events.on('response:mocked', () => store.recordRequest());
  return {
    ...store,
    start() {
      if (!started) {
        started = worker.start({
          quiet: true,
          serviceWorker: { url: options.serviceWorkerUrl ?? '/mockServiceWorker.js' },
          onUnhandledFrame({ frame }) {
            if (frame instanceof HttpNetworkFrame) {
              const request = frame.data.request;
              const url = new URL(request.url);
              const destination = request.destination || request.headers.get('sec-fetch-dest');
              const asset = request.mode === 'navigate' || ['document', 'script', 'style', 'image', 'font', 'manifest', 'worker', 'serviceworker'].includes(destination ?? '')
                || /\.(?:css|[cm]?jsx?|[cm]?tsx?|html|woff2?|ttf|otf|ico|svg|png|jpe?g|webp|avif)$/i.test(url.pathname)
                || url.pathname.startsWith('/@vite/');
              if (request.method === 'GET' && url.origin === window.location.origin && asset) return;
              // Reject with a network-error response instead of MSW's default
              // conversion of Error objects into a synthetic HTTP 500 response.
              throw Response.error();
            }
            // MSW 3 callback defaults.error() only logs. Rejecting the callback
            // is required to prevent the underlying frame from passing through.
            throw new Error('DemoDock blocked an unhandled network request. Add an explicit mock handler.');
          }
        }).then(() => undefined).catch(error => { started = undefined; throw error; });
      }
      return started;
    },
    async stop() { if (started) await started.catch(() => undefined); await worker.stop(); started = undefined; }
  };
}
