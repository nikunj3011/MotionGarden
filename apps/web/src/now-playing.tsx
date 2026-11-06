import {useEffect,useRef} from 'react';
import {Link} from 'react-router-dom';
import {useSound,musicPieces} from './sound';
import {Shuffle} from 'lucide-react';
import {ReactToMusicControl} from './audio-reaction';
import {useAppearance} from './preferences';

export default function NowPlaying(){
 const sound=useSound();const {theme}=useAppearance();const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const element=canvas.current;if(!element)return;const context=element.getContext('2d');if(!context)return;const data=new Uint8Array(128);let frame=0,last=0;const draw=(time:number)=>{frame=requestAnimationFrame(draw);if(document.hidden||time-last<50)return;last=time;const width=element.clientWidth,height=element.clientHeight;const ratio=Math.min(devicePixelRatio,2);if(element.width!==Math.round(width*ratio)||element.height!==Math.round(height*ratio)){element.width=Math.round(width*ratio);element.height=Math.round(height*ratio)}context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);const analyser=sound.engine()?.analyser;if(analyser)analyser.getByteFrequencyData(data);else data.fill(0);const count=28,gap=2,bar=(width-gap*(count-1))/count;context.fillStyle=theme==='dark'?'#dfc57c':'#397e98';const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;for(let i=0;i<count;i++){const value=!reduced&&sound.playing&&!sound.muted?data[Math.min(data.length-1,Math.floor(1+(i/(count-1))**2*24))]/255:0;const h=2+value*(height-2);context.fillRect(i*(bar+gap),(height-h)/2,bar,h)}};frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame)},[sound.playing,sound.muted,theme]);
 return <div className={`now-playing ${sound.playing?'is-playing':''}`}><Link className="now-playing-link" to={`/music/${sound.piece.id}`} aria-label={`Open current music: ${sound.piece.title}`} onPointerDown={event=>event.stopPropagation()}>
  <span className="now-playing-caption"><small>{sound.playing?(sound.muted?'MUTED':'NOW PLAYING'):'READY TO LISTEN'}</small><strong>{sound.piece.title}</strong><span aria-hidden="true">↗</span></span>
  <canvas ref={canvas} aria-hidden="true"/>
 </Link><button data-sound-control className="shuffle-soundtrack" aria-label="Shuffle music" title="A different soundscape" onPointerDown={event=>event.stopPropagation()} onClick={()=>{const others=musicPieces.filter(piece=>piece.id!==sound.piece.id);void sound.play(others[Math.floor(Math.random()*others.length)],Math.floor(Math.random()*9999)+1)}}><Shuffle size={16}/></button><ReactToMusicControl/></div>;
}



