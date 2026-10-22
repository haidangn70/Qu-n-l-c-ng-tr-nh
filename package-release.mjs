// Creates an upload folder containing source only, never runtime data or credentials.
import {mkdirSync,cpSync,rmSync,existsSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=import.meta.dirname,target=resolve(root,'releases','ha-tang-cang-v3.2.0');
const allowed=resolve(root,'releases'),rel=relative(allowed,target);
if(!rel||rel.startsWith('..')||isAbsolute(rel))throw Error('Đường dẫn đóng gói ngoài releases');
execFileSync(process.execPath,[resolve(root,'bundle-public.mjs')],{stdio:'inherit'});
execFileSync(process.execPath,[resolve(root,'verify-build.mjs')],{stdio:'inherit'});
if(existsSync(target))rmSync(target,{recursive:true});mkdirSync(target,{recursive:true});
const files=['package.json','.node-version','.gitignore','.dockerignore','.env.example','Dockerfile','render.yaml','server.mjs','operations.mjs','domain.mjs','xlsx.mjs','backup.mjs','reset-admin.mjs','doctor.mjs','verify-build.mjs','bundle-public.mjs','public-bundle.json','package-release.mjs','demo.mjs','tests.mjs','infrastructure-tests.mjs','pwa-tests.mjs','CAI-DAT.md','SUA-LOI-3.1.1.md','SUA-CHUA-3.2.md','README.md','GUIDE.md','RENDER.md','DEPLOYMENT.md','TEST-RESULTS.md','README-LEGACY.md','schema.sql','CHAY-PHAN-MEM.cmd','public','.github','migrations'];
for(const file of files)cpSync(resolve(root,file),resolve(target,file),{recursive:true});
console.log('Gói nguồn sạch: '+target+'\nKhông chứa data/, demo-data/, mật khẩu hoặc .env.');



