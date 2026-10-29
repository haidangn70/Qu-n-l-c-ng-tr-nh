import {randomBytes} from 'node:crypto';
import {today,days,lastProgressDate} from './domain.mjs';
import {readXlsx} from './xlsx.mjs';

export const infrastructure=['Khu vực Cầu cảng','Khu vực đường bãi xếp hàng','Nhà văn phòng','Khu vực cổng cảng','Khu vực kho','Khu vực nhà xưởng sửa chữa','Khu vực bãi roro','Nạo vét khu nước trước bến, luồng hàng hải','Khu vực khác'];
export const equipment=['Cần trục giàn QC','Cần trục chân đế Tukan','Cần trục giàn RTG','Xe nâng container RS','Xe nâng hàng FL','Ô tô vận chuyển'];
export const flows={damage:['Mới ghi nhận','Đánh giá','Đề xuất','Phê duyệt','Lập công việc','Thực hiện','Nghiệm thu','Đóng hư hỏng'],work:['Chờ phê duyệt','Đã phê duyệt','Chờ bàn giao','Đang thực hiện','Hoàn thành sửa chữa','Chờ nghiệm thu','Đã nghiệm thu','Đã đóng'],investment:['Đề xuất đầu tư','Khảo sát hiện trạng','Lập và duyệt dự án','Lựa chọn nhà thầu','Chờ bàn giao','Đang thực hiện','Hoàn thành xây dựng','Chờ nghiệm thu','Đã nghiệm thu','Đã đóng']};
const operation=['Đang sử dụng','Hạn chế sử dụng','Tạm dừng','Ngừng sử dụng'],technical=['Tốt','Cần theo dõi','Hư hỏng nhẹ','Hư hỏng nặng','Nguy cơ mất an toàn'];
const kinds=['asset','inspection','damage','work','investment','maintenance'];
const project=k=>['work','investment'].includes(k);
export function installOperations({db,assert,body,record,allowed,audit,hash,publicUser}){
 if(!db.prepare('PRAGMA table_info(users)').all().some(c=>c.name==='unit'))db.exec("ALTER TABLE users ADD COLUMN unit TEXT NOT NULL DEFAULT ''");
 db.exec(`CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY,applied TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS catalogs(id INTEGER PRIMARY KEY,type TEXT NOT NULL,name TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,UNIQUE(type,name));
 CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY,record_id INTEGER NOT NULL,category TEXT NOT NULL,due TEXT NOT NULL,message TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(record_id,category,due));
 CREATE TABLE IF NOT EXISTS alert_receipts(alert_id INTEGER,user_id INTEGER,read_at TEXT,resolved_at TEXT,PRIMARY KEY(alert_id,user_id));
 CREATE TABLE IF NOT EXISTS request_keys(user_id INTEGER,key TEXT,result_id INTEGER NOT NULL,PRIMARY KEY(user_id,key));
 CREATE TABLE IF NOT EXISTS operation_settings(id INTEGER PRIMARY KEY CHECK(id=1),thresholds TEXT NOT NULL DEFAULT '[7,3,1]',stale_days INTEGER NOT NULL DEFAULT 7);
 INSERT OR IGNORE INTO operation_settings(id) VALUES(1);
 CREATE UNIQUE INDEX IF NOT EXISTS unique_operations_code ON records(json_extract(data,'$.code')) WHERE kind IN ('asset','inspection','damage','work','maintenance');
 INSERT OR IGNORE INTO migrations VALUES(2,datetime('now'));`);
 for(const [type,names] of [['infrastructure',infrastructure],['equipment',equipment],['equipmentGroup',['Tuyến tiền phương','Tuyến hậu phương']]])for(const name of names)db.prepare('INSERT OR IGNORE INTO catalogs(type,name) VALUES(?,?)').run(type,name);
 if(!db.prepare('SELECT version FROM migrations WHERE version=3').get()){
  db.exec("BEGIN IMMEDIATE; UPDATE operation_settings SET thresholds='[4,1,0]' WHERE thresholds='[7,3,1]'; DROP INDEX IF EXISTS unique_operations_code; CREATE UNIQUE INDEX unique_operations_code ON records(json_extract(data,'$.code')) WHERE kind IN ('asset','inspection','damage','work','investment','maintenance'); INSERT INTO migrations VALUES(3,datetime('now')); COMMIT;");
 }
 if(!db.prepare('SELECT version FROM migrations WHERE version=4').get()){
  const aliases={'Cầu cảng':'Khu vực Cầu cảng','Khu vực bãi':'Khu vực đường bãi xếp hàng','Kho':'Khu vực kho','Cổng ra vào':'Khu vực cổng cảng'};
  db.exec('BEGIN IMMEDIATE');try{
   for(const [oldName,newName] of Object.entries(aliases)){
    db.prepare("UPDATE records SET data=json_set(data,'$.group',?) WHERE kind IN ('asset','work','investment') AND json_extract(data,'$.group')=?").run(newName,oldName);
    db.prepare("UPDATE catalogs SET active=0 WHERE type='infrastructure' AND name=?").run(oldName);
   }
   db.prepare("INSERT INTO migrations VALUES(4,datetime('now'))").run();db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 const all=()=>db.prepare("SELECT id FROM records WHERE kind IN ('asset','inspection','damage','work','investment','maintenance') ORDER BY id DESC").all().map(x=>record(x.id));
 const canApprove=u=>['admin','approver'].includes(u.role);
 const writer=u=>assert(['admin','approver','manager','technician','repairer'].includes(u.role),'Bạn không có quyền chỉnh sửa',403);
 const approve=u=>assert(canApprove(u),'Cần quyền lãnh đạo/phê duyệt',403);
 const date=(v,label)=>{if(v)assert(/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Ngày không hợp lệ: '+label)};
 const visible=(u,id,kind)=>{const r=record(Number(id));assert(r&&allowed(u,r)&&(!kind||r.kind===kind),'Không tìm thấy hoặc không có quyền hồ sơ liên quan',404);return r};
 function validate(u,k,d,old){
  assert(typeof d.name==='string'&&d.name.trim()&&d.name.length<=300,'Tên hồ sơ là bắt buộc (tối đa 300 ký tự)');
  assert(typeof d.code==='string'&&/^[\p{L}\p{N}_.\/-]{1,60}$/u.test(d.code),'Mã hồ sơ không hợp lệ');
  for(const key of ['plannedStart','due','start','completed','accepted','handover','inService','inspectionDate','expiry','nextInspection','detected','originalDue'])date(d[key],key);
  for(const key of ['start','completed','accepted','handover','inspectionDate','detected'])if(d[key])assert(d[key]<=today(),'Ngày thực tế không được ở tương lai: '+key);
  for(const key of ['budget','approvedBudget','cost','hours','km','quantity','cycle','meterDue'])if(d[key]!==undefined&&d[key]!=='')assert(Number.isFinite(Number(d[key]))&&Number(d[key])>=0,'Số liệu phải hữu hạn và không âm: '+key);
  assert(Array.isArray(d.assignees),'Danh sách phối hợp không hợp lệ');
  d.assignees=[...new Set(d.assignees.map(Number))];assert(d.assignees.every(id=>Number.isSafeInteger(id)&&id>0),'Tài khoản phối hợp không hợp lệ');
  if(['work','damage','inspection','investment'].includes(k))for(const [key,max] of [['responsibleName',300],['collaboratorNames',1500]]){if(d[key]!==undefined){assert(typeof d[key]==='string'&&d[key].length<=max,'Tên phân công không hợp lệ (tối đa '+max+' ký tự)');d[key]=d[key].trim();}}
  if(k==='investment'&&d.assetName!==undefined){assert(typeof d.assetName==='string'&&d.assetName.length<=1000,'Hạng mục liên quan tối đa 1.000 ký tự');d.assetName=d.assetName.trim();}
  if(!canApprove(u)&&k==='asset'&&u.unit)assert(d.unit===u.unit||old&&d.unit===old.unit,'Không được chuyển hồ sơ sang đơn vị ngoài phạm vi',403);
  if(!canApprove(u)&&old)assert(Number(d.responsibleId||0)===Number(old.responsibleId||0),'Chỉ lãnh đạo được thay đổi người phụ trách',403);
  if(!canApprove(u))assert(String(d.approvedBudget||'')===String(old?.approvedBudget||''),'Chỉ lãnh đạo được cập nhật kinh phí phê duyệt',403);
  for(const id of d.assignees)assert(db.prepare('SELECT id FROM users WHERE id=? AND active=1').get(id),'Tài khoản phối hợp không hợp lệ');
  if(d.responsibleId)assert(db.prepare('SELECT id FROM users WHERE id=? AND active=1').get(Number(d.responsibleId)),'Người phụ trách không hợp lệ');
  if(k==='asset'){
   assert(['infrastructure','equipment'].includes(d.assetType),'Chọn loại tài sản');
   assert(db.prepare('SELECT id FROM catalogs WHERE type=? AND name=? AND active=1').get(d.assetType,d.group)||old?.group===d.group,'Danh mục chưa được kích hoạt');
   if(d.assetType==='equipment'){d.line=d.line||(equipment.slice(0,2).includes(d.group)?'Tuyến tiền phương':equipment.includes(d.group)?'Tuyến hậu phương':'');assert(!d.line||db.prepare("SELECT id FROM catalogs WHERE type='equipmentGroup' AND name=? AND active=1").get(d.line)||old?.line===d.line,'Nhóm tuyến thiết bị không hợp lệ');}
   assert(d.unit&&d.location&&d.responsibleId,'Cần đơn vị, vị trí và người phụ trách');
   assert(operation.includes(d.operation)&&technical.includes(d.technical),'Trạng thái tài sản không hợp lệ');
   if(d.parentId){const p=visible(u,d.parentId,'asset');assert(p.id!==old?.id,'Tài sản không thể là cấp trên của chính nó');let parent=p;const seen=new Set([old?.id]);while(parent){assert(!seen.has(parent.id),'Cấu trúc tài sản tạo vòng lặp');seen.add(parent.id);parent=parent.parentId?record(parent.parentId):null;}}
  }else if(!project(k)&&(!['damage','inspection'].includes(k)||d.assetId)){visible(u,d.assetId,'asset');}
  if(k==='inspection'){
   for(const [key,max] of [['assetName',1000],['inspector',2000],['responsibleTitle',300],['collaboratorTitles',1500],['unit',300],['conclusion',10000]])if(d[key]!==undefined){assert(typeof d[key]==='string'&&d[key].length<=max,'Thông tin phiếu kiểm tra không hợp lệ: '+key+' (tối đa '+max+' ký tự)');d[key]=d[key].trim();}
   assert(d.assetId||d.assetName,'Nhập hạng mục hạ tầng cần kiểm tra');
   assert(d.inspectionDate&&d.conclusion&&d.inspector,'Phiếu kiểm tra cần ngày, người kiểm tra và kết luận');
   assert(!d.technical||technical.includes(d.technical),'Đánh giá kỹ thuật không hợp lệ');
   if(!d.assetId&&!canApprove(u)&&u.unit)assert(d.unit===u.unit||old&&d.unit===old.unit,'Không được chuyển phiếu kiểm tra sang đơn vị ngoài phạm vi',403);
  }
  if(k==='damage'){
   assert(d.description&&d.detected&&d.due,'Hư hỏng cần mô tả, ngày phát hiện và hạn xử lý');
   if(d.group!==undefined){
    assert(typeof d.group==='string'&&d.group.length<=300,'Khu vực hư hỏng không hợp lệ');d.group=d.group.trim();
    if(d.group)assert(db.prepare("SELECT id FROM catalogs WHERE type='infrastructure' AND name=? AND active=1").get(d.group)||old?.group===d.group||d.assetId&&record(Number(d.assetId))?.group===d.group,'Chọn khu vực hư hỏng trong danh mục');
   }
   if(d.location!==undefined){assert(typeof d.location==='string'&&d.location.length<=2000,'Vị trí, địa điểm hư hỏng tối đa 2.000 ký tự');d.location=d.location.trim();}
   assert(d.assetId||d.location,'Nhập vị trí, địa điểm hư hỏng');
   if(!d.assetId&&!canApprove(u)&&u.unit)assert(d.unit===u.unit||old&&d.unit===old.unit,'Không được chuyển hồ sơ sang đơn vị ngoài phạm vi',403);
   assert(['Thấp','Trung bình','Cao','Khẩn cấp'].includes(d.priority),'Chọn mức ưu tiên');
   if(d.inspectionId){const i=visible(u,d.inspectionId,'inspection');assert(Number(i.assetId||0)===Number(d.assetId||0),'Phiếu kiểm tra thuộc tài sản khác');}
   if(!canApprove(u))assert((d.confirmedCause||'')===(old?.confirmedCause||''),'Chỉ người phê duyệt được kết luận nguyên nhân',403);
  }
  if(project(k)){
   assert(Array.isArray(d.damageIds||[]),'Danh sách hư hỏng không hợp lệ');
   d.damageIds=[...new Set((d.damageIds||[]).map(Number))];assert(d.damageIds.every(id=>Number.isSafeInteger(id)&&id>0),'Liên kết hư hỏng không hợp lệ');
   const validArea=!!d.group&&(db.prepare("SELECT id FROM catalogs WHERE type='infrastructure' AND name=? AND active=1").get(d.group)||old?.group===d.group);
   if(k==='work'){
    assert(d.assetId||(d.damageIds||[]).length||validArea,'Chọn khu vực hạ tầng cho công trình sửa chữa');
    if(d.group)assert(validArea,'Khu vực hạ tầng không hợp lệ');
   }
   if(d.assetId){const asset=visible(u,d.assetId,'asset');assert(asset.assetType==='infrastructure','Công trình phải thuộc hạ tầng');}
   if(k==='investment')assert(d.assetId||db.prepare("SELECT id FROM catalogs WHERE type='infrastructure' AND name=? AND active=1").get(d.group)||old?.group===d.group,'Chọn khu vực đầu tư');
   for(const id of d.damageIds||[]){const damage=visible(u,id,'damage');assert(!d.assetId||Number(damage.assetId)===Number(d.assetId),'Hư hỏng không thuộc hạng mục đã chọn');assert(['Phê duyệt','Lập công việc','Thực hiện','Nghiệm thu'].includes(damage.status)||damage.status==='Đóng hư hỏng'&&old?.damageIds?.includes(damage.id)&&['Đã nghiệm thu','Đã đóng'].includes(old.status),'Hư hỏng chưa phê duyệt hoặc đã đóng');}
   const relatedUnits=[d.assetId&&record(d.assetId)?.unit,...(d.damageIds||[]).flatMap(id=>{const damage=record(id);return [damage?.unit,damage?.assetId&&record(damage.assetId)?.unit];})].filter(Boolean);
   if(!d.unit)d.unit=old?.unit||relatedUnits[0]||u.unit||'';
   assert(typeof d.unit==='string'&&d.unit.length<=300,'Đơn vị công trình không hợp lệ');d.unit=d.unit.trim();
   if(!canApprove(u)&&u.unit)assert(d.unit===u.unit||old&&d.unit===old.unit||relatedUnits.includes(d.unit),'Không được chuyển công trình sang đơn vị ngoài phạm vi',403);
   assert(d.due,'Cần hạn hoàn thành');
   if(k==='work')assert(d.responsibleId,'Cần người phụ trách công trình sửa chữa');
   assert(d.progress!==''&&d.progress!=null&&Number.isFinite(Number(d.progress))&&Number(d.progress)>=0&&Number(d.progress)<=100,'Tiến độ phải từ 0 đến 100%');d.progress=Number(d.progress);
   assert(!d.completed||d.start&&d.completed>=d.start,'Ngày hoàn thành phải từ ngày bắt đầu');
   assert(!d.accepted||d.completed&&d.accepted>=d.completed,'Ngày nghiệm thu phải từ ngày hoàn thành');
   assert(!d.due||!d.plannedStart||d.due>=d.plannedStart,'Hạn hoàn thành phải từ ngày dự kiến thi công');
   assert(!d.start||!d.handover||d.start>=d.handover,'Ngày thi công phải từ ngày bàn giao mặt bằng');
   assert(d.steps===undefined||Array.isArray(d.steps),'Danh sách mốc công việc không hợp lệ');
   if(d.steps?.length){assert(d.steps.every(s=>s.name&&Number(s.weight)>=0&&Number(s.progress)>=0&&Number(s.progress)<=100),'Mốc công việc không hợp lệ');assert(Math.abs(d.steps.reduce((s,x)=>s+Number(x.weight),0)-100)<0.0001,'Tổng trọng số phải bằng 100%');
    for(const step of d.steps){for(const key of ['plannedStart','plannedEnd','actualStart','actualEnd'])date(step[key],'mốc '+step.name);assert(!step.plannedEnd||step.plannedStart&&step.plannedEnd>=step.plannedStart,'Lịch kế hoạch mốc không hợp lệ');assert(!step.actualEnd||step.actualStart&&step.actualEnd>=step.actualStart,'Lịch thực hiện mốc không hợp lệ');if(step.quantity!==''&&step.quantity!==undefined){assert(Number(step.quantity)>0&&Number(step.done)>=0&&Number(step.done)<=Number(step.quantity),'Khối lượng mốc ngoài phạm vi kế hoạch');}if(step.responsibleId)assert(db.prepare('SELECT id FROM users WHERE id=? AND active=1').get(Number(step.responsibleId)),'Người phụ trách mốc không hợp lệ');}
    for(const step of d.steps)for(const key of ['actualStart','actualEnd'])if(step[key])assert(step[key]<=today(),'Ngày thực tế của mốc không được ở tương lai');
    d.progress=Math.round(d.steps.reduce((s,x)=>s+Number(x.weight)*Number(x.progress)/100,0));}
   assert(!d.completed||Number(d.progress)===100&&!(d.steps||[]).some(step=>Number(step.progress)!==100),'Ngày hoàn thành cần tiến độ 100% và hoàn tất các mốc');
   if(['Hoàn thành sửa chữa','Hoàn thành xây dựng','Chờ nghiệm thu'].includes(d.status))assert(d.completed&&Number(d.progress)===100,'Công trình đã chuyển hoàn thành phải giữ ngày hoàn thành và tiến độ 100%');
   if(old&&days(today(),old.due)>0&&Number(d.progress)!==Number(old.progress))assert(d.delayCause&&d.remedy&&d.expectedCompletion,'Công việc quá hạn cần nguyên nhân, biện pháp và ngày dự kiến hoàn thành');
   date(d.expectedCompletion,'dự kiến hoàn thành');
  }
  if(k==='maintenance'){
   assert(d.due&&Number(d.cycle)>0&&['Ngày','Giờ','Km'].includes(d.cycleUnit),'Kế hoạch cần hạn, chu kỳ và đơn vị chu kỳ');
   assert(d.responsibleId,'Cần người thực hiện');
  }
 }
 function put(u,k,d,old=null,action='update'){
  validate(u,k,d,old);const at=new Date().toISOString();let id;
  if(old){id=old.id;assert(db.prepare('UPDATE records SET data=?,updated=?,version=version+1 WHERE id=? AND version=?').run(JSON.stringify(d),at,id,old.version).changes,'Hồ sơ đã thay đổi, tải lại trước khi lưu',409)}
  else id=Number(db.prepare('INSERT INTO records(kind,data,updated) VALUES(?,?,?)').run(k,JSON.stringify(d),at).lastInsertRowid);
  audit(u,action,id,{before:old,after:d});
  if(k==='inspection'&&d.technical&&d.assetId){const asset=record(d.assetId);put(u,'asset',{...asset,technical:d.technical,lastInspection:d.inspectionDate,history:[...(asset.history||[]),{at,by:u.id,name:u.name,status:d.technical,previous:asset.technical,inspectionId:id}]},asset,'inspection-assessment');}
  return record(id);
 }
 function transaction(fn){db.exec('BEGIN IMMEDIATE');try{const r=fn();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}
 const stamp=(u,status,reason)=>({at:new Date().toISOString(),by:u.id,name:u.name,status,reason:reason||''});
 function scan(){
  const now=today(),at=new Date().toISOString(),settings=db.prepare('SELECT * FROM operation_settings').get(),thresholds=JSON.parse(settings.thresholds).sort((a,b)=>a-b);
  for(const r of [...all(),...db.prepare("SELECT id FROM records WHERE kind='project'").all().map(x=>record(x.id))]){
   if(r.archived||r.completed||['Đã đóng','Đóng hư hỏng','Đã hủy','Đã nghiệm thu','Hoàn thành','Từ chối'].includes(r.status))continue;
   const candidates=[['deadline',r.due||r.deadline],...(r.kind==='asset'?[['inspection',r.expiry],['check',r.nextInspection]]:[])];
   for(const [category,due] of candidates){if(!due)continue;const left=days(due,now),level=left<0?'overdue':(r.kind==='work'?[0,1,4]:thresholds).find(t=>left<=t);if(level===undefined)continue;const msg=`${r.code||r.id} · ${r.name}: ${left<0?'quá hạn '+(-left):'còn '+left} ngày (${category==='inspection'?'kiểm định':category==='check'?'kiểm tra':r.kind==='work'?'hoàn thành sửa chữa':'xử lý'})`;db.prepare('INSERT INTO alerts(record_id,category,due,message,created) VALUES(?,?,?,?,?) ON CONFLICT(record_id,category,due) DO UPDATE SET message=excluded.message').run(r.id,category+'-'+level,due,msg,at);}
   const progressDate=lastProgressDate(r);
   if(project(r.kind)&&r.status==='Đang thực hiện'&&progressDate&&days(now,progressDate)>=settings.stale_days)db.prepare('INSERT INTO alerts(record_id,category,due,message,created) VALUES(?,?,?,?,?) ON CONFLICT(record_id,category,due) DO UPDATE SET message=excluded.message').run(r.id,'stale',progressDate,r.name+': chưa cập nhật tiến độ từ '+settings.stale_days+' ngày',at);
   if(r.kind==='maintenance'&&r.meterDue&&['Giờ','Km'].includes(r.cycleUnit)){const asset=record(r.assetId),meter=Number(asset?.[r.cycleUnit==='Giờ'?'hours':'km']||0);if(meter>=Number(r.meterDue))db.prepare('INSERT OR IGNORE INTO alerts(record_id,category,due,message,created) VALUES(?,?,?,?,?)').run(r.id,'meter',String(r.meterDue),r.name+': đến mốc '+r.meterDue+' '+r.cycleUnit+' (hiện tại '+meter+')',at);}
  }
 }
 scan();const timer=setInterval(()=>{try{scan()}catch(e){console.error('Lỗi tạo cảnh báo:',e.message)}},process.env.NODE_ENV==='test'?Number(process.env.ALERT_INTERVAL_MS||60000):60000);timer.unref();
 return async function handle({path,req,res,u,send,url}){
  if(!path.startsWith('/api/v2/'))return false;
  const route=path.slice(8),method=req.method;
  const reply=(status,data)=>{send(status,data);return true};
  if(route==='import'){
   writer(u);assert(method==='POST','Phương thức không hợp lệ',405);const b=await body(req),sheet=readXlsx(Buffer.from(b.base64||'','base64'));
   const header=['Mã','Tên','Loại','Nhóm','Đơn vị','Khu vực','Vị trí','Vận hành','Kỹ thuật','Người phụ trách (ID)'];assert(header.every((h,i)=>sheet[0]?.[i]===h),'Không đúng cột trong tệp mẫu nhập tài sản');
   const seen=new Set(),preview=sheet.slice(1).map((row,index)=>{const d={kind:'asset',code:row[0],name:row[1],assetType:row[2],group:row[3],unit:row[4],region:row[5]||'',location:row[6],operation:row[7],technical:row[8],responsibleId:Number(row[9]),owner:u.id,assignees:[],history:[],extensions:[],logs:[],downtime:[],status:'Đã ghi nhận'};let error='';try{validate(u,'asset',d);assert(!seen.has(d.code)&&!db.prepare("SELECT id FROM records WHERE kind IN ('asset','inspection','damage','work','investment','maintenance') AND json_extract(data,'$.code')=?").get(d.code),'Mã đã tồn tại');seen.add(d.code)}catch(err){error=err.message}return {row:index+2,data:d,error}});
   if(!b.commit)return reply(200,{preview});
   assert(preview.length&&preview.every(p=>!p.error),'Cần sửa hết lỗi trước khi nhập');
   const imported=transaction(()=>preview.map(p=>put(u,'asset',p.data,null,'import')));scan();return reply(201,{imported:imported.length});
  }
  if(route==='settings'){
   if(method==='PUT'){approve(u);const b=await body(req);assert(Array.isArray(b.thresholds)&&b.thresholds.length>0&&b.thresholds.length<=10&&b.thresholds.every(n=>Number.isInteger(n)&&n>=0&&n<=365),'Các mốc cảnh báo phải là số ngày từ 0 đến 365');assert(Number.isInteger(b.staleDays)&&b.staleDays>0&&b.staleDays<=365,'Ngày chưa cập nhật từ 1 đến 365');db.prepare('UPDATE operation_settings SET thresholds=?,stale_days=? WHERE id=1').run(JSON.stringify([...new Set(b.thresholds)]),b.staleDays);audit(u,'alert-settings',null,b);scan()}else assert(method==='GET','Phương thức không hợp lệ',405);
   const s=db.prepare('SELECT * FROM operation_settings').get();return reply(200,{thresholds:JSON.parse(s.thresholds),staleDays:s.stale_days});
  }
  if(route==='catalogs'){
   if(method==='POST'){assert(u.role==='admin','Chỉ quản trị viên',403);const b=await body(req);assert(['infrastructure','equipment','equipmentGroup'].includes(b.type)&&b.name?.trim(),'Danh mục không hợp lệ');db.prepare('INSERT INTO catalogs(type,name) VALUES(?,?)').run(b.type,b.name.trim());audit(u,'catalog-create',null,b)}
   else if(method==='PUT'){assert(u.role==='admin','Chỉ quản trị viên',403);const b=await body(req);assert(b.name?.trim(),'Nhập tên danh mục');const c=db.prepare('SELECT * FROM catalogs WHERE id=?').get(Number(b.id));assert(c,'Không tìm thấy danh mục',404);transaction(()=>{db.prepare('UPDATE catalogs SET name=?,active=? WHERE id=?').run(b.name.trim(),b.active?1:0,c.id);if(c.type==='infrastructure'&&c.name!==b.name.trim()){for(const r of all().filter(r=>['asset','work','investment','damage'].includes(r.kind)&&r.group===c.name)){const d={...r,group:b.name.trim()};db.prepare('UPDATE records SET data=?,version=version+1,updated=? WHERE id=?').run(JSON.stringify(d),new Date().toISOString(),r.id);audit(u,'catalog-rename-record',r.id,{old:c.name,new:b.name.trim()});}}audit(u,'catalog-update',null,b)})}else assert(method==='GET','Phương thức không hợp lệ',405);
   return reply(200,{catalogs:db.prepare('SELECT * FROM catalogs ORDER BY type,id').all(),flows,operation,technical});
  }
  if(route==='users'){
   assert(u.role==='admin','Chỉ quản trị viên',403);assert(method==='PUT','Phương thức không hợp lệ',405);const b=await body(req);const target=db.prepare('SELECT * FROM users WHERE id=?').get(Number(b.id));assert(target,'Không tìm thấy tài khoản',404);
   assert(b.id!==u.id||b.active!==false,'Không tự khóa tài khoản');
   if(b.password)assert(b.password.length>=12,'Mật khẩu ít nhất 12 ký tự');
   if(b.role)assert(['admin','approver','manager','technician','repairer','collaborator','viewer'].includes(b.role),'Vai trò không hợp lệ');
   assert(!(target.role==='admin'&&(b.active===false||b.role&&b.role!=='admin'))||db.prepare("SELECT count(*) AS n FROM users WHERE role='admin' AND active=1 AND id<>?").get(target.id).n>0,'Phải giữ ít nhất một quản trị viên hoạt động');
   assert(b.unit===undefined||typeof b.unit==='string'&&b.unit.length<=200,'Đơn vị không hợp lệ');
   db.prepare('UPDATE users SET active=?,password=?,role=?,unit=? WHERE id=?').run(b.active===undefined?target.active:b.active?1:0,b.password?hash(b.password):target.password,b.role||target.role,b.unit===undefined?target.unit:b.unit.trim(),target.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(target.id);audit(u,'user-update',null,{id:target.id,active:b.active,role:b.role,unit:b.unit,passwordChanged:!!b.password});return reply(200,{ok:true});
  }
  if(route==='password'){
   assert(method==='POST','Phương thức không hợp lệ',405);const b=await body(req);assert(b.password?.length>=12,'Mật khẩu ít nhất 12 ký tự');
   const {scryptSync,timingSafeEqual}=await import('node:crypto');const [salt,key]=u.password.split(':');assert(timingSafeEqual(scryptSync(b.current||'',salt,64),Buffer.from(key,'hex')),'Mật khẩu hiện tại không đúng',403);
   db.prepare('UPDATE users SET password=? WHERE id=?').run(hash(b.password),u.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);audit(u,'password-change',null,{});return reply(200,{ok:true});
  }
  if(route==='alerts'){
   if(method==='POST'){const b=await body(req);const a=db.prepare('SELECT * FROM alerts WHERE id=?').get(b.id);assert(a,'Không tìm thấy cảnh báo',404);visible(u,a.record_id);db.prepare('INSERT INTO alert_receipts VALUES(?,?,?,?) ON CONFLICT(alert_id,user_id) DO UPDATE SET read_at=excluded.read_at,resolved_at=COALESCE(excluded.resolved_at,alert_receipts.resolved_at)').run(a.id,u.id,new Date().toISOString(),b.resolved?new Date().toISOString():null)}else assert(method==='GET','Phương thức không hợp lệ',405);
   const settings=db.prepare('SELECT * FROM operation_settings').get(),thresholds=JSON.parse(settings.thresholds).sort((a,b)=>a-b);
   return reply(200,db.prepare('SELECT a.*,r.read_at,r.resolved_at FROM alerts a LEFT JOIN alert_receipts r ON a.id=r.alert_id AND r.user_id=? ORDER BY a.id DESC').all(u.id).filter(a=>{
    const r=record(a.record_id);if(!r||!allowed(u,r)||r.archived||r.completed||['Đã đóng','Đóng hư hỏng','Hoàn thành','Đã hủy','Đã nghiệm thu','Từ chối'].includes(r.status))return false;
    if(a.category==='stale')return r.status==='Đang thực hiện'&&lastProgressDate(r)===a.due&&days(today(),a.due)>=settings.stale_days;
    if(a.category==='meter'){const asset=record(r.assetId);return String(r.meterDue)===a.due&&Number(asset?.[r.cycleUnit==='Giờ'?'hours':'km']||0)>=Number(r.meterDue)}
    const left=days(a.due,today()),level=left<0?'overdue':(r.kind==='work'?[0,1,4]:thresholds).find(t=>left<=t);return level!==undefined&&a.category.endsWith('-'+level)&&(r.due===a.due||r.deadline===a.due||r.expiry===a.due||r.nextInspection===a.due);
   }));
  }
  if(route==='records'){
   if(method==='GET')return reply(200,all().filter(r=>allowed(u,r)));
   assert(method==='POST','Phương thức không hợp lệ',405);writer(u);const b=await body(req);assert(kinds.includes(b.kind),'Loại hồ sơ không hợp lệ');
   const key=req.headers['idempotency-key'];assert(typeof key==='string'&&key.length>=16&&key.length<=100,'Cần khóa gửi lại hợp lệ');
   const previous=db.prepare('SELECT result_id FROM request_keys WHERE user_id=? AND key=?').get(u.id,key);if(previous)return reply(200,visible(u,previous.result_id));
   const d={...b,owner:u.id,assignees:canApprove(u)?(b.assignees||[]):[],history:[],extensions:[],logs:[],dailyLogs:[],downtime:[],status:flows[b.kind]?.[0]||(b.kind==='maintenance'?'Chưa thực hiện':'Đã ghi nhận')};
   for(const field of ['id','version','updated','archived','accepted','handover','results','_requestKey'])delete d[field];
   if(b.kind!=='work')delete d.completed;
   if(project(b.kind)){d.progress=b.kind==='work'&&b.progress!==undefined?b.progress:0;d.originalDue=d.due;d.originalStart=d.plannedStart||'';d.damageIds=b.damageIds||[];if(Array.isArray(d.steps)&&d.steps.length){if(b.kind==='investment')assert(d.steps.every(step=>Number(step.progress)===0),'Dự án đầu tư mới bắt đầu ở 0%; cập nhật theo quy trình sau khi phê duyệt');d.progress=Math.round(d.steps.reduce((sum,step)=>sum+Number(step.weight)*Number(step.progress)/100,0));}if(b.kind!=='work')delete d.start;else if(Number(d.progress)>0)d.history=[stamp(u,'Ghi nhận tiến độ '+d.progress+'%','Tiến độ khi khai báo công trình')];}
   const result=transaction(()=>{const r=put(u,b.kind,d,null,'create');db.prepare('INSERT INTO request_keys VALUES(?,?,?)').run(u.id,key,r.id);return r});scan();return reply(201,result);
  }
  const match=route.match(/^records\/(\d+)(?:\/(\w+))?$/);assert(match,'Không tìm thấy',404);let r=visible(u,match[1]);assert(kinds.includes(r.kind),'Loại hồ sơ không hỗ trợ');const action=match[2];
  if(method==='GET'&&!action)return reply(200,r);
  writer(u);assert(!r.archived||action==='archive','Hồ sơ đã lưu trữ',409);const b=await body(req);
  if(action==='daily'&&method==='POST'&&(r.dailyLogs||[]).some(l=>l.id===b.entryId))return reply(200,r);
  assert(b.version===r.version,'Hồ sơ đã được cập nhật. Giữ nội dung và tải lại để đối chiếu.',409);
  let d={...r};delete d.version;delete d.updated;delete d.id;
  if(action==='transition'){
   assert(method==='POST'&&flows[r.kind],'Không hỗ trợ chuyển trạng thái');assert(typeof b.status==='string'&&b.status.trim(),'Cần chọn trạng thái tiếp theo');assert(!['Đã đóng','Đóng hư hỏng','Đã hủy','Từ chối'].includes(r.status),'Hồ sơ đã kết thúc, không thể chuyển trạng thái');const flow=flows[r.kind],index=flow.indexOf(r.status);
   if(['Yêu cầu bổ sung','Từ chối','Tạm dừng','Đã hủy'].includes(b.status)){approve(u);assert(b.reason?.trim(),'Cần lý do');assert(!['Đã đóng','Đóng hư hỏng','Đã hủy'].includes(r.status),'Hồ sơ đã kết thúc');assert((r.kind==='damage'&&['Yêu cầu bổ sung','Từ chối'].includes(b.status))||(project(r.kind)&&['Tạm dừng','Đã hủy'].includes(b.status)),'Trạng thái không phù hợp');d.resumeStatus=r.status;}
   else{const next=r.resumeStatus&&['Yêu cầu bổ sung','Tạm dừng'].includes(r.status)?r.resumeStatus:flow[index+1];assert(b.status===next,'Chuyển trạng thái không hợp lệ');if(['Phê duyệt','Đã phê duyệt','Đã nghiệm thu','Đã đóng','Đóng hư hỏng'].includes(b.status))approve(u);}
   if(project(r.kind)){
    if(r.kind==='investment'&&['Lựa chọn nhà thầu','Chờ bàn giao'].includes(b.status))approve(u);
    if(b.status==='Đang thực hiện')assert(r.handover&&r.start,'Cần ngày bàn giao và bắt đầu thực tế');
    if(['Hoàn thành sửa chữa','Hoàn thành xây dựng'].includes(b.status))assert(Number(r.progress)===100&&r.completed,'Cần tiến độ 100% và ngày hoàn thành');
    if(b.status==='Đã nghiệm thu'){assert(r.accepted&&r.acceptanceNote,'Cần ngày và biên bản/kết luận nghiệm thu');for(const id of r.damageIds||[])assert(r.results?.[id]?.trim(),'Phải xác nhận kết quả riêng từng hư hỏng');}
   }
   if(r.kind==='damage'&&['Lập công việc','Thực hiện','Nghiệm thu','Đóng hư hỏng'].includes(b.status)){
    const linked=all().filter(w=>w.kind==='work'&&(w.damageIds||[]).includes(r.id)&&w.status!=='Đã hủy'&&(!w.archived||['Đã nghiệm thu','Đã đóng'].includes(w.status)));
    assert(linked.length,'Cần lập công trình sửa chữa liên quan trước khi chuyển bước');
    if(b.status==='Thực hiện')assert(linked.some(w=>['Đang thực hiện','Hoàn thành sửa chữa','Chờ nghiệm thu','Đã nghiệm thu','Đã đóng'].includes(w.status)),'Cần bàn giao và bắt đầu công trình sửa chữa liên quan');
    if(b.status==='Nghiệm thu')assert(linked.every(w=>w.completed||['Đã nghiệm thu','Đã đóng'].includes(w.status)),'Các công trình sửa chữa liên quan chưa hoàn thành thi công');
    if(b.status==='Đóng hư hỏng')assert(linked.every(w=>['Đã nghiệm thu','Đã đóng'].includes(w.status)&&w.results?.[r.id]?.trim()),'Các công trình sửa chữa liên quan phải nghiệm thu và có kết quả xử lý');
   }
   d.status=b.status;d.history=[...r.history,stamp(u,b.status,b.reason)];
  }else if(action==='archive'){
   approve(u);assert(method==='POST'&&typeof b.archived==='boolean'&&b.reason?.trim(),'Cần trạng thái lưu trữ và lý do');d.archived=b.archived;d.history=[...r.history,stamp(u,b.archived?'Lưu trữ':'Khôi phục',b.reason)];
  }else if(action==='extend'){
   approve(u);assert(method==='POST'&&project(r.kind)&&b.reason?.trim()&&b.due&&b.proposer,'Cần hạn mới, người đề xuất và lý do');date(b.due,'hạn mới');assert(b.due>r.due,'Gia hạn phải sau thời hạn hiện hành');d.due=b.due;d.extensions=[...r.extensions,{old:r.due,new:b.due,reason:b.reason,proposer:b.proposer,approvedBy:u.id,approvedAt:new Date().toISOString()}];
  }else if(action==='daily'){
   assert(method==='POST'&&project(r.kind)&&r.status==='Đang thực hiện','Chỉ cập nhật nhật ký khi đang thi công');
   assert(typeof b.entryId==='string'&&/^[a-f0-9-]{16,64}$/.test(b.entryId),'Cần mã nhật ký hợp lệ');
   const existing=(r.dailyLogs||[]).find(x=>x.id===b.entryId);if(existing)return reply(200,r);
   date(b.workDate,'ngày nhật ký');assert(b.workDate&&b.workDate<=today()&&b.workDate>=r.start,'Ngày nhật ký phải từ ngày khởi công đến hôm nay');
   const entryType=b.entryType||'quantity';assert(['quantity','progress'].includes(entryType),'Loại cập nhật không hợp lệ');
   if(entryType==='quantity'){
    assert(typeof b.item==='string'&&b.item.trim()&&b.item.length<=300&&typeof b.unit==='string'&&b.unit.trim()&&b.unit.length<=40,'Nhập nội dung và đơn vị khối lượng');
    assert(Number.isFinite(Number(b.quantity))&&Number(b.quantity)>=0&&b.quantity!==''&&b.quantity!=null,'Khối lượng phải là số không âm');
   }
   assert(typeof b.note==='string'&&b.note.trim()&&b.note.length<=10000,'Nhập mô tả công việc trong ngày (tối đa 10.000 ký tự)');
   assert(!(r.steps||[]).length,'Hãy cập nhật tiến độ theo mốc trên hồ sơ này');
    assert(b.progress!==''&&b.progress!=null,'Nhập phần trăm tiến độ hoàn thành');
    d.progress=Number(b.progress);d.delayCause=b.delayCause||r.delayCause;d.remedy=b.remedy||r.remedy;d.expectedCompletion=b.expectedCompletion||r.expectedCompletion;
   d.dailyLogs=[...(r.dailyLogs||[]),{id:b.entryId,entryType,workDate:b.workDate,item:entryType==='quantity'?b.item.trim():'Cập nhật tiến độ',...(entryType==='quantity'?{quantity:Number(b.quantity),unit:b.unit.trim()}:{}),note:b.note,next:b.next||'',issues:b.issues||'',progress:d.progress,at:new Date().toISOString(),by:u.id,name:u.name}];
  }else if(action==='downtime'){
   assert(method==='POST'&&r.kind==='asset'&&r.assetType==='equipment','Chỉ áp dụng cho thiết bị');const pauses=[...r.downtime];
   if(b.stop){assert(!pauses.some(p=>!p.to),'Thiết bị đã dừng');assert(b.reason?.trim(),'Cần lý do dừng');pauses.push({from:new Date().toISOString(),reason:b.reason,by:u.id});d.operation='Tạm dừng'}else{assert(pauses.length&&!pauses.at(-1).to,'Thiết bị chưa dừng');pauses[pauses.length-1]={...pauses.at(-1),to:new Date().toISOString()};d.operation='Đang sử dụng'}d.downtime=pauses;
  }else if(action==='generate'){
   assert(method==='POST'&&r.kind==='maintenance'&&!r.workId&&r.status!=='Hoàn thành','Kế hoạch đã tạo công việc');
   return reply(201,transaction(()=>{
    const damage=put(u,'damage',{code:'BD-HH-'+randomBytes(6).toString('hex'),name:'Bảo dưỡng: '+r.name,assetId:r.assetId,description:r.checklist||r.name,detected:today(),due:r.due,responsibleId:r.responsibleId,priority:'Trung bình',owner:r.owner,assignees:r.assignees,history:[stamp(u,'Phê duyệt','Công việc theo kế hoạch bảo dưỡng')],status:'Phê duyệt'},null,'maintenance-damage');
    const work=put(u,'work',{code:'BD-CV-'+randomBytes(6).toString('hex'),name:r.name,damageIds:[damage.id],responsibleId:r.responsibleId,due:r.due,originalDue:r.due,progress:0,owner:r.owner,assignees:r.assignees,history:[],extensions:[],logs:[],status:'Chờ phê duyệt',planId:r.id},null,'maintenance-work');
    put(u,r.kind,{...d,workId:work.id,status:'Đã tạo công việc'},r,'generate');return work;
   }));
  }else{
   assert(method==='PUT'&&!action,'Phương thức không hợp lệ',405);assert(!r.archived&&!['Đã nghiệm thu','Đã đóng','Đóng hư hỏng','Đã hủy','Từ chối'].includes(r.status),'Hồ sơ đã khóa');
   const immutable=['id','kind','version','updated','owner','status','history','extensions','downtime','logs','dailyLogs','originalDue','originalStart','workId','resumeStatus','archived'];
   for(const [key,value] of Object.entries(b))if(!immutable.includes(key))d[key]=value;
   if(project(r.kind)&&Array.isArray(d.steps)&&d.steps.length)d.progress=Math.round(d.steps.reduce((sum,step)=>sum+Number(step.weight)*Number(step.progress)/100,0));
   if(!canApprove(u)){d.assignees=r.assignees;assert(!b.archived,'Chỉ lãnh đạo được lưu trữ',403);assert((b.accepted||'')===(r.accepted||'')&&(b.acceptanceNote||'')===(r.acceptanceNote||''),'Chỉ người phê duyệt được nghiệm thu',403);}
   if(project(r.kind)){d.due=r.due;d.damageIds=r.damageIds||[];assert(r.kind==='work'||['Chờ bàn giao','Đang thực hiện','Tạm dừng'].includes(r.status)||Number(d.progress)===Number(r.progress),'Chưa đến bước cập nhật tiến độ');if(b.log?.trim())d.logs=[...r.logs,{at:new Date().toISOString(),by:u.id,text:b.log,progress:d.progress}];delete d.log;}
   if(project(r.kind)&&Number(d.progress)!==Number(r.progress))d.history=[...r.history,stamp(u,'Cập nhật tiến độ '+d.progress+'%',String(r.progress)+'% → '+d.progress+'%')];
   if(r.kind==='asset'&&d.technical!==r.technical)d.history=[...r.history,{...stamp(u,d.technical),previous:r.technical}];
  }
  const result=transaction(()=>{const saved=put(u,r.kind,d,r,action||'update');
   if(r.kind==='work'&&d.status==='Đã nghiệm thu'&&r.planId){const plan=visible(u,r.planId,'maintenance');put(u,'maintenance',{...plan,status:'Hoàn thành',completed:d.completed,cost:d.cost||'',result:d.acceptanceNote},plan,'maintenance-complete');}
   return saved;
  });scan();return reply(200,result);
 };
}
