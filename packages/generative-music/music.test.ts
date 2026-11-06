import { expect, it } from 'vitest';
import json from '../../content/music/v1/index.json';
import { musicCatalogSchema, midiFrequency, pulseAt, noteAt } from './index';
it('validates all three mathematical styles', () =>
  expect(musicCatalogSchema.parse(json).items.map((p) => p.style)).toEqual([
    'Ambient',
    'Polyrhythm',
    'Arpeggio',
  ]));
it('distributes Euclidean pulses across a cycle without changing count', () => {
  for (const pulses of [3, 5, 7, 11])
    expect(
      Array.from({ length: 16 }, (_, s) => pulseAt(s, pulses, 16)).filter(Boolean),
    ).toHaveLength(pulses);
});
it('uses equal-tempered frequencies and deterministic in-scale notes', () => {
  expect(midiFrequency(69)).toBe(440);
  expect(midiFrequency(81)).toBe(880);
  for (const piece of musicCatalogSchema.parse(json).items) {
    const notes = Array.from({ length: 100 }, (_, s) => noteAt(piece, s, 42));
    expect(notes).toEqual(Array.from({ length: 100 }, (_, s) => noteAt(piece, s, 42)));
    for (const note of notes) expect(piece.scale).toContain((note - piece.root) % 12);
  }
});
