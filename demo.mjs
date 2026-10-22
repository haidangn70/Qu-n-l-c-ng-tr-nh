
// All demonstration records live in preview-data/, separate from real data/.
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {today} from './domain.mjs';
const port=Number(process.env.DEMO_PORT||3109),origin=`http://127.0.0.1:${port}`,password=process.env.DEMO_PASSWORD||randomBytes(18).toString('base64url');
const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(port),DATA_DIR:resolve(import.meta.dirname,'preview-data'),COOKIE_SECURE:'0',PUBLIC_ORIGIN:origin,DEMO_MODE:'1',ADMIN_PASSWORD:''},stdio:['ignore','pipe','inherit']});
child.stdout.pipe(process.stdout);child.on('exit',code=>process.exitCode=code||0);process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);});
let cookie='';
async function call(route,data,method=data?'POST':'GET'){
 const response=await fetch(origin+'/api/'+route,{method,headers:{'Content-Type':'application/json',Cookie:cookie,'Idempotency-Key':randomBytes(16).toString('hex')},body:data?JSON.stringify(data):undefined});
 if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];const out=await response.json();if(!response.ok)throw Error(out.error);return out;
}
const offset=n=>new Date(Date.parse(today()+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const create=data=>call('v2/records',data),update=(r,data)=>call('v2/records/'+r.id,{...r,...data},'PUT'),transition=(r,status)=>call(`v2/records/${r.id}/transition`,{version:r.version,status});
if((await call('setup')).needed){
 await call('setup',{username:'minhhoa',name:'Quản trị minh họa',password});await call('login',{username:'minhhoa',password});
 await call('users',{username:'kythuat',name:'Nguyễn Văn Hùng',password:randomBytes(18).toString('hex'),role:'technician'});
 await call('users',{username:'phoihop',name:'Trần Minh Anh',password:randomBytes(18).toString('hex'),role:'collaborator'});
 const names=['Cầu cảng số 1 – kết cấu mặt cầu','Đường nội bộ khu bãi A','Nhà điều hành trung tâm','Cổng cảng số 2','Kho hàng tổng hợp số 3','Nhà xưởng cơ khí số 1','Bãi roro phía Đông','Khu nước trước bến số 1','Hệ thống thoát nước nội bộ'];
 const areas=(await call('v2/catalogs')).catalogs.filter(c=>c.type==='infrastructure'&&c.active);const assets=[];
 for(let i=0;i<areas.length;i++)assets.push(await create({kind:'asset',code:'MH-HT-'+String(i+1).padStart(3,'0'),name:'[MINH HỌA] '+names[i],assetType:'infrastructure',group:areas[i].name,unit:'Phòng Kỹ thuật',location:'Khu vực '+String(i+1).padStart(2,'0'),responsibleId:i%2?2:1,assignees:[3],operation:'Đang sử dụng',technical:['Cần theo dõi','Hư hỏng nhẹ','Tốt','Tốt','Cần theo dõi','Tốt','Tốt','Cần theo dõi','Tốt'][i],specifications:'Hồ sơ giả lập để minh họa giao diện, không dùng làm dữ liệu thực tế.'}));
 for(let i=0;i<3;i++){
  let r=await create({kind:'work',code:'MH-SC-'+(i+1),name:'[MINH HỌA] '+['Sửa chữa mặt cầu cảng số 1','Cải tạo mặt đường khu bãi A','Sửa chữa mái kho hàng số 3'][i],assetId:assets[[0,1,4][i]].id,responsibleId:i===1?2:1,assignees:[3],due:offset([4,2,14][i]),plannedStart:offset(-8),contractor:'Đơn vị thi công minh họa',supervisor:'Nguyễn Văn Hùng',budget:[280000000,450000000,180000000][i],description:'Theo dõi bàn giao mặt bằng, thi công từng phân đoạn và nghiệm thu theo hồ sơ được duyệt.'});
  if(i<2){r=await transition(r,'Đã phê duyệt');r=await transition(r,'Chờ bàn giao');r=await update(r,{handover:offset(-8),start:offset(-7)});r=await transition(r,'Đang thực hiện');await call(`v2/records/${r.id}/daily`,{version:r.version,entryId:crypto.randomUUID(),workDate:today(),item:i?'Thảm bê tông nhựa':'Đổ bê tông mặt cầu',quantity:i?150:28,unit:i?'m²':'m³',note:'[MINH HỌA] Hoàn thành khối lượng phân đoạn, kiểm tra chất lượng và vệ sinh hiện trường.',progress:i?35:68,next:'Tiếp tục thi công phân đoạn kế tiếp theo kế hoạch.'});}
 }
 for(let i=0;i<2;i++){
  let r=await create({kind:'investment',code:'MH-DT-'+(i+1),name:'[MINH HỌA] '+['Xây mới kho hàng tổng hợp','Mở rộng bãi roro phía Đông'][i],group:areas[[4,6][i]].name,unit:'Phòng Kỹ thuật',responsibleId:1,assignees:[2,3],due:offset(i?30:21),plannedStart:offset(-5),budget:i?2000000000:5000000000,description:'Dự án minh họa quá trình đề xuất, khảo sát, phê duyệt, chọn nhà thầu và xây dựng.'});
  r=await transition(r,'Khảo sát hiện trạng');r=await transition(r,'Lập và duyệt dự án');
  if(!i){r=await transition(r,'Lựa chọn nhà thầu');r=await transition(r,'Chờ bàn giao');r=await update(r,{handover:offset(-5),start:offset(-4)});r=await transition(r,'Đang thực hiện');await call(`v2/records/${r.id}/daily`,{version:r.version,entryId:crypto.randomUUID(),workDate:today(),item:'San nền kho',quantity:350,unit:'m³',note:'[MINH HỌA] San nền và kiểm tra cao độ khu vực thi công.',progress:25});}
 }
 await create({kind:'damage',code:'MH-HH-001',name:'[MINH HỌA] Nứt cục bộ mặt đường khu bãi A',assetId:assets[1].id,responsibleId:1,assignees:[3],description:'Vết nứt và bong tróc tại phân đoạn đường nội bộ. Cần khảo sát chi tiết trước khi lập phương án.',detected:today(),due:offset(4),priority:'Cao',proposal:'Khảo sát, đo đạc khối lượng và lập phương án sửa chữa cục bộ.'});
 console.log(`MINH HỌA SẴN SÀNG: ${origin}\nTài khoản: minhhoa\nMật khẩu của bản minh họa: ${password}\nDữ liệu tách riêng: preview-data/`);
}else console.log('Bản minh họa đã có dữ liệu. Dùng tài khoản minhhoa đã khởi tạo trước đó.');
