import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Download,
  Maximize,
  EyeOff,
} from 'lucide-react';
import { useCatalog } from './catalog';
import { AppearanceControls, useArtworkColors, useAppearance, defaultColors } from './preferences';
import BottomSheet from './bottom-sheet';
import { newVariation } from './variation';
import { SoundControl } from './sound';
import { useArtworkAudio } from './audio-reaction';
import { useArtInteraction, InteractionControls } from './interaction';
import SoundtrackPanel from './soundtrack-panel';
function ArtworkPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error } = useCatalog();
  const manifest = data?.find((a) => a.id === id);
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState('');
  const [paused, setPaused] = useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hidden, setHidden] = useState(false);
  const [values, setValues] = useState<Record<string, number>>({});
  const { colors, setColors, theme } = useAppearance();
  const [notice, setNotice] = useState('');
  const interaction = useArtInteraction(frame, id);
  useArtworkColors(frame, id);
  useArtworkAudio(frame, id);
  const send = (message: unknown) =>
    frame.current?.contentWindow?.postMessage(message, location.origin);
  useEffect(() => {
    if (manifest) setValues(Object.fromEntries(manifest.parameters.map((p) => [p.key, p.default])));
  }, [manifest]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'READY') {
        setReady(true);
        setFailure('');
      }
      if (event.data?.type === 'ERROR') setFailure(String(event.data.message));
      if (event.data?.type === 'CAPTURE' && event.data.blob instanceof Blob) {
        const url = URL.createObjectURL(event.data.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `motiongarden-${id}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [id]);
  useEffect(() => {
    if (ready) {
      send({ type: 'SET_PARAMETERS', values });
      send({ type: paused ? 'PAUSE' : 'RESUME' });
    }
  }, [values, ready, paused]);
  if (error || (data && !manifest))
    return (
      <main>
        <h1>Artwork unavailable</h1>
        <Link to="/">Return to garden</Link>
      </main>
    );
  return (
    <div className="player">
      <iframe
        ref={frame}
        title={manifest?.title || 'Artwork'}
        src={`${import.meta.env.BASE_URL}renderer/v1/index.html?id=${encodeURIComponent(id || '')}`}
        sandbox="allow-scripts allow-same-origin"
        allow="fullscreen"
      />
      <div className="player-top">
        <Link to="/" aria-label="Back to garden">
          <ArrowLeft size={18} />
          <span className="player-back-label">Back to garden</span>
        </Link>
        <AppearanceControls />
        <SoundControl />
        <button onClick={() => setHidden(!hidden)} aria-label="Toggle controls">
          <EyeOff size={19} />
        </button>
      </div>
      {(!ready || failure) && (
        <div className="player-status" role={failure ? 'alert' : 'status'}>
          {failure || 'Growing your artwork…'}
          {failure && (
            <button
              onClick={() => {
                setFailure('');
                setReady(false);
                frame.current?.contentWindow?.location.reload();
              }}
            >
              Restart artwork
            </button>
          )}
        </div>
      )}
      {!hidden && manifest && (
        <BottomSheet title={manifest.title}>
          <aside className="controls">
            <p className="eyebrow">A LIVING EXPERIMENT</p>
            <h1>{manifest.title}</h1>
            <p>{manifest.description}</p>
            <SoundtrackPanel variant="player" />
            {id === 'flow-field' && <InteractionControls interaction={interaction} />}
            <div className="play-actions">
              <button onClick={() => setPaused(!paused)}>
                {paused ? <Play size={18} /> : <Pause size={18} />} {paused ? 'Play' : 'Pause'}
              </button>
              <button
                aria-label="Fullscreen"
                onClick={() => {
                  document
                    .querySelector('.player')
                    ?.requestFullscreen()
                    .catch(() => setFailure('Fullscreen is unavailable in this browser.'));
                }}
              >
                <Maximize size={18} />
              </button>
              <button
                aria-label="Export PNG"
                disabled={!ready}
                onClick={() => send({ type: 'CAPTURE' })}
              >
                <Download size={18} />
              </button>
            </div>
            {manifest.parameters
              .filter((p) => p.key !== 'seed' && p.key !== 'hue')
              .map((p) => (
                <label className="slider" key={p.key}>
                  <span>
                    {p.label}
                    <output>{values[p.key]}</output>
                  </span>
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={values[p.key] ?? p.default}
                    onChange={(e) => setValues({ ...values, [p.key]: +e.target.value })}
                  />
                </label>
              ))}
            <div className="preset-row">
              {manifest.presets.map((p) => (
                <button key={p.name} onClick={() => setValues({ ...values, ...p.values })}>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="play-actions">
              <button
                onClick={() => {
                  let seed = Math.floor(Math.random() * 9999) + 1;
                  if (seed === values.seed) seed = (seed % 9999) + 1;
                  const variation = newVariation(manifest, values, seed, colors.length, theme);
                  setValues(variation.values);
                  setColors(variation.colors);
                  setNotice('New variation: motion, intensity, and colors updated.');
                }}
              >
                <Shuffle size={15} /> New seed
              </button>
              <button
                onClick={() => {
                  setValues(Object.fromEntries(manifest.parameters.map((p) => [p.key, p.default])));
                  setColors(defaultColors(theme));
                  setNotice('Controls reset.');
                }}
              >
                <RotateCcw size={15} /> Reset
              </button>
            </div>
            <button
              className="random-artwork-player"
              disabled={!data || data.length < 2}
              onClick={() => {
                const others = data!.filter((art) => art.id !== id);
                navigate(`/art/${others[Math.floor(Math.random() * others.length)].id}`);
              }}
            >
              <Shuffle size={15} /> Surprise me — another artwork
            </button>
            <button
              className="save-preset"
              onClick={() => {
                localStorage.setItem(
                  `mg:preset:${id}`,
                  JSON.stringify({ parameters: values, colors }),
                );
                setNotice('Preset saved on this device.');
              }}
            >
              Save this moment
            </button>
            <button
              className="load-preset"
              onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem(`mg:preset:${id}`) || 'null');
                  if (saved) {
                    setValues(saved.parameters || saved);
                    if (
                      Array.isArray(saved.colors) &&
                      saved.colors.length >= 1 &&
                      saved.colors.length <= 8 &&
                      saved.colors.every(
                        (c: unknown) => typeof c === 'string' && /^#[a-f0-9]{6}$/i.test(c),
                      )
                    )
                      setColors(saved.colors);
                    setNotice('Saved preset restored.');
                  }
                } catch {}
              }}
            >
              Restore saved preset
            </button>
            <p className="variation-notice" role="status">
              {notice}
            </p>
            <small>
              Seed {values.seed ?? 42} · {manifest.engine === 'p5' ? 'p5.js' : 'Three.js'} /
              Original code / MIT license
            </small>
          </aside>
        </BottomSheet>
      )}
    </div>
  );
}

export default function Player() {
  const { id } = useParams();
  return <ArtworkPlayer key={id} />;
}
