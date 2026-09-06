// Conference UI parity: server allows any player (human or bot) to be selected as witness.
// This post-render patch keeps the client from hiding bot targets.
(function(){
  const base=render;
  render=function(){
    base();
    if(!state||state.phase!=='VOTING')return;
    const host=document.getElementById('voteTargets');if(!host)return;
    const voted=state.conference?.voted||busy;
    host.innerHTML=state.players.map(x=>`<button class="vote-target" data-id="${x.id}" ${voted?'disabled':''}>${x.name}${x.bot?' · BOT':''}</button>`).join('');
    host.querySelectorAll('.vote-target').forEach(b=>b.onclick=()=>act('vote',{target:b.dataset.id},d=>result(d.resolved?'Vote resolved.':'Vote locked.')));
  };
})();
