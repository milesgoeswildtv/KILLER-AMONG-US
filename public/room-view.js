// Room View Engine — art-ready cinematic interiors without changing game position.
// Add approved art paths here as they are committed. Missing assets never interrupt gameplay.
const ROOM_ART={
  // vault:'/art/rooms/vault.webp',
  // control:'/art/rooms/control.webp',
  // high:'/art/rooms/high-roller.webp',
  // office:'/art/rooms/back-office.webp',
  // after:'/art/rooms/afterhours.webp',
  // workshop:'/art/rooms/workshop.webp',
  // kitchen:'/art/rooms/kitchen.webp',
  // back:'/art/rooms/back-room.webp',
  // casino:'/art/rooms/casino-floor.webp'
};
let roomViewOpen=false,roomViewRoom=null,roomViewLastPosition=null;

function ensureRoomView(){
  if(document.getElementById('roomView'))return;
  const el=document.createElement('section');
  el.id='roomView';el.className='room-view hidden';
  el.innerHTML=`<div class="room-view-bg"></div><div class="room-view-vignette"></div><header class="room-view-head"><button id="roomViewBack" class="room-view-back">‹ HQ BOARD</button><div><small>FULL TILT HEADQUARTERS</small><h2 id="roomViewTitle">ROOM</h2></div><b id="roomViewStatus">INSIDE</b></header><div class="room-view-actions"><button id="roomViewSearch">🔎 SEARCH FOR EVIDENCE</button><button id="roomViewDoors">🚪 SECURITY DOORS</button><button id="roomViewPassages">◈ HIDDEN PASSAGES</button><button id="roomViewAccuse" class="danger">⚠ ACCUSE</button><button id="roomViewEnd" class="secondary">END TURN</button></div><div id="roomViewResult" class="room-view-result"></div>`;
  document.body.appendChild(el);
  document.getElementById('roomViewBack').onclick=closeRoomView;
  document.getElementById('roomViewSearch').onclick=()=>document.getElementById('searchBtn')?.click();
  document.getElementById('roomViewDoors').onclick=()=>document.getElementById('doorsBtn')?.click();
  document.getElementById('roomViewPassages').onclick=()=>document.getElementById('passagesBtn')?.click();
  document.getElementById('roomViewAccuse').onclick=()=>document.getElementById('accuseBtn')?.click();
  document.getElementById('roomViewEnd').onclick=()=>document.getElementById('endBtn')?.click();
}
function artForRoom(id){return ROOM_ART[id]||null}
function openRoomView(id,automatic=false){
  const art=artForRoom(id);if(!art)return false;
  ensureRoomView();roomViewOpen=true;roomViewRoom=id;
  const rv=document.getElementById('roomView');
  document.getElementById('roomViewTitle').textContent=roomName(id);
  rv.querySelector('.room-view-bg').style.backgroundImage=`url("${art}")`;
  rv.classList.remove('hidden');requestAnimationFrame(()=>rv.classList.add('shown'));
  syncRoomView();return true;
}
function closeRoomView(){
  const rv=document.getElementById('roomView');if(!rv)return;
  rv.classList.remove('shown');roomViewOpen=false;
  setTimeout(()=>rv.classList.add('hidden'),260);
  if(typeof centerOnPosition==='function')setTimeout(()=>centerOnPosition(state?.private?.position),300);
}
function syncRoomView(){
  if(!roomViewOpen||!state)return;
  const p=state.private,id=p.room;
  if(!id||id!==roomViewRoom){closeRoomView();return}
  const roomAction=myTurn()&&state.phase!=='MOVE'&&!state.acted;
  const set=(id,disabled)=>{const b=document.getElementById(id);if(b)b.disabled=disabled};
  set('roomViewSearch',!roomAction||id==='casino'||busy);
  set('roomViewDoors',!roomAction||id!=='control'||busy);
  set('roomViewPassages',!roomAction||id!=='control'||busy);
  set('roomViewAccuse',document.getElementById('accuseBtn')?.disabled??true);
  set('roomViewEnd',!myTurn()||state.phase==='MOVE'||busy);
  const status=document.getElementById('roomViewStatus');if(status)status.textContent=myTurn()?'YOUR TURN':'INSIDE';
  const r=document.getElementById('roomViewResult');if(r)r.textContent=document.getElementById('result')?.textContent||'';
}
function maybeEnterRoomView(){
  if(!state?.private)return;
  const pos=state.private.position,room=state.private.room;
  if(room&&pos!==roomViewLastPosition&&artForRoom(room))setTimeout(()=>openRoomView(room,true),180);
  roomViewLastPosition=pos;
  syncRoomView();
}
ensureRoomView();
const roomViewBaseRender=render;
render=function(){roomViewBaseRender();maybeEnterRoomView()};
