import { sendRenderer } from './renderer-bridge';
import { useEffect, type RefObject } from 'react';
import { AudioWaveform } from 'lucide-react';
import { useSound } from './sound';
import {
  silentBands,
  spectrumBands,
  type AudioBands,
} from '../../../packages/artwork-runtime/audio';
export function ReactToMusicControl() {
  const sound = useSound();
  return (
    <button
      data-sound-control
      onPointerDown={(event) => event.stopPropagation()}
      className="react-to-music"
      aria-label="Reacts to music"
      aria-pressed={sound.reactive}
      title={sound.reactive ? 'Artwork reacts to live music' : 'Music reaction off'}
      onClick={() => sound.setReactive(!sound.reactive)}
    >
      <AudioWaveform size={16} />
      <span>Reacts to music</span>
      <small>{sound.reactive ? 'On' : 'Off'}</small>
    </button>
  );
}
export function useArtworkAudio(frame: RefObject<HTMLIFrameElement | null>, id?: string) {
  const sound = useSound();
  useEffect(() => {
    const target = frame.current?.contentWindow;
    let bands: AudioBands = { ...silentBands };
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const send = (values: AudioBands) => sendRenderer(target, { type: 'SET_AUDIO', bands: values });
    const sample = () => {
      if (!sound.reactive || !sound.playing || sound.muted || document.hidden || media.matches) {
        bands = { ...silentBands };
        send(bands);
        return;
      }
      const analyser = sound.engine()?.analyser;
      if (!analyser) {
        send(silentBands);
        return;
      }
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const next = spectrumBands(data, analyser.context.sampleRate, analyser.fftSize);
      bands = {
        bass: bands.bass * 0.7 + next.bass * 0.3,
        mid: bands.mid * 0.7 + next.mid * 0.3,
        treble: bands.treble * 0.7 + next.treble * 0.3,
      };
      send(bands);
    };
    const ready = (event: MessageEvent) => {
      if (
        event.origin === location.origin &&
        event.source === target &&
        event.data?.type === 'READY'
      )
        sample();
    };
    window.addEventListener('message', ready);
    document.addEventListener('visibilitychange', sample);
    media.addEventListener('change', sample);
    sample();
    const timer =
      sound.reactive && sound.playing && !sound.muted ? setInterval(sample, 60) : undefined;
    return () => {
      clearInterval(timer);
      window.removeEventListener('message', ready);
      document.removeEventListener('visibilitychange', sample);
      media.removeEventListener('change', sample);
      send(silentBands);
    };
  }, [sound.reactive, sound.playing, sound.muted, id, frame]);
}
