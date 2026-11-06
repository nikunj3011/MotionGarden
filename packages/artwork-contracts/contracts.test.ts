import { describe, it, expect } from 'vitest';
import { manifestSchema, parametersFor, commandSchema } from './index';
import manifest from '../../content/artworks/flow-field/v1/manifest.json';
describe('artwork contract', () => {
  it('parses v1 and accepts additive metadata', () =>
    expect(manifestSchema.parse({ ...manifest, futureField: true }).id).toBe('flow-field'));
  it('rejects unknown schema versions', () =>
    expect(manifestSchema.safeParse({ ...manifest, schemaVersion: 2 }).success).toBe(false));
  it('clamps parameter values and rejects nonfinite inputs', () => {
    const m = manifestSchema.parse(manifest);
    expect(parametersFor(m, { speed: 100, hue: NaN })).toMatchObject({ speed: 3, hue: 96 });
  });
  it('rejects privileged or malformed bridge messages', () => {
    expect(commandSchema.safeParse({ type: 'OPEN_URL', url: 'https://example.com' }).success).toBe(
      false,
    );
    expect(
      commandSchema.safeParse({ type: 'SET_PARAMETERS', values: { speed: Infinity } }).success,
    ).toBe(false);
    expect(commandSchema.safeParse({ type: 'RESIZE', width: 0, height: 500 }).success).toBe(false);
  });
});
