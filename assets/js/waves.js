// Small SVG surface morph and bounded fine-pointer parallax. No canvas/WebGL or scroll work.
export function initWaves(svg, reduced) {
  if (!svg) return { setRunning() {} };
  const ribbons = Array.from(svg.querySelectorAll('[data-wave-lane]'));
  const edges = Array.from(svg.querySelectorAll('[data-wave-edge]'));
  const fibers = Array.from(svg.querySelectorAll('[data-wave-fiber]')).map(path => {
    const [lane, edge] = path.dataset.waveFiber.split(',').map(Number);
    return {path, lane, edge};
  });
  const compact = matchMedia('(max-width: 767px), (pointer: coarse)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)'),hero=svg.closest('.home-intro');
  const pointer={x:0,y:0,targetX:0,targetY:0};
  const resetPointer=()=>{pointer.targetX=0;pointer.targetY=0;};
  hero?.addEventListener('pointermove',event=>{
    if(!running || reduced.matches || !fine.matches || event.pointerType==='touch')return;
    const box=hero.getBoundingClientRect();
    pointer.targetX=Math.max(-7,Math.min(7,(event.clientX-box.left-box.width/2)/box.width*14));
    pointer.targetY=Math.max(-4,Math.min(4,(event.clientY-box.top-box.height/2)/box.height*8));
  },{passive:true});
  hero?.addEventListener('pointerleave',resetPointer);
  fine.addEventListener('change',()=>{resetPointer();if(!fine.matches){pointer.x=0;pointer.y=0;hero?.style.removeProperty('--wave-x');hero?.style.removeProperty('--wave-y');}});
  let frame=0, running=false, previous=0, elapsed=0, rendered=0;
  const sample = (lane, edge, t, steps) => Array.from({length:steps+1}, (_,i) => {
    const phase=t*(.78+lane*.085);
    const u=i/steps, x=-80+1760*u, valley=Math.sin(Math.PI*u)**2;
    let y=112+lane*52+(314-lane*29)*valley+30*Math.sin(u*Math.PI*2.4+lane*.7+phase*.26);
    y+=Math.sin(u*Math.PI*3.1-phase*.18+lane*.5)*11;
    return [x,y+edge*(65+18*lane+20*Math.sin(u*Math.PI*2+lane*.5+phase*.12))];
  });
  const curve=(points,move=true)=>{
    let path=`${move?'M':'L'}${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
    for(let i=0;i<points.length-1;i++) {
      const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
      path+=`C${(b[0]+(c[0]-a[0])/6).toFixed(1)},${(b[1]+(c[1]-a[1])/6).toFixed(1)} ${(c[0]-(d[0]-b[0])/6).toFixed(1)},${(c[1]-(d[1]-b[1])/6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
    }
    return path;
  };
  const draw=time=>{
    if(hero && fine.matches && !reduced.matches){
      pointer.x+=(pointer.targetX-pointer.x)*.15;pointer.y+=(pointer.targetY-pointer.y)*.15;
      hero.style.setProperty('--wave-x',`${pointer.x.toFixed(2)}px`);hero.style.setProperty('--wave-y',`${pointer.y.toFixed(2)}px`);
    }
    const steps=compact.matches?20:32;
    const surfaces=ribbons.map((path,lane)=>{
      const top=sample(lane,-.5,time,steps),bottom=sample(lane,.5,time,steps);
      path.setAttribute('d',curve(top)+' '+curve(bottom.reverse(),false)+'Z');return top;
    });
    edges.forEach(path=>path.setAttribute('d',curve(surfaces[Number(path.dataset.waveEdge)])));
    if(!compact.matches) fibers.forEach(({path,lane,edge})=>path.setAttribute('d',curve(sample(lane,edge,time,steps))));
    svg.dataset.waveFrames=String(++rendered);
  };
  const tick=now=>{
    if(!running) return;
    if(!previous) previous=now;
    const interval=compact.matches?1000/16:1000/30;
    if(now-previous>=interval) { elapsed+=Math.min(now-previous,100);previous=now;draw(elapsed/1000); }
    frame=requestAnimationFrame(tick);
  };
  return {setRunning(value){
    value=Boolean(value)&&!reduced.matches;
    svg.dataset.waveRunning=String(value);
    if(value===running)return;
    running=value;cancelAnimationFrame(frame);previous=0;
    if(!running){resetPointer();pointer.x=0;pointer.y=0;hero?.style.removeProperty('--wave-x');hero?.style.removeProperty('--wave-y');}
    if(running) frame=requestAnimationFrame(tick);
  }};
}
