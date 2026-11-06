const CACHE='piaogen-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

function isDoc(req){
  const acc=req.headers.get('accept')||'';
  return req.mode==='navigate' || acc.indexOf('text/html')>-1;
}

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  // 页面：网络优先，永远先取最新版本，只有断网时才用缓存兜底
  if(isDoc(req)){
    e.respondWith(
      fetch(req,{cache:'no-store'}).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{});
        return resp;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // 图标等静态资源：缓存优先，命中后同时静默更新
  e.respondWith(
    caches.match(req).then(r=>{
      const net=fetch(req).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
        return resp;
      }).catch(()=>r||caches.match('./index.html'));
      return r||net;
    })
  );
});
//（注：内容由AI生成）
