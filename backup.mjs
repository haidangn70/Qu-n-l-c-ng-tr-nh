import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,cpSync} from 'node:fs';
import {resolve} from 'node:path';
const source=resolve(process.env.DATA_DIR||'data'),target=resolve('backups',new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(target,{recursive:true});
const db=new DatabaseSync(resolve(source,'app.sqlite'));
db.exec(`VACUUM INTO '${resolve(target,'app.sqlite').replaceAll("'","''").replaceAll('\\','/')}'`);
cpSync(resolve(source,'files'),resolve(target,'files'),{recursive:true});db.close();
console.log('Đã sao lưu tại '+target+'; dừng ứng dụng khi sao lưu để bảo đảm ảnh và dữ liệu cùng thời điểm.');
