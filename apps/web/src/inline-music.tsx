import { Link } from 'react-router-dom';
import { Play, Square, RotateCw } from 'lucide-react';
import { useSound } from './sound';
import MusicVisual from './music-visual';
export default function InlineMusic() {
  const sound = useSound();
  return (
    <section
      className="inline-music-viewer"
      aria-label="Current music player"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Link
        className="inline-music-preview"
        to={`/music/${sound.piece.id}`}
        aria-label="Open music viewer"
      >
        <MusicVisual compact />
      </Link>
      <div className="inline-music-details">
        <small>
          {sound.piece.style.toUpperCase()} / {sound.piece.bpm} BPM
        </small>
        <Link to={`/music/${sound.piece.id}`}>{sound.piece.title} ↗</Link>
        <div className="inline-music-actions">
          <button
            data-sound-control
            aria-label={sound.playing ? 'Stop music' : 'Play music'}
            onClick={() => (sound.playing ? sound.stop() : void sound.play())}
          >
            {sound.playing ? <Square size={13} /> : <Play size={13} />}
          </button>
          <button
            data-sound-control
            aria-label="Regenerate music"
            onClick={() => void sound.play(sound.piece, Math.floor(Math.random() * 9999) + 1)}
          >
            <RotateCw size={13} />
            <span>New seed</span>
          </button>
        </div>
      </div>
    </section>
  );
}
