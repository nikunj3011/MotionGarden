import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, Search, Square } from 'lucide-react';
import { musicPieces, useSound } from './sound';
export default function MusicWorks() {
  const sound = useSound();
  const [search, setSearch] = useState('');
  const visible = musicPieces.filter((piece) =>
    `${piece.title} ${piece.style} ${piece.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="music-intro">
        <p>Music grown from numbers.</p>
        <span>
          OSCILLATORS · EUCLIDEAN RHYTHMS · FIBONACCI SEQUENCES
          <br />
          GENERATED ON YOUR DEVICE. NO AI. NO RECORDED TRACKS.
        </span>
      </div>
      <label className="index-search music-search">
        <Search size={17} />
        <input
          aria-label="Search music"
          placeholder="Search by name or style"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div className="music-index">
        {visible.map((piece, index) => (
          <article className="music-row" key={piece.id}>
            <span className="row-number">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <Link to={`/music/${piece.id}`}>
                <h2>{piece.title}</h2>
              </Link>
              <p>{piece.description}</p>
              <small>
                {piece.style.toUpperCase()} / {piece.bpm} BPM
              </small>
            </div>
            <button
              data-sound-control
              className="music-play"
              aria-label={
                sound.playing && sound.piece.id === piece.id
                  ? `Stop ${piece.title}`
                  : `Play ${piece.title}`
              }
              onClick={() =>
                sound.playing && sound.piece.id === piece.id ? sound.stop() : void sound.play(piece)
              }
            >
              {sound.playing && sound.piece.id === piece.id ? (
                <Square size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>
            <Link aria-label={`Open ${piece.title}`} to={`/music/${piece.id}`}>
              <ArrowUpRight size={24} />
            </Link>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p className="index-message">No music found. Try another name or style.</p>
      )}
      {sound.error && <p role="alert">{sound.error}</p>}
    </>
  );
}
