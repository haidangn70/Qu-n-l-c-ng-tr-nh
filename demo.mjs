// Môi trường minh họa riêng. Không chạy trên DATA_DIR dữ liệu thật.
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
const port=Number(process.env.DEMO_PORT||3109),origin=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,HOST:'127.0.0.1',PORT:String(port),DATA_DIR:resolve('demo-data'),COOKIE_SECURE:'0',PUBLIC_ORIGIN:origin},stdio:['ignore','pipe','inherit']});
child.stdout.pipe(process.stdout);child.on('exit',code=>process.exitCode=code||0);process.on('SIGINT',()=>child.kill());process.on('SIGTERM',()=>child.kill());
await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});
let cookie='';async function call(route,data){const r=await fetch(origin+'/api/'+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:cookie,'Idempotency-Key':randomBytes(16).toString('hex')},body:data?JSON.stringify(data):undefined});if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];const out=await r.json();if(!r.ok)throw Error(out.error);return out}
if((await call('setup')).needed){
 const password=randomBytes(15).toString('base64url');await call('setup',{username:'minhhoa',name:'Quản trị [MINH HỌA]',password});await call('login',{username:'minhhoa',password});
 for(const data of [{code:'DEMO-HT-001',name:'[MINH HỌA] Cầu cảng số 1',assetType:'infrastructure',group:'Cầu cảng',location:'Khu cầu 1',technical:'Cần theo dõi'},{code:'DEMO-TB-001',name:'[MINH HỌA] Cần trục QC 01',assetType:'equipment',group:'Cần trục giàn QC',location:'Tuyến tiền phương',technical:'Tốt'}])await call('v2/records',{kind:'asset',unit:'Đơn vị minh họa',operation:'Đang sử dụng',responsibleId:1,...data});
 console.log(`MÔI TRƯỜNG MINH HỌA: ${origin}\nTài khoản: minhhoa\nMật khẩu ngẫu nhiên của môi trường minh họa: ${password}\nDữ liệu: demo-data/; tách khỏi data/.`);
}else console.log('Dùng tài khoản minh họa đã thiết lập lần trước. Mật khẩu không được lưu dạng rõ.');
