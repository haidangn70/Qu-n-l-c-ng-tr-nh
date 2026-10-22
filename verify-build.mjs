import {statSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {restorePublic} from './bundle-public.mjs';
const root=import.meta.dirname;
try{const restored=restorePublic(root);if(restored)console.log('Đã phục hồi '+restored+' tệp public từ gói giao diện.')}catch(error){console.error(error.message);process.exit(1)}
const scripts=['server.mjs','operations.mjs','domain.mjs','xlsx.mjs','public/app.js','public/operations.js','public/sw.js'];
const files=[...scripts,'public/index.html','public/style.css','public/manifest.webmanifest','public/icon.svg'];
for(const file of files){try{if(!statSync(resolve(root,file)).isFile())throw Error('not a file')}catch{console.error('Thiếu tệp triển khai bắt buộc: '+file);process.exit(1)}}
for(const file of scripts)execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'inherit'});
for(const file of ['doctor.mjs','reset-admin.mjs','package-release.mjs','demo.mjs']){try{statSync(resolve(root,file))}catch{continue}execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'inherit'});}
console.log('Đã kiểm tra đầy đủ tệp giao diện và cú pháp máy chủ.');
