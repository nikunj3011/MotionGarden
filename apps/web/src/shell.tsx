import { Link, NavLink } from 'react-router-dom';
import { ArrowUpRight, Flower2, Music2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppearanceControls } from './preferences';
import { SoundControl } from './sound';
export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="site-header">
      <Link to="/" aria-label="MotionGarden home" className="wordmark">
        <Flower2 aria-hidden="true" />
        <span>
          motion<span className="wordmark-second">garden</span>
        </span>
        <sup>®</sup>
      </Link>
      {children}
      <div className="header-tools">
        <AppearanceControls />
        <SoundControl />
        <nav aria-label="Main navigation">
          <NavLink to="/works">
            [ Works <ArrowUpRight size={12} /> ]
          </NavLink>
          <Link to="/works?tab=music" className="music-nav-link" aria-label="Music">
            <Music2 size={14} />
            <span>Music</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function Filters({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="category-filters" role="group" aria-label="Filter artworks">
      {['All', ...categories, 'Saved'].map((category) => (
        <button key={category} aria-pressed={value === category} onClick={() => onChange(category)}>
          {category}
        </button>
      ))}
    </div>
  );
}
