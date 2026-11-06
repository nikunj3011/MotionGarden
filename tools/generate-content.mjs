import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const previewColors = ['#edc24b', '#91bdcb', '#eee5ce'];
const artworks = [
  {
    id: 'flow-field',
    title: 'Quiet currents',
    description:
      'A thousand small journeys, guided by an invisible field. Drag gently or enable tilt to guide the flow. Each gesture eases into the current and slowly settles away.',
    category: 'Organic',
    engine: 'p5',
    engineVersion: '1.11',
    hue: 96,
    tags: ['Flow fields', 'Particles', 'Interactive'],
  },
  {
    id: 'orbit-sculpture',
    title: 'Orbital bloom',
    description: 'Thirty-six delicate orbits unfold into a sculpture that never quite repeats.',
    category: 'Sculptural',
    engine: 'three',
    engineVersion: '0.170',
    hue: 28,
    tags: ['3D', 'Geometry', 'WebGL'],
  },
];
for (const a of artworks) {
  const folder = `content/artworks/${a.id}/v1`;
  await mkdir(folder, { recursive: true });
  const checksum = createHash('sha256')
    .update(await readFile(`${folder}/sketch.js`))
    .digest('hex');
  const manifest = {
    schemaVersion: 1,
    ...a,
    version: 'v1',
    creator: { name: 'MotionGarden Studio', id: 'motiongarden' },
    entry: `artworks/${a.id}/v1/sketch.js`,
    thumbnail: `artworks/${a.id}/v1/thumbnail.svg`,
    checksum,
    minimumRendererVersion: 1,
    license: 'MIT',
    remix: true,
    tier: 'free',
    canvas: { responsive: true, background: '#13252f' },
    capabilities: a.engine === 'three' ? ['webgl'] : ['canvas2d', 'touch', 'tilt'],
    quality: { low: 350, high: 700 },
    parameters: [
      { key: 'speed', label: 'Motion', min: 0.2, max: 3, step: 0.1, default: 1 },
      { key: 'hue', label: 'Color', min: 0, max: 360, step: 1, default: a.hue },
      { key: 'density', label: 'Intensity', min: 5, max: 60, step: 1, default: 25 },
      { key: 'seed', label: 'Seed', min: 1, max: 9999, step: 1, default: 42 },
    ],
    presets: [
      { name: 'Still morning', values: { speed: 0.4, hue: a.hue, density: 18, seed: 42 } },
      { name: 'After hours', values: { speed: 1.4, hue: 260, density: 40, seed: 117 } },
    ],
  };
  await writeFile(`${folder}/manifest.json`, JSON.stringify(manifest, null, 2));
  const paths = Array.from({ length: 90 }, (_, i) => {
    const y = 30 + i * 5;
    return `<path d="M -30 ${y} C 140 ${y - 180}, 200 ${y + 220}, 410 ${y - 20} S 620 ${y - 180}, 850 ${y + 10}" fill="none" stroke="${previewColors[i % previewColors.length]}" stroke-width="${a.engine === 'p5' ? '.9' : '1.4'}" opacity=".65" transform="rotate(${a.engine === 'three' ? i * 2 : 0} 400 250)"/>`;
  }).join('');
  await writeFile(
    `${folder}/thumbnail.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${a.engine === 'p5' ? '#13252f' : '#13252f'}"/>${paths}</svg>`,
  );
}
await mkdir('content/catalog/v1', { recursive: true });
await writeFile(
  'content/catalog/v1/index.json',
  JSON.stringify(
    {
      schemaVersion: 1,
      revision: '2026-11-05.1',
      items: artworks.map((a) => ({ id: a.id, manifest: `artworks/${a.id}/v1/manifest.json` })),
    },
    null,
    2,
  ),
);
