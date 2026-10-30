import { PLATFORMS, CATEGORIES, getControl } from "./platforms.js";
import { newFlows, validateFlows, configureFlows, addFlow } from "./flow-core.js";

function services(category, platforms) {
  if (!Object.hasOwn(CATEGORIES, category) || !Array.isArray(platforms) || !platforms.length ||
    platforms.length>Object.keys(PLATFORMS).length || new Set(platforms).size!==platforms.length ||
    platforms.some(id=>!Object.hasOwn(PLATFORMS,id))) throw Error("Choisissez une catégorie et au moins un service valide.");
  return platforms;
}
export function guidedOptions(category, platforms) {
  return services(category,platforms).map(id=>({id,label:PLATFORMS[id].label,
    controls:PLATFORMS[id].controls.filter(c=>c.category===category)}));
}

/** Build the complete snapshot first. The caller performs exactly one atomic save. */
export function buildGuidedPlan(flows, input, now=Date.now(), idFactory=()=>"flow-"+crypto.randomUUID()) {
  const current=validateFlows(flows||newFlows());
  const {category,target,platforms,selections}=input||{};
  services(category,platforms);
  if(typeof target!=="string"||!target.trim()||target.trim().length>200||/[\u0000-\u001f\u007f]/.test(target)) throw Error("Indiquez un nom sur une ligne, de 1 à 200 caractères.");
  if(!Array.isArray(selections)||!selections.length||selections.length>43) throw Error("Choisissez au moins une action documentée.");
  const selected=new Set();
  for(const choice of selections) {
    if(!choice||Object.keys(choice).length!==2||!Object.hasOwn(choice,"platform")||!Object.hasOwn(choice,"control")) throw Error("Sélection d’action invalide.");
    const control=getControl(choice.platform,choice.control), key=choice.platform+":"+choice.control;
    if(!control||control.category!==category||!platforms.includes(choice.platform)||selected.has(key)) throw Error("Action absente, en double ou hors sélection.");
    selected.add(key);
  }
  let result=configureFlows(current,[...new Set([...current.platforms,...platforms.filter(p=>p!=="local")])],[...new Set([...current.categories,category])]);
  let added=0,existing=0;
  for(const choice of selections) {
    const duplicate=result.items.some(i=>i.platform===choice.platform&&i.control===choice.control&&i.target.toLowerCase()===target.trim().toLowerCase());
    if(duplicate){ existing++; continue; }
    result=addFlow(result,{...choice,id:idFactory(),target:target.trim()},now); added++;
  }
  return {flows:result,added,existing};
}
