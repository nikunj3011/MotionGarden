import {Runtime} from './index';
import {StaticCloudflareRepository} from '../artwork-sdk';
import {commandSchema} from '../artwork-contracts';
const transparent=new URLSearchParams(location.search).get('surface')==='transparent';
if(transparent){document.documentElement.style.background='transparent';document.body.style.background='transparent';document.getElementById('canvas')!.style.background='transparent'};
const runtime=new Runtime();const container=document.getElementById('canvas')!;let currentId=new URLSearchParams(location.search).get('id')||'flow-field';
let pendingAudio={bass:0,mid:0,treble:0};
let pendingTheme:'white'|'dark'='dark';
let pendingColors:string[]|undefined;
let requestedPause=matchMedia('(prefers-reduced-motion: reduce)').matches;let pendingValues:Record<string,number>={};
const reply=(data:unknown)=>{if(parent!==window)parent.postMessage(data,location.origin);const native=window as any;if(native.webkit?.messageHandlers?.motiongarden)native.webkit.messageHandlers.motiongarden.postMessage(data);};
async function start(id:string){currentId=id;try{await runtime.initialize({container,manifest:await new StaticCloudflareRepository('/').get(id),baseUrl:'/',transparent});if(Object.keys(pendingValues).length)runtime.setParameters(pendingValues);document.documentElement.style.colorScheme=pendingTheme==='dark'?'dark':'light';runtime.setTheme(pendingTheme);runtime.setAudio(pendingAudio);if(pendingColors)runtime.setPalette(pendingColors);if(document.hidden||requestedPause)runtime.pause();reply({type:'READY',id})}catch(error){reply({type:'ERROR',message:error instanceof Error?error.message:'Renderer failed'})}}
async function dispatch(input:unknown){const parsed=commandSchema.safeParse(input);if(!parsed.success){reply({type:'ERROR',message:'Invalid renderer command'});return}const message=parsed.data;try{switch(message.type){case 'SET_AUDIO':pendingAudio=message.bands;runtime.setAudio(message.bands);break;case 'SET_THEME':pendingTheme=message.theme;document.documentElement.style.colorScheme=message.theme==='dark'?'dark':'light';runtime.setTheme(message.theme);break;case 'SET_PALETTE':pendingColors=message.colors;runtime.setPalette(message.colors);break;case 'INIT':await start(message.id);break;case 'SET_PARAMETERS':pendingValues=message.values;runtime.setParameters(message.values);break;case 'PAUSE':requestedPause=true;runtime.pause();break;case 'RESUME':requestedPause=false;if(!document.hidden)runtime.resume();break;case 'RESIZE':runtime.resize(message.width,message.height);break;case 'CAPTURE':reply({type:'CAPTURE',blob:await runtime.capture()});break;case 'DISPOSE':runtime.dispose();break}}catch(error){reply({type:'ERROR',message:String(error)})}}
window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent)void dispatch(event.data)});
Object.defineProperty(window,'MotionGarden',{value:Object.freeze({dispatch}),writable:false});
new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;if(width&&height)runtime.resize(width,height)}).observe(container);
document.addEventListener('visibilitychange',()=>{if(document.hidden||requestedPause)runtime.pause();else runtime.resume()});
window.addEventListener('pagehide',()=>runtime.dispose());
container.addEventListener('webglcontextlost',event=>{event.preventDefault();runtime.pause();reply({type:'ERROR',message:'Graphics context lost. Restarting…'})},true);
container.addEventListener('webglcontextrestored',()=>void start(currentId),true);
void start(currentId);





