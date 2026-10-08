// Offline copy: the app opens without internet (outdoors at the bars, on a run). The drawings are inside the page.
// Online it always takes the newest page from the site, so updates keep arriving as before.
// The training log is in localStorage and is never touched here.
const CACHE='wt-v2'; // a new name drops the old copy (v1 also held the photos)
const CORE=['./','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const keep=(key,r)=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(ca=>ca.put(key,c)).catch(()=>{});}return r;};
// the page: from the network, but if it does not answer in 4 s (weak signal) or fails, the saved copy
function page(req){return new Promise((ok,no)=>{let t=setTimeout(()=>{t=null;no();},4000);
  fetch(req).then(r=>{keep('./',r);if(t){clearTimeout(t);ok(r);}}).catch(()=>{if(t){clearTimeout(t);no();}});})
  .catch(()=>caches.match('./').then(r=>r||fetch(req)));}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
  if(u.origin===location.origin){
    if(req.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html')){e.respondWith(page(req));return;}
    // icons, manifest: the saved copy at once, refreshed in the background
    e.respondWith(caches.match(req,{ignoreSearch:true}).then(c=>{const n=fetch(req).then(r=>keep(req,r));
      if(c){n.catch(()=>{});return c;}return n;}));return;}
  // everything else (fonts, the GitHub copy of the log) goes straight to the network
});
