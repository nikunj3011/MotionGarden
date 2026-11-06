import {useEffect,useId,useRef,useState,type ReactNode} from 'react';
import {ChevronUp,ChevronDown} from 'lucide-react';

const mobileQuery='(max-width: 650px), (max-width: 950px) and (max-height: 500px)';
export default function BottomSheet({title,children}:{title:string;children:ReactNode}){
 const [mobile,setMobile]=useState(()=>matchMedia(mobileQuery).matches);
 const [expanded,setExpanded]=useState(false);const [offset,setOffset]=useState<number|null>(null);
 const sheet=useRef<HTMLElement>(null);const handle=useRef<HTMLButtonElement>(null);const gesture=useRef<{y:number;offset:number;last:number}|null>(null);const suppressClick=useRef(false);const id=useId();
 const distance=()=>Math.max(0,(sheet.current?.offsetHeight??0)-(handle.current?.offsetHeight??64));
 useEffect(()=>{const media=matchMedia(mobileQuery);const change=()=>{setMobile(media.matches);setOffset(null);gesture.current=null};media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 const finish=(cancelled=false)=>{const current=gesture.current;if(!current)return;const moved=current.last-current.y;if(!cancelled&&Math.abs(moved)>6){setExpanded(moved<-30?true:moved>30?false:(offset??current.offset)<distance()/2);suppressClick.current=true}gesture.current=null;setOffset(null)};
 return <section ref={sheet} className={`bottom-sheet ${mobile?'is-mobile':''} ${expanded?'is-expanded':'is-collapsed'} ${offset!==null?'is-dragging':''}`} aria-label="Artwork controls" style={mobile&&offset!==null?{transform:`translateY(${offset}px)`}:undefined} onKeyDown={event=>{if(event.key==='Escape'&&mobile&&expanded){setExpanded(false);handle.current?.focus()}}}>
  <button ref={handle} className="sheet-handle" aria-label={expanded?'Minimize artwork controls':'Expand artwork controls'} aria-expanded={expanded} aria-controls={id}
   onPointerDown={event=>{if(!mobile)return;suppressClick.current=false;const start=expanded?0:distance();gesture.current={y:event.clientY,offset:start,last:event.clientY};setOffset(start);event.currentTarget.setPointerCapture(event.pointerId)}}
   onPointerMove={event=>{if(!gesture.current)return;gesture.current.last=event.clientY;setOffset(Math.max(0,Math.min(distance(),gesture.current.offset+event.clientY-gesture.current.y)))}}
   onPointerUp={()=>finish()} onPointerCancel={()=>finish(true)}
   onClick={()=>{if(suppressClick.current){suppressClick.current=false;return}setExpanded(value=>!value)}}
   onKeyDown={event=>{if(event.key==='ArrowUp'||event.key==='ArrowDown'){event.preventDefault();setExpanded(event.key==='ArrowUp')}}}>
   <span className="sheet-grip" aria-hidden="true"/><span className="sheet-peek"><span><small>ARTWORK CONTROLS</small><strong>{title}</strong></span>{expanded?<ChevronDown size={20}/>:<ChevronUp size={20}/>}</span>
  </button>
  <div id={id} className="sheet-content" inert={mobile&&!expanded}>{children}</div>
 </section>;
}
