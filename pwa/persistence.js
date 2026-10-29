/** Transactional witness: one digest only, never a second copy of personal data. */
function failure(code){return Object.assign(Error(code),{code});}
async function digest(raw,crypto){
  if(raw!==null&&typeof raw!=="string")throw failure("invalid-snapshot");
  const bytes=new TextEncoder().encode(raw===null?"absent":"present:"+raw);
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(n=>n.toString(16).padStart(2,"0")).join("");
}
async function connection(indexedDB){
  return new Promise((resolve,reject)=>{
    let finished=false;const request=indexedDB.open("fil-clair-integrity-v1",1);
    const timer=setTimeout(()=>{finished=true;reject(failure("witness-unavailable"));},5000);
    request.onupgradeneeded=()=>request.result.createObjectStore("state");
    request.onerror=request.onblocked=()=>{clearTimeout(timer);finished=true;reject(failure("witness-unavailable"));};
    request.onsuccess=()=>{clearTimeout(timer);const db=request.result;if(finished){db.close();return;}db.onversionchange=()=>db.close();resolve(db);};
  });
}
async function compareAndSet(db,expected,next){
  return new Promise((resolve,reject)=>{
    let reason;const tx=db.transaction("state","readwrite",{durability:"strict"}),store=tx.objectStore("state"),request=store.get("snapshot");
    const timer=setTimeout(()=>{reason=failure("witness-unavailable");try{tx.abort();}catch{reject(reason);}},5000);
    request.onsuccess=()=>{
      const record=request.result;
      if(record!==undefined&&(!record||Object.keys(record).length!==2||record.version!==1||typeof record.digest!=="string"||!/^[a-f0-9]{64}$/.test(record.digest))) reason=failure("witness-invalid");
      else if(record!==undefined&&record.digest!==expected)reason=failure("snapshot-conflict");
      if(reason){tx.abort();return;}
      store.put({version:1,digest:next},"snapshot");
    };
    tx.oncomplete=()=>{clearTimeout(timer);resolve();};
    tx.onabort=()=>{clearTimeout(timer);reject(reason||failure("witness-unavailable"));};
    tx.onerror=()=>{}; // onabort provides the one rejection after a transaction error.
  });
}
export async function commitSnapshot({base,next,write,indexedDB=globalThis.indexedDB,crypto=globalThis.crypto}){
  if(base===next)return;
  if(!indexedDB?.open||!crypto?.subtle||typeof write!=="function")throw failure("witness-unavailable");
  const [oldDigest,newDigest]=await Promise.all([digest(base,crypto),digest(next,crypto)]),db=await connection(indexedDB);
  try{
    // Commit the claim before the one synchronous write. A stale renderer can
    // no longer pass solely because its cached read still equals its old base.
    await compareAndSet(db,oldDigest,newDigest);
    try{write();}catch{
      // setItem failure is atomic. Restore the old witness only if still owned.
      // If this recovery fails, later writes fail closed; no automatic rebasing.
      await compareAndSet(db,newDigest,oldDigest);throw failure("snapshot-write-failed");
    }
  }finally{db.close();}
}
