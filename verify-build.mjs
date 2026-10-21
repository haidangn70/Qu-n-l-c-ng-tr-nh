import {statSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=import.meta.dirname;
const scripts=['server.mjs','operations.mjs','domain.mjs','xlsx.mjs','public/app.js','public/operations.js','public/sw.js'];
const files=[...scripts,'public/index.html','public/style.css','public/manifest.webmanifest','public/icon.svg'];
for(const file of files){try{if(!statSync(resolve(root,file)).isFile())throw Error('not a file')}catch{console.error('Thiếu tệp triển khai bắt buộc: '+file);process.exit(1)}}
for(const file of scripts)execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'inherit'});
console.log('Đã kiểm tra đầy đủ tệp giao diện và cú pháp máy chủ.');
