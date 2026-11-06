import React,{Suspense,lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import Gallery from './gallery';
import Works from './works';
import './style.css';
import './appearance.css';
import './chromatic.css';
import './soundtrack.css';
import {PreferencesProvider} from './preferences';
import {SoundProvider} from './sound';
const MusicPlayer=lazy(()=>import('./music-player'));
const Player=lazy(()=>import('./player'));
createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={new QueryClient()}><PreferencesProvider><SoundProvider><BrowserRouter><Suspense fallback={<p className="loading" role="status">Opening artwork…</p>}><Routes><Route path="/" element={<Gallery/>}/><Route path="/works" element={<Works/>}/><Route path="/music/:id" element={<MusicPlayer/>}/><Route path="/art/:id" element={<Player/>}/><Route path="*" element={<main className="not-found"><h1>A little off the path.</h1><Link to="/">Back to the garden ↗</Link></main>}/></Routes></Suspense></BrowserRouter></SoundProvider></PreferencesProvider></QueryClientProvider></React.StrictMode>);



