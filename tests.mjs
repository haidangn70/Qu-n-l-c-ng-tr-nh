import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readdirSync,cpSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {timing,progress} from './domain.mjs';
test('Quy tắc thời gian: chưa khởi công, thiếu hạn, quá hạn, hoàn thành, gia hạn',()=>{
assert.equal(timing({handoverActual:'2026-01-01'},'2026-01-10').elapsed,null);
assert.equal(timing({},'2026-01-10').label,'Chưa có thời hạn');
assert.equal(timing({start:'2026-01-01',deadline:'2026-01-09',status:'Tạm dừng'},'2026-01-10').label,'Quá hạn 1 ngày');
assert.equal(timing({start:'2026-01-01',deadline:'2026-01-09',completed:'2026-01-11'},'2026-02-10').elapsed,10);
assert.equal(timing({deadline:'2026-01-09',completed:'2026-01-11'},'2026-02-10').label,'Hoàn thành chậm 2 ngày');
assert.equal(timing({deadline:'2026-01-20'},'2026-01-10').remaining,10);
assert.equal(timing({deadline:'2026-01-10'},'2026-01-10').label,'Sắp đến hạn · 0 ngày');
assert.equal(timing({deadline:'2026-01-09',status:'Đã hủy'},'2026-01-10').kind,'neutral');
});

test('Tiến độ dùng trọng số với nhiều đơn vị tính',()=>{assert.equal(progress([{unit:'m',done:5,approved:10,weight:2},{unit:'bộ',done:1,approved:1,weight:1}]),67);assert.equal(progress([]),null)});
const data=mkdtempSync(join(tmpdir(),'hatang-test-'));let child,adminCookie,viewerCookie,managerCookie,project;
async function req(path,method='GET',body,cookie=adminCookie){const r=await fetch('http://127.0.0.1:3107/api/'+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
before(async()=>{child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3107',DATA_DIR:data,NODE_ENV:'test',ALERT_INTERVAL_MS:'100'},stdio:'pipe'});await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);setTimeout(()=>reject(new Error('Server timeout')),10000).unref()});});
after(async()=>{child?.kill();await new Promise(r=>setTimeout(r,500));rmSync(data,{recursive:true,force:true})});
test('Luồng thật: đăng nhập, quyền, lưu, xung đột, gia hạn, duyệt và chuyển một lần',async()=>{
assert.equal((await req('records')).status,401);
assert.equal((await req('setup','POST',{name:'Quản trị',username:'admin',password:'test-password-123'})).status,201);
adminCookie=(await req('login','POST',{username:'admin',password:'test-password-123'})).cookie;
await req('users','POST',{name:'Xem',username:'viewer',password:'test-password-123',role:'viewer'});
await req('users','POST',{name:'Giám sát',username:'manager',password:'test-password-123',role:'manager'});
viewerCookie=(await req('login','POST',{username:'viewer',password:'test-password-123'})).cookie;
managerCookie=(await req('login','POST',{username:'manager',password:'test-password-123'})).cookie;
let out=await req('records','POST',{kind:'project',name:'Công trình thử nghiệm',status:'Chưa khởi công',deadline:'2026-01-09',items:[{name:'Ống',unit:'m',approved:10,done:0,weight:1}]});assert.equal(out.status,201);project=out.data;
assert.equal((await req('records','POST',{kind:'project',name:'X'},viewerCookie)).status,403);
assert.equal((await req('records/'+project.id,'GET',null,managerCookie)).status,404);
project=(await req('records/'+project.id,'PUT',{...project,assignees:[2,3]})).data;
assert.equal((await req('records/'+project.id,'GET',null,viewerCookie)).status,200);
assert.equal((await req('records/'+project.id,'PUT',project,viewerCookie)).status,403);
const stale={...project};project=(await req('records/'+project.id,'PUT',{...project,notes:'Đã lưu'})).data;
assert.equal((await req('records/'+project.id,'PUT',stale)).status,409);
assert.equal((await req('records/'+project.id+'/deadline','POST',{version:project.version,deadline:'2026-02-01',reason:'Mưa'},managerCookie)).status,403);
project=(await req('records/'+project.id+'/deadline','POST',{version:project.version,deadline:'2026-02-01',reason:'Điều chỉnh đã duyệt'})).data;
assert.equal(project.initialDeadline,'2026-01-09');assert.equal(project.history[0].old,'2026-01-09');
assert.equal((await req('records/'+project.id,'PUT',{...project,items:[{name:'Sai',unit:'m',approved:0,done:2,weight:1}]})).status,400);
let proposal=(await req('records','POST',{kind:'proposal',name:'Đề xuất thử',items:[]})).data;
for(const status of ['Gửi đề xuất','Khảo sát/thẩm định','Chờ phê duyệt','Đã phê duyệt']){out=await req(`records/${proposal.id}/transition`,'POST',{version:proposal.version,status});assert.equal(out.status,200);proposal=out.data}
out=await req(`records/${proposal.id}/convert`,'POST',{version:proposal.version});assert.equal(out.status,201);assert.equal(out.data.source,proposal.id);assert.notEqual(out.data.id,proposal.id);assert.equal((await req('records/'+out.data.id)).data.kind,'project');
assert.equal((await req(`records/${proposal.id}/convert`,'POST',{version:proposal.version})).status,409);
assert.equal((await req('records')).data.filter(r=>r.source===proposal.id).length,1);
assert.equal((await req('files','POST',{recordId:project.id,name:'bad.pdf',mime:'application/pdf',base64:Buffer.from('wrong').toString('base64')})).status,400);
out=await req('files','POST',{recordId:project.id,name:'test.pdf',mime:'application/pdf',base64:Buffer.from('%PDF-1.4 test').toString('base64')});assert.equal(out.status,201);
const file=await fetch(`http://127.0.0.1:3107/api/files/${out.data.id}`,{headers:{Cookie:adminCookie}});assert.equal(await file.text(),'%PDF-1.4 test');
assert.ok((await req('audit')).data.length>5);
});

test('Tài sản → nhiều phiếu/hư hỏng → phê duyệt → sửa chữa → nghiệm thu; chống vượt quyền',async()=>{
 const call=async(path,method='GET',data,cookie=adminCookie,key='integration-request-'+Math.random())=>{const response=await fetch('http://127.0.0.1:3107/api/v2/'+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie||'','Idempotency-Key':key},body:data?JSON.stringify(data):undefined});return {status:response.status,data:await response.json()}};
 const create=async data=>{const out=await call('records','POST',data);assert.equal(out.status,201,JSON.stringify(out.data));return out.data};
 const update=async(r,changes={})=>{const out=await call('records/'+r.id,'PUT',{...r,...changes});assert.equal(out.status,200,JSON.stringify(out.data));return out.data};
 const transition=async(r,status)=>{const out=await call(`records/${r.id}/transition`,'POST',{version:r.version,status});assert.equal(out.status,200,JSON.stringify(out.data));return out.data};
 const catalogs=(await call('catalogs')).data.catalogs;assert.equal(catalogs.filter(c=>c.type==='infrastructure').length,9);assert.equal(catalogs.filter(c=>c.type==='equipment').length,6);
 let asset=await create({kind:'asset',code:'TB-001',name:'Cần trục thử',assetType:'equipment',group:'Cần trục giàn QC',unit:'Đơn vị A',location:'Cầu 1',responsibleId:1,operation:'Đang sử dụng',technical:'Tốt'});
 const duplicate=await call('records','POST',{...asset,code:'TB-001'});assert.equal(duplicate.status,400);
 const idem='same-submit-request-key-123';const a=await call('records','POST',{kind:'inspection',code:'KT-001',name:'Kiểm tra lần 1',assetId:asset.id,inspectionDate:'2026-10-21',inspector:'Kỹ thuật',conclusion:'Phát hiện hai hư hỏng'},adminCookie,idem);assert.equal(a.status,201);assert.equal((await call('records','POST',{},adminCookie,idem)).status,400);
 const retry=await call('records','POST',{kind:'inspection'},adminCookie,idem);assert.equal(retry.data.id,a.data.id);
 const inspection2=await create({kind:'inspection',code:'KT-002',name:'Kiểm tra lần 2',assetId:asset.id,inspectionDate:'2026-10-22',inspector:'Kỹ thuật',conclusion:'Đánh giá lại'});assert.notEqual(a.data.id,inspection2.id);
 let damages=[];for(let i=0;i<2;i++){let d=await create({kind:'damage',code:'HH-'+i,name:'Hư hỏng '+i,assetId:asset.id,inspectionId:a.data.id,description:'Nứt kết cấu',detected:'2026-10-21',due:'2026-11-10',priority:'Cao',responsibleId:1});for(const status of ['Đánh giá','Đề xuất','Phê duyệt'])d=await transition(d,status);damages.push(d)}
 let work=await create({kind:'work',code:'CV-001',name:'Sửa chữa thử nghiệm',damageIds:damages.map(d=>d.id),responsibleId:1,due:'2026-11-01',progress:0});
 assert.equal((await req('records/'+work.id,'PUT',{...work,status:'Đã nghiệm thu'})).status,405);
 assert.equal((await call(`records/${work.id}/transition`,'POST',{version:work.version,status:'Đã nghiệm thu'})).status,400);
 work=await transition(work,'Đã phê duyệt');work=await transition(work,'Chờ bàn giao');
 assert.equal((await call(`records/${work.id}/transition`,'POST',{version:work.version,status:'Đang thực hiện'})).status,400);
 work=await update(work,{handover:'2026-10-21',start:'2026-10-21'});work=await transition(work,'Đang thực hiện');
 assert.equal((await call('records/'+work.id,'PUT',{...work,steps:[{name:'Sai trọng số',weight:80,progress:20}]})).status,400);
 assert.equal((await call('records/'+work.id,'PUT',{...work,steps:[{name:'Sai khối lượng',weight:100,progress:20,quantity:10,done:11}]})).status,400);
 work=await update(work,{steps:[{name:'Hạng mục 1',weight:100,progress:25,quantity:10,done:2.5,unit:'m',responsibleId:1,plannedStart:'2026-10-21',plannedEnd:'2026-10-30'}]});assert.equal(work.progress,25);
 work=await update(work,{steps:[],progress:25});
 assert.equal((await call('records/'+work.id,'PUT',{...work,progress:101})).status,400);
 const old=work;work=await update(work,{progress:100,completed:'2026-10-25',log:'Hoàn thành lắp đặt'});assert.equal(work.status,'Đang thực hiện');assert.equal(work.logs.length,1);assert.equal((await call('records/'+work.id,'PUT',old)).status,409);
 let out=await call(`records/${work.id}/extend`,'POST',{version:work.version,due:'2026-11-05',reason:'Bổ sung phạm vi',proposer:'Người phụ trách'});assert.equal(out.status,200);work=out.data;assert.equal(work.originalDue,'2026-11-01');assert.equal(work.extensions[0].old,'2026-11-01');
 work=await transition(work,'Hoàn thành sửa chữa');work=await transition(work,'Chờ nghiệm thu');
 assert.equal((await call(`records/${work.id}/transition`,'POST',{version:work.version,status:'Đã nghiệm thu'})).status,400);
 work=await update(work,{accepted:'2026-10-26',acceptanceNote:'Đạt yêu cầu',results:Object.fromEntries(damages.map(d=>[d.id,'Đã khắc phục, đạt yêu cầu']))});work=await transition(work,'Đã nghiệm thu');work=await transition(work,'Đã đóng');
 for(let d of damages){for(const status of ['Lập công việc','Thực hiện','Nghiệm thu','Đóng hư hỏng'])d=await transition(d,status)}
 assert.equal((await call(`records/${work.id}/transition`,'POST',{version:work.version})).status,400);
 const closedDamage=(await call('records/'+damages[0].id)).data;assert.equal((await call(`records/${closedDamage.id}/transition`,'POST',{version:closedDamage.version,status:'Mới ghi nhận'})).status,400);
 const archivedWork=await call(`records/${work.id}/archive`,'POST',{version:work.version,archived:true,reason:'Lưu hồ sơ sau khi đóng hư hỏng'});assert.equal(archivedWork.status,200,JSON.stringify(archivedWork.data));
 assert.equal((await call('records/'+asset.id,'GET',null,managerCookie)).status,404);
 assert.equal((await call('records','POST',{kind:'asset'},viewerCookie)).status,403);
 assert.equal((await call('records','GET',null,managerCookie)).data.length,0);
 const original=asset;asset=await update(asset,{technical:'Cần theo dõi'});assert.equal(asset.history[0].previous,'Tốt');assert.equal((await call('records/'+asset.id,'PUT',original)).status,409);
 out=await call(`records/${asset.id}/downtime`,'POST',{version:asset.version,stop:true,reason:'Sửa chữa'});assert.equal(out.status,200);asset=out.data;
 assert.equal((await call(`records/${asset.id}/downtime`,'POST',{version:asset.version,stop:true,reason:'Trùng'})).status,400);
 asset=(await call(`records/${asset.id}/downtime`,'POST',{version:asset.version,stop:false})).data;assert.equal(asset.downtime.length,1);assert.ok(asset.downtime[0].to);
 let plan=await create({kind:'maintenance',code:'BD-001',name:'Bảo dưỡng định kỳ',assetId:asset.id,due:'2026-11-10',cycle:30,cycleUnit:'Ngày',responsibleId:1});
 out=await call(`records/${plan.id}/generate`,'POST',{version:plan.version});assert.equal(out.status,201,JSON.stringify(out.data));assert.equal(out.data.status,'Chờ phê duyệt');plan=(await call('records/'+plan.id)).data;assert.equal((await call(`records/${plan.id}/generate`,'POST',{version:plan.version})).status,400);
 out=await req('files','POST',{recordId:asset.id,name:'protected.pdf',mime:'application/pdf',base64:Buffer.from('%PDF-1.4 protected').toString('base64')});assert.equal(out.status,201);assert.equal((await req('files/'+out.data.id,'GET',null,managerCookie)).status,403);
 out=await call(`records/${asset.id}/archive`,'POST',{version:asset.version,archived:true,reason:'Lưu trữ thử'});assert.equal(out.status,200);asset=out.data;assert.equal(asset.archived,true);assert.equal((await call('records/'+asset.id,'PUT',asset)).status,409);
 out=await call(`records/${asset.id}/archive`,'POST',{version:asset.version,archived:false,reason:'Khôi phục thử'});assert.equal(out.status,200);assert.equal(out.data.archived,false);
 const {DatabaseSync}=await import('node:sqlite');const disk=new DatabaseSync(join(data,'app.sqlite'));assert.ok(disk.prepare('SELECT count(*) AS n FROM records').get().n>10);assert.ok(disk.prepare('SELECT count(*) AS n FROM migrations').get().n);disk.close();
});

test('XLSX thực: xuất, đọc, xem trước lỗi từng dòng và nhập giao dịch',async()=>{
 const {xlsxDownload}=await import('./public/operations.js');const {readXlsx}=await import('./xlsx.mjs');let blob;
 const originalDocument=globalThis.document,originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
 const make=async rows=>{try{globalThis.document={createElement:()=>({click(){}})};URL.createObjectURL=b=>{blob=b;return 'blob:test'};URL.revokeObjectURL=()=>{};xlsxDownload(rows);return Buffer.from(await blob.arrayBuffer())}finally{globalThis.document=originalDocument;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke}};
 const header=['Mã','Tên','Loại','Nhóm','Đơn vị','Khu vực','Vị trí','Vận hành','Kỹ thuật','Người phụ trách (ID)'];const row=['HT-NHAP-001','Tài sản có dấu tiếng Việt','infrastructure','Khu vực Cầu cảng','Đơn vị A','Khu 1','Cầu 1','Đang sử dụng','Tốt',1];let bytes=await make([header,row]);assert.deepEqual(readXlsx(bytes)[1].slice(0,3),row.slice(0,3));
 let out=await req('v2/import','POST',{base64:bytes.toString('base64')});assert.equal(out.status,200);assert.equal(out.data.preview[0].error,'');assert.equal(out.data.preview[0].row,2);
 assert.equal((await req('v2/import','POST',{base64:bytes.toString('base64'),commit:true})).data.imported,1);
 out=await req('v2/import','POST',{base64:bytes.toString('base64')});assert.match(out.data.preview[0].error,/tồn tại/);
 assert.equal((await req('v2/import','POST',{base64:bytes.toString('base64'),commit:true})).status,400);
 bytes=await make([header,['HT-SAI','Thiếu dữ liệu']]);out=await req('v2/import','POST',{base64:bytes.toString('base64')});assert.ok(out.data.preview[0].error);
 assert.throws(()=>readXlsx(Buffer.from('không phải xlsx')));
});

test('Lịch cảnh báo chạy khi không có trình duyệt, chống trùng; bền vững sau khởi động lại; khóa và phạm vi đơn vị',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const disk=new DatabaseSync(join(data,'app.sqlite'));const asset=disk.prepare("SELECT * FROM records WHERE kind='asset' LIMIT 1").get();const value=JSON.parse(asset.data);value.nextInspection='2000-01-01';disk.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify(value),asset.id);
 await new Promise(resolve=>setTimeout(resolve,350));const first=disk.prepare("SELECT count(*) AS n FROM alerts WHERE record_id=? AND category='check-overdue'").get(asset.id).n;assert.equal(first,1);
 await new Promise(resolve=>setTimeout(resolve,250));assert.equal(disk.prepare("SELECT count(*) AS n FROM alerts WHERE record_id=? AND category='check-overdue'").get(asset.id).n,1);disk.close();
 assert.equal((await req('v2/settings','PUT',{thresholds:[7,3,1],staleDays:7})).status,200);
 assert.equal((await req('v2/settings','PUT',{thresholds:[-1],staleDays:0})).status,400);
 let users=(await req('users')).data;let manager=users.find(u=>u.username==='manager');
 assert.equal((await req('v2/users','PUT',{id:manager.id,unit:'Đơn vị A',active:true})).status,200);
 assert.equal((await req('me','GET',null,managerCookie)).status,401);
 managerCookie=(await req('login','POST',{username:'manager',password:'test-password-123'})).cookie;
 assert.equal((await req('v2/records/'+asset.id,'GET',null,managerCookie)).status,200);
 assert.equal((await req('v2/users','PUT',{id:manager.id,active:false})).status,200);assert.equal((await req('me','GET',null,managerCookie)).status,401);
 assert.equal((await req('v2/users','PUT',{id:1,active:false})).status,400);
 const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;
 child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3107',DATA_DIR:data,NODE_ENV:'test',ALERT_INTERVAL_MS:'100'},stdio:'pipe'});await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});
 assert.equal((await req('v2/records/'+asset.id)).data.nextInspection,'2000-01-01');assert.ok((await req('v2/alerts')).data.some(a=>a.record_id===asset.id));
});

test('Sao lưu và phục hồi DB cùng tệp vào thư mục sạch',async()=>{
 const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;
 const result=spawnSync(process.execPath,[join(import.meta.dirname,'backup.mjs')],{env:{...process.env,DATA_DIR:data},cwd:data,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const backup=join(data,'backups',readdirSync(join(data,'backups'))[0]),restored=join(data,'restored');mkdirSync(restored);cpSync(join(backup,'app.sqlite'),join(restored,'app.sqlite'));cpSync(join(backup,'files'),join(restored,'files'),{recursive:true});
 const {DatabaseSync}=await import('node:sqlite');const disk=new DatabaseSync(join(restored,'app.sqlite'));assert.equal(disk.prepare('PRAGMA integrity_check').get().integrity_check,'ok');const file=disk.prepare('SELECT * FROM files LIMIT 1').get();const count=disk.prepare('SELECT count(*) AS n FROM records').get().n;assert.ok(count>10);disk.close();
 child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3107',DATA_DIR:restored,NODE_ENV:'test',ALERT_INTERVAL_MS:'100'},stdio:'pipe'});await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});
 const records=await req('records');assert.equal(records.status,200);assert.equal(records.data.length,count);
 const response=await fetch('http://127.0.0.1:3107/api/files/'+file.id,{headers:{Cookie:adminCookie}});assert.equal(response.status,200);assert.equal((await response.arrayBuffer()).byteLength,file.size);assert.ok((await req('audit')).data.length);
});

test('Render: thiếu tệp giao diện trả 500, HEAD không làm máy chủ dừng, build phát hiện thiếu tệp',async()=>{
 const fixture=mkdtempSync(join(tmpdir(),'hatang-render-'));let processUnderTest;
 try{
  for(const file of ['server.mjs','operations.mjs','domain.mjs','xlsx.mjs','verify-build.mjs','bundle-public.mjs'])cpSync(join(import.meta.dirname,file),join(fixture,file));
  const build=spawnSync(process.execPath,['verify-build.mjs'],{cwd:fixture,encoding:'utf8'});assert.equal(build.status,1);assert.match(build.stderr,/Thiếu tệp triển khai bắt buộc/);
  processUnderTest=spawn(process.execPath,[join(fixture,'server.mjs')],{env:{...process.env,HOST:'',PORT:'3110',RENDER:'true',DATA_DIR:join(fixture,'data')},stdio:'pipe'});
  const startup=await new Promise((resolve,reject)=>{processUnderTest.stdout.once('data',b=>resolve(b.toString()));processUnderTest.once('error',reject);setTimeout(()=>reject(Error('Không khởi động được máy chủ thử Render')),10000).unref()});assert.match(startup,/0\.0\.0\.0:3110/);
  for(const method of ['GET','HEAD','GET']){const response=await fetch('http://127.0.0.1:3110/',{method});assert.equal(response.status,500);if(method==='HEAD')assert.equal(await response.text(),'');else assert.match((await response.json()).error,/Lỗi máy chủ/);}
  assert.equal((await fetch('http://127.0.0.1:3110/no-such-route')).status,404);
  assert.equal((await fetch('http://127.0.0.1:3110/healthz',{method:'HEAD'})).status,200);
  assert.equal((await fetch('http://127.0.0.1:3110/healthz')).status,200);
 }finally{if(processUnderTest&&processUnderTest.exitCode===null){const done=new Promise(resolve=>processUnderTest.once('exit',resolve));processUnderTest.kill();await done}rmSync(fixture,{recursive:true,force:true})}
});

test('Build khi chỉ có tệp gốc: phục hồi giao diện, phục vụ HTTP và chặn gói bị thay đổi',async()=>{
 const fixture=mkdtempSync(join(tmpdir(),'hatang-bundle-'));let app;
 try{
  for(const file of ['package.json','server.mjs','operations.mjs','domain.mjs','xlsx.mjs','verify-build.mjs','bundle-public.mjs','public-bundle.json'])cpSync(join(import.meta.dirname,file),join(fixture,file));
  const build=spawnSync(process.execPath,['verify-build.mjs'],{cwd:fixture,encoding:'utf8'});assert.equal(build.status,0,build.stderr);assert.match(build.stdout,/phục hồi 7 tệp/);
  app=spawn(process.execPath,[join(fixture,'server.mjs')],{env:{...process.env,HOST:'127.0.0.1',PORT:'3111',DATA_DIR:join(fixture,'data')},stdio:'pipe'});await new Promise((resolve,reject)=>{app.stdout.once('data',resolve);app.once('error',reject);setTimeout(()=>reject(Error('Hết thời gian khởi động')),10000).unref()});
  const home=await fetch('http://127.0.0.1:3111/');assert.equal(home.status,200);assert.match(await home.text(),/Phần mềm theo dõi/);
  for(const path of ['/app.js','/operations.js','/style.css','/icon.svg','/manifest.webmanifest','/sw.js'])assert.equal((await fetch('http://127.0.0.1:3111'+path)).status,200,path);
  const {restorePublic}=await import('./bundle-public.mjs'),{readFileSync,writeFileSync,existsSync}=await import('node:fs');
  const corrupt=join(fixture,'corrupt');mkdirSync(corrupt);const bundle=JSON.parse(readFileSync(join(fixture,'public-bundle.json'),'utf8'));bundle.assets['icon.svg'].base64=Buffer.from('đã thay đổi').toString('base64');writeFileSync(join(corrupt,'public-bundle.json'),JSON.stringify(bundle));assert.throws(()=>restorePublic(corrupt),/SHA-256/);assert.equal(existsSync(join(corrupt,'public')),false);
 }finally{if(app&&app.exitCode===null){const done=new Promise(resolve=>app.once('exit',resolve));app.kill();await done}rmSync(fixture,{recursive:true,force:true})}
});

