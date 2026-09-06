// KILLER AMONG US — forced testimony rules.
function renderConferenceV2(){
  if(!state||!conference?.())return;
  const p=state.private,c=state.conference||{},text=document.getElementById('conferenceText'),turnText=document.getElementById('turnText');
  if(state.phase==='VOTING'){
    if(text)text.textContent='Vote for ONE player. If they hold unseen evidence, they must reveal one. If they do not, they must repeat a previously disclosed clue.';
    if(turnText)turnText.textContent='Discussion is over. Force one player to testify.';
  }
  if(state.phase==='TESTIMONY'){
    const witness=state.players.find(x=>x.id===c.witnessId)?.name||'The witness',mine=c.witnessId===p.id,mode=c.testimonyMode;
    if(text){
      if(mine&&mode==='NEW')text.textContent='You have unseen evidence. Choose ONE piece to sacrifice to the public Case Board.';
      else if(mine&&mode==='DUPLICATE')text.textContent='You have no unseen evidence. Choose ONE previously disclosed clue to repeat. Everyone will know you produced nothing new.';
      else text.textContent=`${witness} is being forced to testify.`;
    }
    if(turnText)turnText.textContent=mine?(mode==='DUPLICATE'?'No new evidence remains. Repeat one of your previous disclosures.':'Choose one unseen clue to reveal.'):`Waiting for ${witness} to testify…`;
    const progress=document.getElementById('voteProgress');if(progress)progress.textContent=mode==='DUPLICATE'&&mine?'DUPLICATE REQUIRED':'TESTIMONY';
    if(mine&&mode==='DUPLICATE')document.querySelectorAll('.vote-target.testimony').forEach(b=>b.classList.add('duplicate-testimony'));
  }
}
const conferenceV2BaseRender=render;render=function(){conferenceV2BaseRender();renderConferenceV2()};
