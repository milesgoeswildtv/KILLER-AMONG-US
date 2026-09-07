// KILLER AMONG US — Case Conference presentation.
// The server permits any evidence the selected witness personally recovered.
// IMPORTANT: the UI never tells the table whether testimony is new, old, repeated, or duplicated.
function renderConferenceV2(){
  if(!state||!conference?.())return;
  const p=state.private,c=state.conference||{},text=document.getElementById('conferenceText'),turnText=document.getElementById('turnText');
  if(state.phase==='VOTING'){
    if(text)text.textContent='Vote for ONE player to testify. Pay attention: the game will not tell you whether the evidence they reveal has been seen before.';
    if(turnText)turnText.textContent='Discussion is over. Force one player to testify.';
  }
  if(state.phase==='TESTIMONY'){
    const witness=state.players.find(x=>x.id===c.witnessId)?.name||'The witness',mine=c.witnessId===p.id;
    if(text)text.textContent=mine?'Choose ONE piece of evidence from your Evidence Log to reveal. Its source room remains secret.':`${witness} is being forced to testify.`;
    if(turnText)turnText.textContent=mine?'Choose one piece of evidence to reveal.':`Waiting for ${witness} to testify…`;
    const progress=document.getElementById('voteProgress');if(progress)progress.textContent='TESTIMONY';
  }
}
const conferenceV2BaseRender=render;render=function(){conferenceV2BaseRender();renderConferenceV2()};
