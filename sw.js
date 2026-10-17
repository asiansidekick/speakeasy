/* Speakeasy offline support: keeps a copy of the app so it opens with no signal.
   Always tries the network first, so new builds still arrive when you're online. */
const CACHE="speakeasy-v1";
const PAGE="./index.html";
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.add(PAGE)).catch(()=>{}))});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(r.mode==="navigate"||(u.origin===self.location.origin&&/\/(index\.html)?$/.test(u.pathname))){
    e.respondWith(Promise.race([fetch(r),timeout(6000)]).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(PAGE,cp))}
      return res;
    }).catch(()=>caches.match(PAGE).then(m=>m||fetch(r))));
    return;
  }
  if(/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open(CACHE).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==="opaque"))c.put(r,res.clone());return res}).catch(()=>m);
      return m||net;
    })));
  }
});
