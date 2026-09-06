// Back Office — emergency lighting control. One wing at a time, one full-round lifespan.
let backOfficeMessage='';
let lastLightPulseAt=0;

function ensureBackOffice(){
  if(document.getElementById('backOfficeConsole'))return;
  const panel=document.createElement('section');
  panel.id='backOfficeConsole';panel.className='back-office-console hidden';
  panel.innerHTML=`<div class="back-office-head"><div><small>BACK OFFICE SYSTEM</small><b>EMERGENCY LIGHTING</b></div><span>ROLL 1 OR 6</span></div><div class="lighting-status"><div><small>WEST WING</small><b id="westLightState">OFF</b></div><div><small>EAST WING</small><b id="eastLightState">OFF</b></div></div><div class="back-office-grid"><button id="activateWest" class="light-control west"><span>WEST WING</span><strong>ACTIVATE BOTH FLOODLIGHTS</strong><em>Forces visibility through both west choke corridors.</em></button><button id="activateEast" class="light-control east"><span>EAST WING</span><strong>ACTIVATE BOTH FLOODLIGHTS</strong><em>Forces visibility through both east choke corridors.</em></button></div><div id="recordsResult" class="records-result"></div><footer>Only one wing can be active. Activating the other side switches the first side off. Lights expire automatically after one full round.</footer>`;
  document.getElementById('roomView')?.appendChild(panel);
  document.getElementById('activateWest').onclick=()=>activateWing('WEST');
  document.getElementById('activateEast').onclick=()=>activateWing('EAST');
}

function activateWing(side){
  act('lights',{side},d=>{
    backOfficeMessage=`🎲 ${d.roll} — ${d.privateMessage}`;
    syncBackOffice();
  });
}

function lightRects(side){
  return state?.board?.lightZones?.[side]||[];
}
function tileInsideRect(tile,rect){
  const [r1,r2,c1,c2]=rect;return tile.row>=r1&&tile.row<=r2&&tile.col>=c1&&tile.col<=c2;
}
function syncBoardLights(){
  const active=state?.lights?.side||null;
  document.querySelectorAll('.floor-tile.emergency-lit,.floor-tile.light-pulse').forEach(el=>el.classList.remove('emergency-lit','light-west','light-east','light-pulse'));
  if(active&&state?.board?.tiles){
    const rects=lightRects(active);
    for(const [id,tile] of Object.entries(state.board.tiles)){
      if(!rects.some(r=>tileInsideRect(tile,r)))continue;
      const el=document.querySelector(`.floor-tile[data-position="${CSS.escape(id)}"]`);
      if(el)el.classList.add('emergency-lit',active==='WEST'?'light-west':'light-east');
    }
  }
  const pulse=state?.lightPulse;
  if(pulse?.at&&pulse.at!==lastLightPulseAt){
    lastLightPulseAt=pulse.at;
    (pulse.tiles||[]).forEach(id=>document.querySelector(`.floor-tile[data-position="${CSS.escape(id)}"]`)?.classList.add('light-pulse'));
    showLightExposure(pulse);
  }
}

function showLightExposure(pulse){
  let el=document.getElementById('lightExposureBanner');
  if(!el){el=document.createElement('div');el.id='lightExposureBanner';el.className='light-exposure-banner hidden';document.body.appendChild(el)}
  el.innerHTML=`<small>EMERGENCY LIGHTS</small><b>${pulse.name} EXPOSED</b><span>${pulse.side} WING</span>`;
  el.classList.remove('hidden');
  clearTimeout(showLightExposure.timer);
  showLightExposure.timer=setTimeout(()=>el.classList.add('hidden'),3200);
}

function syncBackOffice(){
  ensureBackOffice();
  const panel=document.getElementById('backOfficeConsole');if(!panel||!state)return;
  const inside=roomViewOpen&&state.private?.room==='office';panel.classList.toggle('hidden',!inside);
  const side=state.lights?.side||null;
  const west=document.getElementById('westLightState'),east=document.getElementById('eastLightState');
  west.textContent=side==='WEST'?'ACTIVE · ONE ROUND':'OFF';east.textContent=side==='EAST'?'ACTIVE · ONE ROUND':'OFF';
  west.classList.toggle('active',side==='WEST');east.classList.toggle('active',side==='EAST');
  if(inside){
    const roomAction=myTurn()&&state.phase!=='MOVE'&&!state.acted&&!busy;
    document.getElementById('activateWest').disabled=!roomAction;
    document.getElementById('activateEast').disabled=!roomAction;
    document.getElementById('recordsResult').textContent=backOfficeMessage;
    document.getElementById('roomView')?.classList.add('is-office');
  }else document.getElementById('roomView')?.classList.remove('is-office');
  syncBoardLights();
}

ensureBackOffice();
const backOfficeBaseRender=render;
render=function(){backOfficeBaseRender();syncBackOffice()};
