import { mkdir, cp, readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['--check', 'script.js'], { stdio: 'inherit' });
await mkdir('dist/client', { recursive: true });
for (const file of ['index.html', 'style.css', 'script.js']) await cp(file, `dist/client/${file}`);
await cp('assets', 'dist/client/assets', { recursive: true });
await mkdir('dist/server', { recursive: true });
await writeFile('dist/server/index.js', `export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n`);
try {
  const config = JSON.parse(await readFile('.openai/hosting.json', 'utf8'));
  await mkdir('dist/.openai', { recursive: true });
  await writeFile('dist/.openai/hosting.json', JSON.stringify({ ...config, static: { directory: 'client' } }, null, 2));
} catch (error) { if (error.code !== 'ENOENT') throw error; }
for (const file of ['bride.webp', 'interior.webp']) await access(`dist/client/assets/${file}`);
console.log('Built: dist/client (static site) and dist/server/index.js (Worker).');
