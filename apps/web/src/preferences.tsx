import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Moon,Sun,Plus,X,Palette} from 'lucide-react';
const defaults=['#edc24b','#0a0a0a','#eee5ce'];
const lightDefaults=['#edc24b','#91bdcb','#eee5ce'];
const valid=(value:unknown):value is string[]=>Array.isArray(value)&&value.length>=1&&value.length<=8&&value.every(c=>typeof c==='string'&&/^#[\da-f]{6}$/i.test(c));
const Preferences=createContext<{colors:string[];setColors:(colors:string[])=>void;theme:string;setTheme:(theme:string)=>void}>({colors:defaults,setColors:()=>{},theme:'white',setTheme:()=>{}});
export function useAppearance(){return useContext(Preferences)}
export function defaultColors(theme:string){return [...(theme==='dark'?defaults:lightDefaults)]}
export function PreferencesProvider({children}:{children:ReactNode}){
 const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('mg:theme')==='dark'?'dark':'white'}catch{return 'white'}});
 const [palettes,setPalettes]=useState<{white:string[];dark:string[]}>(()=>{try{const saved=JSON.parse(localStorage.getItem('mg:palettes:v2')||'null');return {white:valid(saved?.white)&&JSON.stringify(saved.white)!==JSON.stringify(['#c9971c','#397e98','#a8b8b5'])?saved.white:lightDefaults,dark:valid(saved?.dark)&&JSON.stringify(saved.dark)!==JSON.stringify(lightDefaults)?saved.dark:defaults}}catch{return {white:lightDefaults,dark:defaults}}});
 const colors=theme==='dark'?palettes.dark:palettes.white;
 const setColors=(next:string[])=>setPalettes(previous=>({...previous,[theme]:next}));
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('mg:theme',theme)}catch{}},[theme]);
 useEffect(()=>{try{localStorage.setItem('mg:palettes:v2',JSON.stringify(palettes))}catch{}},[palettes]);
 return <Preferences.Provider value={{colors,setColors,theme,setTheme}}>{children}</Preferences.Provider>;
}
export function useArtworkColors(frame:RefObject<HTMLIFrameElement|null>,id?:string){
 const {colors,theme}=useContext(Preferences);
 useEffect(()=>{const send=()=>{frame.current?.contentWindow?.postMessage({type:'SET_THEME',theme},location.origin);frame.current?.contentWindow?.postMessage({type:'SET_PALETTE',colors},location.origin)};send();const ready=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===frame.current?.contentWindow&&event.data?.type==='READY')send()};window.addEventListener('message',ready);return()=>window.removeEventListener('message',ready)},[colors,theme,id,frame]);
}
export function AppearanceControls(){
 const {colors,setColors,theme,setTheme}=useContext(Preferences);const [open,setOpen]=useState(false);const panel=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!panel.current?.contains(e.target as Node))setOpen(false)};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}};document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)}},[open]);
 return <div className="appearance-controls"><div ref={panel} className="color-control"><button ref={trigger} className="appearance-button" aria-expanded={open} aria-controls="colors-panel" onClick={()=>setOpen(!open)}><Palette size={14}/> Colors <span className="mini-swatches" aria-hidden="true">{colors.slice(0,4).map((c,i)=><i key={i} style={{background:c}}/>)}</span></button>{open&&<section id="colors-panel" className="colors-panel" aria-label="Artwork colors"><div className="colors-heading"><h2>Your colors, in motion.</h2><button aria-label="Close colors" onClick={()=>{setOpen(false);trigger.current?.focus()}}><X size={16}/></button></div><p>Pick colors. Every shade blends into the artwork.</p><div className="palette-strip" style={{background:colors.length===1?colors[0]:`linear-gradient(90deg,${colors.join(',')})`}}/><div className="color-pickers">{colors.map((color,index)=><div className="color-picker" key={index}><label><input type="color" aria-label={`Color ${index+1}`} value={color} onChange={event=>setColors(colors.map((c,i)=>i===index?event.target.value:c))}/><span>{color.toUpperCase()}</span></label><button aria-label={`Remove color ${index+1}`} disabled={colors.length===1} onClick={()=>setColors(colors.filter((_,i)=>i!==index))}><X size={12}/></button></div>)}</div><div className="palette-actions"><button disabled={colors.length>=8} onClick={()=>setColors([...colors,['#72a6ba','#e7bb35','#d9cfb2','#a9c5ce','#b68c3b'][Math.max(0,colors.length-3)%5]])}><Plus size={14}/> Add color</button><button onClick={()=>setColors(theme==='dark'?defaults:lightDefaults)}>Reset colors</button></div><small>APPLIES LIVE · UP TO 8 COLORS · SAVED ON THIS BROWSER</small></section>}</div><button className="appearance-button theme-toggle" aria-label={theme==='dark'?'Use white theme':'Use dark theme'} onClick={()=>setTheme(theme==='dark'?'white':'dark')}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}<span>{theme==='dark'?'White':'Dark'}</span></button></div>;
}




