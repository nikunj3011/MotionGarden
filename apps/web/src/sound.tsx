import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import catalog from '../../../content/music/v1/index.json';
import {MathematicalMusic,musicCatalogSchema,type MusicPiece} from '../../../packages/generative-music';
export const musicPieces=musicCatalogSchema.parse(catalog).items;
type SoundState={reactive:boolean;setReactive:(value:boolean)=>void;piece:MusicPiece;seed:number;muted:boolean;playing:boolean;error:string;play:(piece?:MusicPiece,seed?:number)=>Promise<void>;stop:()=>void;toggle:()=>void;choose:(piece:MusicPiece)=>void;engine:()=>MathematicalMusic|undefined};
const SoundContext=createContext<SoundState|null>(null);
export function useSound(){return useContext(SoundContext)!}
export function SoundProvider({children}:{children:ReactNode}){
 const [piece,setPiece]=useState(()=>musicPieces[Math.floor(Math.random()*musicPieces.length)]);const [seed,setSeed]=useState(()=>Math.floor(Math.random()*9999)+1);const [muted,setMuted]=useState(()=>{try{return localStorage.getItem('mg:sound-muted')==='true'}catch{return false}});const [playing,setPlaying]=useState(false);const [error,setError]=useState('');
 const [reactive,setReactive]=useState(()=>{try{return localStorage.getItem('mg:react-to-music')!=='false'}catch{return true}});
 useEffect(()=>{try{localStorage.setItem('mg:react-to-music',String(reactive))}catch{}},[reactive]);
 const selected=useRef({piece,seed});const request=useRef(0);const engine=useRef<MathematicalMusic|undefined>(undefined);const attempted=useRef(false);const wanted=useRef(false);
 const play=useCallback(async(nextPiece=piece,nextSeed=seed,automatic=false)=>{const current=++request.current;selected.current={piece:nextPiece,seed:nextSeed};attempted.current=!automatic;wanted.current=true;try{if(!engine.current)engine.current=new MathematicalMusic(nextPiece,nextSeed);else if(nextPiece.id!==piece.id||nextSeed!==seed)engine.current.configure(nextPiece,nextSeed);engine.current.setMuted(muted);const started=await engine.current.start(automatic);if(current!==request.current)return;if(!started){attempted.current=false;setPlaying(false);setError('Tap Sound to start listening. Your browser paused autoplay.');return}attempted.current=true;setPiece(nextPiece);setSeed(nextSeed);setPlaying(true);setError('')}catch{if(current!==request.current)return;wanted.current=false;attempted.current=false;setPlaying(false);setError('Sound could not start. Tap Sound to try again.')}},[piece,seed,muted]);
 const stop=()=>{request.current++;wanted.current=false;attempted.current=true;void engine.current?.pause();setPlaying(false)};
 const choose=(nextPiece:MusicPiece)=>{if(nextPiece.id===piece.id)return;request.current++;selected.current={piece:nextPiece,seed};setPiece(nextPiece);engine.current?.configure(nextPiece,seed)};
 const toggle=()=>{if(!playing){setMuted(false);if(engine.current)engine.current.setMuted(false);void play().then(()=>{engine.current?.setMuted(false)});return}setMuted(value=>!value)};
 useEffect(()=>{const timer=setTimeout(()=>{if(!muted)void play(selected.current.piece,selected.current.seed,true)},0);return()=>clearTimeout(timer)},[]);
 useEffect(()=>{engine.current?.setMuted(muted);try{localStorage.setItem('mg:sound-muted',String(muted))}catch{}},[muted]);
 useEffect(()=>{const unlock=(event:Event)=>{const target=event.target;if(target instanceof Element&&target.closest('[data-sound-control]'))return;if(attempted.current)return;attempted.current=true;if(!muted)void play()};document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);return()=>{document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true)}},[muted,play]);
 useEffect(()=>{const visibility=()=>{if(document.hidden){void engine.current?.pause();setPlaying(false)}else if(wanted.current&&engine.current){void engine.current.start().then(()=>setPlaying(true)).catch(()=>{setPlaying(false);setError('Tap Sound to resume.')})}};document.addEventListener('visibilitychange',visibility);return()=>{document.removeEventListener('visibilitychange',visibility);request.current++;wanted.current=false;void engine.current?.dispose()}},[]);
 return <SoundContext.Provider value={{reactive,setReactive,piece,seed,muted,playing,error,play,stop,toggle,choose,engine:()=>engine.current}}>{children}</SoundContext.Provider>;
}
export function SoundControl(){const sound=useSound();const label=!sound.playing?'Enable generative sound':sound.muted?'Unmute sound':'Mute sound';return <button data-sound-control className="appearance-button sound-toggle" aria-label={label} aria-pressed={sound.playing&&!sound.muted} onClick={sound.toggle} title={sound.error||`${sound.piece.title} · mathematically generated`}>
 {sound.muted?<VolumeX size={15}/>:<Volume2 size={15}/>}<span>{!sound.playing?'Tap for sound':sound.muted?'Muted':'Sound on'}</span>
 </button>}



