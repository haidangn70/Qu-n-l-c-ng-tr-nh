import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {today} from './domain.mjs';
const dir=mkdtempSync(join(tmpdir(),'infrastructure-v3-')),origin='http://127.0.0.1:3112';
const recoveryToken='test-recovery-key-for-v3-only-000000',password='test-infrastructure-password-123';
let child,cookie,asset,repair,investment;
const offset=n=>new Date(Date.parse(today()+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
async function call(path,method='GET',data,session=cookie){const response=await fetch(origin+'/api/'+path,{method,headers:{'Content-Type':'application/json',Cookie:session||'','Idempotency-Key':'test-v3-'+crypto.randomUUID()},body:data?JSON.stringify(data):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
async function ok(path,method='GET',data){const out=await call(path,method,data);assert.ok(out.status<300,JSON.stringify(out));return out.data;}
async function update(r,changes){return ok('v2/records/'+r.id,'PUT',{...r,...changes});}
async function transition(r,status){return ok(`v2/records/${r.id}/transition`,'POST',{version:r.version,status});}
before(async()=>{child=spawn(process.execPath,['server.mjs'],{cwd:import.meta.dirname,env:{...process.env,HOST:'127.0.0.1',PORT:'3112',DATA_DIR:dir,NODE_ENV:'test',ALERT_INTERVAL_MS:'100',RECOVERY_TOKEN:recoveryToken,ADMIN_PASSWORD:password,ADMIN_USERNAME:'admin',COOKIE_SECURE:'0'},stdio:'pipe'});await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',b=>{output+=b;if(output.includes('Ứng dụng:'))resolve();});child.once('error',reject);child.once('exit',code=>reject(Error('Máy chủ dừng: '+code)));setTimeout(()=>reject(Error('Hết thời gian khởi động')),10000).unref();});cookie=(await call('login','POST',{username:'admin',password})).cookie;assert.ok(cookie);});
after(async()=>{if(child&&child.exitCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;}rmSync(dir,{recursive:true,force:true});});

test('V3: mặc định khu vực, cảnh báo 4 ngày và tạo quản trị từ môi trường',async()=>{
 assert.equal((await ok('setup')).needed,false);
 const catalogs=(await ok('v2/catalogs')).catalogs.filter(c=>c.type==='infrastructure'&&c.active);
 assert.equal(catalogs.length,9);assert.ok(catalogs.some(c=>c.name==='Khu vực bãi roro'));assert.ok(catalogs.some(c=>c.name.includes('luồng hàng hải')));
 assert.deepEqual((await ok('v2/settings')).thresholds,[4,1,0]);
 asset=await ok('v2/records','POST',{kind:'asset',code:'HT-TEST-V3',name:'Cầu cảng kiểm thử',assetType:'infrastructure',group:'Khu vực Cầu cảng',unit:'Phòng Kỹ thuật',location:'Cầu 1',responsibleId:1,operation:'Đang sử dụng',technical:'Tốt'});
 repair=await ok('v2/records','POST',{kind:'work',code:'SC-TEST-V3',name:'Sửa kết cấu cầu cảng',assetId:asset.id,responsibleId:1,plannedStart:offset(-2),due:offset(4)});
 assert.deepEqual(repair.damageIds,[]);assert.equal(repair.originalDue,offset(4));assert.equal(repair.progress,0);
 let list=await ok('v2/alerts');assert.equal(list.filter(a=>a.record_id===repair.id&&a.category==='deadline-4').length,1);
 await new Promise(resolve=>setTimeout(resolve,250));list=await ok('v2/alerts');assert.equal(list.filter(a=>a.record_id===repair.id&&a.category==='deadline-4').length,1);
 const notYet=await ok('v2/records','POST',{kind:'investment',code:'DT-5DAY',name:'Đầu tư chưa đến mốc nhắc',group:'Khu vực kho',unit:'Phòng Kỹ thuật',responsibleId:1,due:offset(5)});assert.equal((await ok('v2/alerts')).filter(a=>a.record_id===notYet.id).length,0);
});
test('V3: sửa chữa độc lập, nhật ký khối lượng theo ngày và ảnh gắn đúng nhật ký',async()=>{
 repair=await transition(repair,'Đã phê duyệt');repair=await transition(repair,'Chờ bàn giao');
 assert.equal((await call(`v2/records/${repair.id}/transition`,'POST',{version:repair.version,status:'Đang thực hiện'})).status,400);
 repair=await update(repair,{handover:offset(-2),start:offset(-1)});repair=await transition(repair,'Đang thực hiện');
 const entry={version:repair.version,entryId:crypto.randomUUID(),workDate:today(),item:'Đổ bê tông mặt cầu',quantity:12.5,unit:'m³',note:'Đã hoàn thành phân đoạn 1',progress:35};
 repair=await ok(`v2/records/${repair.id}/daily`,'POST',entry);assert.equal(repair.progress,35);assert.equal(repair.dailyLogs.length,1);
 assert.equal((await ok(`v2/records/${repair.id}/daily`,'POST',entry)).dailyLogs.length,1,'Gửi lại sau mất mạng không trùng nhật ký');
 assert.equal((await call(`v2/records/${repair.id}/daily`,'POST',{...entry,entryId:crypto.randomUUID(),version:repair.version,workDate:offset(1)})).status,400);
 assert.equal((await call(`v2/records/${repair.id}/daily`,'POST',{...entry,entryId:crypto.randomUUID(),version:repair.version,quantity:-1})).status,400);
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
 const f=await ok('files','POST',{recordId:repair.id,logId:entry.entryId,name:'hien-truong.png',mime:'image/png',base64:png});
 const files=await ok('file-list?record='+repair.id);assert.equal(files[0].log_id,entry.entryId);assert.equal(files[0].id,f.id);
 const image=await fetch(origin+'/api/files/'+f.id+'?inline=1',{headers:{Cookie:cookie}});assert.equal(image.status,200);assert.match(image.headers.get('content-disposition'),/^inline/);
 assert.equal((await call('files','POST',{recordId:repair.id,logId:'nhat-ky-sai',name:'sai.png',mime:'image/png',base64:png})).status,400);
 repair=await update(repair,{dailyLogs:[],progress:40});assert.equal(repair.dailyLogs.length,1,'Không được xóa lịch sử qua cập nhật hồ sơ');
 assert.equal((await call(`v2/records/${repair.id}/transition`,'POST',{version:repair.version,status:'Hoàn thành sửa chữa'})).status,400);
});
test('V3: đầu tư mới theo đầy đủ các bước, phân công, nghiệm thu và gia hạn',async()=>{
 await ok('users','POST',{name:'Phối hợp',username:'phoihop',password,role:'collaborator'});
 investment=await ok('v2/records','POST',{kind:'investment',code:'DT-TEST-V3',name:'Xây mới kho cảng',group:'Khu vực kho',unit:'Phòng Kỹ thuật',responsibleId:1,assignees:[2],plannedStart:offset(-4),due:offset(4)});
 assert.deepEqual(investment.assignees,[2]);assert.equal(investment.status,'Đề xuất đầu tư');
 const participant=(await call('login','POST',{username:'phoihop',password})).cookie;assert.equal((await call('v2/records/'+investment.id,'GET',null,participant)).status,200);assert.equal((await call('v2/records/'+investment.id,'PUT',{...investment,name:'Sửa trái quyền'},participant)).status,403);
 for(const state of ['Khảo sát hiện trạng','Lập và duyệt dự án','Lựa chọn nhà thầu','Chờ bàn giao'])investment=await transition(investment,state);
 investment=await update(investment,{handover:offset(-3),start:offset(-2)});investment=await transition(investment,'Đang thực hiện');
 const original=investment.due;investment=await ok(`v2/records/${investment.id}/extend`,'POST',{version:investment.version,due:offset(6),proposer:'Kỹ thuật',reason:'Bổ sung phạm vi kho'});assert.equal(investment.originalDue,original);assert.equal(investment.extensions.length,1);
 investment=await ok(`v2/records/${investment.id}/daily`,'POST',{version:investment.version,entryId:crypto.randomUUID(),workDate:today(),item:'Lắp dựng',quantity:100,unit:'m²',note:'Hoàn thành kết cấu',progress:100});assert.equal(investment.status,'Đang thực hiện');
 investment=await update(investment,{completed:today(),accepted:today(),acceptanceNote:'Đạt yêu cầu nghiệm thu',cost:120000000});
 for(const state of ['Hoàn thành xây dựng','Chờ nghiệm thu','Đã nghiệm thu','Đã đóng'])investment=await transition(investment,state);
 assert.equal(investment.progress,100);assert.equal((await call('v2/records/'+investment.id,'PUT',{...investment,progress:20})).status,400);
});
test('V3: tùy chỉnh khu vực cập nhật hồ sơ, ẩn danh mục không xóa dữ liệu',async()=>{
 let c=(await ok('v2/catalogs')).catalogs.find(c=>c.name==='Khu vực Cầu cảng');
 await ok('v2/catalogs','PUT',{id:c.id,name:'Khu vực Cầu cảng mở rộng',active:true});asset=await ok('v2/records/'+asset.id);assert.equal(asset.group,'Khu vực Cầu cảng mở rộng');
 await ok('v2/catalogs','PUT',{id:c.id,name:'Khu vực Cầu cảng mở rộng',active:false});assert.equal((await ok('v2/records/'+asset.id)).name,'Cầu cảng kiểm thử');
 await ok('v2/catalogs','POST',{type:'infrastructure',name:'Khu vực người dùng bổ sung'});assert.ok((await ok('v2/catalogs')).catalogs.some(c=>c.name==='Khu vực người dùng bổ sung'));
});
test('V3: khôi phục mật khẩu bằng mã một lần, thu hồi phiên cũ và giữ công trình',async()=>{
 const count=(await ok('v2/records')).length;
 assert.equal((await call('recovery','POST',{username:'admin',password:'new-password-test-123',recoveryToken:'sai-ma'})).status,403);
 await ok('recovery','POST',{username:'admin',password:'new-password-test-123',recoveryToken});
 assert.equal((await call('me')).status,401);
 assert.equal((await call('recovery','POST',{username:'admin',password:'other-password-123',recoveryToken})).status,403);
 cookie=(await call('login','POST',{username:'admin',password:'new-password-test-123'})).cookie;assert.ok(cookie);assert.equal((await ok('v2/records')).length,count);
});
