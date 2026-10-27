import {CONFIG} from './config.js';
import {createRunner} from './runner.js';
const runner=createRunner(chrome,CONFIG);
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
 const popup=sender.id===chrome.runtime.id&&sender.url===chrome.runtime.getURL('popup.html');
 const content=sender.id===chrome.runtime.id&&sender.tab&&sender.frameId===0&&/^https:\/\/(x\.com|twitter\.com)\//.test(sender.url||'');
 if(!(popup&&['state','refresh','start','cancel'].includes(message?.type))&&!(content&&['sessionResult','blockResult'].includes(message?.type)))return;
 runner.dispatch(message,sender).then(data=>respond({ok:true,data}),error=>respond({ok:false,error:error.message}));return true;
});
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='block-next')runner.tick().catch(()=>{});});
chrome.tabs.onUpdated.addListener((id,change)=>{if(change.status==='complete')runner.tick().catch(()=>{});});
chrome.runtime.onStartup.addListener(()=>runner.startup().catch(()=>{}));
chrome.runtime.onInstalled.addListener(()=>runner.startup().catch(()=>{}));
