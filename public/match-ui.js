(()=>{
  const mobile=()=>matchMedia('(max-width:850px)').matches;
  const labels=[['hq','HQ'],['notebook','NOTES'],['hand','HAND'],['evidence','EVIDENCE'],['publicBoard','CASE']];
  const parents={};
  for(const [,id] of labels.slice(1)){
    const el=document.getElementById(id);
    if(el)parents[id]=el.closest('.card');
  }
  const statusCard=document.getElementById('turnText')?.closest('.card');
  statusCard?.classList.add('mobile-status-card');
  const roleCard=document.getElementById('roleTitle')?.closest('.card');
  roleCard?.classList.add('mobile-role-card');
  const dock=document.createElement('nav');
  dock.className='match-dock';
  dock.setAttribute('aria-label','Match panels');
  dock.innerHTML=labels.map(([id,label])=>`<button type="button" data-match-panel="${id}">${label}</button>`).join('');
  document.body.appendChild(dock);

  let active='hq',lastEvidence=0,lastPublic=0;
  function apply(){
    if(!mobile()){
      Object.values(parents).forEach(x=>x?.classList.remove('mobile-panel-open','mobile-panel-hidden'));
      document.body.classList.remove('intel-open');
      return;
    }
    document.body.classList.toggle('intel-open',active!=='hq');
    for(const [id,card] of Object.entries(parents)){
      if(!card)continue;
      card.classList.toggle('mobile-panel-open',active===id);
      card.classList.toggle('mobile-panel-hidden',active!==id);
    }
    dock.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.matchPanel===active));
  }
  dock.addEventListener('click',e=>{
    const b=e.target.closest('[data-match-panel]');
    if(!b)return;
    active=b.dataset.matchPanel;
    apply();
  });

  const evidenceCount=document.getElementById('evidenceCount');
  const publicCount=document.getElementById('publicCount');
  function numberFrom(el){const m=(el?.textContent||'').match(/\d+/);return m?Number(m[0]):0}
  const obs=new MutationObserver(()=>{
    const e=numberFrom(evidenceCount),p=numberFrom(publicCount);
    if(mobile()&&e>lastEvidence&&lastEvidence>0){const btn=dock.querySelector('[data-match-panel="evidence"]');btn?.classList.add('attention');setTimeout(()=>btn?.classList.remove('attention'),4000)}
    if(mobile()&&p>lastPublic&&lastPublic>0){const btn=dock.querySelector('[data-match-panel="publicBoard"]');btn?.classList.add('attention');setTimeout(()=>btn?.classList.remove('attention'),4000)}
    lastEvidence=e;lastPublic=p;
  });
  if(evidenceCount)obs.observe(evidenceCount,{childList:true,subtree:true,characterData:true});
  if(publicCount)obs.observe(publicCount,{childList:true,subtree:true,characterData:true});
  lastEvidence=numberFrom(evidenceCount);lastPublic=numberFrom(publicCount);

  const turnOwner=document.getElementById('turnOwner');
  if(turnOwner){let prev='';new MutationObserver(()=>{const now=turnOwner.textContent||'';if(now!==prev&&/YOUR|YOU|CASE CONFERENCE/i.test(now))navigator.vibrate?.(35);prev=now}).observe(turnOwner,{childList:true,subtree:true,characterData:true})}
  addEventListener('resize',apply);
  apply();
})();