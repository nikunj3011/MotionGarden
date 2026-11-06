import { it, expect } from 'vitest';
import { blendPalette } from './palette';
import { commandSchema } from '../artwork-contracts';
it('blends every palette stop and supports one color', () => {
  expect(blendPalette(['#ff0000', '#00ff00', '#0000ff'], 5)).toEqual([
    '#ff0000',
    '#808000',
    '#00ff00',
    '#008080',
    '#0000ff',
  ]);
  expect(blendPalette(['#aabbcc'], 3)).toEqual(['#aabbcc', '#aabbcc', '#aabbcc']);
});
it('rejects invalid, empty and excessive color palettes', () => {
  for (const colors of [[], ['red'], ['#fff'], Array(9).fill('#ffffff')])
    expect(commandSchema.safeParse({ type: 'SET_PALETTE', colors }).success).toBe(false);
  expect(commandSchema.safeParse({ type: 'SET_PALETTE', colors: ['#112233'] }).success).toBe(true);
});
