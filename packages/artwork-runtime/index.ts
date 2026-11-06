import { parametersFor, type ArtworkManifest } from '../artwork-contracts';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import { blendPalette } from './palette';
import { audioBandsSchema, paletteSchema, interactionSchema } from '../artwork-contracts';
import type { AudioBands } from './audio';
export interface ArtworkEngine {
  initialize(config: ArtworkConfig): Promise<void>;
  setParameters(values: Record<string, unknown>): void;
  setAudio(bands: AudioBands): void;
  setTheme(theme: 'white' | 'dark'): void;
  setPalette(colors: string[]): void;
  resize(width: number, height: number): void;
  pause(): void;
  resume(): void;
  capture(): Promise<Blob>;
  dispose(): void;
}
export interface ArtworkConfig {
  container: HTMLElement;
  manifest: ArtworkManifest;
  baseUrl: string;
  seed?: number;
  transparent?: boolean;
}
export class Runtime implements ArtworkEngine {
  private engine: any;
  private manifest?: ArtworkManifest;
  private generation = 0;
  async initialize(config: ArtworkConfig) {
    this.dispose();
    const generation = this.generation;
    this.manifest = config.manifest;
    const url = new URL(config.manifest.entry, new URL(config.baseUrl, location.href));
    if (url.origin !== location.origin)
      throw Error('Renderer packages must be served from the controlled origin');
    const response = await fetch(url);
    if (!response.ok) throw Error('Artwork package unavailable');
    const source = await response.arrayBuffer();
    if (source.byteLength > 1024 * 1024) throw Error('Artwork package exceeds size limit');
    const hash = bytesToHex(sha256(new Uint8Array(source)));
    if (hash !== config.manifest.checksum) throw Error('Artwork integrity check failed');
    const module = await import(/* @vite-ignore */ url.href);
    if (generation !== this.generation) return;
    // p5 1.x's bundled regenerator shim assigns this global in strict modules.
    // Predeclare the binding so it does not fall back to Function() to create it.
    if (config.manifest.engine === 'p5' && !('regeneratorRuntime' in globalThis)) {
      Object.defineProperty(globalThis, 'regeneratorRuntime', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }
    // The minified distribution also omits the eval-based friendly-error reader.
    const library =
      config.manifest.engine === 'p5'
        ? (await import('p5/lib/p5.min.js')).default
        : await import('three');
    if (generation !== this.generation) return;
    this.engine = module.create({
      container: config.container,
      library,
      transparent: config.transparent ?? false,
      parameters: parametersFor(config.manifest, {}),
      seed: config.seed ?? 42,
      quality: matchMedia('(max-width: 700px)').matches ? 'low' : 'high',
    });
  }
  setParameters(values: Record<string, unknown>) {
    if (this.manifest) this.engine?.setParameters(parametersFor(this.manifest, values));
  }
  setAudio(bands: AudioBands) {
    this.engine?.setAudio?.(audioBandsSchema.parse(bands));
  }
  setInteraction(value: unknown) {
    this.engine?.setInteraction?.(interactionSchema.parse(value));
  }
  setTheme(theme: 'white' | 'dark') {
    this.engine?.setTheme?.(theme);
  }
  setPalette(colors: string[]) {
    this.engine?.setPalette?.(blendPalette(paletteSchema.parse(colors)));
  }
  resize(w: number, h: number) {
    this.engine?.resize(w, h);
  }
  pause() {
    this.engine?.pause();
  }
  resume() {
    this.engine?.resume();
  }
  capture(): Promise<Blob> {
    const canvas = this.engine?.canvas as HTMLCanvasElement | undefined;
    return new Promise((resolve, reject) => {
      if (!canvas) return reject(Error('Renderer is not ready'));
      canvas.toBlob((b) => (b ? resolve(b) : reject(Error('Capture failed'))), 'image/png');
    });
  }
  dispose() {
    this.generation++;
    this.engine?.dispose();
    this.engine = undefined;
  }
}
