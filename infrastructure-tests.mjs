import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {areaWatch,areaWatchSummary,recordAreas,UNASSIGNED_AREA} from './public/operations.js';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
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

test('Hư hỏng: nhập vị trí trực tiếp, tên phân công tùy chọn và ảnh không cần hạng mục',async()=>{
 const input={kind:'damage',code:'HH-VI-TRI',name:'Nền gạch nhà điều hành',location:'  Sảnh tầng 1, nhà điều hành 6 tầng  ',description:'Nền gạch bong, nứt tại cửa ra vào',detected:today(),due:offset(4),priority:'Trung bình',responsibleName:'',collaboratorNames:''};
 let damage=await ok('v2/records','POST',input);
 assert.equal(damage.assetId,undefined);assert.equal(damage.responsibleId,undefined);assert.equal(damage.location,input.location.trim());assert.equal(damage.responsibleName,'');assert.equal(damage.collaboratorNames,'');assert.equal(damage.owner,1);
 assert.equal((await ok('v2/records')).find(r=>r.id===damage.id)?.location,input.location.trim());
 damage=await update(damage,{responsibleName:'  Nguyễn Văn Thanh  ',collaboratorNames:'  Trần Bình, Lê An  ',location:'Hành lang tầng 2, nhà điều hành'});
 const stored=await ok('v2/records/'+damage.id);assert.equal(stored.responsibleName,'Nguyễn Văn Thanh');assert.equal(stored.collaboratorNames,'Trần Bình, Lê An');assert.equal(stored.location,'Hành lang tầng 2, nhà điều hành');
 const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
 const file=await ok('files','POST',{recordId:damage.id,name:'hien-truong-hu-hong.png',mime:'image/png',base64:png}),files=await ok('file-list?record='+damage.id);
 assert.equal(files.length,1);assert.equal(files[0].id,file.id);assert.equal(files[0].log_id,'');
 const response=await fetch(origin+'/api/files/'+file.id+'?inline=1',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.ok((await response.arrayBuffer()).byteLength>0);
 assert.equal((await fetch(origin+'/api/files/'+file.id)).status,401,'Ảnh hiện trường phải đăng nhập');
 damage=await update(damage,{responsibleName:'',collaboratorNames:''});assert.equal(damage.responsibleName,'');assert.equal(damage.collaboratorNames,'');assert.equal((await ok('file-list?record='+damage.id)).length,1,'Cập nhật hồ sơ giữ ảnh đã lưu');
 for(const invalid of [{location:''},{location:'   '},{location:null},{location:{}},{location:'x'.repeat(2001)},{responsibleName:null},{responsibleName:'x'.repeat(301)},{collaboratorNames:[]}])assert.equal((await call('v2/records','POST',{...input,code:'HH-INVALID-'+crypto.randomUUID().slice(0,8),...invalid})).status,400,JSON.stringify(invalid));
});

test('Sửa chữa theo khu vực: tạo và cập nhật tiến độ ngay khi chưa có hạng mục',async()=>{
 assert.equal((await ok('v2/records')).filter(r=>r.kind==='asset').length,0);
 const input={kind:'work',code:'SC-KV-TRUC-TIEP',name:'Sửa chữa nhà điều hành',group:'Khu vực kho',unit:'Phòng Kỹ thuật',responsibleId:1,responsibleName:'Anh Thanh',collaboratorNames:'Nguyễn Hải Đăng',plannedStart:offset(-3),start:offset(-2),due:offset(4),progress:45.5,description:'Chống thấm mái và cửa kính'};
 let work=await ok('v2/records','POST',input);
 assert.equal(work.assetId,undefined);assert.deepEqual(work.damageIds,[]);assert.equal(work.group,input.group);assert.equal(work.progress,45.5);assert.equal(work.start,input.start);assert.equal(work.status,'Chờ phê duyệt');
 assert.equal((await ok('v2/records')).find(r=>r.id===work.id)?.progress,45.5,'Công trình không có hạng mục vẫn có trong danh sách');
 assert.equal((await ok('v2/alerts')).find(a=>a.record_id===work.id)?.category,'deadline-4');
 work=await update(work,{progress:65,responsibleName:'Phạm Dũng'});assert.equal(work.progress,65);assert.equal(work.status,'Chờ phê duyệt');assert.equal(work.history.at(-1).status,'Cập nhật tiến độ 65%');
 const stored=await ok('v2/records/'+work.id);assert.equal(stored.progress,65);assert.equal(stored.responsibleName,'Phạm Dũng');assert.equal(stored.originalDue,input.due);
 for(const invalid of [{group:''},{group:'Khu vực không tồn tại'},{progress:-1},{progress:101},{progress:''},{progress:null},{progress:'không hợp lệ'},{completed:today()}])assert.equal((await call('v2/records','POST',{...input,code:'SC-KV-INVALID-'+crypto.randomUUID().slice(0,8),...invalid})).status,400,JSON.stringify(invalid));
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,progress:101})).status,400);assert.equal((await ok('v2/records/'+work.id)).progress,65);
 const complete=await ok('v2/records','POST',{...input,code:'SC-KV-HOAN-THANH',progress:100,completed:today()});assert.equal(complete.progress,100);assert.equal(complete.completed,today());assert.equal(complete.start,input.start);assert.equal(complete.status,'Chờ phê duyệt','Ghi tiến độ không tự phê duyệt');
});

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
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,assetId:''})).status,400,'Không lưu sửa chữa thiếu cả hạng mục và khu vực');
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
test('Sửa chữa: nhập tên phân công trực tiếp, cập nhật thời gian và tiến độ có lịch sử',async()=>{
 let work=await ok('v2/records','POST',{kind:'work',code:'SC-THONG-TIN',name:'Công trình theo dõi đơn giản',assetId:asset.id,responsibleId:1,responsibleName:'  Nguyễn Văn An  ',collaboratorNames:'  Trần Bình, Lê Chi  ',plannedStart:offset(-3),due:offset(4)});
 assert.equal(work.responsibleName,'Nguyễn Văn An');assert.equal(work.collaboratorNames,'Trần Bình, Lê Chi');
 const originalDue=work.originalDue;
 for(const status of ['Đã phê duyệt','Chờ bàn giao'])work=await transition(work,status);
 work=await update(work,{handover:offset(-2),start:offset(-1),progress:25,responsibleName:'Phạm Dũng',collaboratorNames:'Vũ Hà'});
 assert.equal(work.responsibleName,'Phạm Dũng');assert.equal(work.collaboratorNames,'Vũ Hà');assert.equal(work.progress,25);assert.equal(work.start,offset(-1));
 assert.equal(work.responsibleId,1,'Nhập tên không đổi tài khoản phân công');assert.equal(work.originalDue,originalDue);
 assert.equal(work.history.at(-1).status,'Cập nhật tiến độ 25%');assert.equal(work.history.at(-1).reason,'0% → 25%');
 const stored=await ok('v2/records/'+work.id);assert.equal(stored.responsibleName,'Phạm Dũng');assert.equal(stored.progress,25);
 for(const invalid of [{responsibleName:null},{responsibleName:'x'.repeat(301)},{collaboratorNames:[]},{collaboratorNames:'x'.repeat(1501)},{progress:101},{start:offset(-3)},{completed:today()}])assert.equal((await call('v2/records/'+work.id,'PUT',{...work,...invalid})).status,400,JSON.stringify(invalid));
 assert.equal((await ok('v2/records/'+work.id)).version,work.version,'Dữ liệu không hợp lệ giữ nguyên hồ sơ');
 work=await update(work,{collaboratorNames:''});assert.equal(work.collaboratorNames,'','Cho phép xóa tên phối hợp');
 work=await update(work,{progress:100,completed:today()});assert.equal(work.completed,today());assert.equal(work.status,'Chờ bàn giao','Cập nhật thông tin không tự phê duyệt hoặc nghiệm thu');
});

test('Sửa chữa: luôn cảnh báo từ 4 ngày, ngày đến hạn và quá hạn dù đổi mốc chung',async()=>{
 const original=await ok('v2/settings');
 try{
  await ok('v2/settings','PUT',{thresholds:[10,2],staleDays:original.staleDays});
  for(const [days,category] of [[5,null],[4,'deadline-4'],[3,'deadline-4'],[1,'deadline-1'],[0,'deadline-0'],[-1,'deadline-overdue']]){
   const work=await ok('v2/records','POST',{kind:'work',code:'SC-CB-'+String(days).replace('-','M'),name:'Cảnh báo sửa chữa '+days,assetId:asset.id,responsibleId:1,due:offset(days)});
   const notices=(await ok('v2/alerts')).filter(a=>a.record_id===work.id);
   assert.equal(notices.length,category?1:0,'Mốc '+days+' ngày');if(category)assert.equal(notices[0].category,category);
  }
  const project=await ok('v2/records','POST',{kind:'investment',code:'DT-CB-TUY-CHINH',name:'Đầu tư dùng mốc chung',group:'Khu vực kho',responsibleId:1,due:offset(5)});
  assert.equal((await ok('v2/alerts')).find(a=>a.record_id===project.id)?.category,'deadline-10','Đầu tư vẫn dùng thiết lập riêng');
 }finally{await ok('v2/settings','PUT',original);}
});

test('Sửa chữa theo khu vực: giữ phạm vi đơn vị và phân quyền khi tạo công trình',async()=>{
 const allUsers=await ok('users','POST',{name:'Cán bộ khu vực',username:'area-manager',password,role:'manager'}),manager=allUsers.find(u=>u.username==='area-manager');
 await ok('v2/users','PUT',{id:manager.id,unit:'Đơn vị A'});
 const session=(await call('login','POST',{username:'area-manager',password})).cookie;
 const input={kind:'work',code:'SC-KV-MANAGER',name:'Công trình trong phạm vi đơn vị',group:'Khu vực kho',unit:'Đơn vị A',responsibleId:manager.id,due:offset(8),progress:30};
 assert.equal((await call('v2/records','POST',{...input,code:'SC-KV-NGOAI-DON-VI',unit:'Đơn vị B'},session)).status,403);
 const result=await call('v2/records','POST',input,session);assert.equal(result.status,201);assert.equal(result.data.progress,30);
 const updateResult=await call('v2/records/'+result.data.id,'PUT',{...result.data,progress:55},session);assert.equal(updateResult.status,200);assert.equal(updateResult.data.progress,55);
 assert.equal((await call('v2/records/'+result.data.id,'GET',undefined,session)).data.progress,55);
});

test('V3: khôi phục mật khẩu bằng mã một lần, thu hồi phiên cũ và giữ công trình',async()=>{
 const count=(await ok('v2/records')).length;
 assert.equal((await call('recovery','POST',{username:'admin',password:'new-password-test-123',recoveryToken:'sai-ma'})).status,403);
 await ok('recovery','POST',{username:'admin',password:'new-password-test-123',recoveryToken});
 assert.equal((await call('me')).status,401);
 assert.equal((await call('recovery','POST',{username:'admin',password:'other-password-123',recoveryToken})).status,403);
 cookie=(await call('login','POST',{username:'admin',password:'new-password-test-123'})).cookie;assert.ok(cookie);assert.equal((await ok('v2/records')).length,count);
});

test('Kiểm tra hiện trạng: nhập hạng mục, nhiều người, chức danh và ảnh; thử lại không nhân đôi phiếu',async()=>{
 const assetsBefore=(await ok('v2/records')).filter(r=>r.kind==='asset').length;
 const input={kind:'inspection',code:'KT-NHAP-TRUC-TIEP',name:'Kiểm tra ray cầu tàu',assetName:'  Ray cầu tàu số 2  ',inspectionDate:today(),inspector:'  Nguyễn Văn An, Trần Thị Bình\nLê Văn Cường  ',technical:'Cần theo dõi',conclusion:'  Theo dõi khe nối ray  ',responsibleName:'  Phạm Văn Dũng  ',responsibleTitle:'  Phó trưởng phòng Kỹ thuật  ',collaboratorNames:'  Trần Thị Mai, Lê Văn Sơn  ',collaboratorTitles:'  Kỹ sư cầu đường, Cán bộ kỹ thuật  '};
 const key='inspection-attachment-retry-'+crypto.randomUUID();
 const submit=()=>fetch(origin+'/api/v2/records',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,'Idempotency-Key':key},body:JSON.stringify(input)});
 let response=await submit();assert.equal(response.status,201);let inspection=await response.json();
 assert.equal(inspection.assetId,undefined);assert.equal(inspection.responsibleId,undefined);assert.deepEqual(inspection.assignees,[]);
 assert.equal(inspection.assetName,input.assetName.trim());assert.equal(inspection.inspector,input.inspector.trim());assert.equal(inspection.responsibleName,input.responsibleName.trim());assert.equal(inspection.responsibleTitle,input.responsibleTitle.trim());assert.equal(inspection.collaboratorNames,input.collaboratorNames.trim());assert.equal(inspection.collaboratorTitles,input.collaboratorTitles.trim());assert.equal(inspection.conclusion,input.conclusion.trim());
 assert.equal((await ok('v2/records')).filter(r=>r.kind==='asset').length,assetsBefore,'Nhập hạng mục trên phiếu không tự tạo hoặc đổi danh mục hạ tầng');
 assert.equal((await call('files','POST',{recordId:inspection.id,name:'anh-loi.png',mime:'image/png',base64:Buffer.from('khong-phai-anh').toString('base64')})).status,400);
 response=await submit();assert.equal(response.status,200);assert.equal((await response.json()).id,inspection.id,'Thử lại sau lỗi ảnh giữ đúng một phiếu');
 const png=readFileSync(new URL('./public/icon-192.png',import.meta.url)).toString('base64');
 for(const name of ['anh-hien-trang-1.png','anh-hien-trang-2.png'])await ok('files','POST',{recordId:inspection.id,name,mime:'image/png',base64:png});
 const files=await ok('file-list?record='+inspection.id);assert.equal(files.length,2);
 assert.equal((await fetch(origin+'/api/files/'+files[0].id)).status,401,'Ảnh kiểm tra chỉ được xem sau đăng nhập');
 assert.equal((await fetch(origin+'/api/files/'+files[0].id,{headers:{Cookie:cookie}})).status,200);
 inspection=await update(inspection,{assetName:'Ray cầu tàu khu vực phía Bắc',inspector:'Nguyễn Văn An\nTrần Thị Bình',responsibleName:'',responsibleTitle:'',collaboratorNames:'',collaboratorTitles:''});
 const stored=await ok('v2/records/'+inspection.id);assert.equal(stored.assetName,'Ray cầu tàu khu vực phía Bắc');assert.equal(stored.inspector,'Nguyễn Văn An\nTrần Thị Bình');assert.equal(stored.responsibleName,'');assert.equal(stored.responsibleTitle,'');assert.equal((await ok('file-list?record='+inspection.id)).length,2);
 for(const invalid of [{assetName:''},{assetName:null},{assetName:{}},{assetName:'x'.repeat(1001)},{inspector:''},{inspector:[]},{inspector:'x'.repeat(2001)},{responsibleName:null},{responsibleTitle:{}},{responsibleTitle:'x'.repeat(301)},{collaboratorNames:[]},{collaboratorTitles:[]},{collaboratorTitles:'x'.repeat(1501)},{conclusion:'  '}])assert.equal((await call('v2/records','POST',{...input,code:'KT-SAI-'+crypto.randomUUID().slice(0,8),...invalid})).status,400,JSON.stringify(invalid));
 assert.equal((await call('v2/records','POST',{...input,code:'KT-SAI-LIEN-KET',assetId:99999999})).status,404,'Nhập tên tự do không bỏ qua kiểm tra liên kết hạng mục');
 const activeGroup=(await ok('v2/catalogs')).catalogs.find(c=>c.type==='infrastructure'&&c.active).name;
 const linkedAsset=await ok('v2/records','POST',{kind:'asset',code:'HT-KT-LIEN-KET',name:'Hạng mục liên kết cũ',assetType:'infrastructure',group:activeGroup,unit:'Phòng Kỹ thuật',location:'Cầu 2',responsibleId:1,operation:'Đang sử dụng',technical:'Tốt'});
 let legacy=await ok('v2/records','POST',{kind:'inspection',code:'KT-DINH-DANG-CU',name:'Phiếu dùng hạng mục đã có',assetId:linkedAsset.id,inspectionDate:today(),inspector:'Người kiểm tra cũ',technical:'Hư hỏng nhẹ',conclusion:'Cần xử lý',responsibleId:1});
 assert.equal((await ok('v2/records/'+linkedAsset.id)).technical,'Hư hỏng nhẹ','Phiếu liên kết tiếp tục cập nhật đánh giá hạng mục');
 legacy=await update(legacy,{assetName:'Tên mô tả trên phiếu',responsibleName:'Tên nhập trực tiếp',responsibleTitle:'Kỹ sư',technical:'Cần theo dõi'});
 assert.equal(legacy.assetId,linkedAsset.id);assert.equal(legacy.responsibleId,1);assert.equal((await ok('v2/records/'+linkedAsset.id)).name,'Hạng mục liên kết cũ','Nhập tên trên phiếu không đổi tên danh mục');
 assert.equal((await ok('v2/records/'+linkedAsset.id)).technical,'Cần theo dõi');
});

test('Kiểm tra hiện trạng nhập trực tiếp: giữ quyền sở hữu và phạm vi đơn vị',async()=>{
 const makeManager=async(username,name,unit)=>{
  const list=await ok('users','POST',{name,username,password,role:'manager'}),account=list.find(u=>u.username===username);
  await ok('v2/users','PUT',{id:account.id,unit});
  return {account,session:(await call('login','POST',{username,password})).cookie};
 };
 const owner=await makeManager('inspection-owner','Người tạo phiếu kiểm tra','Đơn vị kiểm tra A'),other=await makeManager('inspection-other','Người phụ trách chỉ nhập tên','Đơn vị kiểm tra B');
 const input={kind:'inspection',code:'KT-PHAM-VI',name:'Phiếu kiểm tra trong đơn vị',assetName:'Ray bến số 3',unit:'Đơn vị kiểm tra A',inspectionDate:today(),inspector:'Người kiểm tra A, Người kiểm tra B',technical:'Tốt',conclusion:'Đạt',responsibleName:other.account.name,responsibleTitle:'Kỹ sư',collaboratorNames:'Tên tự do',collaboratorTitles:'Chuyên viên'};
 assert.equal((await call('v2/records','POST',{...input,code:'KT-NGOAI-DON-VI',unit:'Đơn vị kiểm tra B'},owner.session)).status,403);
 const created=await call('v2/records','POST',input,owner.session);assert.equal(created.status,201);assert.equal(created.data.owner,owner.account.id);assert.equal(created.data.responsibleId,undefined);
 assert.equal((await call('v2/records/'+created.data.id,'GET',undefined,other.session)).status,404,'Tên trên phiếu không tự cấp quyền truy cập cho tài khoản trùng tên');
 assert.ok(!(await call('v2/records','GET',undefined,other.session)).data.some(r=>r.id===created.data.id));
 const changed=await call('v2/records/'+created.data.id,'PUT',{...created.data,assetName:'Ray bến số 3 đoạn phía Bắc',responsibleName:'Người được phân công mới',responsibleTitle:'Tổ trưởng'},owner.session);
 assert.equal(changed.status,200);assert.equal(changed.data.responsibleTitle,'Tổ trưởng');
 assert.equal((await call('v2/records/'+created.data.id,'PUT',{...changed.data,unit:'Đơn vị kiểm tra B'},owner.session)).status,403);
});

test('Theo dõi khu vực: tổng hợp hồ sơ trực tiếp, liên kết nhiều khu vực và cảnh báo hiện hành',()=>{
 const source=[
  {id:1,kind:'asset',group:'Cầu cảng, khu A'},
  {id:2,kind:'damage',assetId:1,priority:'Khẩn cấp',due:'2026-10-28',status:'Đánh giá'},
  {id:3,kind:'work',group:'Khu vực kho',progress:20,due:'2026-11-02',status:'Chờ phê duyệt'},
  {id:4,kind:'damage',group:'Khu vực kho',priority:'Trung bình',due:'2026-11-02',status:'Mới ghi nhận'},
  {id:5,kind:'damage',location:'Vị trí chưa phân khu',due:'2026-11-20',status:'Mới ghi nhận'},
  {id:6,kind:'work',damageIds:[2,4,2],due:'2026-11-10',status:'Đang thực hiện'},
  {id:7,kind:'work',group:'Khu vực kho',progress:100,completed:'2026-10-20',due:'2026-10-15',status:'Chờ nghiệm thu'},
  {id:8,kind:'damage',group:'Khu vực kho',archived:true,status:'Mới ghi nhận'},
  {id:9,kind:'damage',group:'Khu vực kho',status:'Đóng hư hỏng'},
  {id:10,kind:'work',group:'Khu vực kho',status:'Đã nghiệm thu'},
  {id:11,kind:'investment',group:'Khu vực kho',status:'Đang thực hiện'}
 ];
 const before=JSON.stringify(source),items=areaWatch(source,'2026-10-29',[1,0]),lookup=new Map(items.map(item=>[item.record.id,item]));
 assert.deepEqual([...lookup.keys()].sort((a,b)=>a-b),[2,3,4,5,6,7]);assert.equal(items[0].record.id,2);
 assert.deepEqual(lookup.get(6).areas,['Cầu cảng, khu A','Khu vực kho']);assert.equal(lookup.get(3).soon,true,'Sửa chữa vẫn nhắc trước 4 ngày');assert.equal(lookup.get(4).soon,false,'Hư hỏng dùng mốc chung');
 assert.equal(lookup.get(2).overdue,true);assert.equal(lookup.get(2).urgent,true);assert.equal(lookup.get(5).unassigned,true);assert.equal(lookup.get(7).overdue,false);assert.equal(lookup.get(7).completed,true);
 assert.deepEqual(recordAreas(source[1],source),['Cầu cảng, khu A'],'Tên khu vực chứa dấu phẩy không bị tách');
 const summary=areaWatchSummary(items,['Khu vực kho','Khu vực chưa có công việc']);
 assert.equal(summary.find(area=>area.name==='Cầu cảng, khu A').total,2);assert.equal(summary.find(area=>area.name==='Khu vực kho').work,3);assert.equal(summary.find(area=>area.name===UNASSIGNED_AREA).total,1);assert.equal(summary.find(area=>area.name==='Khu vực chưa có công việc').total,0);
 assert.equal(items.length,6,'Tổng số hồ sơ không nhân đôi do liên quan nhiều khu vực');assert.equal(JSON.stringify(source),before,'Tổng hợp không sửa dữ liệu gốc');
 const dueToday=areaWatch([{id:20,kind:'damage',group:'Khu vực kho',due:'2026-10-29',priority:'Trung bình'}],'2026-10-29',[0])[0];assert.equal(dueToday.soon,true);assert.equal(dueToday.days,0);assert.equal(dueToday.overdue,false);
});

test('Hư hỏng theo khu vực: tùy chọn phân khu, kiểm tra danh mục, đổi tên và giữ hồ sơ cũ',async()=>{
 const first='Khu vực tổng hợp hư hỏng thử',renamed='Khu vực tổng hợp sau đổi tên';
 await ok('v2/catalogs','POST',{type:'infrastructure',name:first});
 const input={kind:'damage',code:'HH-AREA-WATCH',name:'Hư hỏng phân khu trực tiếp',group:'  '+first+'  ',location:'Địa điểm nhập trực tiếp',description:'Theo dõi hư hỏng không cần danh mục hạng mục',detected:today(),due:offset(4),priority:'Trung bình',responsibleName:''};
 let damage=await ok('v2/records','POST',input);assert.equal(damage.group,first);assert.equal(damage.assetId,undefined);
 assert.equal((await call('v2/records/'+damage.id,'PUT',{...damage,group:123})).status,400);assert.equal((await call('v2/records/'+damage.id,'PUT',{...damage,group:'Khu vực không có trong danh mục'})).status,400);
 const catalog=(await ok('v2/catalogs')).catalogs.find(c=>c.type==='infrastructure'&&c.name===first);
 await ok('v2/catalogs','PUT',{id:catalog.id,name:renamed,active:true});
 damage=await ok('v2/records/'+damage.id);assert.equal(damage.group,renamed);assert.equal(damage.version,2,'Đổi tên khu vực tăng phiên bản hồ sơ hư hỏng');
 await ok('v2/catalogs','PUT',{id:catalog.id,name:renamed,active:false});
 damage=await update(damage,{notes:'Cập nhật hồ sơ giữ khu vực đã ẩn'});assert.equal(damage.group,renamed);
 const rows=areaWatch(await ok('v2/records'),today());assert.ok(rows.some(item=>item.record.id===damage.id&&item.areas.includes(renamed)),'Khu vực ẩn vẫn có công việc được theo dõi');
 damage=await update(damage,{group:''});assert.equal(damage.group,'');assert.deepEqual(recordAreas(damage,[]),[UNASSIGNED_AREA]);assert.equal(damage.location,input.location);
});

test('Đầu tư mới: nhập trực tiếp hạng mục, để trống tên phân công và bổ sung ảnh',async()=>{
 const input={kind:'investment',code:'DT-NHAP-TRUC-TIEP',name:'Đầu tư khu nhà điều hành',assetName:'  Nhà điều hành phía Bắc  ',group:'Nhà văn phòng',unit:'Phòng Kỹ thuật',due:offset(15),responsibleName:'',collaboratorNames:''};
 const assetsBefore=(await ok('v2/records')).filter(r=>r.kind==='asset').length;
 let project=await ok('v2/records','POST',input);assert.equal(project.assetName,'Nhà điều hành phía Bắc');assert.equal(project.assetId,undefined);assert.equal(project.responsibleId,undefined);assert.deepEqual(project.assignees,[]);assert.equal(project.owner,1);assert.equal(project.responsibleName,'');assert.equal(project.collaboratorNames,'');assert.equal(project.status,'Đề xuất đầu tư');
 const originalDue=project.originalDue;
 const png=readFileSync(new URL('./public/icon-192.png',import.meta.url)).toString('base64');
 for(const name of ['dau-tu-1.png','dau-tu-2.png'])await ok('files','POST',{recordId:project.id,name,mime:'image/png',base64:png});
 project=await update(project,{assetName:'  Nhà điều hành và sân đường  ',responsibleName:'  Nguyễn Văn Thanh  ',collaboratorNames:'  Trần Bình, Lê An  '});
 assert.equal(project.assetName,'Nhà điều hành và sân đường');assert.equal(project.responsibleName,'Nguyễn Văn Thanh');assert.equal(project.collaboratorNames,'Trần Bình, Lê An');assert.equal(project.originalDue,originalDue);assert.equal(project.unit,input.unit);assert.equal(project.progress,0);assert.equal(project.status,'Đề xuất đầu tư');assert.equal((await ok('file-list?record='+project.id)).length,2);
 project=await update(project,{assetName:'',responsibleName:'',collaboratorNames:''});assert.equal(project.assetName,'');assert.equal(project.responsibleName,'');assert.equal(project.collaboratorNames,'');assert.equal((await ok('file-list?record='+project.id)).length,2,'Xóa tên hoặc hạng mục mô tả vẫn giữ ảnh');
 assert.equal((await ok('v2/records')).filter(r=>r.kind==='asset').length,assetsBefore,'Không tạo hạng mục giả từ tên nhập trực tiếp');
 for(const invalid of [{assetName:123},{assetName:'x'.repeat(1001)},{responsibleName:[]},{responsibleName:'x'.repeat(301)},{collaboratorNames:'x'.repeat(1501)}])assert.equal((await call('v2/records/'+project.id,'PUT',{...project,...invalid})).status,400);
 assert.equal((await call('v2/records','POST',{kind:'work',code:'SC-VAN-CAN-PHU-TRACH',name:'Sửa chữa vẫn cần tài khoản phụ trách',group:'Khu vực kho',unit:'Phòng Kỹ thuật',due:offset(4)})).status,400);
});

test('Đầu tư cũ: tên nhập trực tiếp giữ liên kết hạng mục và các tài khoản đã phân công',async()=>{
 const legacyAsset=await ok('v2/records/'+asset.id);
 let project=await ok('v2/records','POST',{kind:'investment',code:'DT-GIU-LIEN-KET',name:'Dự án có liên kết cũ',assetId:asset.id,group:legacyAsset.group,unit:'Phòng Kỹ thuật',responsibleId:1,assignees:[2],due:offset(20)});
 project=await update(project,{assetName:'Tên hạng mục riêng trên dự án',responsibleName:'Tên phụ trách nhập tự do',collaboratorNames:'Tên phối hợp nhập tự do'});
 assert.equal(project.assetId,asset.id);assert.equal(project.responsibleId,1);assert.deepEqual(project.assignees,[2]);assert.equal((await ok('v2/records/'+asset.id)).name,legacyAsset.name);
 project=await update(project,{assetName:'',responsibleName:'',collaboratorNames:''});assert.equal(project.assetId,asset.id);assert.equal(project.responsibleId,1);assert.deepEqual(project.assignees,[2]);
 assert.equal((await call('v2/records/'+project.id,'PUT',{...project,assetId:999999999})).status,404);
});

test('Đầu tư nhập tên trực tiếp: quyền sở hữu, phạm vi đơn vị và ảnh không cấp quyền theo tên',async()=>{
 const makeManager=async(username,name,unit)=>{const list=await ok('users','POST',{name,username,password,role:'manager'}),account=list.find(u=>u.username===username);await ok('v2/users','PUT',{id:account.id,unit});return {account,session:(await call('login','POST',{username,password})).cookie};};
 const owner=await makeManager('investment-owner','Người lập dự án thử','Đơn vị đầu tư A'),other=await makeManager('investment-other','Người chỉ nhập tên vào dự án','Đơn vị đầu tư B');
 const input={kind:'investment',code:'DT-PHAM-VI',name:'Dự án riêng trong đơn vị',assetName:'Hạng mục nhập tự do',group:'Khu vực kho',unit:'Đơn vị đầu tư A',due:offset(15),responsibleName:other.account.name,collaboratorNames:other.account.name};
 assert.equal((await call('v2/records','POST',{...input,code:'DT-NGOAI-DON-VI',unit:'Đơn vị đầu tư B'},owner.session)).status,403);
 const created=await call('v2/records','POST',input,owner.session);assert.equal(created.status,201);assert.equal(created.data.owner,owner.account.id);assert.equal(created.data.responsibleId,undefined);assert.deepEqual(created.data.assignees,[]);
 assert.equal((await call('v2/records/'+created.data.id,'GET',undefined,other.session)).status,404);assert.ok(!(await call('v2/records','GET',undefined,other.session)).data.some(r=>r.id===created.data.id));
 const fileInput={recordId:created.data.id,name:'dau-tu-trong-don-vi.png',mime:'image/png',base64:readFileSync(new URL('./public/icon-192.png',import.meta.url)).toString('base64')};
 const uploaded=await call('files','POST',fileInput,owner.session);assert.equal(uploaded.status,201);assert.equal((await call('files','POST',fileInput,other.session)).status,403);
 assert.equal((await fetch(origin+'/api/files/'+uploaded.data.id,{headers:{Cookie:other.session}})).status,403);assert.equal((await fetch(origin+'/api/files/'+uploaded.data.id,{headers:{Cookie:owner.session}})).status,200);
 const changed=await call('v2/records/'+created.data.id,'PUT',{...created.data,responsibleName:'',collaboratorNames:'',assetName:'Hạng mục đã bổ sung'},owner.session);assert.equal(changed.status,200);assert.equal(changed.data.assetName,'Hạng mục đã bổ sung');
 assert.equal((await call('v2/records/'+created.data.id,'PUT',{...changed.data,unit:'Đơn vị đầu tư B'},owner.session)).status,403);
});

test('Rà soát: chuỗi kiểm tra nhập trực tiếp → hư hỏng → nhiều công trình, không nghiệm thu/đóng sớm',async()=>{
 const inspection=await ok('v2/records','POST',{kind:'inspection',code:'KT-AUDIT-CHAIN',name:'Kiểm tra nền bãi',assetName:'Nền bãi phía Bắc',unit:'Phòng Kỹ thuật',inspectionDate:today(),inspector:'Cán bộ kiểm tra',technical:'Hư hỏng nhẹ',conclusion:'Cần sửa các vị trí lún'});
 let damage=await ok('v2/records','POST',{kind:'damage',code:'HH-AUDIT-CHAIN',name:'Lún nền bãi',location:'Nền bãi phía Bắc',group:'Khu vực kho',unit:'Phòng Kỹ thuật',inspectionId:inspection.id,detected:today(),due:offset(10),priority:'Cao',description:inspection.conclusion});
 assert.equal(damage.inspectionId,inspection.id);assert.equal(damage.assetId,undefined);
 for(const status of ['Đánh giá','Đề xuất','Phê duyệt'])damage=await transition(damage,status);
 assert.equal((await call(`v2/records/${damage.id}/transition`,'POST',{version:damage.version,status:'Lập công việc'})).status,400);
 const createWork=async(code)=>ok('v2/records','POST',{kind:'work',code,name:'Sửa một phần nền bãi '+code,damageIds:[String(damage.id),damage.id],responsibleId:1,due:offset(10)});
 let first=await createWork('SC-AUDIT-A'),second=await createWork('SC-AUDIT-B');assert.deepEqual(first.damageIds,[damage.id]);assert.equal(first.unit,damage.unit);
 damage=await transition(damage,'Lập công việc');assert.equal((await call(`v2/records/${damage.id}/transition`,'POST',{version:damage.version,status:'Thực hiện'})).status,400);
 const start=async work=>{work=await transition(work,'Đã phê duyệt');work=await transition(work,'Chờ bàn giao');work=await update(work,{handover:offset(-2),start:offset(-1)});return transition(work,'Đang thực hiện');};
 const finish=async work=>{work=await update(work,{progress:100,completed:today()});work=await transition(work,'Hoàn thành sửa chữa');return transition(work,'Chờ nghiệm thu');};
 const accept=async work=>{work=await update(work,{accepted:today(),acceptanceNote:'Đạt',results:{[damage.id]:'Đã khắc phục phần việc này'}});return transition(work,'Đã nghiệm thu');};
 first=await start(first);damage=await transition(damage,'Thực hiện');first=await finish(first);first=await accept(first);
 assert.equal((await call(`v2/records/${damage.id}/transition`,'POST',{version:damage.version,status:'Nghiệm thu'})).status,400,'Một công trình xong không làm hồ sơ hư hỏng kết thúc khi còn công trình khác');
 second=await start(second);second=await finish(second);damage=await transition(damage,'Nghiệm thu');
 assert.equal((await call(`v2/records/${damage.id}/transition`,'POST',{version:damage.version,status:'Đóng hư hỏng'})).status,400,'Cần nghiệm thu đủ các công trình');
 second=await accept(second);damage=await transition(damage,'Đóng hư hỏng');assert.equal(damage.status,'Đóng hư hỏng');
 const png=readFileSync(new URL('./public/icon-192.png',import.meta.url)).toString('base64');for(const recordId of [first.id,second.id,damage.id])assert.equal((await call('files','POST',{recordId,name:'khong-duoc-them.png',mime:'image/png',base64:png})).status,409,'Khóa ảnh thống nhất với giao diện sau nghiệm thu/đóng');
});

test('Rà soát: liên kết hư hỏng không cho chuyển công trình sang đơn vị ngoài phạm vi',async()=>{
 const accounts=await ok('users','POST',{name:'Cán bộ rà soát phạm vi',username:'audit-scope',password,role:'manager'}),manager=accounts.find(u=>u.username==='audit-scope');await ok('v2/users','PUT',{id:manager.id,unit:'Đơn vị rà soát A'});const session=(await call('login','POST',{username:'audit-scope',password})).cookie;
 let response=await call('v2/records','POST',{kind:'damage',code:'HH-AUDIT-SCOPE',name:'Hư hỏng trong đơn vị',location:'Địa điểm nhập tự do',group:'Khu vực kho',unit:'Đơn vị rà soát A',description:'Nội dung',detected:today(),due:offset(10),priority:'Trung bình'},session);assert.equal(response.status,201);let damage=response.data;for(const status of ['Đánh giá','Đề xuất','Phê duyệt'])damage=await transition(damage,status);
 const input={kind:'work',code:'SC-AUDIT-SCOPE',name:'Sửa chữa hư hỏng đã duyệt',damageIds:[damage.id],responsibleId:manager.id,due:offset(10)};
 assert.equal((await call('v2/records','POST',{...input,code:'SC-AUDIT-SCOPE-SAI',unit:'Đơn vị ngoài phạm vi'},session)).status,403);
 response=await call('v2/records','POST',input,session);assert.equal(response.status,201);assert.equal(response.data.unit,damage.unit);
 assert.equal((await call('v2/records/'+response.data.id,'PUT',{...response.data,unit:'Đơn vị ngoài phạm vi'},session)).status,403);
});

test('Rà soát: cảnh báo theo lần cập nhật tiến độ, sửa ghi chú không làm mất cảnh báo',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const original=await ok('v2/settings');
 try{
  await ok('v2/settings','PUT',{thresholds:original.thresholds,staleDays:2});
  let project=await ok('v2/records','POST',{kind:'investment',code:'DT-AUDIT-STALE',name:'Đầu tư cần nhắc cập nhật',group:'Khu vực kho',unit:'Phòng Kỹ thuật',due:offset(20),responsibleName:'',collaboratorNames:''});
  for(const status of ['Khảo sát hiện trạng','Lập và duyệt dự án','Lựa chọn nhà thầu','Chờ bàn giao'])project=await transition(project,status);
  project=await update(project,{handover:offset(-10),start:offset(-10)});project=await transition(project,'Đang thực hiện');
  const db=new DatabaseSync(join(dir,'app.sqlite')),raw=db.prepare('SELECT data FROM records WHERE id=?').get(project.id),value=JSON.parse(raw.data);value.history=value.history.map(h=>({...h,at:offset(-10)+'T05:00:00Z'}));db.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify(value),project.id);db.close();
  await new Promise(resolve=>setTimeout(resolve,350));project=await ok('v2/records/'+project.id);const first=(await ok('v2/alerts')).find(a=>a.record_id===project.id&&a.category==='stale');assert.ok(first);assert.equal(first.due,offset(-10));
  project=await update(project,{notes:'Chỉ thay ghi chú, chưa báo cáo tiến độ'});const afterNote=(await ok('v2/alerts')).find(a=>a.record_id===project.id&&a.category==='stale');assert.equal(afterNote.id,first.id);
  project=await update(project,{progress:25});assert.equal(project.history.at(-1).status,'Cập nhật tiến độ 25%');assert.equal((await ok('v2/alerts')).some(a=>a.record_id===project.id&&a.category==='stale'),false);
 }finally{await ok('v2/settings','PUT',original);}
});

test('Rà soát: cảnh báo loại hồ sơ từ chối và cập nhật đúng sau gia hạn/hoàn thành',async()=>{
 let damage=await ok('v2/records','POST',{kind:'damage',code:'HH-AUDIT-REJECT',name:'Hư hỏng không tiếp tục xử lý',location:'Địa điểm thử',description:'Nội dung',detected:offset(-2),due:offset(-1),priority:'Trung bình'});assert.ok((await ok('v2/alerts')).some(a=>a.record_id===damage.id));
 damage=await ok(`v2/records/${damage.id}/transition`,'POST',{version:damage.version,status:'Từ chối',reason:'Hồ sơ thử không được thông qua'});assert.equal((await ok('v2/alerts')).some(a=>a.record_id===damage.id),false);
 const png=readFileSync(new URL('./public/icon-192.png',import.meta.url)).toString('base64');assert.equal((await call('files','POST',{recordId:damage.id,name:'khong-duoc-them.png',mime:'image/png',base64:png})).status,409);
 let work=await ok('v2/records','POST',{kind:'work',code:'SC-AUDIT-ALERT',name:'Thử cảnh báo và gia hạn',group:'Khu vực kho',unit:'Phòng Kỹ thuật',responsibleId:1,due:offset(4)});assert.equal((await ok('v2/alerts')).filter(a=>a.record_id===work.id).length,1);
 work=await ok(`v2/records/${work.id}/extend`,'POST',{version:work.version,due:offset(15),reason:'Thay đổi kế hoạch có phê duyệt',proposer:'Người phụ trách'});assert.equal((await ok('v2/alerts')).some(a=>a.record_id===work.id),false);assert.equal(work.originalDue,offset(4));
 work=await update(work,{progress:100,start:today(),completed:today()});assert.equal((await ok('v2/alerts')).some(a=>a.record_id===work.id),false);
});

test('Rà soát: ngày thực tế không vượt ngày hiện tại, ID phối hợp được chuẩn hóa',async()=>{
 for(const [kind,extra] of [['inspection',{assetName:'Hạng mục thử',inspectionDate:offset(1),inspector:'Người kiểm tra',conclusion:'Nội dung'}],['damage',{location:'Vị trí thử',detected:offset(1),description:'Nội dung',priority:'Trung bình'}],['work',{responsibleId:1,start:offset(1)}]])assert.equal((await call('v2/records','POST',{kind,code:'AUDIT-FUTURE-'+kind,name:'Ngày thực tế thử',group:'Khu vực kho',unit:'Phòng Kỹ thuật',due:offset(10),...extra})).status,400);
 let project=await ok('v2/records','POST',{kind:'investment',code:'DT-AUDIT-IDS',name:'Chuẩn hóa tài khoản phối hợp',group:'Khu vực kho',unit:'Phòng Kỹ thuật',due:offset(10),assignees:['2',2]});assert.deepEqual(project.assignees,[2]);
 const participant=(await call('login','POST',{username:'phoihop',password})).cookie;assert.equal((await call('v2/records/'+project.id,'GET',undefined,participant)).status,200);
 assert.equal((await call('v2/records/'+project.id,'PUT',{...project,assignees:['khong-phai-id']})).status,400);assert.equal((await call('v2/records/'+project.id,'PUT',{...project,handover:offset(1)})).status,400);
});

test('Rà soát: mốc tiến độ theo ngày Việt Nam và cảnh báo khu vực nhận việc chậm cập nhật',async()=>{
 const {lastProgressDate}=await import('./domain.mjs');assert.equal(lastProgressDate({start:'2026-10-01',updated:'2026-10-30T10:00:00Z',history:[{status:'Cập nhật tiến độ 15%',at:'2026-10-28T18:30:00Z'}]}),'2026-10-29');
 const rows=areaWatch([{id:7,kind:'work',group:'Khu vực kho',status:'Đang thực hiện',due:'2026-11-30'}],'2026-10-29',[4,1,0],[7]);assert.equal(rows[0].stale,true);assert.equal(rows[0].attention,true);assert.equal(areaWatchSummary(rows)[0].attention,1);
});

test('Rà soát: xem trước Excel nhận mã đã được dùng bởi hồ sơ đầu tư',async()=>{
 await ok('v2/records','POST',{kind:'investment',code:'AUDIT-XLSX-CODE',name:'Dự án dùng mã cần đối chiếu',group:'Khu vực kho',unit:'Phòng Kỹ thuật',due:offset(12)});
 const {xlsxDownload}=await import('./public/operations.js');const originalDocument=globalThis.document,originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;let blob,bytes;
 try{globalThis.document={createElement:()=>({click(){}})};URL.createObjectURL=value=>{blob=value;return 'blob:audit'};URL.revokeObjectURL=()=>{};xlsxDownload([['Mã','Tên','Loại','Nhóm','Đơn vị','Khu vực','Vị trí','Vận hành','Kỹ thuật','Người phụ trách (ID)'],['AUDIT-XLSX-CODE','Hạng mục trùng mã','infrastructure','Khu vực kho','Phòng Kỹ thuật','','Vị trí thử','Đang sử dụng','Tốt',1]]);bytes=Buffer.from(await blob.arrayBuffer());}finally{globalThis.document=originalDocument;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;}
 const preview=await ok('v2/import','POST',{base64:bytes.toString('base64')});assert.match(preview.preview[0].error,/Mã đã tồn tại/);assert.equal((await call('v2/import','POST',{base64:bytes.toString('base64'),commit:true})).status,400);
});

test('Rà soát: tiến độ theo mốc không thể vượt quy trình hoặc ghi hoàn thành khi mốc chưa xong',async()=>{
 const steps=[{name:'Khảo sát',weight:50,progress:20},{name:'Thi công',weight:50,progress:60}];
 let work=await ok('v2/records','POST',{kind:'work',code:'SC-AUDIT-STEPS',name:'Công trình dùng mốc',group:'Khu vực kho',responsibleId:1,due:offset(10),steps});assert.equal(work.progress,40);assert.equal(work.history.at(-1).status,'Ghi nhận tiến độ 40%');
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,progress:100,start:today(),completed:today()})).status,400,'Không lấy % khai báo để bỏ qua tiến độ các mốc');
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,steps:[{name:'Mốc gần xong',weight:100,progress:99.9}],progress:100,start:today(),completed:today()})).status,400,'Làm tròn thành 100% chưa đồng nghĩa tất cả mốc hoàn tất');
 work=await update(work,{steps:steps.map(step=>({...step,progress:100}))});assert.equal(work.progress,100);assert.equal(work.history.at(-1).status,'Cập nhật tiến độ 100%');
 assert.equal((await call('v2/records/'+work.id,'PUT',{...work,steps:[{...work.steps[0],weight:100,actualStart:offset(1)}]})).status,400);
 let investment=await ok('v2/records','POST',{kind:'investment',code:'DT-AUDIT-STEPS',name:'Đầu tư theo mốc',group:'Khu vực kho',unit:'Phòng Kỹ thuật',due:offset(10),steps:[{name:'Mốc đầu tư',weight:100,progress:0}]});
 assert.equal((await call('v2/records/'+investment.id,'PUT',{...investment,steps:[{name:'Mốc đầu tư',weight:100,progress:25}]})).status,400,'Thay mốc không được bỏ qua bước được cập nhật tiến độ');
 for(const status of ['Khảo sát hiện trạng','Lập và duyệt dự án','Lựa chọn nhà thầu','Chờ bàn giao'])investment=await transition(investment,status);
 investment=await update(investment,{handover:today(),start:today()});investment=await transition(investment,'Đang thực hiện');investment=await update(investment,{steps:[{name:'Mốc đầu tư',weight:100,progress:100}],completed:today()});assert.equal(investment.progress,100);investment=await transition(investment,'Hoàn thành xây dựng');
 assert.equal((await call('v2/records/'+investment.id,'PUT',{...investment,completed:'',steps:[{name:'Mốc đầu tư',weight:100,progress:50}]})).status,400,'Không để trạng thái Hoàn thành nhưng tiến độ còn 50%');
});
