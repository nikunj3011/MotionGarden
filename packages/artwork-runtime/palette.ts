export function blendPalette(colors: string[], steps = 256): string[] {
  if (!colors.length) return [];
  const rgb = colors.map((hex) =>
    [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)),
  );
  return Array.from({ length: steps }, (_, index) => {
    const position = (index / (steps - 1)) * (colors.length - 1),
      left = Math.floor(position),
      right = Math.min(left + 1, colors.length - 1),
      t = position - left;
    return (
      '#' +
      rgb[left]
        .map((v, c) =>
          Math.round(v + (rgb[right][c] - v) * t)
            .toString(16)
            .padStart(2, '0'),
        )
        .join('')
    );
  });
}
