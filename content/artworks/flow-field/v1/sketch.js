export function create({container,library:P5,parameters,seed,quality,transparent=false}) {
 let audio={bass:0,mid:0,treble:0},theme='dark',ready=false,palette=[],values=parameters,particles=[],canvas,paused=false,sketchReset=()=>{};
 const sketch=new P5(p=>{
  const reset=()=>{p.randomSeed(values.seed??seed);p.noiseSeed(values.seed??seed);particles=Array.from({length:quality==='low'?350:700},()=>({x:p.random(p.width),y:p.random(p.height),age:p.random(200)}));if(transparent)p.clear();else p.background(theme==='white'?'#f3f0e6':'#101112');};
  p.setup=()=>{const c=p.createCanvas(container.clientWidth,container.clientHeight);canvas=c.elt;p.pixelDensity(Math.min(devicePixelRatio,2));p.colorMode(p.HSB,360,100,100,100);ready=true;reset()};
  p.draw=()=>{if(transparent){const ctx=p.drawingContext;ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,0.035)';ctx.fillRect(0,0,p.width,p.height);ctx.restore()}else{p.noStroke();p.fill(theme==='white'?'rgba(243,240,230,0.035)':'rgba(16,17,18,0.035)');p.rect(0,0,p.width,p.height);}for(let i=0;i<particles.length;i++){const dot=particles[i];const angle=audio.mid*Math.sin(i*.03)*.5+p.noise(dot.x*.0018,dot.y*.0018,p.frameCount*.0005)*Math.PI*4;const x=dot.x,y=dot.y;dot.x+=Math.cos(angle)*values.speed*(1+audio.bass*1.2+audio.mid*.4);dot.y+=Math.sin(angle)*values.speed*(1+audio.bass*1.2+audio.mid*.4);dot.age++;if(dot.x<0||dot.x>p.width||dot.y<0||dot.y>p.height||dot.age>300){dot.x=p.random(p.width);dot.y=p.random(p.height);dot.age=0;continue;}if(palette.length){const hex=palette[Math.round(i/(particles.length-1)*(palette.length-1))];p.stroke(`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${Math.min(1,values.density/50)})`)}else p.stroke((values.hue+i*.065)%360,48,85,values.density);p.strokeWeight((palette.length?1.35:1)*(1+audio.treble*.7));p.line(x,y,dot.x,dot.y)}};
  p.mousePressed=()=>{if(p.mouseX>=0&&p.mouseX<p.width&&p.mouseY>=0&&p.mouseY<p.height){for(const dot of particles.slice(0,180)){dot.x=p.mouseX+p.random(-20,20);dot.y=p.mouseY+p.random(-20,20);dot.age=0}}};
  p.windowResized=()=>{};
  sketchReset=reset;
 },container);
 return {get canvas(){return canvas},setAudio(next){audio=next},setTheme(next){if(theme!==next){theme=next;if(ready){sketchReset();if(paused)sketch.redraw?.()}}},setPalette(colors){palette=colors;if(paused)sketch.redraw?.()},setParameters(next){const changed=values.seed!==next.seed;values=next;if(changed){sketchReset();if(paused)sketch.redraw?.()}},resize(w,h){sketch.resizeCanvas(w,h);sketchReset()},pause(){paused=true;sketch.noLoop()},resume(){if(paused){paused=false;sketch.loop()}},dispose(){sketch.remove()}};
}





