import {readListResponse} from './core.js';
const ALARM='block-next';
export function createRunner(chrome,config,fetcher=globalThis.fetch,defer=setTimeout) {
  let serial=Promise.resolve();
  const locked=fn=>{const next=serial.then(fn);serial=next.catch(()=>{});return next;};
  const read=async()=> (await chrome.storage.local.get('job')).job;
  const save=job=>chrome.storage.local.set({job});
  const schedule=async when=>{
    await chrome.alarms.create(ALARM,{when});
    // Les alarmes servent de secours si Chrome arrête le service worker.
    defer(()=>locked(drive).catch(()=>{}),Math.max(100,when-Date.now()));
  };
  async function list() {
    const response=await fetcher(config.listUrl,{cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(15000)});
    const list=await readListResponse(response);
    if(!list.accounts.length)throw new Error('La liste est vide pour le moment.');
    await chrome.storage.local.set({list,checkedAt:Date.now()});return list;
  }
  async function pause(job,message){job.status='paused';job.message=message;await save(job);await chrome.alarms.clear(ALARM);}
  async function closeOwnedTab(job){
    try{const tab=await chrome.tabs.get(job.tabId);if(new URL(tab.url).hostname==='x.com')await chrome.tabs.remove(job.tabId);}catch{}
  }
  async function finish(job){
    job.status='done';job.message=job.failed.length?`${job.confirmed} compte(s) bloqué(s), ${job.failed.length} compte(s) indisponible(s).`:`${job.confirmed} compte(s) bloqué(s). C’est fait !`;
    await save(job);await chrome.alarms.clear(ALARM);await closeOwnedTab(job);
  }
  async function drive(){
    const job=await read();if(job?.status!=='running')return;
    if(job.index>=job.accounts.length){await finish(job);return;}
    if(job.phase==='delay'){
      if(job.nextAt>Date.now()){await schedule(job.nextAt);return;}
      job.phase='loading';job.attempt=crypto.randomUUID();job.deadline=Date.now()+60000;await save(job);
      try{await chrome.tabs.update(job.tabId,{url:`https://x.com/${job.accounts[job.index].username}`});}
      catch{await pause(job,'L’onglet de blocage a été fermé. Cliquez pour reprendre.');return;}
    }
    if(job.deadline<Date.now()){await pause(job,'X ne répond pas ou demande une vérification. Ouvrez l’onglet X, puis cliquez pour reprendre.');return;}
    if(['inspecting','blocking'].includes(job.phase)){await schedule(job.deadline+100);return;}
    let tab;
    try{tab=await chrome.tabs.get(job.tabId);}catch{await pause(job,'L’onglet de blocage a été fermé. Cliquez pour reprendre.');return;}
    if(tab.status!=='complete'){await schedule(Date.now()+3000);return;}
    let url;try{url=new URL(tab.url);}catch{await pause(job,'L’onglet X a changé. Cliquez pour reprendre.');return;}
    if(url.hostname!=='x.com' || (job.phase==='loading' && url.pathname.toLowerCase()!==`/${job.accounts[job.index].username.toLowerCase()}`)){
      await pause(job,'Connectez-vous à X dans l’onglet ouvert, puis cliquez pour reprendre.');return;
    }
    const session=job.phase==='sessionLoading';
    job.phase=session?'inspecting':'blocking';job.deadline=Date.now()+35000;await save(job);
    try {
      const accepted=await chrome.tabs.sendMessage(job.tabId,{type:session?'inspect':'block',jobId:job.id,attempt:job.attempt,account:job.accounts[job.index],owner:job.owner});
      if(!accepted?.accepted)throw new Error('not-ready');
    } catch {
      job.phase=session?'sessionLoading':'loading';await save(job);await schedule(Date.now()+3000);return;
    }
    await schedule(job.deadline+100);
  }
  async function result(message,sender){
    const job=await read();
    if(job?.status!=='running' || sender.tab?.id!==job.tabId || sender.frameId!==0 || job.id!==message.jobId || job.attempt!==message.attempt)return;
    if(message.type==='sessionResult' && job.phase==='inspecting'){
      if(!message.owner || !/^[A-Za-z0-9_]{1,15}$/.test(message.owner)){await pause(job,'Connectez-vous à X dans l’onglet ouvert, puis cliquez pour reprendre.');return;}
      if(job.owner && job.owner.toLowerCase()!==message.owner.toLowerCase()){await pause(job,'Le compte X connecté a changé. Revenez au compte utilisé au lancement.');return;}
      job.owner=message.owner;job.phase='delay';job.nextAt=Date.now();job.message='Blocage en cours…';await save(job);await drive();return;
    }
    if(message.type!=='blockResult'||job.phase!=='blocking')return;
    if(['blocked','already'].includes(message.outcome)){job.confirmed++;job.index++;}
    else if(message.outcome==='unavailable'){job.failed.push(job.accounts[job.index]);job.index++;}
    else{await pause(job,message.error||'X a interrompu le blocage. Ouvrez l’onglet X, puis cliquez pour reprendre.');return;}
    if(job.index>=job.accounts.length){await finish(job);return;}
    job.phase='delay';job.nextAt=Date.now()+2500;job.message=`${job.confirmed} / ${job.accounts.length} comptes bloqués…`;await save(job);await schedule(job.nextAt);
  }
  return {
    dispatch(message,sender={}){
      if(message?.type==='state')return chrome.storage.local.get(['list','job','checkedAt']);
      if(message?.type==='refresh')return list();
      return locked(async()=>{
        if(['sessionResult','blockResult'].includes(message?.type))return result(message,sender);
        const old=await read();
        if(message?.type==='cancel'){
          if(old){old.status='cancelled';old.message='Arrêté. Les blocages déjà faits restent actifs.';await save(old);await closeOwnedTab(old);}await chrome.alarms.clear(ALARM);return;
        }
        if(message?.type!=='start')throw new Error('Commande inconnue.');
        if(old?.status==='running')return;
        const accounts=old?.status==='paused'?old.accounts:(await list()).accounts;
        const tab=await chrome.tabs.create({url:'https://x.com/home',active:false});
        if(old?.status==='paused')await closeOwnedTab(old);
        const job=old?.status==='paused'?old:{id:crypto.randomUUID(),accounts,index:0,confirmed:0,failed:[],owner:null};
        Object.assign(job,{status:'running',phase:'sessionLoading',tabId:tab.id,attempt:crypto.randomUUID(),deadline:Date.now()+60000,message:'Vérification de votre session X…'});
        await save(job);await schedule(Date.now()+1500);
      });
    },
    tick:()=>locked(drive),
    startup:()=>locked(async()=>{const job=await read();if(job?.status==='running')await pause(job,'Chrome a redémarré. Cliquez pour reprendre.');})
  };
}
