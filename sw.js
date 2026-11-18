'use strict';
const VERSION='savely-offline-v1';
const APP_CACHE=VERSION+'-app';
const RUNTIME_CACHE=VERSION+'-runtime';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./icons/savely-icon.svg'];
// Cache key third-party libraries used by app features. If a CDN is unavailable during install,
// the main app still installs and those optional integrations remain gracefully unavailable offline.
const OPTIONAL_ASSETS=[
 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap'
];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(APP_CACHE);
  await cache.addAll(APP_SHELL);
  const runtime=await caches.open(RUNTIME_CACHE);
  await Promise.all(OPTIONAL_ASSETS.map(async url=>{
   try{const response=await fetch(new Request(url,{mode:'cors',cache:'reload'}));if(response.ok)await runtime.put(url,response);}catch(_){}
  }));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>!key.startsWith(VERSION)).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 // App navigation is network-first with a complete cached app-shell fallback.
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{
    const response=await fetch(request);
    if(response&&response.ok){const cache=await caches.open(APP_CACHE);cache.put('./index.html',response.clone());}
    return response;
   }catch(_){return (await caches.match('./index.html'))||new Response('Savely is not yet installed for offline use. Open it once while online, then try again.',{status:503,headers:{'Content-Type':'text/plain'} });}
  })());
  return;
 }
 // Same-origin app assets: cache-first so the installed app opens without a network.
 if(url.origin===self.location.origin){
  event.respondWith((async()=>{
   const cached=await caches.match(request);
   if(cached)return cached;
   try{
    const response=await fetch(request);
    if(response&&response.ok){const cache=await caches.open(APP_CACHE);cache.put(request,response.clone());}
    return response;
   }catch(_){return new Response('',{status:504,statusText:'Offline asset unavailable'});}
  })());
  return;
 }
 // Cache external static resources after first successful use; never cache financial/auth API calls.
 const isStatic=/\.(?:js|css|woff2?|ttf|otf|svg|png|jpg|jpeg|webp)$/i.test(url.pathname)||
  url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
 if(isStatic){
  event.respondWith((async()=>{
   const cache=await caches.open(RUNTIME_CACHE),cached=await cache.match(request);
   if(cached)return cached;
   try{const response=await fetch(request);if(response&&response.ok)cache.put(request,response.clone());return response;}
   catch(_){return cached||new Response('',{status:504,statusText:'Offline resource unavailable'});}
  })());
 }
});
