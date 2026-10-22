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
test('Biểu mẫu: bổ sung khu vực/hạng mục, gõ thêm hư hỏng và đổi liên kết đầu tư vẫn giữ hồ sơ',async()=>{
 const group='Khu vực bổ sung trực tiếp từ biểu mẫu';
 await ok('v2/catalogs','POST',{type:'infrastructure',name:group});
 const createAsset=async suffix=>ok('v2/records','POST',{kind:'asset',code:'HT-FORM-'+suffix,name:'Hạng mục biểu mẫu '+suffix,assetType:'infrastructure',group,unit:'Phòng Kỹ thuật',location:'Vị trí bổ sung '+suffix,responsibleId:1,operation:'Đang sử dụng',technical:'Tốt'});
 const first=await createAsset('A'),second=await createAsset('B');
 let damage=await ok('v2/records','POST',{kind:'damage',code:'HH-FORM',name:'Hư hỏng được gõ bổ sung',assetId:first.id,responsibleId:1,description:'Mô tả ban đầu',component:'Kết cấu',detected:today(),due:offset(8),priority:'Trung bình',proposal:'Khảo sát'});
 damage=await update(damage,{description:'Mô tả ban đầu. Bổ sung hiện trạng mới.',component:'Kết cấu bê tông và mặt cầu',preliminaryCause:'Nguyên nhân nhập bổ sung',proposal:'Khảo sát; bổ sung phương án sửa chữa',notes:'Ghi chú nhập sau',assetId:second.id});
 const storedDamage=await ok('v2/records/'+damage.id);assert.equal(storedDamage.component,'Kết cấu bê tông và mặt cầu');assert.match(storedDamage.description,/Bổ sung hiện trạng mới/);assert.equal(storedDamage.assetId,second.id);assert.equal(storedDamage.notes,'Ghi chú nhập sau');
 let project=await ok('v2/records','POST',{kind:'investment',code:'DT-FORM',name:'Đầu tư đang nhập',group,unit:'Phòng Kỹ thuật',description:'Nội dung giữ nguyên sau khi thêm hạng mục',responsibleId:1,due:offset(20)});
 const originalDue=project.originalDue;
 project=await update(project,{assetId:first.id});assert.equal(project.assetId,first.id);
 project=await update(project,{assetId:second.id});assert.equal(project.assetId,second.id);assert.equal(project.description,'Nội dung giữ nguyên sau khi thêm hạng mục');assert.equal(project.originalDue,originalDue);
 project=await update(project,{assetId:''});assert.equal(project.assetId,'');assert.equal(project.group,group);
 assert.equal((await call('v2/records/'+project.id,'PUT',{...project,assetId:999999999})).status,404);
 assert.equal((await ok('v2/records/'+project.id)).version,project.version,'Liên kết sai không ghi đè hồ sơ');
});
test('V3.2: khai báo hạng mục rồi lập sửa chữa, đổi hạng mục và giữ nguyên nội dung',async()=>{
 const makeAsset=code=>ok('v2/records','POST',{kind:'asset',code,name:'Hạng mục sửa chữa '+code,assetType:'infrastructure',group:'Khu vực kho',unit:'Phòng Kỹ thuật',location:'Kho số 2',responsibleId:1,technical:'Cần theo dõi',operation:'Đang sử dụng'});
 const first=await makeAsset('HT-SC-32-A'),second=await makeAsset('HT-SC-32-B');
 let work=await ok('v2/records','POST',{kind:'work',code:'SC-32-LINK',name:'Sửa mái kho',assetId:first.id,description:'Thay tôn mái kho và xử lý dột',responsibleId:1,due:offset(10)});
 const originalDue=work.originalDue;
 work=await update(work,{assetId:second.id});assert.equal(work.assetId,second.id);assert.equal(work.description,'Thay tôn mái kho và xử lý dột');assert.equal(work.originalDue,originalDue);
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,assetId:''})).status,400,'Không lưu sửa chữa thiếu hạng mục');
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,assetId:999999})).status,404,'Không lưu liên kết hạng mục không tồn tại');
 assert.equal((await ok('v2/records/'+work.id)).version,work.version,'Lỗi liên kết giữ nguyên hồ sơ đang có');
});
test('V3.2: cập nhật tiến độ không bắt buộc khối lượng, lưu ảnh đúng nhật ký và kiểm tra dữ liệu',async()=>{
 const a=await ok('v2/records','POST',{kind:'asset',code:'HT-SC-32-LOG',name:'Cầu cảng nhật ký',assetType:'infrastructure',group:'Khu vực kho',unit:'Phòng Kỹ thuật',location:'Kho 3',responsibleId:1,technical:'Tốt',operation:'Đang sử dụng'});
 let work=await ok('v2/records','POST',{kind:'work',code:'SC-32-LOG',name:'Theo dõi tiến độ bằng ảnh',assetId:a.id,responsibleId:1,due:offset(4)});
 for(const status of ['Đã phê duyệt','Chờ bàn giao'])work=await transition(work,status);
 work=await update(work,{handover:offset(-2),start:offset(-1)});work=await transition(work,'Đang thực hiện');
 const entry={version:work.version,entryId:crypto.randomUUID(),entryType:'progress',workDate:today(),progress:45,note:'Đã xử lý bề mặt, chuẩn bị thi công lớp phủ',next:'Thi công lớp phủ',issues:'Chờ vật tư bổ sung'};
 work=await ok(`v2/records/${work.id}/daily`,'POST',entry);
 assert.equal(work.progress,45);assert.equal(work.dailyLogs.length,1);assert.equal(work.dailyLogs[0].entryType,'progress');assert.equal(work.dailyLogs[0].quantity,undefined);assert.equal(work.dailyLogs[0].unit,undefined);assert.equal(work.dailyLogs[0].issues,entry.issues);
 assert.equal((await ok(`v2/records/${work.id}/daily`,'POST',entry)).dailyLogs.length,1,'Gửi lại không nhân đôi tiến độ');
 for(const invalid of [{progress:-1},{progress:101},{progress:''},{progress:null},{note:''},{workDate:offset(1)},{workDate:offset(-3)},{entryType:'khac'},{entryType:'quantity'}])assert.equal((await call(`v2/records/${work.id}/daily`,'POST',{...entry,entryId:crypto.randomUUID(),version:work.version,...invalid})).status,400,JSON.stringify(invalid));
 assert.equal((await ok('v2/records/'+work.id)).dailyLogs.length,1,'Nhật ký không hợp lệ không thay đổi hồ sơ');
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
 const file=await ok('files','POST',{recordId:work.id,logId:entry.entryId,name:'anh-tien-do-45.png',mime:'image/png',base64:png});
 const files=await ok('file-list?record='+work.id);assert.equal(files.length,1);assert.equal(files[0].log_id,entry.entryId);
 const image=await fetch(origin+'/api/files/'+file.id+'?inline=1',{headers:{Cookie:cookie}});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.ok((await image.arrayBuffer()).byteLength>0);
 assert.equal((await fetch(origin+'/api/files/'+file.id)).status,401,'Ảnh tiến độ cần đăng nhập');
 work=await ok(`v2/records/${work.id}/daily`,'POST',{...entry,entryId:crypto.randomUUID(),version:work.version,progress:100,note:'Hoàn thành thi công, chờ kiểm tra và nghiệm thu'});
 assert.equal(work.status,'Đang thực hiện','Tiến độ 100% không tự nghiệm thu');assert.equal(work.dailyLogs.length,2);
});
test('V3: khôi phục mật khẩu bằng mã một lần, thu hồi phiên cũ và giữ công trình',async()=>{
 const count=(await ok('v2/records')).length;
 assert.equal((await call('recovery','POST',{username:'admin',password:'new-password-test-123',recoveryToken:'sai-ma'})).status,403);
 await ok('recovery','POST',{username:'admin',password:'new-password-test-123',recoveryToken});
 assert.equal((await call('me')).status,401);
 assert.equal((await call('recovery','POST',{username:'admin',password:'other-password-123',recoveryToken})).status,403);
 cookie=(await call('login','POST',{username:'admin',password:'new-password-test-123'})).cookie;assert.ok(cookie);assert.equal((await ok('v2/records')).length,count);
});
