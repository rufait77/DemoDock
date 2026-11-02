import { cp, mkdir, readdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
export const root = fileURLToPath(new URL('..', import.meta.url));
export async function packSdk(destination) {
  await mkdir(destination, { recursive: true });
  const npm = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const result = execFileSync(process.execPath, [npm, 'pack', '--workspace', '@rufait77/demodock', '--pack-destination', destination, '--json'], { cwd: root, encoding: 'utf8', windowsHide: true });
  return join(destination, JSON.parse(result)[0].filename);
}
export async function scaffold(target, tarball) {
  const directory = resolve(target);
  try { if ((await readdir(directory)).length) throw new Error(`Refusing to overwrite non-empty folder: ${directory}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(directory, { recursive: true });
  await cp(join(root, 'templates/react-vite'), directory, { recursive: true });
  await mkdir(join(directory, 'vendor'), { recursive: true });
  await copyFile(tarball, join(directory, 'vendor', basename(tarball)));
  const manifest = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
  manifest.name = basename(directory).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+/, '') || 'my-demo';
  manifest.dependencies['@rufait77/demodock'] = `file:./vendor/${basename(tarball)}`;
  await writeFile(join(directory, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(join(directory, '.gitignore'), 'node_modules/\ndist/\n.env\n.env.*\n*.log\n');
  await copyFile(join(root, 'LICENSE'), join(directory, 'LICENSE'));
  return directory;
}
