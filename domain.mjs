export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const days=(a,b)=>Math.round((Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000);
export function timing(p,now=today(),threshold=7){const end=p.completed||now;let elapsed=p.start?days(end,p.start):null;let remaining=p.deadline?days(p.deadline,p.completed||now):null;return {elapsed,remaining,label:p.status==='Đã hủy'?'Đã hủy':!p.deadline?'Chưa có thời hạn':p.completed?(remaining===0?'Hoàn thành đúng hạn':remaining>0?`Hoàn thành sớm ${remaining} ngày`:`Hoàn thành chậm ${-remaining} ngày`):remaining<0?`Quá hạn ${-remaining} ngày`:remaining<=threshold?`Sắp đến hạn · ${remaining} ngày`:`Còn ${remaining} ngày`,kind:p.status==='Đã hủy'?'neutral':!p.deadline?'neutral':p.completed?'done':remaining<0?'danger':remaining<=threshold?'warning':'normal'};}
export function progress(items=[]){const sum=items.reduce((a,i)=>a+Number(i.weight||0),0);return sum?Math.round(items.reduce((a,i)=>a+Math.min(1,i.done/i.approved)*Number(i.weight||0),0)/sum*100):null;}
export const roles=['admin','approver','manager','technician','repairer','collaborator','viewer'];
export function lastProgressDate(record){
 const stamps=[record.start,...(record.dailyLogs||[]).map(log=>log.at||log.workDate),...(record.logs||[]).map(log=>log.at),...(record.history||[]).filter(entry=>/^(Cập nhật tiến độ|Ghi nhận tiến độ|Đang thực hiện)/.test(entry.status)).map(entry=>entry.at)];
 const localDay=value=>value.length>10&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value)):value.slice(0,10);
 return stamps.filter(value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}/.test(value)).map(localDay).sort().at(-1)||(record.updated?localDay(record.updated):'');
}
