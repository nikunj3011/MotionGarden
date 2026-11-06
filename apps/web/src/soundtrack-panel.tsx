import {useEffect,useRef,useState,useId} from 'react';
import {Link} from 'react-router-dom';
import {Shuffle,Dice5,Volume2,VolumeX,ArrowUpRight,Minimize2,Maximize2} from 'lucide-react';
import {useSound,musicPieces} from './sound';
import {useAppearance} from './preferences';
import {ReactToMusicControl} from './audio-reaction';
import MusicVisual from './music-visual';

function Spectrum(){const sound=useSound();const {theme}=useAppearance();const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const element=canvas.current,ctx=element?.getContext('2d');if(!element||!ctx)return;let frame=0,last=0;const data=new Uint8Array(128);const draw=(time:number)=>{frame=requestAnimationFrame(draw);if(document.hidden||time-last<50)return;last=time;const width=element.clientWidth,height=element.clientHeight,ratio=Math.min(devicePixelRatio,2);if(element.width!==Math.round(width*ratio)||element.height!==Math.round(height*ratio)){element.width=Math.round(width*ratio);element.height=Math.round(height*ratio)}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);sound.engine()?.analyser?.getByteFrequencyData(data);ctx.fillStyle=theme==='dark'?'#dfc57c':'#397e98';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,count=36,gap=3,bar=(width-gap*(count-1))/count;for(let i=0;i<count;i++){const value=!reduced&&sound.playing&&!sound.muted?data[Math.floor(1+(i/(count-1))**2*24)]/255:0;const h=2+value*(height-2);ctx.fillRect(i*(bar+gap),(height-h)/2,bar,h)}};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame)},[sound.playing,sound.muted,theme]);
 return <canvas ref={canvas} className="soundtrack-spectrum" aria-hidden="true"/>;
}
export default function SoundtrackPanel({variant='main'}:{variant?:'main'|'player'}){
 const panelId=useId();const [minimized,setMinimized]=useState(()=>{try{return localStorage.getItem('mg:music-panel:'+variant)==='compact'}catch{return false}});useEffect(()=>{try{localStorage.setItem('mg:music-panel:'+variant,minimized?'compact':'expanded')}catch{}},[minimized,variant]);
 const sound=useSound();const shuffle=()=>{const others=musicPieces.filter(piece=>piece.id!==sound.piece.id);void sound.play(others[Math.floor(Math.random()*others.length)],Math.floor(Math.random()*9999)+1)};
 return <section className={`soundtrack-panel now-playing inline-music-viewer ${sound.playing?'is-playing':''}`} id={panelId} data-size={minimized?'minimized':'expanded'} data-variant={variant} aria-label="Current music player" onPointerDown={event=>event.stopPropagation()}>
  <button data-sound-control className="music-panel-size" aria-label={minimized?'Expand music panel':'Minimize music panel'} aria-expanded={!minimized} aria-controls={panelId} title={minimized?'Expand music panel':'Minimize music panel'} onClick={()=>setMinimized(value=>!value)}>{minimized?<Maximize2 size={14}/>:<Minimize2 size={14}/>}</button><div className="soundtrack-top"><Link className="inline-music-preview" to={`/music/${sound.piece.id}`} aria-label="Open music viewer"><MusicVisual compact/></Link><div className="inline-music-details"><Link className="now-playing-link" to={`/music/${sound.piece.id}`} aria-label={`Open current music: ${sound.piece.title}`}><span className="now-playing-caption"><small><i aria-hidden="true"/>{sound.playing?(sound.muted?'MUTED':'NOW PLAYING'):'READY TO LISTEN'}</small><strong>{sound.piece.title}</strong></span><span className="soundtrack-meta">{sound.piece.style} <span>·</span> {sound.piece.bpm} BPM <ArrowUpRight size={12}/></span></Link></div></div>
  <Spectrum/>
  <div className="soundtrack-controls"><button data-sound-control aria-label="Vary music" title="New variation of this piece" onClick={()=>void sound.play(sound.piece,Math.floor(Math.random()*9999)+1)}><Dice5 size={16} strokeWidth={1.7}/><span className="music-action-label">Vary</span></button><button data-sound-control aria-label="Shuffle music" title="A different soundscape" onClick={shuffle}><Shuffle size={16} strokeWidth={1.7}/><span className="music-action-label">Shuffle</span></button><button data-sound-control aria-label={sound.muted?'Unmute current music':'Mute current music'} title={sound.muted?'Unmute':'Mute'} onClick={sound.toggle}>{sound.muted?<VolumeX size={16} strokeWidth={1.7}/>:<Volume2 size={16} strokeWidth={1.7}/>}<span className="music-action-label">{sound.muted?'Unmute':'Mute'}</span></button><ReactToMusicControl/></div>

 </section>;
}



