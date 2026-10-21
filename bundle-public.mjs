import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const files=['index.html','app.js','operations.js','style.css','manifest.webmanifest','sw.js','icon.svg'];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export function createPublicBundle(root=import.meta.dirname){
 const assets=Object.fromEntries(files.map(name=>{const bytes=readFileSync(resolve(root,'public',name));return [name,{sha256:digest(bytes),base64:bytes.toString('base64')}]}));
 writeFileSync(resolve(root,'public-bundle.json'),JSON.stringify({version:1,assets},null,2)+'\n');
 return files.length;
}

export function restorePublic(root=import.meta.dirname){
 const bundlePath=resolve(root,'public-bundle.json');
 if(!existsSync(bundlePath))return 0;
 const bundle=JSON.parse(readFileSync(bundlePath,'utf8'));
 if(bundle.version!==1||!bundle.assets||Object.keys(bundle.assets).length!==files.length)throw Error('Gói giao diện không hợp lệ');
 // Validate the whole bundle before writing any file; names never come from the bundle.
 const assets=files.map(name=>{const asset=bundle.assets[name];if(typeof asset?.base64!=='string')throw Error('Gói giao diện thiếu '+name);const bytes=Buffer.from(asset.base64,'base64');if(bytes.length>2*1024*1024||digest(bytes)!==asset.sha256)throw Error('Gói giao diện sai kiểm tra SHA-256: '+name);return [name,bytes]});
 let restored=0;for(const [name,bytes] of assets){const target=resolve(root,'public',name);if(existsSync(target)){if(digest(readFileSync(target))!==digest(bytes))throw Error('Giao diện khác gói đóng sẵn: '+name+'. Chạy node bundle-public.mjs để cập nhật gói.');continue}mkdirSync(resolve(root,'public'),{recursive:true});writeFileSync(target,bytes);restored++}
 return restored;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const restore=process.argv.includes('--restore');const count=restore?restorePublic():createPublicBundle();console.log(restore?'Đã phục hồi '+count+' tệp giao diện còn thiếu.':'Đã đóng gói '+count+' tệp giao diện, kèm SHA-256.')}catch(error){console.error(error.message);process.exitCode=1}
}
