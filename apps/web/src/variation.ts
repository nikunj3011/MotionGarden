import type { ArtworkManifest } from '../../../packages/artwork-contracts';
export function newVariation(
  manifest: ArtworkManifest,
  current: Record<string, number>,
  seed: number,
  colorCount: number,
  theme: string,
) {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const values = Object.fromEntries(
    manifest.parameters.map((parameter) => {
      if (parameter.key === 'seed') return [parameter.key, seed];
      const count = Math.floor((parameter.max - parameter.min) / parameter.step + 1e-9) + 1;
      let index = Math.floor(random() * count);
      if (
        count > 1 &&
        Math.abs(
          parameter.min + index * parameter.step - (current[parameter.key] ?? parameter.default),
        ) <
          parameter.step / 2
      )
        index = (index + 1) % count;
      return [parameter.key, Number((parameter.min + index * parameter.step).toFixed(6))];
    }),
  );
  const hue = random() * 12;
  const colors = Array.from({ length: colorCount }, (_, index) => {
    const family = index % 3;
    const h = (family === 0 ? 38 + hue : family === 1 ? 194 + hue : 42 + hue) / 360,
      s =
        family === 0
          ? 0.65 + random() * 0.15
          : family === 1
            ? 0.25 + random() * 0.15
            : 0.08 + random() * 0.08,
      l = theme === 'dark' ? 0.62 + random() * 0.15 : 0.32 + random() * 0.13;
    const a = s * Math.min(l, 1 - l);
    const channel = (n: number) => {
      const k = (n + h * 12) % 12;
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
        .toString(16)
        .padStart(2, '0');
    };
    return '#' + channel(0) + channel(8) + channel(4);
  });
  return { values, colors };
}
