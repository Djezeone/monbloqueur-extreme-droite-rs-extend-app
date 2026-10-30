import {searchHelp} from "./help-data.js";
import {PLATFORMS} from "./platforms.js";
import {supportDestination} from "./support-config.js";

const $=id=>document.getElementById(id);
function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
export function mountHelp() {
  const dialog=$("help-dialog"); let trigger=null;
  function render(expand="") {
    const results=searchHelp($("help-search").value,$("help-system").value);
    $("help-count").textContent=results.length?results.length+" réponses disponibles. Choisissez une question.":"Aucune réponse. Essayez un mot plus court ou Tous les appareils.";
    $("help-results").replaceChildren(...results.map(item=>{
      const details=node("details"), summary=node("summary",item.question);
      details.dataset.helpId=item.id; details.append(summary,node("p",item.answer));details.open=item.id===expand;return details;
    }));
  }
  for(const [id,platform] of Object.entries(PLATFORMS)) {
    if(id==="local")continue;
    const control=platform.controls.find(c=>c.mode==="guide");if(!control)continue;
    const link=node("a",platform.label+" ↗");link.href=control.url;link.target="_blank";link.rel="noopener noreferrer";link.className="button subtle";
    $("help-official").append(link);
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-help]");if(!button)return;
    trigger=button;$("help-search").value="";$("help-system").value="all";render(button.dataset.help);
    if(!dialog.open)dialog.showModal();$("help-title").focus();
  });
  const restoreFocus=()=>{if(trigger?.isConnected&&!trigger.closest("[hidden]"))trigger.focus();else $("help-open").focus();};
  $("help-close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("close",restoreFocus);
  $("help-search").addEventListener("input",()=>render());$("help-system").addEventListener("change",()=>render());
  render();
  const destination=supportDestination();
  if(destination) {
    const link=node("a","Soutenir FIL CLAIR");link.id="support-link";link.className="button subtle";link.href=destination;
    link.target="_blank";link.rel="noopener noreferrer";link.referrerPolicy="no-referrer";
    $("support-entry").replaceChildren(link);
    $("support-status").textContent="Page externe CONTRIB.OS. Aucun choix personnel ni session n’est partagé. Si elle est indisponible, fermez son onglet et continuez dans FIL CLAIR.";
  }
  return {reset(){if(dialog.open)dialog.close();trigger=null;$("help-search").value="";$("help-system").value="all";render();}};
}
