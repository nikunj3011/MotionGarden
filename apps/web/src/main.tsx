import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Gallery from './gallery';
import Works from './works';
import './style.css';
import './appearance.css';
import './chromatic.css';
import './soundtrack.css';
import './interaction.css';
import { RecoveryBoundary } from './recovery';
import { PreferencesProvider } from './preferences';
import { SoundProvider, loadMusicCatalog } from './sound';
const Router = import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;
const MusicPlayer = lazy(() => import('./music-player'));
const Player = lazy(() => import('./player'));
const root = createRoot(document.getElementById('root')!);
root.render(
  <p className="loading" role="status">
    Opening the garden…
  </p>,
);
function renderGarden() {
  root.render(
    <React.StrictMode>
      <RecoveryBoundary>
        <QueryClientProvider client={new QueryClient()}>
          <PreferencesProvider>
            <SoundProvider>
              <Router>
                <Suspense
                  fallback={
                    <p className="loading" role="status">
                      Opening artwork…
                    </p>
                  }
                >
                  <Routes>
                    <Route path="/" element={<Gallery />} />
                    <Route path="/works" element={<Works />} />
                    <Route path="/music/:id" element={<MusicPlayer />} />
                    <Route path="/art/:id" element={<Player />} />
                    <Route
                      path="*"
                      element={
                        <main className="not-found">
                          <h1>A little off the path.</h1>
                          <Link to="/">Back to the garden ↗</Link>
                        </main>
                      }
                    />
                  </Routes>
                </Suspense>
              </Router>
            </SoundProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </RecoveryBoundary>
    </React.StrictMode>,
  );
}
void loadMusicCatalog()
  .then(renderGarden)
  .catch(() => {
    root.render(
      <main className="not-found" role="alert">
        <h1>The garden couldn’t load.</h1>
        <p>Check your connection and try again.</p>
        <button onClick={() => location.reload()}>Try again</button>
      </main>,
    );
  });
