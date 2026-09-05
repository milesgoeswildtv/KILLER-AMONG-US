const SUSPECTS=['Sam','Kass','Michael','Ruby','Seal','Kate','REM','Tweeky'];
const WEAPONS=['Casino Chips','Ban Hammer','Broken Bottle','Pool Cue','Ethernet Cable','Trophy','Wrench','Heavy Ashtray','Letter Opener'];
const ROOM_IDS=['vault','control','high','office','after','workshop','kitchen','back'];
const ROOM_NAMES={vault:'THE VAULT',control:'CONTROL ROOM',high:'HIGH ROLLER ROOM',office:'BACK OFFICE',casino:'CASINO FLOOR',after:'AFTERHOURS',workshop:'WORKSHOP',kitchen:'KITCHEN',back:'BACK ROOM'};
const ROOMS=ROOM_IDS.map(id=>ROOM_NAMES[id]);
const START_ROOMS=['vault','high','office','after','workshop','kitchen','back','control'];
const ADJ={vault:['control','office'],control:['vault','high','casino'],high:['control','after'],office:['vault','casino','workshop'],casino:['control','office','after','kitchen'],after:['high','casino','back'],workshop:['office','kitchen'],kitchen:['workshop','casino','back'],back:['kitchen','after']};
const SECURITY=[{name:'OPEN FLOOR',blocked:[]},{name:'NORTH LOCKDOWN',blocked:[['vault','control'],['control','high']]},{name:'SERVICE LOCKDOWN',blocked:[['office','workshop'],['kitchen','back']]},{name:'EAST LOCKDOWN',blocked:[['high','after'],['after','back']]}];
const TURN_MS=45000,CONFERENCE_MS=30000;
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization,x-host-token','access-control-allow-methods':'GET,POST,OPTIONS',...extra}});
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const id=(n=24)=>{const bytes=new Uint8Array(n);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')};
const d6=()=>Math.floor(Math.random()*6)+1;
const lobbyCode=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return [...bytes].map(x=>alphabet[x%alphabet.length]).join('')};
const edgeKey=(a,b)=>[a,b].sort().join('|');

export default {async fetch(request,env){
 if(request.method==='OPTIONS')return json({ok:true});
 const url=new URL(request.url);
 if(url.pathname==='/api/health')return json({ok:true,game:'KILLER AMONG US',multiplayer:'pass-7'});
 if(url.pathname==='/api/lobby/create'&&request.method==='POST'){
  const body=await safeBody(request),code=lobbyCode(),stub=env.MATCHES.get(env.MATCHES.idFromName(code));
  return stub.fetch(new Request(`${url.origin}/create`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,name:body.name||'Host'})}));
 }
 const m=url.pathname.match(/^\/api\/lobby\/([A-Z0-9]{6})(?:\/(join|state|start|leave|roll|move|search|suggest|switch|end|accuse|vote))?$/i);
 if(m){const code=m[1].toUpperCase(),action=m[2]||'state',stub=env.MATCHES.get(env.MATCHES.idFromName(code));const headers=new Headers(request.headers);headers.set('x-lobby-code',code);return stub.fetch(new Request(`${url.origin}/${action}`,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body}))}
 if(env.ASSETS)return env.ASSETS.fetch(request);
 return new Response('Not found',{status:404});
}};

async function safeBody(request){try{return await request.json()}catch{return {}}}
function cleanName(v){return String(v).replace(/[<>]/g,'').trim().slice(0,24)||'Player'}

export class MatchLobby {
 constructor(state,env){this.state=state;this.env=env;this.data=null}
 async load(){if(!this.data)this.data=await this.state.storage.get('match')||null;return this.data}
 async save(){await this.state.storage.put('match',this.data)}
 token(request){const raw=request.headers.get('authorization')||'';return raw.toLowerCase().startsWith('bearer ')?raw.slice(7).trim():''}
 playerByToken(token){return this.data?.players.find(p=>p.token===token)||null}
 publicPlayer(p){return {id:p.id,name:p.name,seat:p.seat,character:p.character||null,room:p.room,connected:Date.now()-(p.lastSeen||0)<15000,revealedHand:!!p.revealedHand}}
 isTurn(p){return this.data.status==='ACTIVE'&&this.data.phase!=='CONFERENCE'&&this.data.players[this.data.turn]?.id===p.id}
 blocked(a,b){return SECURITY[this.data.security].blocked.some(e=>edgeKey(...e)===edgeKey(a,b))}
 neighbors(room){let n=(ADJ[room]||[]).filter(x=>!this.blocked(room,x));if(this.data.passages){if(room==='vault')n.push('back');if(room==='back')n.push('vault');if(room==='high')n.push('workshop');if(room==='workshop')n.push('high')}return [...new Set(n)]}
 reachable(start,max){const found={},q=[[start,[]]],best={[start]:0};while(q.length){const [node,path]=q.shift();if(path.length>=max)continue;for(const next of this.neighbors(node)){const np=[...path,next],dist=np.length;if(best[next]!==undefined&&best[next]<=dist)continue;best[next]=dist;if(next!==start)found[next]=np;q.push([next,np])}}return found}
 knowledge(p){return new Set([...Object.values(p.found||{}),...(this.data.publicClues||[])]).size}
 pushEvent(text,type='PUBLIC'){this.data.events=this.data.events||[];this.data.events.unshift({id:id(5),at:Date.now(),text,type});this.data.events=this.data.events.slice(0,60);this.data.lastEvent=text}
 bump(event,type='PUBLIC'){this.data.version++;if(event)this.pushEvent(event,type)}
 async touch(p){p.lastSeen=Date.now();await this.resolveDeadline();}
 async resolveDeadline(){if(!this.data||this.data.status!=='ACTIVE'||!this.data.deadline||Date.now()<this.data.deadline)return;
  if(this.data.phase==='CONFERENCE'){await this.finishConference();return;}
  const timed=this.data.players[this.data.turn];this.pushEvent(`${timed?.name||'A player'} ran out of time. Turn auto-ended.`,'SYSTEM');this.advanceTurn();this.data.version++;await this.save();
 }
 async fetch(request){
  const url=new URL(request.url),action=url.pathname.slice(1);
  if(request.method==='OPTIONS')return json({ok:true});
  if(action==='create'&&request.method==='POST'){
   if(await this.load())return json({error:'Lobby already exists'},409);
   const body=await safeBody(request),hostToken=id(),playerToken=id(),name=cleanName(body.name||'Host'),now=Date.now();
   this.data={code:body.code,status:'LOBBY',createdAt:now,hostToken,version:1,players:[{id:id(8),name,seat:0,room:null,role:null,hand:[],found:{},history:[],token:playerToken,lastSeen:now}],solution:null,turn:0,round:1,publicClues:[],publicHands:[],security:0,passages:true,phase:'START',moveRoll:0,reachable:{},acted:false,events:[],conference:null,deadline:null};
   this.pushEvent('Lobby created.','SYSTEM');await this.save();return json({ok:true,code:this.data.code,hostToken,playerToken,playerId:this.data.players[0].id});
  }
  if(!await this.load())return json({error:'Lobby not found'},404);
  if(action==='join'&&request.method==='POST'){
   if(this.data.status!=='LOBBY')return json({error:'Match already started'},409);if(this.data.players.length>=8)return json({error:'Lobby is full'},409);
   const body=await safeBody(request),name=cleanName(body.name||'Player');if(this.data.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return json({error:'That name is already in the lobby'},409);
   const p={id:id(8),name,seat:this.data.players.length,room:null,role:null,hand:[],found:{},history:[],token:id(),lastSeen:Date.now()};this.data.players.push(p);this.bump(`${name} joined the lobby.`);await this.save();return json({ok:true,code:this.data.code,playerToken:p.token,playerId:p.id});
  }
  const token=this.token(request),player=this.playerByToken(token);if(!player)return json({error:'Invalid player session'},401);
  await this.touch(player);
  if(action==='state'&&request.method==='GET'){await this.save();return json(this.viewFor(player))}
  if(action==='leave'&&request.method==='POST'){if(this.data.status!=='LOBBY')return json({error:'Cannot leave after match start'},409);this.data.players=this.data.players.filter(p=>p.id!==player.id);this.data.players.forEach((p,i)=>p.seat=i);this.bump(`${player.name} left the lobby.`);await this.save();return json({ok:true})}
  if(action==='start'&&request.method==='POST'){const host=request.headers.get('x-host-token')||'';if(host!==this.data.hostToken)return json({error:'Host authorization required'},403);if(this.data.status!=='LOBBY')return json({error:'Match already started'},409);if(this.data.players.length<3)return json({error:'Need at least 3 players to start'},409);this.startGame();await this.save();return json({ok:true,state:this.viewFor(player)})}
  if(this.data.status!=='ACTIVE')return json({error:'Match is not active'},409);
  if(action==='vote'&&request.method==='POST')return this.actVote(player,await safeBody(request));
  if(this.data.phase==='CONFERENCE')return json({error:'Case Conference is in progress'},409);
  if(!this.isTurn(player))return json({error:'It is not your turn'},409);
  if(action==='roll'&&request.method==='POST')return this.actRoll(player);
  if(action==='move'&&request.method==='POST')return this.actMove(player,await safeBody(request));
  if(action==='search'&&request.method==='POST')return this.actSearch(player);
  if(action==='suggest'&&request.method==='POST')return this.actSuggest(player,await safeBody(request));
  if(action==='switch'&&request.method==='POST')return this.actSwitch(player,await safeBody(request));
  if(action==='accuse'&&request.method==='POST')return this.actAccuse(player,await safeBody(request));
  if(action==='end'&&request.method==='POST')return this.actEnd(player);
  return json({error:'Not found'},404);
 }
 startGame(){
  const activeSuspects=shuffle(SUSPECTS).slice(0,this.data.players.length),killerIndex=Math.floor(Math.random()*this.data.players.length),killer=activeSuspects[killerIndex],weapon=WEAPONS[Math.floor(Math.random()*WEAPONS.length)],room=ROOMS[Math.floor(Math.random()*ROOMS.length)];
  const deck=shuffle([...activeSuspects.filter(x=>x!==killer).map(name=>({type:'SUSPECT',name})),...WEAPONS.filter(x=>x!==weapon).map(name=>({type:'WEAPON',name})),...ROOMS.filter(x=>x!==room).map(name=>({type:'ROOM',name}))]);
  this.data.players.forEach((p,i)=>{p.character=activeSuspects[i];p.role=i===killerIndex?'KILLER':'INVESTIGATOR';p.room=START_ROOMS[i];p.hand=[];p.found={};p.history=[];p.accuseLocked=false;p.revealedHand=false;p.voteTarget=null});deck.forEach((card,i)=>this.data.players[i%this.data.players.length].hand.push(card));
  this.data.solution={killer,weapon,room};this.data.clueMap=this.makeClueMap();this.data.status='ACTIVE';this.data.turn=0;this.data.round=1;this.data.phase='START';this.data.moveRoll=0;this.data.reachable={};this.data.acted=false;this.data.publicClues=[];this.data.publicHands=[];this.data.security=0;this.data.passages=true;this.data.conference=null;this.data.deadline=Date.now()+TURN_MS;this.bump(`The investigation begins. ${this.data.players[0].name}'s turn.`,'SYSTEM');
 }
 makeClueMap(){const s=shuffle(SUSPECTS.filter(x=>x!==this.data.solution.killer)),w=shuffle(WEAPONS.filter(x=>x!==this.data.solution.weapon)),r=shuffle(ROOMS.filter(x=>x!==this.data.solution.room));const clues=[`The Killer is NOT ${s.slice(0,3).join(', ')}.`,`The Killer is NOT ${s.slice(3,6).join(', ')}.`,`The Killer is one of: ${shuffle([this.data.solution.killer,s[0],s[1]]).join(', ')}.`,`The murder weapon was NOT ${w.slice(0,3).join(', ')}.`,`The murder weapon was NOT ${w.slice(3,6).join(', ')}.`,`The weapon is one of: ${shuffle([this.data.solution.weapon,w[0],w[1]]).join(', ')}.`,`The crime did NOT happen in ${r.slice(0,4).join(', ')}.`,`The crime happened in one of: ${shuffle([this.data.solution.room,r[0],r[1],r[2]]).join(', ')}.`];return Object.fromEntries(ROOM_IDS.map((rid,i)=>[rid,clues[i]]))}
 async actRoll(p){if(this.data.phase!=='START')return json({error:'Movement already rolled'},409);const roll=d6();this.data.moveRoll=roll;this.data.reachable=this.reachable(p.room,roll);this.data.phase='MOVE';if(!Object.keys(this.data.reachable).length)this.data.phase='ROOM';this.bump(`${p.name} rolled movement.`);await this.save();return json({ok:true,roll,reachable:this.data.reachable,state:this.viewFor(p)})}
 async actMove(p,body){if(this.data.phase!=='MOVE')return json({error:'Roll movement first'},409);const dest=String(body.room||''),path=this.data.reachable[dest];if(!path)return json({error:'That room is not reachable on this roll'},400);p.room=dest;this.data.phase='ROOM';this.data.reachable={};this.bump(`${p.name} entered ${ROOM_NAMES[dest]}.`);await this.save();return json({ok:true,path,state:this.viewFor(p)})}
 async actSearch(p){if(this.data.phase==='MOVE'||this.data.acted)return json({error:'You cannot search right now'},409);if(p.room==='casino')return json({error:'Casino Floor contains no evidence'},409);const roll=d6();this.data.acted=true;let clue=null,isNew=false;if(roll===1||roll===6){clue=this.data.clueMap[p.room];isNew=!p.found[p.room];p.found[p.room]=clue;if(isNew&&p.accuseLocked)p.accuseLocked=false}this.bump(`${p.name} searched ${ROOM_NAMES[p.room]}.`);await this.save();return json({ok:true,roll,success:!!clue,isNew,clue,state:this.viewFor(p)})}
 async actSuggest(p,body){if(this.data.phase==='MOVE'||this.data.acted)return json({error:'You cannot suggest right now'},409);if(p.room==='casino')return json({error:'Make suggestions from a searchable room'},409);const suspect=String(body.suspect||''),weapon=String(body.weapon||'');if(!SUSPECTS.includes(suspect)||!WEAPONS.includes(weapon))return json({error:'Invalid suggestion'},400);const room=ROOM_NAMES[p.room];this.data.acted=true;let shown=null,who=null,passed=[];for(let step=1;step<this.data.players.length;step++){const q=this.data.players[(this.data.turn+step)%this.data.players.length],matches=q.hand.filter(c=>c.name===suspect||c.name===weapon||c.name===room);if(matches.length){shown=matches[Math.floor(Math.random()*matches.length)];who=q;break}passed.push(q.name)}p.history.unshift({round:this.data.round,suspect,weapon,room,passed,shownBy:who?.name||null,shownCard:shown||null});this.bump(`${p.name} suggested ${suspect} with ${weapon} in ${room}.`);await this.save();return json({ok:true,shownBy:who?.name||null,shownCard:shown||null,passed,state:this.viewFor(p)})}
 async actSwitch(p,body){if(p.room!=='control')return json({error:'You must be in Control Room'},409);if(this.data.phase==='MOVE'||this.data.acted)return json({error:'You cannot flip a switch right now'},409);const type=body.type==='passages'?'passages':'doors',roll=d6();this.data.acted=true;const success=roll===1||roll===6;if(success){if(type==='passages')this.data.passages=!this.data.passages;else this.data.security=(this.data.security+1)%SECURITY.length}this.bump(success?'⚠ Headquarters security configuration changed.':`${p.name} used Control Room.`);await this.save();return json({ok:true,roll,success,type,privateMessage:success?`SUCCESS — ${type==='passages'?`passages are now ${this.data.passages?'OPEN':'LOCKED'}`:`security is now ${SECURITY[this.data.security].name}`}`:'FAILED — nobody else knows you tried.',state:this.viewFor(p)})}
 async actAccuse(p,body){if(this.knowledge(p)<3||p.accuseLocked)return json({error:'Accusation is locked'},409);const suspect=p.role==='KILLER'?p.character:String(body.suspect||''),weapon=String(body.weapon||''),room=String(body.room||'');if(!SUSPECTS.includes(suspect)||!WEAPONS.includes(weapon)||!ROOMS.includes(room))return json({error:'Invalid accusation'},400);const correct=suspect===this.data.solution.killer&&weapon===this.data.solution.weapon&&room===this.data.solution.room;if(correct){this.data.status='FINISHED';this.data.deadline=null;this.bump(p.role==='KILLER'?`${p.name} covered their tracks and escaped.`:`${p.name} solved the case and caught the Killer.`,'SYSTEM');await this.save();return json({ok:true,correct:true,winner:p.name,solution:this.data.solution,state:this.viewFor(p)})}p.accuseLocked=true;this.data.acted=true;const penalty=d6();let outcome;if(penalty===1||penalty===6){p.hand=[];outcome='DISCARDED FACE-DOWN'}else{p.revealedHand=true;outcome='REVEALED';const txt=`${p.name}: ${p.hand.map(c=>`${c.type}: ${c.name}`).join(' · ')||'EMPTY HAND'}`;if(!this.data.publicHands.includes(txt))this.data.publicHands.push(txt)}this.bump(`${p.name} made a WRONG accusation.`);await this.save();return json({ok:true,correct:false,penalty,outcome,state:this.viewFor(p)})}
 async actEnd(p){this.pushEvent(`${p.name} ended their turn.`);this.advanceTurn();this.data.version++;await this.save();return json({ok:true,state:this.viewFor(p)})}
 advanceTurn(){this.data.turn=(this.data.turn+1)%this.data.players.length;this.data.phase='START';this.data.moveRoll=0;this.data.reachable={};this.data.acted=false;if(this.data.turn===0){this.data.round++;if(this.data.round%5===0){this.startConference();return}}this.data.deadline=Date.now()+TURN_MS;this.pushEvent(`${this.data.players[this.data.turn].name}'s turn.`,'SYSTEM')}
 startConference(){this.data.phase='CONFERENCE';this.data.conference={votes:{},startedAt:Date.now(),deadline:Date.now()+CONFERENCE_MS};this.data.deadline=this.data.conference.deadline;for(const p of this.data.players)p.voteTarget=null;this.pushEvent('🚨 CASE CONFERENCE — vote for who must testify.','SYSTEM')}
 async actVote(p,body){if(this.data.phase!=='CONFERENCE'||!this.data.conference)return json({error:'No Case Conference is active'},409);const target=String(body.target||'');if(!this.data.players.some(x=>x.id===target))return json({error:'Invalid testimony target'},400);this.data.conference.votes[p.id]=target;p.voteTarget=target;this.bump(`${p.name} submitted a testimony vote.`,'SYSTEM');if(Object.keys(this.data.conference.votes).length>=this.data.players.length){await this.finishConference();return json({ok:true,resolved:true,state:this.viewFor(p)})}await this.save();return json({ok:true,resolved:false,state:this.viewFor(p)})}
 async finishConference(){if(this.data.phase!=='CONFERENCE')return;const counts={};for(const target of Object.values(this.data.conference?.votes||{}))counts[target]=(counts[target]||0)+1;let witness=null;if(Object.keys(counts).length){const top=Math.max(...Object.values(counts)),tied=Object.keys(counts).filter(k=>counts[k]===top);witness=this.data.players.find(p=>p.id===tied[Math.floor(Math.random()*tied.length)])||null}else witness=this.data.players[Math.floor(Math.random()*this.data.players.length)];
  const unpublishedFor=witness?[...new Set(Object.values(witness.found||{}))].filter(c=>!this.data.publicClues.includes(c)):[];let clue=null,source='TESTIMONY';if(unpublishedFor.length)clue=unpublishedFor[Math.floor(Math.random()*unpublishedFor.length)];else{const all=[...new Set(Object.values(this.data.clueMap||{}))].filter(c=>!this.data.publicClues.includes(c));if(all.length){clue=all[Math.floor(Math.random()*all.length)];source='FORENSIC SWEEP'}}if(clue)this.data.publicClues.push(clue);
  this.pushEvent(clue?`🔎 ${source}: ${witness?.name||'A player'} was called to testify. New verified evidence entered the record.`:'Case Conference ended. All verified clues are already public.','SYSTEM');this.data.conference=null;this.data.turn=0;this.data.phase='START';this.data.moveRoll=0;this.data.reachable={};this.data.acted=false;this.data.deadline=Date.now()+TURN_MS;this.data.version++;await this.save();
 }
 viewFor(player){const current=this.data.players[this.data.turn]||null,conference=this.data.phase==='CONFERENCE'&&this.data.conference?{deadline:this.data.conference.deadline,voted:!!this.data.conference.votes[player.id],voteCount:Object.keys(this.data.conference.votes).length,total:this.data.players.length}:null;return {ok:true,version:this.data.version,code:this.data.code,status:this.data.status,players:this.data.players.map(p=>this.publicPlayer(p)),turnPlayerId:current?.id||null,round:this.data.round,security:this.data.security,securityName:SECURITY[this.data.security].name,passages:this.data.passages,phase:this.data.phase,acted:this.data.acted,reachable:this.isTurn(player)?this.data.reachable:{},publicClues:this.data.publicClues,publicHands:this.data.publicHands,events:(this.data.events||[]).slice(0,20),deadline:this.data.deadline,conference,private:{id:player.id,name:player.name,character:player.character||null,role:player.role||null,room:player.room||null,hand:player.hand||[],found:player.found||{},history:player.history||[],knowledge:this.knowledge(player),accuseLocked:!!player.accuseLocked,killerKnowledge:player.role==='KILLER'?{killer:player.character}:null}}}
}
