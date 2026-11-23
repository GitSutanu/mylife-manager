// Reminder schedule logic. Dates are 'YYYY-MM-DD' in the device's own time zone.
const R={
today(){return new Intl.DateTimeFormat('en-CA').format(new Date())},
ld(x){return new Intl.DateTimeFormat('en-CA').format(x)},
hm(x){return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(x)},
addDays(n){const x=new Date();x.setDate(x.getDate()+n);return new Intl.DateTimeFormat('en-CA').format(x)},
nowHM(){return new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date())},
fmt(d){return d?d.split('-').reverse().join('/'):''},
active(t){return t.status!=='COMPLETED'&&!t.archived&&!t.deleted},
// true if the task's reminder schedule includes date d
isOn(t,d){if(!this.active(t)||!t.rem||t.rem.type==='none')return false;const r=t.rem;
if(r.snoozeAt){const sa=new Date(r.snoozeAt);if(Date.now()<sa)return false;if(this.ld(sa)===d)return true}
switch(r.type){
case 'daily':return !r.start||d>=r.start;
case 'date':return r.start===d;
case 'range':return !!r.start&&!!r.end&&d>=r.start&&d<=r.end;
case 'weekly':return (r.days||[]).includes(new Date(d+'T12:00:00').getDay());
case 'monthly':{const [y,m,day]=d.split('-').map(Number);const last=new Date(y,m,0).getDate();return day===Math.min(r.dom||1,last)}
case 'custom':return (r.dates||[]).includes(d);}
return false},
isOverdue(t){return this.active(t)&&t.due&&t.due<this.today()},
cmp(a,b){const o={TOP:0,MIDDLE:1,LESS:2};const od=x=>this.isOverdue(x)?0:x.due===this.today()?1:2;return o[a.priority]-o[b.priority]||od(a)-od(b)||(a.due||'9').localeCompare(b.due||'9')},
async check(tasks,notify){const d=this.today(),hm=this.nowHM(),seen=new Set((await DB.all('reminderLog')).map(x=>x.key));
for(const t of tasks){if(!this.isOn(t,d))continue;const rm=t.rem,sz=rm.snoozeAt&&this.ld(new Date(rm.snoozeAt))===d;
const at=sz?this.hm(new Date(rm.snoozeAt)):(rm.time||'09:00');if(at>hm)continue;
const key=t.id+'|'+d+(sz?'|'+rm.snoozeAt:'');if(seen.has(key))continue;
await DB.put('reminderLog',{key,taskId:t.id,title:t.title,type:rm.type,date:d,at:new Date().toISOString(),shown:true});seen.add(key);notify(t)}}};
