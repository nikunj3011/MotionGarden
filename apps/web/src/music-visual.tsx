import { useEffect, useRef } from 'react';
import { useSound } from './sound';
import { useAppearance } from './preferences';
export default function MusicVisual({ compact = false }: { compact?: boolean }) {
  const sound = useSound();
  const { colors, theme } = useAppearance();
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const ctx = element.getContext('2d');
    if (!ctx) return;
    let frame = 0,
      last = 0,
      width = 0,
      height = 0;
    const samples = new Uint8Array(128);
    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 2);
      width = element.clientWidth;
      height = element.clientHeight;
      element.width = width * ratio;
      element.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || !width || !height || now - last < 33) return;
      last = now;
      ctx.clearRect(0, 0, width, height);
      const engine = sound.engine();
      engine?.analyser?.getByteFrequencyData(samples);
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const energy =
        !reduced && engine?.state === 'running'
          ? samples.reduce((n, x) => n + x, 0) / (samples.length * 255)
          : 0;
      const t = reduced ? 0 : (engine?.currentTime ?? 0);
      const size = Math.min(width, height),
        rings = compact ? 18 : 42,
        segments = compact ? 90 : 180;
      for (let ring = 0; ring < rings; ring++) {
        ctx.beginPath();
        ctx.strokeStyle = colors[ring % colors.length];
        ctx.globalAlpha = 0.4 + energy * 0.5;
        ctx.lineWidth = compact ? 0.8 : 1;
        for (let n = 0; n <= segments; n++) {
          const a = (n / segments) * Math.PI * 2;
          const wave =
            Math.sin(
              a * (sound.piece.style === 'Polyrhythm' ? 5 : 3) +
                t * 0.35 +
                ring * 0.15 +
                sound.seed * 0.01,
            ) *
            (size * 0.018 + energy * size * 0.09);
          const radius = size * 0.27 + wave + ring * size * (compact ? 0.006 : 0.0017);
          const x = width / 2 + Math.cos(a) * radius,
            y = height / 2 + Math.sin(a) * radius * 0.8;
          if (n === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [colors, theme, sound.seed, sound.piece.id, compact]);
  return (
    <canvas
      ref={canvas}
      aria-label={compact ? 'Current music visualization' : 'Mathematical music visualization'}
    />
  );
}
