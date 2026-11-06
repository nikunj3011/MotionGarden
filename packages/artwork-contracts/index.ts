import { z } from 'zod';
// Keep validation compatible with strict CSP: no generated Function/eval code.
z.config({ jitless: true });
export const parameterSchema = z
  .object({
    key: z.string().regex(/^[a-zA-Z]+$/),
    label: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    default: z.number(),
  })
  .refine(
    (p) => p.min <= p.default && p.default <= p.max && p.min < p.max,
    'Invalid parameter range',
  );
export const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.literal('v1'),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  creator: z.object({ name: z.string(), id: z.string() }),
  engine: z.enum(['p5', 'three']),
  engineVersion: z.string(),
  entry: z.string().regex(/^artworks\/[a-z0-9-]+\/v1\/sketch\.js$/),
  thumbnail: z.string(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  minimumRendererVersion: z.literal(1),
  license: z.literal('MIT'),
  remix: z.boolean(),
  tier: z.literal('free'),
  canvas: z.object({ responsive: z.boolean(), background: z.string() }),
  capabilities: z.array(z.string()),
  quality: z.object({ low: z.number(), high: z.number() }),
  parameters: z.array(parameterSchema),
  presets: z.array(z.object({ name: z.string(), values: z.record(z.string(), z.number()) })),
});
export type ArtworkManifest = z.infer<typeof manifestSchema>;
export const catalogSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.string(),
  items: z.array(z.object({ id: z.string(), manifest: z.string() })),
});
export function parametersFor(m: ArtworkManifest, values: Record<string, unknown>) {
  return Object.fromEntries(
    m.parameters.map((p) => {
      const v = values[p.key];
      return [
        p.key,
        typeof v === 'number' && Number.isFinite(v)
          ? Math.min(p.max, Math.max(p.min, v))
          : p.default,
      ];
    }),
  );
}
export const paletteSchema = z
  .array(z.string().regex(/^#[a-fA-F0-9]{6}$/))
  .min(1)
  .max(8);
export const audioBandsSchema = z.object({
  bass: z.number().finite().min(0).max(1),
  mid: z.number().finite().min(0).max(1),
  treble: z.number().finite().min(0).max(1),
});
export const interactionSchema = z.object({
  enabled: z.boolean(),
  pointer: z.object({
    x: z.number().finite().min(-1).max(1),
    y: z.number().finite().min(-1).max(1),
    strength: z.number().finite().min(0).max(1),
  }),
  tilt: z.object({ x: z.number().finite().min(-1).max(1), y: z.number().finite().min(-1).max(1) }),
});
export const commandSchema = z.discriminatedUnion('type', [
  interactionSchema.extend({ type: z.literal('SET_INTERACTION') }),
  z.object({ type: z.literal('SET_AUDIO'), bands: audioBandsSchema }),
  z.object({ type: z.literal('SET_THEME'), theme: z.enum(['white', 'dark']) }),
  z.object({ type: z.literal('SET_PALETTE'), colors: paletteSchema }),
  z.object({ type: z.literal('INIT'), id: z.string().regex(/^[a-z0-9-]+$/) }),
  z.object({
    type: z.literal('SET_PARAMETERS'),
    values: z.record(z.string(), z.number().finite()),
  }),
  z.object({ type: z.literal('PAUSE') }),
  z.object({ type: z.literal('RESUME') }),
  z.object({ type: z.literal('CAPTURE') }),
  z.object({ type: z.literal('DISPOSE') }),
  z.object({
    type: z.literal('RESIZE'),
    width: z.number().positive().max(8192),
    height: z.number().positive().max(8192),
  }),
]);
