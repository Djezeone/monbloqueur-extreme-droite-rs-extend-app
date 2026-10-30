import {PLATFORMS,CATEGORIES} from "./platforms.js";
import {newFlows} from "./flow-core.js";
import {guidedOptions,buildGuidedPlan} from "./guided-core.js";
import {FLOW_STATUS} from "./actions.js";
const $=id=>document.getElementById(id);
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
export function mountGuided({getState,save,notify,navigate,onSaved}) {
  const dialog=$("guided-dialog"),body=$("guided-body");
  let step=1,category="sources",target="",platforms=new Set(),selections=new Set(),trigger=null,busy=false;
  const current=()=>getState().flows||newFlows();
  function error(message){$("guided-error").textContent=message;$("guided-error").hidden=!message;}
  function field(label,input){const wrapper=node("label",undefined,"field");wrapper.append(node("span",label),input);return wrapper;}
  function choice(value,label,description,checked,onChange){
    const wrapper=node("label",undefined,"choice-card"),input=node("input"),text=node("span");
    input.type="checkbox";input.value=value;input.checked=checked;text.append(node("strong",label),node("small",description));
    input.addEventListener("change",()=>onChange(input.checked));wrapper.append(input,text);return wrapper;
  }
  function selectedInput(){return {category,target,platforms:[...platforms],selections:[...selections].map(key=>{const [platform,control]=key.split(":");return {platform,control};})};}
  function render(focus=true){
    error("");body.replaceChildren();$("guided-progress").textContent="Étape "+step+" sur 4";
    $("guided-back").hidden=step===1;$("guided-next").hidden=step===4;$("guided-save").hidden=step!==4;
    $("guided-title").textContent=["Que souhaitez-vous gérer ?","Sur quels services ?","Quelles actions souhaitez-vous préparer ?","Vérifier avant d’enregistrer"][step-1];
    if(step===1){
      const select=node("select");select.id="guided-category";
      for(const [value,label] of Object.entries(CATEGORIES)){const opt=node("option",label);opt.value=value;select.append(opt);}select.value=category;
      select.addEventListener("change",()=>{category=select.value;selections.clear();});
      const input=node("input");input.id="guided-target";input.type="text";input.maxLength=200;input.autocomplete="off";input.setAttribute("list","guided-examples");input.value=target;input.placeholder="Un média, un compte ou un sujet…";
      input.addEventListener("input",()=>{target=input.value;});
      const list=node("datalist");list.id="guided-examples";const example=node("option");example.value="CNEWS";list.append(example);
      body.append(field("Catégorie",select),field("Nom à retenir",input),list,
        node("p","CNEWS est un exemple de nom. Vous pouvez choisir n’importe quelle source. Aucune identité de compte, tiers associé ou personne citée ne sera sélectionné automatiquement.","fine"),
        node("p","Ce nom restera dans le carnet et vos sauvegardes. N’inscrivez aucun mot de passe ou secret.","fine"));
    }else if(step===2){
      const fieldset=node("fieldset",undefined,"flow-fieldset");fieldset.append(node("legend","Choisir un ou plusieurs services"));
      const grid=node("div",undefined,"choice-grid");
      for(const [id,p] of Object.entries(PLATFORMS))grid.append(choice(id,p.label,p.description,platforms.has(id),checked=>{if(checked)platforms.add(id);else platforms.delete(id);selections.clear();}));
      fieldset.append(grid);body.append(fieldset,node("p","Le carnet local fonctionne sans compte. Choisissez seulement les services qui vous intéressent ; aucun n’est connecté par cette sélection.","fine"));
    }else if(step===3){
      for(const p of guidedOptions(category,[...platforms])){
        const fieldset=node("fieldset",undefined,"flow-fieldset");fieldset.append(node("legend",p.label));
        if(!p.controls.length)fieldset.append(node("p","Non disponible : aucun contrôle documenté dans cette catégorie. Le carnet local reste possible.","fine"));
        for(const c of p.controls){
          const key=p.id+":"+c.id;
          fieldset.append(choice(key,c.label,c.mode==="local"?"Note locale, aucun effet dans une autre application.":"Parcours manuel dans le service officiel.",selections.has(key),checked=>{if(checked)selections.add(key);else selections.delete(key);}));
          const details=node("details"),steps=node("ol");c.steps.forEach(text=>steps.append(node("li",text)));
          details.append(node("summary","Portée et mode d’emploi · "+c.label),node("p",c.scope),steps,...c.limits.map(text=>node("p",text,"fine")));
          fieldset.append(details);
        }body.append(fieldset);
      }
      body.append(node("p","Ne plus afficher, masquer, bloquer et Pas intéressé ont des effets différents. Cochez uniquement le contrôle qui correspond à votre intention.","fine"));
    }else{
      const result=buildGuidedPlan(current(),selectedInput());
      body.append(node("p",target),node("p",result.added+" nouvelle(s) fiche(s) à préparer · "+result.existing+" déjà présente(s), avec leur état conservé."));
      const list=node("ul");for(const p of guidedOptions(category,[...platforms]))for(const c of p.controls)if(selections.has(p.id+":"+c.id)){
        const existing=current().items.find(i=>i.platform===p.id&&i.control===c.id&&i.target.toLowerCase()===target.trim().toLowerCase());
        const state=existing?FLOW_STATUS[existing.status]+" · état existant conservé":c.mode==="local"?"Note locale":"À faire chez le fournisseur";
        list.append(node("li",p.label+" · "+c.label+" · "+state));
      }
      body.append(list,node("p","Enregistrer ne modifie aucun service. Ensuite, ouvrez l’aide officielle de chaque fiche, effectuez vous-même le geste puis déclarez-le si nécessaire. Aucune confirmation fournisseur n’est produite."));
    }
    if(focus)$("guided-title").focus();
  }
  function open(event){
    trigger=event?.currentTarget||$("guided-open");step=1;category="sources";target="";selections.clear();
    platforms=new Set(current().platforms.length?current().platforms:["local"]);render(false);dialog.showModal();$("guided-target").focus();
  }
  $("guided-open").addEventListener("click",open);
  $("guided-next").addEventListener("click",()=>{
    if(busy)return;
    try{
      if(step===1&&(!target.trim()||target.trim().length>200||/[\u0000-\u001f\u007f]/.test(target)))throw Error("Choisissez ou saisissez un nom sur une ligne.");
      if(step===2&&!platforms.size)throw Error("Choisissez au moins le carnet local ou un service.");
      if(step===3)buildGuidedPlan(current(),selectedInput());
      step=Math.min(4,step+1);render();
    }catch(e){error(e.message);}
  });
  $("guided-back").addEventListener("click",()=>{if(busy)return;step=Math.max(1,step-1);render();});
  $("guided-cancel").addEventListener("click",()=>{if(!busy)dialog.close();});
  dialog.addEventListener("cancel",event=>{if(busy)event.preventDefault();});
  dialog.addEventListener("close",()=>{target="";selections.clear();body.replaceChildren();if(trigger?.isConnected)trigger.focus();});
  $("guided-save").addEventListener("click",async()=>{
    if(busy)return;busy=true;
    const controls=[...dialog.querySelectorAll("button,input,select")].map(el=>({el,disabled:el.disabled}));
    controls.forEach(({el})=>{el.disabled=true;});dialog.setAttribute("aria-busy","true");
    try{
      const result=buildGuidedPlan(current(),selectedInput()),savedTarget=target.trim();
      if(await save({...getState(),flows:result.flows},result.added+" choix enregistrés ; "+result.existing+" existants conservés. Aucune action distante effectuée.")){
        dialog.close();navigate("flows");onSaved(savedTarget);
      }else error("Enregistrement non confirmé. Votre brouillon est conservé. Consultez le message d’enregistrement puis sauvegardez les données accessibles si nécessaire.");
    }catch(e){error(e.message);notify(e.message,true);}finally{busy=false;dialog.removeAttribute("aria-busy");controls.forEach(({el,disabled})=>{if(el.isConnected)el.disabled=disabled;});}
  });
  return {open,reset(){if(dialog.open)dialog.close();step=1;target="";category="sources";platforms.clear();selections.clear();body.replaceChildren();error("");}};
}
