// Room View Engine — approved Full Tilt Headquarters interiors.
const ROOM_ART={
  vault:'/art/rooms/vault.PNG',
  control:'/art/rooms/control-room.PNG',
  high:'/art/rooms/high-roller-room.PNG',
  office:'/art/rooms/back-office.PNG',
  casino:'/art/rooms/casino-floor.PNG',
  after:'/art/rooms/afterhours.PNG',
  workshop:'/art/rooms/workshop.PNG',
  kitchen:'/art/rooms/kitchen.PNG',
  back:'/art/rooms/back-room.PNG'
};
const roomArtReady=new Map();
let roomViewOpen=false,roomViewRoom=null,roomViewLastRoom=null,roomViewDismissed=null,roomViewTimer=null;

function preloadRoomArt(){
  for(const [id,src] of Object.entries(ROOM_ART)){
    const img=new Image();roomArtReady.set(id,false);
    img.onload=()=>roomArtReady.set(id,true);img.onerror=()=>roomArtReady.set(id,false);img.src=src;
    img.decode?.().then(()=>roomArtReady.set(id,true)).catch(()=>{});
  }
}
function ensureRoomView(){
  if(document.getElementById('roomView'))return;
  const el=document.createElement('section');
  el.id='roomView';el.className='room-view hidden';
  el.innerHTML=`<div class="room-view-bg"></div><div class="room-view-vignette"></div><header class="room-view-head"><button id="roomViewBack" class="room-view-back">‹ HQ BOARD</button><div><small>FULL TILT HEADQUARTERS</small><h2 id="roomViewTitle">ROOM</h2></div><b id="roomViewStatus">INSIDE</b></header><section id="controlConsole" class="control-console hidden"><div class="control-console-head"><small>CONTROL ROOM ACCESS</small><b>PRIVATE SYSTEMS</b></div><div class="control-grid"><button id="controlDoors" class="control-system"><span>SECURITY DOORS</span><strong id="controlDoorsState">—</strong><em>ROLL 1 OR 6 TO CHANGE</em></button><button id="controlPassages" class="control-system"><span>HIDDEN PASSAGES</span><strong id="controlPassagesState">—</strong><em>ROLL 1 OR 6 TO TOGGLE</em></button></div><p>Attempts are private. Failed rolls are not announced to Headquarters.</p></section><div class="room-view-actions"><button id="roomViewSearch">🔎 SEARCH FOR EVIDENCE</button><button id="roomViewDoors">🚪 SECURITY DOORS</button><button id="roomViewPassages">◈ HIDDEN PASSAGES</button><button id="roomViewAccuse" class="danger">⚠ ACCUSE</button><button id="roomViewEnd" class="secondary">END TURN</button></div><div id="roomViewResult" class="room-view-result"></div>`;
  document.body.appendChild(el);
  const enter=document.createElement('button');enter.id='roomViewEnter';enter.className='room-view-enter hidden';enter.type='button';enter.textContent='ENTER ROOM VIEW';enter.onclick=()=>state?.private?.room&&openRoomView(state.private.room,false);document.body.appendChild(enter);
  document.getElementById('roomViewBack').onclick=closeRoomView;
  document.getElementById('roomViewSearch').onclick=()=>document.getElementById('searchBtn')?.click();
  document.getElementById('roomViewDoors').onclick=()=>document.getElementById('doorsBtn')?.click();
  document.getElementById('roomViewPassages').onclick=()=>document.getElementById('passagesBtn')?.click();
  document.getElementById('controlDoors').onclick=()=>document.getElementById('doorsBtn')?.click();
  document.getElementById('controlPassages').onclick=()=>document.getElementById('passagesBtn')?.click();
  document.getElementById('roomViewAccuse').onclick=()=>document.getElementById('accuseBtn')?.click();
  document.getElementById('roomViewEnd').onclick=()=>document.getElementById('endBtn')?.click();
}
function artForRoom(id){return ROOM_ART[id]||null}
function setHQTransition(on){document.getElementById('boardStage')?.classList.toggle('entering-room',!!on)}
function openRoomView(id,automatic=false){
  const art=artForRoom(id);if(!art)return false;
  clearTimeout(roomViewTimer);ensureRoomView();roomViewOpen=true;roomViewRoom=id;roomViewDismissed=null;
  const rv=document.getElementById('roomView'),bg=rv.querySelector('.room-view-bg');document.getElementById('roomViewTitle').textContent=roomName(id);bg.style.backgroundImage=`url("${art}")`;rv.classList.toggle('is-control',id==='control');setHQTransition(true);document.getElementById('roomViewEnter')?.classList.add('hidden');
  roomViewTimer=setTimeout(()=>{rv.classList.remove('hidden');requestAnimationFrame(()=>rv.classList.add('shown'));setTimeout(()=>setHQTransition(false),420)},automatic?170:60);syncRoomView();return true;
}
function closeRoomView(){
  const rv=document.getElementById('roomView');if(!rv)return;clearTimeout(roomViewTimer);setHQTransition(false);roomViewDismissed=roomViewRoom;rv.classList.remove('shown');roomViewOpen=false;roomViewTimer=setTimeout(()=>rv.classList.add('hidden'),260);if(typeof centerOnPosition==='function')setTimeout(()=>centerOnPosition(state?.private?.position),300);syncRoomViewLauncher();
}
function syncRoomViewLauncher(){
  const b=document.getElementById('roomViewEnter');if(!b||!state?.private)return;const room=state.private.room,has=!!artForRoom(room);b.textContent=room?`ENTER ${roomName(room)}`:'ENTER ROOM VIEW';b.classList.toggle('hidden',roomViewOpen||!room||!has);
}
function syncControlConsole(roomAction){
  const panel=document.getElementById('controlConsole');if(!panel||!state)return;const inControl=roomViewOpen&&state.private?.room==='control';panel.classList.toggle('hidden',!inControl);if(!inControl)return;
  const doors=document.getElementById('controlDoors'),passages=document.getElementById('controlPassages');document.getElementById('controlDoorsState').textContent=state.securityName||'—';document.getElementById('controlPassagesState').textContent=state.passages?'OPEN':'LOCKED';doors.disabled=!roomAction||busy;passages.disabled=!roomAction||busy;doors.classList.toggle('system-active',state.securityName!=='OPEN FLOOR');passages.classList.toggle('system-active',!!state.passages);
}
function syncRoomView(){
  syncRoomViewLauncher();if(!roomViewOpen||!state)return;
  const p=state.private,id=p.room;if(!id||id!==roomViewRoom){closeRoomView();return}
  const roomAction=myTurn()&&state.phase!=='MOVE'&&!state.acted;
  const set=(id,disabled)=>{const b=document.getElementById(id);if(b)b.disabled=disabled};
  set('roomViewSearch',!roomAction||id==='casino'||busy);set('roomViewDoors',true);set('roomViewPassages',true);set('roomViewAccuse',document.getElementById('accuseBtn')?.disabled??true);set('roomViewEnd',!myTurn()||state.phase==='MOVE'||busy);
  syncControlConsole(roomAction);
  const status=document.getElementById('roomViewStatus');if(status)status.textContent=myTurn()?'YOUR TURN':'INSIDE';const r=document.getElementById('roomViewResult');if(r)r.textContent=document.getElementById('result')?.textContent||'';
}
function maybeEnterRoomView(){
  if(!state?.private)return;const room=state.private.room;if(room!==roomViewLastRoom){roomViewDismissed=null;roomViewLastRoom=room||null;if(room&&artForRoom(room))setTimeout(()=>{if(state?.private?.room===room&&!roomViewOpen)openRoomView(room,true)},140)}syncRoomView();
}
preloadRoomArt();ensureRoomView();
const roomViewBaseRender=render;render=function(){roomViewBaseRender();maybeEnterRoomView()};
