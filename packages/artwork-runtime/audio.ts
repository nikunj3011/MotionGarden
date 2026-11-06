export type AudioBands = { bass: number; mid: number; treble: number };
export const silentBands: AudioBands = { bass: 0, mid: 0, treble: 0 };
export function spectrumBands(data: Uint8Array, sampleRate: number, fftSize: number): AudioBands {
  const band = (low: number, high: number) => {
    const first = Math.max(1, Math.ceil((low * fftSize) / sampleRate)),
      last = Math.min(data.length - 1, Math.floor((high * fftSize) / sampleRate));
    let sum = 0,
      count = 0;
    for (let i = first; i <= last; i++) {
      sum += (data[i] / 255) ** 2;
      count++;
    }
    return count ? Math.min(1, Math.sqrt(sum / count) * 1.5) : 0;
  };
  return { bass: band(40, 250), mid: band(250, 2000), treble: band(2000, 10000) };
}
