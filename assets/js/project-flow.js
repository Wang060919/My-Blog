// All illustration content is static HTML. These finite cues are examples, never live output.
export function animateProjectFlow(flow, animate, lead = 0) {
  if (!flow) return;
  const get = selector => flow.querySelector(selector);
  if (flow.dataset.flow === 'translation') {
    animate(get('.selection-mark'), [{transform:'scaleX(0)',opacity:.15},{transform:'scaleX(1)',opacity:1}],560,260+lead,'cubic-bezier(.4,0,.2,1)');
    animate(get('.selection-shortcut'), [{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],180,620+lead);
    animate(get('.flow-float'), [{opacity:0,transform:'translate(12px,9px) scale(.97)'},{opacity:1,transform:'translate(0,0) scale(1)'}],480,780+lead);
    animate(get('.flow-result'), [{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],620,1010+lead);
  } else if (flow.dataset.flow === 'signal') {
    flow.querySelectorAll('[data-signal-line]').forEach((path,index)=>{
      const length=path.getTotalLength();
      animate(path,[{strokeDasharray:`${length}`,strokeDashoffset:length},{strokeDasharray:`${length}`,strokeDashoffset:0}],500,160+index*110+lead);
    });
    flow.querySelectorAll('.signal-packets path').forEach((path,index)=>{
      const length=path.getTotalLength();
      animate(path,[{opacity:0,strokeDasharray:`16 ${length}`,strokeDashoffset:16},{opacity:1,strokeDasharray:`16 ${length}`,strokeDashoffset:0,offset:.12},{opacity:1,strokeDasharray:`16 ${length}`,strokeDashoffset:-length,offset:.9},{opacity:0,strokeDasharray:`16 ${length}`,strokeDashoffset:-length}],640,600+index*470+lead,'linear');
    });
    animate(get('.display-light'),[{opacity:.08},{opacity:.75}],360,1350+lead);
    animate(get('.display-wave'),[{clipPath:'inset(0 100% 0 0)',opacity:.15},{clipPath:'inset(0 0% 0 0)',opacity:1}],520,1490+lead);
    animate(get('.chip-led'),[{opacity:.3},{opacity:1},{opacity:.6},{opacity:1}],420,960+lead);
  } else if (flow.dataset.flow === 'request') {
    animate(get('.terminal-input'),[{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}],650,220+lead,'steps(9,end)');
    flow.querySelectorAll('.request-dots i').forEach((dot,index)=>animate(dot,[{opacity:.2,transform:'translateY(0)'},{opacity:1,transform:'translateY(-2px)'},{opacity:.2,transform:'translateY(0)'}],380,820+index*120+lead,'ease-in-out'));
    // Show one complete response: the verified Python exercise does not promise streaming.
    animate(get('.terminal-output'),[{opacity:0,clipPath:'inset(0 0 100% 0)',transform:'translateY(5px)'},{opacity:1,clipPath:'inset(0 0 0% 0)',transform:'translateY(0)'}],420,1340+lead);
  }
}
