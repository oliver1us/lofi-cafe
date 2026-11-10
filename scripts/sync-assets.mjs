import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'assets/manifest.json'), 'utf8'));
let cursor = 0;
let failures = 0;
async function worker() {
  while (cursor < manifest.assets.length) {
    const asset = manifest.assets[cursor++];
    const target = resolve(root, asset.path);
    try {
      const existing = await readFile(target).catch(() => null);
      if (existing && createHash('sha256').update(existing).digest('hex') === asset.sha256) continue;
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      if (createHash('sha256').update(data).digest('hex') !== asset.sha256) throw new Error('Source checksum changed; inspect it before replacing the asset');
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, data);
      console.log(asset.path);
    } catch (error) { failures++; console.error(`${asset.path}: ${error.message}`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
if (failures) process.exitCode = 1;
else console.log(`Verified ${manifest.assets.length} local assets.`);
