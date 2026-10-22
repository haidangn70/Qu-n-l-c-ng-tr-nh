// Local or Render Shell only. Resets one administrator without deleting any records.
import {DatabaseSync} from 'node:sqlite';
import {randomBytes,scryptSync} from 'node:crypto';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=import.meta.dirname,data=resolve(process.env.DATA_DIR||resolve(root,'data'));
mkdirSync(data,{recursive:true});
const path=resolve(data,'app.sqlite'),existed=existsSync(path),db=new DatabaseSync(path);
db.exec('PRAGMA busy_timeout=10000');
if(existed){const backup=resolve(data,'before-account-reset-'+Date.now()+'.sqlite');db.exec("VACUUM INTO '"+backup.replaceAll('\\','/').replaceAll("'","''")+"'");}
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,at TEXT,user_id INTEGER,action TEXT,record_id INTEGER,detail TEXT);`);
const username=process.env.ADMIN_USERNAME||'admin',password=process.env.ADMIN_PASSWORD||randomBytes(18).toString('base64url');
if(password.length<12)throw Error('Mật khẩu cần ít nhất 12 ký tự');
const salt=randomBytes(16).toString('hex'),hash=salt+':'+scryptSync(password,salt,64).toString('hex');
db.exec('BEGIN IMMEDIATE');try{
 const existing=db.prepare('SELECT id FROM users WHERE username=?').get(username);
 let id=existing?.id;
 if(existing)db.prepare("UPDATE users SET password=?,role='admin',active=1 WHERE id=?").run(hash,id);
 else id=Number(db.prepare("INSERT INTO users(name,username,password,role) VALUES('Quản trị hệ thống',?,?,'admin')").run(username,hash).lastInsertRowid);
 db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
 db.prepare('INSERT INTO audit(at,user_id,action,record_id,detail) VALUES(?,?,?,?,?)').run(new Date().toISOString(),id,'local-admin-reset',null,JSON.stringify({username}));
 db.exec('COMMIT');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
const output=resolve(root,'.private-login.txt');
writeFileSync(output,`THÔNG TIN ĐĂNG NHẬP RIÊNG — KHÔNG UPLOAD LÊN GITHUB\n\nTên đăng nhập: ${username}\nMật khẩu: ${password}\n\nĐã đặt lại tài khoản trong: ${data}\nKhông xóa hồ sơ hoặc ảnh. Phiên đăng nhập cũ đã được thu hồi.\n\nTRÊN RENDER MỚI:\nĐặt ADMIN_USERNAME=${username}\nĐặt ADMIN_PASSWORD bằng mật khẩu ở trên trong Environment của Render.\nTài khoản được tạo tự động khi cơ sở dữ liệu chưa có người dùng.\nNếu Render đã có dữ liệu, dùng Quên mật khẩu với RECOVERY_TOKEN, hoặc chạy reset-admin.mjs trong Render Shell.\nĐổi mật khẩu tại mục Tài khoản sau lần đăng nhập đầu.\n`,{mode:0o600});
console.log('Đã đặt lại tài khoản '+username+'. Thông tin riêng được lưu tại .private-login.txt (đã loại khỏi Git và gói triển khai).');
