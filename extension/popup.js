const $=id=>document.getElementById(id);
let busy=false,state,rendering=Promise.resolve(),signature;
const send=async type=>{const reply=await chrome.runtime.sendMessage({type});if(!reply?.ok)throw Error(reply?.error||'Extension indisponible.');return reply.data;};
function render(){rendering=rendering.catch(()=>{}).then(async()=>{
 state=await send('state');const job=state.job,running=job?.status==='running';
 $('start').disabled=busy||running;$('start').textContent=running?'Blocage en cours…':job?.status==='paused'?'Reprendre le blocage':'Bloquer l’Extrême-droite';
 $('status').textContent=job?.message||(state.list?`${state.list.accounts.length} comptes dans la liste.`:'La liste sera chargée au lancement.');
 $('bar').hidden=!job;$('bar').max=job?.accounts.length||1;$('bar').value=job?.index||0;
 $('cancel').hidden=!['running','paused'].includes(job?.status);$('cancel').disabled=busy;
 $('listInfo').textContent=`Voir la liste${state.list?' ('+state.list.accounts.length+')':''}`;
 const next=JSON.stringify(state.list);
 if(signature!==next){signature=next;$('accounts').replaceChildren(...(state.list?.accounts||[]).map(account=>{const li=document.createElement('li');li.textContent='@'+account.username;return li;}));}
 });return rendering;}
async function act(type){if(busy)return;busy=true;$('error').textContent='';await render();try{await send(type);}catch(error){$('error').textContent=error.message;}finally{busy=false;await render();}}
$('start').onclick=()=>act('start');$('cancel').onclick=()=>act('cancel');
chrome.storage.onChanged.addListener(()=>render().catch(()=>{}));
await render();
if(state.job?.status!=='running')send('refresh').then(render).catch(()=>{});
