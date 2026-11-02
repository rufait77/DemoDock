import { copyFile, mkdir } from 'node:fs/promises';
await mkdir(new URL('../packages/demodock/dist/', import.meta.url), { recursive: true });
await copyFile(new URL('../packages/demodock/src/styles.css', import.meta.url), new URL('../packages/demodock/dist/styles.css', import.meta.url));
await copyFile(new URL('../LICENSE', import.meta.url), new URL('../packages/demodock/LICENSE', import.meta.url));
