/** Public deployment configuration, reviewed in Git. No financial credentials. */
export const CONTRIB = Object.freeze({url:null,validatedAt:null});

export function supportDestination(config=CONTRIB) {
  if(!config||typeof config.url!=="string"||typeof config.validatedAt!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(config.validatedAt)) return null;
  const date=new Date(config.validatedAt+"T00:00:00Z");
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==config.validatedAt) return null;
  try {
    const u=new URL(config.url),host=u.hostname;
    if(u.protocol!=="https:"||u.href!==config.url||u.username||u.password||u.port||u.search||u.hash||
      !host.includes(".")||/^[0-9.]+$/.test(host)||host.includes(":")||/(^|\.)(localhost|local|internal)$/.test(host)||
      !host.split(".").every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
    return u.href;
  } catch {return null;}
}
