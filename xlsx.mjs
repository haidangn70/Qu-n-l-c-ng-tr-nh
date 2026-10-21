// Bộ đọc tệp mẫu XLSX: ZIP store/deflate, ô inlineString/sharedString/number.
// Không thực thi công thức, macro, external links hoặc XML entities.
import {inflateRawSync} from 'node:zlib';
const unxml=s=>String(s).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
export function readXlsx(buffer){
 if(buffer.length>10*1024*1024)throw Error('Tệp tối đa 10 MB');
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break}if(end<0)throw Error('Không phải tệp XLSX ZIP hợp lệ');
 const count=buffer.readUInt16LE(end+10);if(count>200)throw Error('Tệp có quá nhiều thành phần');let pos=buffer.readUInt32LE(end+16),total=0;const files={};
 for(let i=0;i<count;i++){
  if(pos+46>buffer.length||buffer.readUInt32LE(pos)!==0x02014b50)throw Error('Cấu trúc ZIP không hợp lệ');const method=buffer.readUInt16LE(pos+10),packed=buffer.readUInt32LE(pos+20),size=buffer.readUInt32LE(pos+24),len=buffer.readUInt16LE(pos+28),extra=buffer.readUInt16LE(pos+30),comment=buffer.readUInt16LE(pos+32),offset=buffer.readUInt32LE(pos+42);const name=buffer.subarray(pos+46,pos+46+len).toString();pos+=46+len+extra+comment;
  total+=size;if(total>20*1024*1024)throw Error('Tệp giải nén vượt 20 MB');
  if(!['xl/worksheets/sheet1.xml','xl/sharedStrings.xml'].includes(name))continue;
  if(offset+30>buffer.length||buffer.readUInt32LE(offset)!==0x04034b50)throw Error('Mục ZIP không hợp lệ');const start=offset+30+buffer.readUInt16LE(offset+26)+buffer.readUInt16LE(offset+28);if(start+packed>buffer.length)throw Error('Tệp ZIP bị cắt');const bytes=buffer.subarray(start,start+packed);
  if(![0,8].includes(method))throw Error('Chỉ hỗ trợ ZIP store/deflate');const out=method===8?inflateRawSync(bytes,{maxOutputLength:20*1024*1024}):bytes;const xml=out.toString('utf8');if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Không cho phép XML entities');files[name]=xml;
 }
 if(!files['xl/worksheets/sheet1.xml'])throw Error('Thiếu sheet1 trong tệp mẫu');const strings=[...(files['xl/sharedStrings.xml']||'').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(m=>[...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>unxml(t[1])).join(''));
 const rows=[];for(const row of files['xl/worksheets/sheet1.xml'].matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){
  if(rows.length>=1001)throw Error('Tệp tối đa 1000 dòng dữ liệu');const cells=[];let sequential=0;
  for(const cell of row[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
   const ref=/\br="([A-Z]+)\d+"/.exec(cell[1]);let col=ref?0:sequential;if(ref)for(const ch of ref[1])col=col*26+ch.charCodeAt(0)-64;if(ref)col--;if(col>50)throw Error('Tệp tối đa 51 cột');sequential=col+1;
   const content=cell[2]||'';if(/<f\b/.test(content))throw Error('Không nhận ô công thức; chuyển thành giá trị trước khi nhập');const value=/<v\b[^>]*>([\s\S]*?)<\/v>/.exec(content)?.[1]||'';cells[col]=/\bt="s"/.test(cell[1])?strings[Number(value)]||'':/\bt="inlineStr"/.test(cell[1])?[...content.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(t=>unxml(t[1])).join(''):unxml(value);
  }rows.push(cells);
 }return rows;
}
