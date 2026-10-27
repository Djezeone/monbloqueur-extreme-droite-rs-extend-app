(() => {
  let running=null,deadline=0;
  const visible=element=>element && element.getClientRects().length>0;
  const find=selector=>Array.from(document.querySelectorAll(selector)).find(visible);
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const owner=()=>{
    const link=find('a[data-testid="AppTabBar_Profile_Link"]');
    return link?new URL(link.href).pathname.split('/').filter(Boolean)[0]:null;
  };
  async function waitFor(fn,timeout=12000){
    const until=Math.min(deadline,Date.now()+timeout);
    while(Date.now()<until){const value=fn();if(value)return value;await delay(200);}
    throw Error('X n’a pas affiché le contrôle attendu.');
  }
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const unblocks=value=>/^(debloquer|unblock)\b/.test(normalize(value));
  const blockedButton=element=>element&&/^(debloquer|unblock|bloque|blocked)\b/.test(normalize(element.textContent+' '+element.getAttribute('aria-label')));
  async function block(message){
    const account=message.account;
    if(location.pathname.toLowerCase()!==`/${account.username.toLowerCase()}`)throw Error('Le profil affiché a changé. Cliquez pour reprendre.');
    const logged=await waitFor(owner);
    if(logged.toLowerCase()!==message.owner.toLowerCase())throw Error('Le compte X connecté a changé. Revenez au compte utilisé au lancement.');
    if(logged.toLowerCase()===account.username.toLowerCase())return 'unavailable';
    const header=await waitFor(()=>{
      const unavailable=find('[data-testid="emptyState"]');
      if(unavailable)return {unavailable:true};
      const name=find('[data-testid="UserName"]');
      return name?{name}:null;
    });
    if(header.unavailable)return 'unavailable';
    if(!header.name.textContent.toLowerCase().includes('@'+account.username.toLowerCase()))throw Error('Le profil affiché ne correspond pas à la liste.');
    // L’identifiant stable empêche de bloquer le nouveau propriétaire d’un pseudo.
    const profileButtons=Array.from(document.querySelectorAll('main [data-testid]')).filter(visible);
    const identified=profileButtons.some(el=>new RegExp(`^${account.id}-(follow|unfollow|unblock)$`).test(el.getAttribute('data-testid')))
      ||Array.from(document.images).some(img=>visible(img)&&img.currentSrc.includes(`/profile_banners/${account.id}/`));
    if(!identified)throw Error('X ne permet pas de vérifier l’identité de ce profil. Le blocage est en pause.');
    const already=find(`main [data-testid="${account.id}-unblock"],main [data-testid="unblock"]`);
    if(blockedButton(already))return 'already';
    const more=await waitFor(()=>find('main [data-testid="userActions"]'));
    more.click();
    const action=await waitFor(()=>find('[role="menuitem"][data-testid="block"]'));
    const text=normalize(action.textContent);
    if(unblocks(text)){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return 'already';}
    if(!/^(bloquer|block)\b/.test(text)||!text.includes('@'+account.username.toLowerCase()))throw Error('Commande de blocage non reconnue.');
    action.click();
    const confirm=await waitFor(()=>find('[data-testid="confirmationSheetConfirm"]'));
    const dialog=confirm.closest('[role="dialog"],[aria-modal="true"]');
    if(!dialog||!dialog.textContent.toLowerCase().includes('@'+account.username.toLowerCase())||!/^(bloquer|block)$/.test(normalize(confirm.textContent)))throw Error('Confirmation de blocage inattendue.');
    // Dernière vérification juste avant l’action sur le compte.
    if(owner()?.toLowerCase()!==message.owner.toLowerCase()||location.pathname.toLowerCase()!==`/${account.username.toLowerCase()}`)throw Error('La session X ou le profil a changé.');
    confirm.click();
    await waitFor(()=>{
      const button=find(`main [data-testid="${account.id}-unblock"],main [data-testid="unblock"]`);
    if(blockedButton(button))return true;
      const notices=Array.from(document.querySelectorAll('[role="alert"],[data-testid="toast"]')).filter(visible);
      return notices.some(el=>{
        const text=normalize(el.textContent);
        return text.includes('@'+account.username.toLowerCase())&&(/a ete bloque|has been blocked|you blocked/.test(text));
      });
    },12000);
    return 'blocked';
  }
  chrome.runtime.onMessage.addListener((message,sender,respond)=>{
    if(sender.id!==chrome.runtime.id||!['inspect','block'].includes(message?.type))return;
    if(running){respond({accepted:running===message.attempt});return;}
    running=message.attempt;deadline=Date.now()+25000;respond({accepted:true});
    (async()=>{
      const result={jobId:message.jobId,attempt:message.attempt,type:message.type==='inspect'?'sessionResult':'blockResult'};
      try{
        if(message.type==='inspect')result.owner=await waitFor(owner);
        else result.outcome=await block(message);
      }catch(error){result.outcome='error';result.error=error.message;}
      finally{running=null;}
      await chrome.runtime.sendMessage(result).catch(()=>{});
    })();
  });
})();
