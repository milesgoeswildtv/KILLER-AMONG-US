// KILLER AMONG US — opposite-door routing presentation.
function clearDoorRouting(){document.querySelectorAll('.door-marker').forEach(x=>x.remove());document.querySelectorAll('.floor-tile.door-threshold').forEach(x=>x.classList.remove('door-threshold','door-open','door-locked','door-side-a','door-side-b'))}
function renderDoorRouting(){
  clearDoorRouting();
  if(!state?.board?.doors)return;
  const active=state.doorSide||'A';
  for(const [room,sides] of Object.entries(state.board.doors)){
    for(const side of ['A','B']){
      const rc=sides?.[side];if(!rc)continue;
      const pos=`floor:${rc[0]}:${rc[1]}`;
      const tile=document.querySelector(`.floor-tile[data-position="${CSS.escape(pos)}"]`);if(!tile)continue;
      const open=side===active;
      tile.classList.add('door-threshold',open?'door-open':'door-locked',side==='A'?'door-side-a':'door-side-b');
      const mark=document.createElement('span');mark.className='door-marker';mark.innerHTML=`<b>${side}</b><em>${open?'OPEN':'LOCKED'}</em>`;mark.title=`${roomName(room)} · ${side}-SIDE ${open?'OPEN':'LOCKED'}`;tile.appendChild(mark);
    }
  }
  const security=document.getElementById('securityMode');if(security){security.textContent=`${active}-SIDE OPEN`;security.className='system-open'}
}
const doorBaseRender=render;render=function(){doorBaseRender();renderDoorRouting()};
