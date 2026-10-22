import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {installationContext} from './public/pwa.js';

test('PWA: biểu tượng PNG thật đúng kích thước, định danh và cấu hình cài độc lập',()=>{
 const manifest=JSON.parse(readFileSync(new URL('./public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.id,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'/?source=pwa');assert.equal(manifest.prefer_related_applications,false);
 for(const size of [192,512])assert.ok(manifest.icons.some(i=>i.sizes===`${size}x${size}`&&i.purpose==='any'));
 assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
 for(const [file,size] of [['icon-192.png',192],['icon-512.png',512],['icon-maskable-512.png',512],['apple-touch-icon.png',180]]){
  const bytes=readFileSync(new URL('./public/'+file,import.meta.url));
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
 }
 const html=readFileSync(new URL('./public/index.html',import.meta.url),'utf8');assert.match(html,/apple-touch-icon/);assert.match(html,/apple-mobile-web-app-capable/);
});
test('PWA: nhận diện iPhone, iPadOS, Android, đã cài và điều kiện HTTPS',()=>{
 const https={protocol:'https:',hostname:'ha-tang.example.vn'};
 assert.equal(installationContext({...https,userAgent:'Mozilla iPhone'}).platform,'ios');
 assert.equal(installationContext({...https,platform:'MacIntel',maxTouchPoints:5}).platform,'ios');
 assert.equal(installationContext({...https,userAgent:'Mozilla Android'}).platform,'android');
 assert.equal(installationContext({...https,displayStandalone:true}).installed,true);
 assert.equal(installationContext({...https,standalone:true}).installed,true);
 assert.equal(installationContext({protocol:'http:',hostname:'192.168.1.5'}).secure,false);
 assert.equal(installationContext({protocol:'http:',hostname:'127.0.0.1'}).secure,true);
});
test('PWA: chỉ mở hộp thoại khi người dùng yêu cầu, dùng mỗi sự kiện cài một lần',async()=>{
 const listeners={},registrations=[],media={matches:false,addEventListener(){}};
 const context={window:{isSecureContext:true,matchMedia:()=>media,addEventListener:(type,fn)=>listeners[type]=fn},location:{protocol:'https:',hostname:'ha-tang.example.vn'},navigator:{userAgent:'Chrome',serviceWorker:{register:async(...args)=>registrations.push(args)}},console};
 const source=readFileSync(new URL('./public/pwa.js',import.meta.url),'utf8').replace(/export (async )?function/g,'$1function');
 vm.runInNewContext(source+'\nthis.pwa={initializeInstallation,getInstallState,requestInstallation};',context);
 let notifications=0,prompts=0,prevented=0;const {pwa}=context;
 pwa.initializeInstallation(()=>notifications++);pwa.initializeInstallation(()=>notifications++);assert.equal(registrations.length,1);
 assert.equal(await pwa.requestInstallation(),'unavailable');
 listeners.beforeinstallprompt({preventDefault(){prevented++;},async prompt(){prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})});
 assert.equal(prevented,1);assert.equal(prompts,0);assert.equal(pwa.getInstallState().canPrompt,true);
 assert.equal(await pwa.requestInstallation(),'dismissed');assert.equal(prompts,1);assert.equal(await pwa.requestInstallation(),'unavailable');
 listeners.beforeinstallprompt({preventDefault(){},async prompt(){prompts++;},userChoice:Promise.resolve({outcome:'accepted'})});
 assert.equal(await pwa.requestInstallation(),'accepted');listeners.appinstalled();assert.equal(pwa.getInstallState().installed,true);assert.equal(pwa.getInstallState().canPrompt,false);assert.ok(notifications>=4);
});
test('PWA: ngoại tuyến hiển thị hướng dẫn, không cache API, hồ sơ hoặc ảnh hiện trường',async()=>{
 const handlers={},stored=new Map(),deleted=[];let networkDown=false;
 const context={self:{location:{origin:'https://ha-tang.example.vn'},addEventListener:(event,fn)=>handlers[event]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},URL,Response,
  caches:{open:async()=>({addAll:async paths=>paths.forEach(path=>stored.set(path,new Response(path==='/offline.html'?'Trang mất kết nối':'icon')))}),match:async key=>stored.get(typeof key==='string'?key:new URL(key.url).pathname)?.clone(),keys:async()=>['ha-tang-v3-20261022','other-cache'],delete:async key=>deleted.push(key)},
  fetch:async()=>{if(networkDown)throw Error('offline');return new Response('Dữ liệu từ máy chủ');}};
 vm.runInNewContext(readFileSync(new URL('./public/sw.js',import.meta.url),'utf8'),context);
 let install;handlers.install({waitUntil:promise=>install=promise});await install;assert.deepEqual([...stored.keys()],['/offline.html','/icon.svg']);
 let activation;handlers.activate({waitUntil:promise=>activation=promise});await activation;assert.deepEqual(deleted,['ha-tang-v3-20261022']);
 const dispatch=(path,method='GET',mode='navigate')=>{let result;handlers.fetch({request:{url:'https://ha-tang.example.vn'+path,method,mode},respondWith:promise=>result=promise});return result;};
 assert.equal(dispatch('/api/v2/records'),undefined);assert.equal(dispatch('/api/files/private.png','GET','cors'),undefined);assert.equal(dispatch('/api/login','POST'),undefined);
 assert.equal(await (await dispatch('/')).text(),'Dữ liệu từ máy chủ');networkDown=true;
 assert.equal(await (await dispatch('/')).text(),'Trang mất kết nối');assert.equal(stored.size,2);
 assert.equal(dispatch('/app.js','GET','cors'),undefined,'Không giữ bản mã cũ trong cache');
});
