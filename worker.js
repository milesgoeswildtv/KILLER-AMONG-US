const SUSPECTS=['Sam','Kass','Michael','Ruby','Seal','Kate','REM','Tweeky'];
const WEAPONS=['Casino Chips','Ban Hammer','Broken Bottle','Pool Cue','Ethernet Cable','Trophy','Wrench','Heavy Ashtray','Letter Opener'];
const ROOMS=['THE VAULT','CONTROL ROOM','HIGH ROLLER ROOM','BACK OFFICE','AFTERHOURS','WORKSHOP','KITCHEN','BACK ROOM'];
const START_ROOMS=['vault','high','office','after','workshop','kitchen','back','control'];

const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8','cache-control':'no-store','access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'GET,POST,OPTIONS',...extra}});
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
const id=(n=24)=>{const bytes=new Uint8Array(n);crypto.getRandomValues(bytes);return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')};
const lobbyCode=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(6);crypto.getRandomValues(bytes);return [...bytes].map(x=>alphabet[x%alphabet.length]).join('')};

export default {
 async fetch(request,env){
  if(request.method==='OPTIONS')return json({ok:true});
  const url=new URL(request.url);
  if(url.pathname==='/api/health')return json({ok:true,game:'KILLER AMONG US',multiplayer:'pass-6'});
  if(url.pathname==='/api/lobby/create'&&request.method==='POST'){
   const body=await safeBody(request),code=lobbyCode(),stub=env.MATCHES.get(env.MATCHES.idFromName(code));
   return stub.fetch(new Request(`${url.origin}/create`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,name:body.name||'Host'})}));
  }
  const m=url.pathname.match(/^\/api\/lobby\/([A-Z0-9]{6})(?:\/(join|state|start|leave))?$/i);
  if(m){const code=m[1].toUpperCase(),action=m[2]||'state',stub=env.MATCHES.get(env.MATCHES.idFromName(code));
   const headers=new Headers(request.headers);headers.set('x-lobby-code',code);
   return stub.fetch(new Request(`${url.origin}/${action}`,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body}));
  }
  return json({error:'Not found'},404);
 }
};

async function safeBody(request){try{return await request.json()}catch{return {}}}

export class MatchLobby {
 constructor(state,env){this.state=state;this.env=env;this.data=null}
 async load(){if(!this.data)this.data=await this.state.storage.get('match')||null;return this.data}
 async save(){await this.state.storage.put('match',this.data)}
 token(request){const raw=request.headers.get('authorization')||'';return raw.toLowerCase().startsWith('bearer ')?raw.slice(7).trim():''}
 playerByToken(token){return this.data?.players.find(p=>p.token===token)||null}
 publicPlayer(p){return {id:p.id,name:p.name,seat:p.seat,room:p.room,connected:p.connected!==false}}
 async fetch(request){
  const url=new URL(request.url),action=url.pathname.slice(1);
  if(request.method==='OPTIONS')return json({ok:true});
  if(action==='create'&&request.method==='POST'){
   if(await this.load())return json({error:'Lobby already exists'},409);
   const body=await safeBody(request),hostToken=id(),playerToken=id(),name=cleanName(body.name||'Host');
   this.data={code:body.code,status:'LOBBY',createdAt:Date.now(),hostToken,version:1,players:[{id:id(8),name,seat:0,room:null,role:null,hand:[],found:{},token:playerToken,connected:true}],solution:null,turn:0,round:1,publicClues:[],security:0,passages:true};
   await this.save();return json({ok:true,code:this.data.code,hostToken,playerToken,playerId:this.data.players[0].id});
  }
  if(!await this.load())return json({error:'Lobby not found'},404);
  if(action==='join'&&request.method==='POST'){
   if(this.data.status!=='LOBBY')return json({error:'Match already started'},409);
   if(this.data.players.length>=8)return json({error:'Lobby is full'},409);
   const body=await safeBody(request),name=cleanName(body.name||'Player');
   if(this.data.players.some(p=>p.name.toLowerCase()===name.toLowerCase()))return json({error:'That name is already in the lobby'},409);
   const p={id:id(8),name,seat:this.data.players.length,room:null,role:null,hand:[],found:{},token:id(),connected:true};this.data.players.push(p);this.data.version++;await this.save();
   return json({ok:true,code:this.data.code,playerToken:p.token,playerId:p.id});
  }
  const token=this.token(request),player=this.playerByToken(token);if(!player)return json({error:'Invalid player session'},401);
  if(action==='state'&&request.method==='GET')return json(this.viewFor(player));
  if(action==='leave'&&request.method==='POST'){
   if(this.data.status!=='LOBBY')return json({error:'Cannot leave after match start in Pass 6'},409);
   this.data.players=this.data.players.filter(p=>p.id!==player.id);this.data.players.forEach((p,i)=>p.seat=i);this.data.version++;await this.save();return json({ok:true});
  }
  if(action==='start'&&request.method==='POST'){
   const host=request.headers.get('x-host-token')||'';if(host!==this.data.hostToken)return json({error:'Host authorization required'},403);
   if(this.data.status!=='LOBBY')return json({error:'Match already started'},409);
   if(this.data.players.length<3)return json({error:'Need at least 3 players to start'},409);
   this.startGame();await this.save();return json({ok:true,state:this.viewFor(player)});
  }
  return json({error:'Not found'},404);
 }
 startGame(){
  const activeSuspects=shuffle(SUSPECTS).slice(0,this.data.players.length),killerIndex=Math.floor(Math.random()*this.data.players.length),killer=activeSuspects[killerIndex],weapon=WEAPONS[Math.floor(Math.random()*WEAPONS.length)],room=ROOMS[Math.floor(Math.random()*ROOMS.length)];
  const deck=shuffle([...activeSuspects.filter(x=>x!==killer).map(name=>({type:'SUSPECT',name})),...WEAPONS.filter(x=>x!==weapon).map(name=>({type:'WEAPON',name})),...ROOMS.filter(x=>x!==room).map(name=>({type:'ROOM',name}))]);
  this.data.players.forEach((p,i)=>{p.character=activeSuspects[i];p.role=i===killerIndex?'KILLER':'INVESTIGATOR';p.room=START_ROOMS[i];p.hand=[];p.found={};p.accuseLocked=false});deck.forEach((card,i)=>this.data.players[i%this.data.players.length].hand.push(card));
  this.data.solution={killer,weapon,room};this.data.status='ACTIVE';this.data.turn=0;this.data.round=1;this.data.version++;
 }
 viewFor(player){
  const current=this.data.players[this.data.turn]||null;
  return {ok:true,version:this.data.version,code:this.data.code,status:this.data.status,isHost:this.data.players[0]?.id===player.id,players:this.data.players.map(p=>this.publicPlayer(p)),turnPlayerId:current?.id||null,round:this.data.round,security:this.data.security,passages:this.data.passages,publicClues:this.data.publicClues,private:{id:player.id,name:player.name,character:player.character||null,role:player.role||null,room:player.room||null,hand:player.hand||[],found:player.found||{},killerKnowledge:player.role==='KILLER'?{killer:player.character}:null}};
 }
}
function cleanName(v){return String(v).replace(/[<>]/g,'').trim().slice(0,24)||'Player'}