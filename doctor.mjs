import {existsSync,accessSync,constants,readFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {restorePublic} from './bundle-public.mjs';
const root=import.meta.dirname;
let errors=0;
const check=(name,fn)=>{try{const detail=fn();console.log('OK · '+name+(detail?' · '+detail:''));}catch(error){errors++;console.error('LỖI · '+name+' · '+error.message);}};
check('Node.js',()=>{if(Number(process.versions.node.split('.')[0])!==24)throw Error('Cần Node.js 24.x');return process.version;});
check('Tự phục hồi tệp giao diện còn thiếu',()=>restorePublic(root)+' tệp được phục hồi');
check('Cú pháp và đủ tệp triển khai',()=>execFileSync(process.execPath,[resolve(root,'verify-build.mjs')],{stdio:'pipe'}).toString().trim());
const data=resolve(process.env.DATA_DIR||resolve(root,'data'));
check('Thư mục lưu dữ liệu',()=>{mkdirSync(resolve(data,'files'),{recursive:true});accessSync(data,constants.W_OK);return data;});
if(existsSync(resolve(data,'app.sqlite')))check('Tính toàn vẹn cơ sở dữ liệu',()=>{const db=new DatabaseSync(resolve(data,'app.sqlite'),{readOnly:true});try{const result=db.prepare('PRAGMA quick_check').get().quick_check;if(result!=='ok')throw Error(result);return result;}finally{db.close();}});
if(process.env.RENDER==='true'){
 check('Lưu trữ Render',()=>{if(!process.env.DATA_DIR?.startsWith('/var/data'))throw Error('Đặt DATA_DIR=/var/data và gắn Persistent Disk tại đường dẫn này');return 'Cần kiểm tra disk đã gắn trên dashboard';});
 check('Cookie HTTPS',()=>{if(process.env.COOKIE_SECURE!=='1')throw Error('Đặt COOKIE_SECURE=1');});
}
console.log(errors?`${errors} lỗi cần xử lý. Công cụ không sửa mã nguồn tùy ý và không xóa dữ liệu.`:'Kiểm tra hoàn tất. Các lỗi thiếu tệp giao diện đã biết được tự khắc phục.');
process.exitCode=errors?1:0;
