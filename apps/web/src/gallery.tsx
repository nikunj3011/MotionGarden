import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Heart,
  MoveUpRight,
  Maximize2,
  Dices,
} from 'lucide-react';
import { useCatalog, useFavorites } from './catalog';
import { Filters, Header } from './shell';
import { useArtworkColors } from './preferences';
import { useArtInteraction, InteractionControls } from './interaction';
import SoundtrackPanel from './soundtrack-panel';

import { useArtworkAudio } from './audio-reaction';

export default function Gallery() {
  const { data: items = [], error, isPending, refetch } = useCatalog();
  const { favorites, toggle, storageError } = useFavorites();
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'idle'>('loading');
  const [rendererError, setRendererError] = useState('');
  const snapshot = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cooldown = useRef(0);
  const wheel = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<number | null>(null);
  const categories = [...new Set(items.map((a) => a.category))];
  const visible = items.filter(
    (a) =>
      category === 'All' ||
      category === a.category ||
      (category === 'Saved' && favorites.includes(a.id)),
  );
  const frame = useRef<HTMLIFrameElement>(null);
  const index = Math.max(
    0,
    visible.findIndex((a) => a.id === selectedId),
  );
  const active = visible[index];
  const interaction = useArtInteraction(frame, active?.id, stage);
  useArtworkColors(frame, active?.id);
  useArtworkAudio(frame, active?.id);
  const turn = useCallback(
    (step: number) => {
      if (visible.length < 2 || phase === 'loading' || performance.now() < cooldown.current) return;
      cooldown.current = performance.now() + 850;
      setDirection(step);
      const canvas = frame.current?.contentDocument?.querySelector('canvas');
      if (canvas && snapshot.current) {
        snapshot.current.width = canvas.width;
        snapshot.current.height = canvas.height;
        snapshot.current.getContext('2d')?.drawImage(canvas, 0, 0);
      }
      setPhase('loading');
      setRendererError('');
      setSelectedId(visible[(index + step + visible.length) % visible.length].id);
      clearTimeout(timer.current);
    },
    [visible, index, active, phase],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (visible.length < 2) return;
      event.preventDefault();
      wheel.current += event.deltaY + event.deltaX;
      if (Math.abs(wheel.current) > 55) {
        turn(wheel.current > 0 ? 1 : -1);
        wheel.current = 0;
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [turn, visible.length]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input,textarea,select,button,a')
      )
        return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        turn(event.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);
  useEffect(() => {
    if (!active) return;
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'READY') {
        setPhase('reveal');
        cooldown.current = performance.now() + 1000;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setPhase('idle'), 1000);
      }
      if (event.data?.type === 'ERROR') {
        setRendererError(String(event.data.message));
        setPhase('idle');
      }
    };
    window.addEventListener('message', receive);
    const timeout = setTimeout(() => {
      setPhase((current) => (current === 'loading' ? 'idle' : current));
      setRendererError((current) =>
        frame.current?.contentDocument?.querySelector('canvas')
          ? current
          : 'Artwork could not load. Try another category or reload the page.',
      );
    }, 12000);
    return () => {
      window.removeEventListener('message', receive);
      clearTimeout(timeout);
    };
  }, [active?.id]);
  const filter = (value: string) => {
    const next = items.find(
      (a) =>
        value === 'All' || value === a.category || (value === 'Saved' && favorites.includes(a.id)),
    );
    if (next?.id !== active?.id) {
      snapshot.current
        ?.getContext('2d')
        ?.clearRect(0, 0, snapshot.current.width, snapshot.current.height);
      setPhase(next ? 'loading' : 'idle');
    }
    setCategory(value);
    setRendererError('');
    setSelectedId(null);
    cooldown.current = 0;
  };
  return (
    <div className={`explore-page transition-${phase}`}>
      <div
        className="page-artwork"
        style={{ '--turn': direction } as React.CSSProperties}
        aria-hidden="true"
      >
        <canvas ref={snapshot} className="transition-snapshot" />
        {active && (
          <div className="live-artwork" key={active.id}>
            <iframe
              ref={frame}
              title={`Preview of ${active.title}`}
              src={`${import.meta.env.BASE_URL}renderer/v1/index.html?id=${encodeURIComponent(active.id)}&surface=transparent`}
              sandbox="allow-scripts allow-same-origin"
              tabIndex={-1}
            />
          </div>
        )}
        <div className="phase-grid" />
        <div className="phase-scan" />
      </div>
      <Header>
        <Filters categories={categories} value={category} onChange={filter} />
      </Header>
      <main className="exhibition">
        <div className="exhibition-topline">
          <span>AN OPEN GARDEN OF ART & SOUND</span>
          <span>
            EST. 2026 <span className="tiny-plus">+</span> ALWAYS IN MOTION
          </span>
        </div>
        <div
          className="world-stage"
          ref={stage}
          role="region"
          aria-label="Rotating artwork gallery"
          tabIndex={0}
          onPointerDown={(e) => {
            if (active?.id === 'flow-field' && interaction.enabled) return;
            drag.current = e.clientX;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (drag.current !== null && Math.abs(e.clientX - drag.current) > 45)
              turn(e.clientX < drag.current ? 1 : -1);
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <SoundtrackPanel />
          {active?.id === 'flow-field' && <InteractionControls interaction={interaction} />}
          <div className="oversized-type" aria-hidden="true">
            <span>ART & SOUND</span>
            <span>IN MOTION</span>
          </div>
          <div className="stage-cross cross-left" aria-hidden="true">
            +<br />+<br />+<br />+
          </div>
          <div className="stage-cross cross-right" aria-hidden="true">
            +<br />+<br />+<br />+
          </div>
          <div className="orbital-path" aria-hidden="true" />

          {rendererError && (
            <p className="stage-message" role="alert">
              {rendererError}
            </p>
          )}
          {phase === 'loading' && active && (
            <span className="transition-status" role="status">
              TUNING INTO {active.title.toUpperCase()} / <span>CONNECTING</span>
            </span>
          )}
          {active && (
            <button
              className="surprise-artwork"
              onPointerDown={(event) => event.stopPropagation()}
              disabled={visible.length < 2 || phase !== 'idle'}
              onClick={() => turn(1 + Math.floor(Math.random() * (visible.length - 1)))}
              aria-label="Discover a work"
              title="Discover a random artwork"
            >
              <Dices size={16} />
              <span>Discover a work</span>
            </button>
          )}
          {active && (
            <Link
              className="expand-preview"
              to={`/art/${active.id}`}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <Maximize2 size={14} /> Expand artwork
            </Link>
          )}
          {isPending && (
            <p className="stage-message" role="status">
              Growing a little world…
            </p>
          )}
          {error && (
            <div className="stage-message" role="alert">
              The garden couldn’t load.<button onClick={() => refetch()}>Try again ↗</button>
            </div>
          )}
          {!isPending && !error && !active && (
            <div className="stage-message">
              {category === 'Saved'
                ? 'Your collection starts with a little love. Save a work with the heart.'
                : 'No works in this view yet.'}
              <button onClick={() => filter('All')}>Explore all works ↗</button>
            </div>
          )}
          <div className="stage-caption">
            <span>CODE IS THE SEED.</span>
            <span>CURIOSITY IS THE WAY IN.</span>
          </div>
        </div>
        <div className="exhibition-bottom">
          <div key={active?.id} className="work-description" aria-live="polite" aria-atomic="true">
            <span className="micro-label">
              {active
                ? `${String(index + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')} — ${active.category.toUpperCase()}`
                : 'YOUR OWN LITTLE UNIVERSE'}
            </span>
            <h1>{active?.title || 'A place for living art.'}</h1>
            <p>{active?.description || 'Original experiments. Infinite possibilities.'}</p>
          </div>
          <div className="orbit-navigation">
            <span className="micro-label">SCROLL OR DRAG TO ROTATE</span>
            <div>
              <button
                aria-label="Previous artwork"
                disabled={visible.length < 2 || phase !== 'idle'}
                onClick={() => turn(-1)}
              >
                <ArrowLeft size={19} />
              </button>
              <span className="orbit-dial" aria-hidden="true">
                <span style={{ transform: `rotate(${index * 180}deg)` }}>✳</span>
              </span>
              <button
                aria-label="Next artwork"
                disabled={visible.length < 2 || phase !== 'idle'}
                onClick={() => turn(1)}
              >
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
          {active ? (
            <div className="work-actions">
              <button
                className="save-work"
                aria-label={`Save ${active.title}`}
                aria-pressed={favorites.includes(active.id)}
                onClick={() => toggle(active.id)}
              >
                <Heart size={19} fill={favorites.includes(active.id) ? 'currentColor' : 'none'} />
              </button>
              <Link className="enter-work" to={`/art/${active.id}`}>
                Enter this world <ArrowUpRight size={23} />
              </Link>
            </div>
          ) : (
            <Link className="enter-work" to="/works">
              See all works <ArrowUpRight size={23} />
            </Link>
          )}
        </div>
        {storageError && (
          <p className="storage-notice" role="status">
            {storageError}
          </p>
        )}
      </main>
      <footer className="exhibition-footer">
        <span>
          <span className="live-dot" /> NO TWO MOMENTS ALIKE
        </span>
        <Link to="/works">
          ALL WORKS, A TO Z <MoveUpRight size={12} />
        </Link>
        <span>
          TAKE YOUR TIME <ArrowDown size={11} />
        </span>
      </footer>
    </div>
  );
}
