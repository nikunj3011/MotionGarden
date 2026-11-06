import {z} from 'zod';
export const pieceSchema=z.object({id:z.string().regex(/^[a-z0-9-]+$/),title:z.string(),style:z.enum(['Ambient','Polyrhythm','Arpeggio']),description:z.string(),bpm:z.number().min(40).max(180),root:z.number().int().min(24).max(84),scale:z.array(z.number().int().min(0).max(11)).min(1).max(12),steps:z.number().int().min(4).max(32),pulses:z.number().int().min(1).max(32)}).refine(p=>p.pulses<=p.steps);
export const musicCatalogSchema=z.object({schemaVersion:z.literal(1),items:z.array(pieceSchema)});
export type MusicPiece=z.infer<typeof pieceSchema>;
export function midiFrequency(midi:number){return 440*2**((midi-69)/12)}
export function pulseAt(step:number,pulses:number,steps:number){return ((step%steps)*pulses)%steps<pulses}
export function noteAt(piece:MusicPiece,step:number,seed:number){const fibonacci=[0,1,1,2,3,5,8,13,21,34,55,89];const degree=(fibonacci[step%fibonacci.length]+Math.floor(step/piece.steps)+seed%piece.scale.length)%piece.scale.length;return piece.root+piece.scale[degree]+(piece.style==='Arpeggio'&&step%4===3?12:0)}
export class MathematicalMusic {
 private context?:AudioContext;private master?:GainNode;private compressor?:DynamicsCompressorNode;analyser?:AnalyserNode;private interval?:ReturnType<typeof setInterval>;private voices=new Set<OscillatorNode>();private nextTime=0;private step=0;private muted=false;private transport=0;
 constructor(private piece:MusicPiece,private seed:number){}
 get state(){return this.context?.state??'closed'}
 get currentTime(){return this.context?.currentTime??0}
 configure(piece:MusicPiece,seed:number){this.piece=piece;this.seed=seed;this.step=0;this.nextTime=(this.context?.currentTime??0)+.05;this.clearVoices()}
 async start(automatic=false){const generation=++this.transport;
  if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.22;this.compressor=this.context.createDynamicsCompressor();this.compressor.threshold.value=-20;this.compressor.ratio.value=6;this.analyser=this.context.createAnalyser();this.analyser.fftSize=256;this.compressor.connect(this.master);this.master.connect(this.analyser);this.analyser.connect(this.context.destination)}
  const resumed=this.context.resume();if(automatic)await Promise.race([resumed,new Promise<void>(resolve=>setTimeout(resolve,300))]);else await resumed;if(generation!==this.transport)return false;if(this.context.state!=='running'){if(automatic)return false;throw Error('Tap again to enable browser audio.')};
  if(this.interval)clearInterval(this.interval);this.nextTime=this.context.currentTime+.05;this.interval=setInterval(()=>this.schedule(),25);this.schedule();return true;
 }
 private voice(frequency:number,at:number,duration:number,wave:OscillatorType='sine',amplitude=.2,endFrequency?:number){
  const ctx=this.context!;const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=wave;oscillator.frequency.setValueAtTime(frequency,at);if(endFrequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,at+duration*.7);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(amplitude,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(this.compressor!);this.voices.add(oscillator);oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();gain.disconnect()};oscillator.start(at);oscillator.stop(at+duration+.03);
 }
 private schedule(){const ctx=this.context;if(!ctx||ctx.state!=='running')return;const piece=this.piece;const spacing=60/piece.bpm/(piece.style==='Ambient'?1:4);if(this.nextTime<ctx.currentTime)this.nextTime=ctx.currentTime+.03;while(this.nextTime<ctx.currentTime+.14){const s=this.step++,at=this.nextTime,note=noteAt(piece,s,this.seed);if(piece.style==='Ambient'){if(s%2===0){for(const offset of [0,7,12])this.voice(midiFrequency(note+offset),at,3.5,'sine',.13)}}else if(piece.style==='Polyrhythm'){if(pulseAt(s,piece.pulses,piece.steps))this.voice(midiFrequency(note+12),at,.4,'triangle',.17);if(pulseAt(s+3,7,16))this.voice(180,at,.09,'sine',.13,65);if(s%8===0)this.voice(85,at,.18,'sine',.35,38)}else{if(pulseAt(s,piece.pulses,piece.steps))this.voice(midiFrequency(note),at,.8,'triangle',.16);if(s%16===0)this.voice(midiFrequency(piece.root-12),at,2,'sine',.2)}this.nextTime+=spacing}}
 setMuted(muted:boolean){this.muted=muted;if(this.context&&this.master)this.master.gain.setTargetAtTime(muted?0:.22,this.context.currentTime,.035)}
 private clearVoices(){for(const voice of this.voices){try{voice.stop()}catch{}}this.voices.clear()}
 async pause(){this.transport++;if(this.interval)clearInterval(this.interval);this.interval=undefined;this.clearVoices();if(this.context?.state==='running')await this.context.suspend()}
 async dispose(){await this.pause();if(this.context&&this.context.state!=='closed')await this.context.close();this.context=undefined;this.master=undefined;this.analyser=undefined}
}


