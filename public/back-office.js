// Back Office — private records terminal. Fog of War makes records valuable.
const BACK_OFFICE_ROOMS=[['vault','THE VAULT'],['control','CONTROL ROOM'],['high','HIGH ROLLER ROOM'],['office','BACK OFFICE'],['after','AFTERHOURS'],['workshop','WORKSHOP'],['kitchen','KITCHEN'],['back','BACK ROOM']];
let backOfficeMessage='';
function ensureBackOffice(){
  if(document.getElementById('backOfficeConsole'))return;
  const panel=document.createElement('section');
  panel.id='backOfficeConsole';panel.className='back-office-console hidden';
  panel.innerHTML=`<div class="back-office-head"><div><small>BACK OFFICE TERMINAL</small><b>PRIVATE RECORDS</b></div><span>ROLL 1 OR 6</span></div><div class="back-office-grid"><div class="records-module"><small>TRACE PUBLIC EVIDENCE</small><p>Privately identify the true room source of one verified clue already on the Case Board.</p><select id="recordsClue"></select><button id="recordsTrace">TRACE EVIDENCE</button></div><div class="records-module"><small>CHECK ACCESS LOG</small><p>Privately identify the most recent recorded player to enter one searchable room.</p><select id="recordsRoom"></select><button id="recordsAccess">CHECK ROOM LOG</button></div></div><div id="recordsResult" class="records-result"></div><footer>Failures are private. Records never become public unless you choose to talk about them.</footer>`;
  document.getElementById('roomView')?.appendChild(panel);
  document.getElementById('recordsTrace').onclick=()=>{
    const clue=document.getElementById('recordsClue').value;if(!clue)return;
    act('records',{type:'trace',clue},d=>{backOfficeMessage=`🎲 ${d.roll} — ${d.privateMessage}`;syncBackOffice()});
  };
  document.getElementById('recordsAccess').onclick=()=>{
    const room=document.getElementById('recordsRoom').value;if(!room)return;
    act('records',{type:'access',room},d=>{backOfficeMessage=`🎲 ${d.roll} — ${d.privateMessage}`;syncBackOffice()});
  };
}
function syncBackOffice(){
  ensureBackOffice();
  const panel=document.getElementById('backOfficeConsole');if(!panel||!state)return;
  const inside=roomViewOpen&&state.private?.room==='office';panel.classList.toggle('hidden',!inside);if(!inside)return;
  const roomAction=myTurn()&&state.phase!=='MOVE'&&!state.acted&&!busy;
  const clueSel=document.getElementById('recordsClue'),roomSel=document.getElementById('recordsRoom');
  const previousClue=clueSel.value,previousRoom=roomSel.value;
  clueSel.innerHTML=(state.publicClues||[]).map(c=>`<option value="${c.replace(/"/g,'&quot;')}">${c}</option>`).join('')||'<option value="">NO PUBLIC EVIDENCE YET</option>';
  roomSel.innerHTML=BACK_OFFICE_ROOMS.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
  if([...clueSel.options].some(o=>o.value===previousClue))clueSel.value=previousClue;
  if([...roomSel.options].some(o=>o.value===previousRoom))roomSel.value=previousRoom;
  document.getElementById('recordsTrace').disabled=!roomAction||!(state.publicClues||[]).length;
  document.getElementById('recordsAccess').disabled=!roomAction;
  clueSel.disabled=!roomAction;roomSel.disabled=!roomAction;
  document.getElementById('recordsResult').textContent=backOfficeMessage;
  document.getElementById('roomView')?.classList.toggle('is-office',inside);
}
ensureBackOffice();
const backOfficeBaseRender=render;
render=function(){backOfficeBaseRender();syncBackOffice()};
