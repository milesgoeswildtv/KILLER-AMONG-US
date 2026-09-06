// KILLER AMONG US — Fog of War presentation layer.
// The HQ stays visible. Players outside your six-space awareness disappear.
const FOG_RADIUS=6;
function fogFloor(pos){if(!pos?.startsWith?.('floor:'))return null;const [,r,c]=pos.split(':');return{r:+r,c:+c}}
function fogDoorIds(room){return(state?.board?.doors?.[room]||[]).map(([r,c])=>`floor:${r}:${c}`)}
function fogDistance(a,b){
  if(!a||!b)return 999;
  if(a===b)return 0;
  const af=fogFloor(a),bf=fogFloor(b);
  if(af&&bf)return Math.abs(af.r-bf.r)+Math.abs(af.c-bf.c);
  if(!af&&!bf)return a===b?0:999; // different rooms do not see through walls
  const room=af?b:a,floor=af?a:b,ff=fogFloor(floor);
  if(!ff)return 999;
  let best=999;
  for(const d of fogDoorIds(room)){const df=fogFloor(d);if(df)best=Math.min(best,1+Math.abs(ff.r-df.r)+Math.abs(ff.c-df.c))}
  return best;
}
function fogVisible(p){
  if(!state?.private||!p)return false;
  if(p.id===state.private.id)return true;
  if(conference?.()||['DISCUSSION','VOTING','TESTIMONY'].includes(state.phase))return true;
  if(state.private.room&&p.room===state.private.room)return true;
  return fogDistance(state.private.position,p.position)<=FOG_RADIUS;
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
  if(hint)hint.textContent=`FOG OF WAR · PLAYERS VISIBLE WITHIN ${FOG_RADIUS} SPACES · ROOMS BLOCK SIGHT · NO LAST-KNOWN MARKERS`;
}
const fogBaseRender=render;
render=function(){fogBaseRender();applyFogOfWar()};
