import {useEffect} from 'react';
import {Link,useParams,useNavigate} from 'react-router-dom';
import {Play,Square,Shuffle,ArrowLeft} from 'lucide-react';
import {musicPieces,useSound,SoundControl} from './sound';
import {AppearanceControls} from './preferences';
import MusicVisual from './music-visual';
export default function MusicPlayer(){
 const {id}=useParams();const navigate=useNavigate();const sound=useSound();const piece=musicPieces.find(p=>p.id===id);
 useEffect(()=>{if(piece)sound.choose(piece)},[id]);
 if(!piece)return <main className="not-found"><h1>Piece not found</h1><Link to="/works?tab=music">Back to music</Link></main>;
 return <div className="music-player"><MusicVisual/><div className="music-top"><Link to="/works?tab=music"><ArrowLeft size={16}/> Music works</Link><div><AppearanceControls/><SoundControl/></div></div><section className="music-info"><p className="micro-label">{piece.style.toUpperCase()} / {piece.bpm} BPM / SEED {sound.seed}</p><h1>{piece.title}</h1><p>{piece.description}</p><div className="music-actions"><button data-sound-control onClick={()=>sound.playing?sound.stop():void sound.play(piece)}>{sound.playing?<Square size={16}/>:<Play size={16}/>} {sound.playing?'Stop':'Play sound'}</button><button data-sound-control onClick={()=>void sound.play(piece,Math.floor(Math.random()*9999)+1)}><Shuffle size={16}/> New seed</button><button data-sound-control onClick={()=>{const others=musicPieces.filter(p=>p.id!==piece.id);const next=others[Math.floor(Math.random()*others.length)];void sound.play(next,Math.floor(Math.random()*9999)+1);navigate(`/music/${next.id}`)}}>Random piece ↗</button></div><p className="music-status" role="status">{sound.error||(sound.playing?(sound.muted?'Playing · muted':'Sound on · generated live'):'Tap Play sound to begin. No AI. No recorded tracks.')}</p></section></div>;
}



