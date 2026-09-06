// KILLER AMONG US — authoritative Fog of War client.
// The server now withholds room/position for players outside your awareness.
const FOG_RADIUS=6;
function fogVisible(p){
  if(!state?.private||!p)return false;
  if(p.id===state.private.id)return true;
  if(conference?.()||['DISCUSSION','VOTING','TESTIMONY'].includes(state.phase))return true;
  return p.visible===true;
}
function applyFogOfWar(){
  if(!state?.players||!state?.private)return;
  const visible=new Set(state.players.filter(fogVisible).map(p=>p.id));
  document.querySelectorAll('.player-piece').forEach(el=>{
    const name=el.getAttribute('title');
    const p=state.players.find(x=>x.name===name);
    el.style.display=p&&visible.has(p.id)?'':'none';
  });
  const list=document.getElementById('players');
  if(list){
    const seen=state.players.filter(p=>visible.has(p.id));
    const hidden=state.players.length-seen.length;
    list.innerHTML=seen.map(x=>`<span class="${x.id===state.turnPlayerId&&!conference()?'active-player':''}">${x.name}${x.bot?' · BOT':''} · ${x.id===state.private.id?positionLabel(x.position):'IN SIGHT'}${x.revealedHand?' · HAND EXPOSED':''}${!x.connected?' · OFFLINE':''}</span>`).join('')+(hidden?`<span class="fog-hidden-count">◌ ${hidden} PLAYER${hidden===1?'':'S'} OUT OF SIGHT</span>`:'');
  }
  const hint=document.querySelector('.board-hint');
  if(hint)hint.textContent=`FOG OF WAR · PLAYERS VISIBLE WITHIN ${FOG_RADIUS} SPACES · HIDDEN POSITIONS NEVER LEAVE THE SERVER`;
}
const fogBaseRender=render;
render=function(){fogBaseRender();applyFogOfWar()};
