import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { validate } from './validate.mjs';
const [mode = 'plan', revision] = process.argv.slice(2);
const bucket = process.env.R2_BUCKET;
const origin = process.env.CONTENT_ORIGIN;
async function walk(folder, prefix = '') {
  const paths = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const key = prefix + entry.name;
    if (entry.isDirectory()) paths.push(...(await walk(`${folder}/${entry.name}`, `${key}/`)));
    else paths.push(key);
  }
  return paths;
}
function upload(key, file, immutable) {
  const ext = key.split('.').pop();
  const type =
    {
      json: 'application/json',
      js: 'text/javascript',
      html: 'text/html',
      svg: 'image/svg+xml',
      css: 'text/css',
    }[ext] || 'application/octet-stream';
  const run = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    [
      'wrangler',
      'r2',
      'object',
      'put',
      `${bucket}/${key}`,
      '--file',
      file,
      '--content-type',
      type,
      '--cache-control',
      immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
      '--remote',
    ],
    { stdio: 'inherit', shell: false },
  );
  if (run.status !== 0) throw Error(`Upload failed: ${key}`);
}
if (mode === 'rollback') {
  if (!bucket || !revision || !/^[\w.-]+$/.test(revision))
    throw Error('Set R2_BUCKET and supply a saved revision');
  upload('catalog/v1/index.json', `releases/${revision}/index.json`, false);
  process.exit(0);
}
await validate('dist');
const files = await walk('dist');
const publish = files.filter((f) => /^(artworks|music|renderer|assets|catalog)\//.test(f));
if (mode === 'plan') {
  console.log(publish.join('\n'));
  process.exit(0);
}
if (mode !== 'publish' || !bucket || !origin)
  throw Error(
    'Usage: node tools/publish.mjs plan|publish|rollback [revision]; set R2_BUCKET and CONTENT_ORIGIN',
  );
const index = JSON.parse(await readFile('dist/catalog/v1/index.json'));
await mkdir(`releases/${index.revision}`, { recursive: true });
await writeFile(`releases/${index.revision}/index.json`, JSON.stringify(index, null, 2));
// Abort on any different existing immutable byte. Catalog is always committed last.
for (const key of publish.filter((k) => !k.startsWith('catalog/'))) {
  const bytes = await readFile(`dist/${key}`);
  const response = await fetch(new URL(key, origin.endsWith('/') ? origin : origin + '/'), {
    cache: 'no-store',
  });
  if (response.ok) {
    if (!Buffer.from(await response.arrayBuffer()).equals(bytes))
      throw Error(`Immutable collision: ${key}. Publish a new package/renderer version.`);
    continue;
  }
  if (response.status !== 404)
    throw Error(`Unable to check existing object: ${key} (${response.status})`);
  upload(key, `dist/${key}`, true);
}
for (const key of publish.filter((k) => k.startsWith('catalog/') && k !== 'catalog/v1/index.json'))
  upload(key, `dist/${key}`, false);
upload('catalog/v1/index.json', 'dist/catalog/v1/index.json', false);
console.log(`Published ${index.revision}. Keep releases/ for rollback.`);
