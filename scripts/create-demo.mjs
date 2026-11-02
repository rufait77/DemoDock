import { join, resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { root, packSdk, scaffold } from './scaffold.mjs';
const argument = process.argv[2];
if (!argument || argument.startsWith('-')) {
  console.log('Usage: npm run create-demo -- ../my-product-demo\nBuild the SDK first with: npm run build:sdk');
  process.exit(argument === '--help' ? 0 : 1);
}
try {
  await access(join(root, 'packages/demodock/dist/index.js'));
  const tarball = await packSdk(join(root, '.artifacts/packages'));
  const directory = await scaffold(resolve(argument), tarball);
  console.log(`Created your playground at ${directory}\n\nNext: cd into that directory, then run npm install and npm run dev.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
