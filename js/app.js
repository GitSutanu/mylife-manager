// MyLife Manager UI. Event delegation, no inline handlers.
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PRI={TOP:'Urgent',MIDDLE:'Medium',LESS:'Low'},ST={PENDING:'Pending',INPROGRESS:'In progress',COMPLETED:'Completed'};
const CATS=['Medical','Family',"Daughter's School",'Office / Work','Banking / Finance','Personal','Shopping','Government / Documents','Home','Travel','Other'];
const PEOPLE=['Me','Mother','Daughter','Office','Family','Other'];
const REM={none:'No reminder',daily:'Every day',date:'Specific date',range:'Date range',weekly:'Weekly',monthly:'Monthly',custom:'Custom dates'};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const NAV=[['dash','Home','home'],['tasks','Tasks','tasks'],['notes','Notes','notes'],['guide','Guide','help'],['settings','Settings','settings']];
const TABS=[['all','All tasks'],['pending','Pending'],['progress','In progress'],['done','Completed'],['someday','No date'],['archived','Archived'],['deleted','Deleted']];
const F0=()=>({q:'',cat:'',pri:'',tag:''});
let S={view:'dash',tab:'all',tv:'list',selMode:false,sel:new Set(),rlog:[],cal:{mode:'month',ref:R.today(),sel:R.today()},tasks:[],notes:[],act:[],set:{},f:F0(),collapsed:{},open:false,ftags:[]};
const P={home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',tasks:'<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8M13 12h8M13 18h8"/>',
notes:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',settings:'<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3"/><path d="M14 2v4M8 10v4M16 18v4"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
folder:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
x:'<path d="M18 6 6 18M6 6l12 12"/>',down:'<path d="m6 9 6 6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',
archive:'<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',trash:'<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
edit:'<path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',check:'<path d="M20 6 9 17l-5-5"/>',left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',undo:'<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
// Toast sits inside the open dialog (if any) so it is never hidden behind it.
const toast=m=>{const t=$('#toast'),d=$('#dlg');(d.open?d:document.body).appendChild(t);t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200)};
async function load(){S.tasks=await DB.all('tasks');S.notes=await DB.all('notes');S.rlog=await DB.all('reminderLog');S.act=await DB.all('activity');
S.set=Object.fromEntries((await DB.all('settings')).map(x=>[x.k,x.v]));applyTheme();}
const setting=(k,d)=>S.set[k]??d;
async function saveSet(k,v){S.set[k]=v;await DB.put('settings',{k,v})}
function applyTheme(){const m=setting('theme','system');document.documentElement.dataset.theme=m==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):m}
async function log(taskId,text){await DB.put('activity',{id:DB.uid(),taskId,text,at:new Date().toISOString()})}
const when=iso=>new Date(iso).toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'});
const live=()=>S.tasks.filter(t=>!t.deleted&&!t.archived);
// ---------- tags ----------
// Tags are free labels. Names that duplicate a category, person, priority or status are dropped so chips never repeat.
const reserved=()=>new Set([...allCats(),...Object.values(PRI),...Object.values(ST)].map(x=>x.toLowerCase()));
const normTag=v=>v.trim().replace(/^#/,'').toLowerCase().replace(/\s+/g,'-');
const allTags=()=>[...new Set(S.tasks.filter(t=>!t.deleted).flatMap(t=>t.tags||[]))].sort();
// ---------- cards ----------
function card(t){const late=R.isOverdue(t),rs=reserved();
return `<div class="card ${t.status==='COMPLETED'?'done':''}" data-action="${S.selMode?'tsel':'open'}" data-id="${t.id}">
<h3>${S.selMode?`<span class="ck ${S.sel.has(t.id)?'on':''}">${S.sel.has(t.id)?ic('check'):''}</span>`:''}<span class="dot ${t.priority}" title="${PRI[t.priority]} priority"></span>${esc(t.title)}</h3>
<div class="meta"><span class="stb ${t.status}"><i></i>${ST[t.status]}</span>
${t.category?`<button class="chip cat" data-action="fcat" data-v="${esc(t.category)}">${ic('folder')}${esc(t.category)}</button>`:''}
${t.due?`<span class="info ${late?'late':''}">${late?'Overdue · ':'Due '}${R.fmt(t.due)}</span>`:''}
${t.rem&&t.rem.type!=='none'?`<span class="info">${ic('bell')}${REM[t.rem.type]}</span>`:''}
${(t.tags||[]).filter(x=>!rs.has(x)).map(x=>`<button class="chip tag" data-action="ftag" data-v="${esc(x)}">#${esc(x)}</button>`).join('')}</div></div>`}
const clock=()=>new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
const head=(sub,title)=>`<div class="head"><small>${sub}</small><h1>${title}</h1></div>`;
const inTab=(t,tab)=>{const base=!t.deleted&&!t.archived;
switch(tab){case 'deleted':return !!t.deleted;case 'archived':return !!t.archived&&!t.deleted;case 'pending':return base&&t.status==='PENDING';
case 'progress':return base&&t.status==='INPROGRESS';case 'done':return base&&t.status==='COMPLETED';
case 'someday':return base&&R.active(t)&&!t.due&&(!t.rem||t.rem.type==='none');default:return base}};
// Dashboard: every task appears once, in the most urgent bucket it fits.
function dash(){const L=live(),d=R.today(),act=L.filter(t=>R.active(t)).sort(R.cmp.bind(R)),n=f=>L.filter(f).length,seen=new Set();
const take=f=>act.filter(t=>!seen.has(t.id)&&f(t)&&(seen.add(t.id),true));
const h=new Date().getHours(),lb=Date.now()-setting('lastBackup',0)>30*864e5;
const stat=(tab,v,l,c)=>`<button class="stat ${c}" data-action="tab" data-v="${tab}"><b>${v}</b><span>${l}</span></button>`;
const A=take(t=>R.isOverdue(t)||t.due===d||R.isOn(t,d)),U=take(t=>t.priority==='TOP'),P=take(t=>t.due||(t.rem&&t.rem.type!=='none')),S0=setting('daily',true)?take(()=>true):[];
const done=L.filter(t=>t.status==='COMPLETED').sort((x,y)=>(y.completedAt||'').localeCompare(x.completedAt||'')).slice(0,3);
const sec=(t,l)=>l.length?`<section class="sec"><header><h2>${t}<span class="n">${l.length}</span></h2></header>${l.map(card).join('')}</section>`:'';
const html=sec('Today & overdue',A)+sec('Urgent',U)+sec('Upcoming',P)+sec('No date',S0)+sec('Recently completed',done);
return head(`${R.fmt(d)} · <span id="clk">${clock()}</span>`,h<12?'Good morning':h<17?'Good afternoon':'Good evening')+`<div class="grid">${stat('all',L.length,'All tasks','')}${stat('pending',n(t=>t.status==='PENDING'),'Pending','a')}${stat('progress',n(t=>t.status==='INPROGRESS'),'In progress','b')}${stat('done',n(t=>t.status==='COMPLETED'),'Completed','c')}</div>`+(L.length&&lb?`<div class="warn">${ic('archive')} Your data is saved only on this device. <a href="#" data-action="export">Export a backup</a></div>`:'')+(html||'<div class="empty"><b>Nothing here yet..</b>Tap + to add your first task.</div>')}
const allCats=()=>setting('cats',[...CATS,...setting('customCats',[])]);
const chips=(arr,key,sel)=>`<div class="chips">${arr.map(x=>{const v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return `<button class="chip ${sel===v?'on':''}" data-action="fset" data-k="${key}" data-v="${esc(v)}">${esc(l)}</button>`}).join('')}</div>`;
function filtered(){const f=S.f,q=f.q.toLowerCase();
return S.tasks.filter(t=>inTab(t,S.tab)).filter(t=>(!f.cat||t.category===f.cat)&&(!f.pri||t.priority===f.pri)&&(!f.tag||(t.tags||[]).includes(f.tag)))
.filter(t=>!q||[t.title,t.description,(t.tags||[]).join(' '),S.notes.filter(n=>n.taskId===t.id).map(n=>n.text).join(' ')].join(' ').toLowerCase().includes(q)).sort(R.cmp.bind(R))}
const tvSwitch=()=>`<div class="seg"><button class="${S.tv==='list'?'on':''}" data-action="tv" data-v="list">List</button><button class="${S.tv==='cal'?'on':''}" data-action="tv" data-v="cal">Calendar</button></div>`;
function bulkBtns(){const B=(k,l,c='')=>`<button class="b sm ${c}" data-action="bulk" data-v="${k}">${l}</button>`;
return S.tab==='deleted'?B('restore','Restore')+B('purge','Delete forever','dng'):S.tab==='archived'?B('restore','Unarchive')+B('del','Delete','dng'):B('done','Complete')+B('arch','Archive')+B('del','Delete','dng')}
function tasks(){if(S.tv==='cal')return calView();
const f=S.f,list=filtered(),tags=allTags(),cnt=[f.cat,f.pri,f.tag].filter(Boolean).length,title=TABS.find(x=>x[0]===S.tab)[1],keep=+setting('keepDeleted',30);
return head(`${list.length} task${list.length===1?'':'s'}`,title)+tvSwitch()+`<div class="tabs">${TABS.map(([k,l])=>`<button class="${S.tab===k?'on':''}" data-action="tab" data-v="${k}">${l}</button>`).join('')}</div>
<div class="search">${ic('search')}<input id="q" type="search" placeholder="Search tasks, notes, tags" value="${esc(f.q)}"></div>
<div class="row" style="margin:0 0 10px"><button class="b sm" data-action="ftoggle">Filters${cnt?` (${cnt})`:''} ${ic(S.open?'up':'down')}</button>${cnt?'<button class="b sm" data-action="reset">Clear</button>':''}${list.length&&!S.selMode?'<button class="b sm" data-action="selmode">Select</button>':''}</div>
${S.selMode?`<div class="selbar"><b>${S.sel.size} selected</b><button class="b sm" data-action="selall">All</button>${bulkBtns()}<button class="b sm" data-action="selx">Cancel</button></div>`:''}
${S.tab==='deleted'&&keep?`<div class="warn">Deleted tasks are removed for good after ${keep} days.</div>`:''}
${S.open?`<div class="fpanel"><h4>Category</h4>${chips(allCats(),'cat',f.cat)}<h4>Priority</h4>${chips(Object.entries(PRI),'pri',f.pri)}
<h4>Tags</h4>${tags.length?chips(tags.map(x=>[x,'#'+x]),'tag',f.tag):'<span style="color:var(--mu);font-size:.8rem">No tags yet. Add tags when creating a task.</span>'}</div>`:''}
${list.map(card).join('')||'<div class="empty"><b>No tasks here</b>Try another tab or clear filters.</div>'}`}
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)},ds=d=>R.ld(d);
const tasksOn=d=>live().filter(t=>t.due===d||R.isOn(t,d)).sort(R.cmp.bind(R));
function calView(){const c=S.cal,ref=pd(c.ref),today=R.today(),m=c.mode==='month';let title,body;
const dayList=s=>tasksOn(s).map(card).join('')||'<div class="none">No tasks on this day</div>';
if(m){const f1=new Date(ref.getFullYear(),ref.getMonth(),1),st=new Date(f1);st.setDate(1-f1.getDay());let cells='';
for(let i=0;i<42;i++){const d=new Date(st);d.setDate(st.getDate()+i);const s=ds(d),l=tasksOn(s).filter(t=>t.due===s||(t.rem&&t.rem.type!=='daily'));
cells+=`<button class="cd ${d.getMonth()!==ref.getMonth()?'out':''} ${s===today?'today':''} ${s===c.sel?'sel':''}" data-action="cday" data-v="${s}"><span>${d.getDate()}</span><i>${l.slice(0,3).map(t=>`<b class="dt ${t.priority}"></b>`).join('')}</i></button>`}
title=ref.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
body=`<div class="cgrid">${DAYS.map(x=>`<em>${x}</em>`).join('')}${cells}</div><h2 class="cdh">${R.fmt(c.sel)}</h2>${dayList(c.sel)}`}
else{const st=new Date(ref);st.setDate(ref.getDate()-ref.getDay());let h='';
for(let i=0;i<7;i++){const d=new Date(st);d.setDate(st.getDate()+i);const s=ds(d);h+=`<h2 class="cdh ${s===today?'tod':''}">${DAYS[i]} ${R.fmt(s)}</h2>${dayList(s)}`}
const en=new Date(st);en.setDate(st.getDate()+6);title=`${R.fmt(ds(st))} – ${R.fmt(ds(en))}`;body=h}
return head('Calendar',title)+tvSwitch()+`<div class="row" style="margin:0 0 12px;align-items:center"><button class="b sm" data-action="cnav" data-v="-1" aria-label="Previous">${ic('left')}</button><button class="b sm" data-action="cnav" data-v="0">Today</button><button class="b sm" data-action="cnav" data-v="1" aria-label="Next">${ic('right')}</button>
<div class="seg" style="margin:0 0 0 auto;width:160px"><button class="${m?'on':''}" data-action="cmode" data-v="month">Month</button><button class="${m?'':'on'}" data-action="cmode" data-v="week">Week</button></div></div>`+body}
function historyView(){const L=S.rlog.slice().sort((a,b)=>(b.at||b.date).localeCompare(a.at||a.date)).slice(0,200);
return head(`${S.rlog.length} total`,'Reminder history')+`<div class="row" style="margin:0 0 12px"><button class="b sm" data-action="nav" data-v="settings">${ic('left')}Settings</button></div>`+
(L.map(x=>{const t=S.tasks.find(y=>y.id===x.taskId),st=x.snoozed?`Snoozed until ${when(x.until)}`:!t||t.deleted?'Task removed':t.status==='COMPLETED'?'Task completed':'Task still open';
return `<div class="note"><b>${esc(x.title)}</b> · ${x.snoozed?'Snooze':REM[x.type]||x.type}<small>${x.at?when(x.at):R.fmt(x.date)} · ${x.snoozed?'':'Shown · '}${st}</small></div>`}).join('')||'<div class="empty"><b>No reminders yet</b>Reminders that fire will be listed here.</div>')}
async function bulk(kind){const ids=[...S.sel];if(!ids.length)return;
if(kind==='del'&&!confirm(`Move ${ids.length} task(s) to Deleted?`))return;if(kind==='purge'&&!confirm(`Delete ${ids.length} task(s) forever, with their notes?`))return;
const now=new Date().toISOString(),msg={done:'Task completed',arch:'Task archived',del:'Task deleted',restore:'Task restored'};
for(const id of ids){const t=S.tasks.find(x=>x.id===id);if(!t)continue;
if(kind==='purge'){for(const n of S.notes.filter(n=>n.taskId===id))await DB.del('notes',n.id);await DB.del('tasks',id);continue}
if(kind==='done'){t.status='COMPLETED';t.completedAt=now}if(kind==='arch')t.archived=true;if(kind==='del'){t.deleted=true;t.deletedAt=now}if(kind==='restore'){t.archived=false;t.deleted=false}
t.updated=now;await DB.put('tasks',t);await log(id,msg[kind])}
S.sel=new Set();S.selMode=false;await refresh();toast(`${ids.length} task(s) updated`)}
// ---------- snooze ----------
function snoozeMenu(id){const B=(v,l)=>`<button class="b" data-action="snz" data-v="${v}" data-id="${id}">${l}</button>`;
$('#dlg').innerHTML=`<div class="dh"><h2>Snooze reminder</h2><button class="x" data-action="close" aria-label="Close">${ic('x')}</button></div>
<div class="row">${B('1h','In 1 hour')}${B('3h','In 3 hours')}${B('tom','Tomorrow')}${B('week','Next week')}</div>
<label>Or pick a date and time</label><input type="datetime-local" id="snzc"><div class="row"><button class="b pri" data-action="snzc" data-id="${id}">Snooze until then</button><button class="b" data-action="open" data-id="${id}">Back</button></div>`}
async function snoozeTo(id,when_){const t=S.tasks.find(x=>x.id===id),dt=new Date(when_);if(isNaN(dt)||dt<=new Date()){toast('Pick a future time');return}
await DB.put('reminderLog',{key:id+'|snz|'+Date.now(),taskId:id,title:t.title,type:'snooze',date:R.today(),at:new Date().toISOString(),snoozed:true,until:dt.toISOString()});
await patch(id,{rem:{...t.rem,snoozeAt:dt.toISOString()}},'Reminder snoozed until '+when(dt.toISOString()));detail(id);toast('Snoozed until '+when(dt.toISOString()))}
async function purgeOld(){const k=+setting('keepDeleted',30);if(!k)return;const lim=Date.now()-k*864e5;
for(const t of S.tasks.filter(t=>t.deleted&&t.deletedAt&&new Date(t.deletedAt)<lim)){for(const n of S.notes.filter(n=>n.taskId===t.id))await DB.del('notes',n.id);await DB.del('tasks',t.id)}await load()}
function notesView(){const q=(S.nq||'').toLowerCase(),L=S.notes.filter(n=>!q||n.text.toLowerCase().includes(q)).sort((a,b)=>b.at.localeCompare(a.at));
return head(`${S.notes.length} total`,'Notes')+`<div class="search">${ic('search')}<input id="nq" type="search" placeholder="Search notes" value="${esc(S.nq||'')}"></div>`+(L.map(n=>{const t=S.tasks.find(x=>x.id===n.taskId);return t?`<div class="card" data-action="open" data-id="${t.id}"><h3><span class="dot ${t.priority}"></span>${esc(t.title)}</h3><div class="note">${esc(n.text)}<small>${when(n.at)}</small></div></div>`:''}).join('')||'<div class="empty"><b>No notes yet</b>Open any task to add a note.</div>')}

function guide(){const L=(t,b)=>`<div class="card flat gd"><h2>${t}</h2>${b}</div>`;
const en=[
['What is this?','A simple personal organizer. Save tasks, notes and reminders for everything you must remember, even when you do not know the date yet.'],
['Add a task','Tap the + button. Type a title, pick a priority and, if you like, a category. Tap <b>More options</b> for a due date, tags and a reminder.'],
['Find tasks','<b>Home</b> shows what needs you today. <b>Tasks</b> has tabs: All, Pending, In progress, Completed, No date, Archived, Deleted. Tap a category or a #tag on any task to filter by it. Switch to <b>Calendar</b> to see tasks by date, and use <b>Select</b> to complete, archive or delete many at once.'],
['Open a task','Tap a task to change its status, add notes, edit, archive or delete it. Archived and deleted tasks can be restored.'],
['Reminders','Choose a reminder when you add a task: daily, a date, a date range, weekly or monthly. Today\'s reminders show on Home with a red number, and as a notification while the app is open. Notifications cannot arrive when the app is fully closed.'],
['Your data','Everything is saved only on this device, in this browser. No account, no server. <b>Never clear this site\'s data or cache, or everything is lost.</b> Use Settings → Export backup now and then. To move to another phone or computer, import the backup there. On iPhone, add the app to your Home Screen, or Safari may erase its data after a week unused. Deleted tasks are removed for good after 30 days (change in Settings).'],
['Install on phone','iPhone: Safari → Share → Add to Home Screen. Android: browser menu → Install app.'],
['Built with','HTML, CSS, JavaScript, IndexedDB, Service Worker (works offline) and Lucide icons. No frameworks, no backend.'],
['Credits','Idea and architecture: <b>'+APP.author+'</b>. Built with the help of ChatGPT and Claude.'+(APP.email?'<br><a href="mailto:'+APP.email+'">'+APP.email+'</a>':'')+(APP.website?' · <a href="'+APP.website+'" target="_blank" rel="noopener">'+APP.website.replace('https://','')+'</a>':'')]];
const bn=[
['এটা কী?','একটা সহজ ব্যক্তিগত অর্গানাইজার। যা মনে রাখতে হবে, সেই কাজ, নোট আর রিমাইন্ডার সেভ করুন, তারিখ জানা না থাকলেও।'],
['কাজ যোগ করা','+ বাটনে চাপুন। কাজের নাম লিখুন, অগ্রাধিকার আর চাইলে ক্যাটাগরি বাছুন। শেষ তারিখ, ট্যাগ আর রিমাইন্ডারের জন্য <b>More options</b> চাপুন।'],
['কাজ খোঁজা','<b>Home</b>-এ আজ যা করতে হবে তা দেখায়। <b>Tasks</b>-এ ট্যাব আছে: All, Pending, In progress, Completed, No date, Archived, Deleted। কোনো কাজের ক্যাটাগরি বা #ট্যাগে চাপলে সেটা দিয়ে ফিল্টার হয়। <b>Calendar</b>-এ তারিখ অনুযায়ী কাজ দেখা যায়, আর <b>Select</b> দিয়ে একসাথে অনেক কাজ Complete, Archive বা Delete করা যায়।'],
['কাজ খোলা','কাজে চাপলে স্ট্যাটাস বদলানো, নোট লেখা, এডিট, আর্কাইভ বা ডিলিট করা যায়। আর্কাইভ বা ডিলিট করা কাজ ফিরিয়ে আনা যায়।'],
['রিমাইন্ডার','কাজ যোগ করার সময় রিমাইন্ডার বাছুন: প্রতিদিন, একটা তারিখ, তারিখের সীমা, সাপ্তাহিক বা মাসিক। আজকের রিমাইন্ডার Home-এ লাল সংখ্যায় দেখায়, আর অ্যাপ খোলা থাকলে নোটিফিকেশনও আসে। অ্যাপ পুরো বন্ধ থাকলে নোটিফিকেশন আসে না।'],
['আপনার ডেটা','সব কিছু শুধু এই ডিভাইসের এই ব্রাউজারেই সেভ থাকে। কোনো অ্যাকাউন্ট বা সার্ভার নেই। <b>এই সাইটের ডেটা বা ক্যাশ কখনো মুছবেন না, নইলে সব হারিয়ে যাবে।</b> মাঝে মাঝে Settings → Export backup করুন। অন্য ফোনে বা কম্পিউটারে নিতে চাইলে সেখানে ব্যাকআপটা Import করুন। আইফোনে অ্যাপটা Home Screen-এ যোগ করে নিন, নইলে এক সপ্তাহ না খুললে Safari ডেটা মুছে দিতে পারে। Delete করা কাজ ৩০ দিন পরে চিরতরে মুছে যায় (Settings-এ বদলানো যায়)।'],
['ফোনে ইনস্টল','আইফোন: Safari → Share → Add to Home Screen। অ্যান্ড্রয়েড: ব্রাউজারের মেনু → Install app।'],
['যা দিয়ে বানানো','HTML, CSS, JavaScript, IndexedDB, Service Worker (অফলাইনে চলে) আর Lucide আইকন। কোনো ফ্রেমওয়ার্ক বা ব্যাকএন্ড নেই।'],
['ক্রেডিট','আইডিয়া ও আর্কিটেকচার: <b>'+APP.author+'</b>। ChatGPT ও Claude-এর সাহায্যে তৈরি।'+(APP.email?'<br><a href="mailto:'+APP.email+'">'+APP.email+'</a>':'')]];
return head('How to use','Guide')+'<h2 class="lang">English</h2>'+en.map(x=>L(...x)).join('')+'<h2 class="lang">বাংলা</h2>'+bn.map(x=>L(...x)).join('')}
async function settingsView(){const pers=navigator.storage?.persisted?await navigator.storage.persisted():null,lb=setting('lastBackup',0);const perm='Notification'in window?Notification.permission:'unsupported',est=navigator.storage?.estimate?await navigator.storage.estimate():null;
const pl={granted:'Enabled',denied:'Blocked (enable in browser settings)',default:'Not asked yet',unsupported:'Not supported here'}[perm],o=(a,sel)=>a.map(([v,l])=>`<option value="${v}" ${v===sel?'selected':''}>${l}</option>`).join('');
return head('Preferences','Settings')+`<div class="card"><h2>Appearance</h2><label>Theme</label><select data-set="theme">${o([['system','System'],['light','Light'],['dark','Dark']],setting('theme','system'))}</select></div>
<div class="card"><h2>Reminders</h2><label>Default time</label><input type="time" data-set="time" value="${setting('time','09:00')}">
<label><input type="checkbox" style="width:auto;min-height:0" data-set="daily" ${setting('daily',true)?'checked':''}> Show undated tasks on the dashboard</label>
<p>Notifications: <b>${pl}</b></p><div class="row"><button class="b pri" data-action="perm">Allow notifications</button><button class="b" data-action="testn">Send test</button><button class="b" data-action="nav" data-v="history">Reminder history</button></div>
<div class="warn">Without a server, notifications can't be guaranteed while the app is fully closed. Reminders show when the app is open or reopened. On iPhone, add the app to your Home Screen (iOS 16.4+) before enabling notifications.</div></div>
<div class="card"><h2>Tasks</h2><label>Default priority</label><select data-set="defPri">${o(Object.entries(PRI),setting('defPri','MIDDLE'))}</select>
<label>Categories</label><div class="chips">${allCats().map(c=>`<span class="chip cat">${esc(c)}<button class="cx" data-action="delcat" data-v="${esc(c)}" aria-label="Delete ${esc(c)}">${ic('x')}</button></span>`).join('')}</div>
<label>Delete trash for good after</label><select data-set="keepDeleted">${o([['7','7 days'],['30','30 days'],['90','90 days'],['0','Never']],String(setting('keepDeleted',30)))}</select>
<label>Add category</label><div class="row" style="margin-top:0"><input id="newcat" placeholder="Category name" style="flex:1"><button class="b" data-action="addcat">Add</button></div></div>
<div class="card"><h2>Data & backup</h2><div class="warn">All data lives only in this browser. Clearing site data erases it, so export a backup regularly.</div>
<p>${est?`Storage used: ${(est.usage/1024).toFixed(0)} KB · `:''}${S.tasks.length} tasks · ${S.notes.length} notes</p>
<p>Last backup: ${lb?when(new Date(lb).toISOString()):'never'}<br>Storage protection: ${pers===null?'unknown':pers?'on':'off (on iPhone, add the app to your Home Screen)'}</p><div class="row"><button class="b pri" data-action="export">Export backup</button><label class="b">Import backup<input type="file" id="imp" accept=".json" class="hide"></label><button class="b dng" data-action="wipe">Clear all data</button></div></div>
<div class="card"><h2>About</h2><p>${APP.name} v${APP.version}<br>Design by ${APP.author} · ${APP.email} . <a href="${APP.website}" target="_blank" rel="noopener noreferrer">${APP.website}</a></p></div>`}
let BADGE=0;
async function render(){BADGE=live().filter(t=>R.isOn(t,R.today())).length;document.title=(BADGE?`(${BADGE}) `:'')+'MyLife Manager';const sub=TABS.map(([k,l])=>`<button class="sb ${S.view==='tasks'&&S.tab===k?'on':''}" data-action="tab" data-v="${k}">${l}</button>`).join('');
$('#nav').innerHTML=NAV.map(([k,l,i])=>`<button class="${S.view===k?'on':''}" data-action="nav" data-v="${k}">${ic(i)}<span>${l}</span>${k==='dash'&&BADGE?`<b class="badge">${BADGE}</b>`:''}</button>`+(k==='tasks'?`<div class="sub">${sub}</div>`:'')).join('');
$('#view').innerHTML=(S.view==='dash'?dash():S.view==='tasks'?tasks():S.view==='notes'?notesView():S.view==='guide'?guide():S.view==='history'?historyView():await settingsView())+`<footer class="foot">Design by <a href="${APP.website}" target="_blank" rel="noopener noreferrer">${APP.author}</a></footer>`}
// ---------- task form ----------
const opt=(arr,sel,none)=>(none?`<option value="">${none}</option>`:'')+arr.map(x=>{const v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return `<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(l)}</option>`}).join('');
function tagbox(){const sug=allTags().filter(x=>!S.ftags.includes(x)).slice(0,8);
$('#tagbox').innerHTML=S.ftags.map(x=>`<span class="chip" data-action="rmtag" data-v="${esc(x)}">#${esc(x)} ${ic('x')}</span>`).join('')+'<input id="tagin" placeholder="Add tag, press Enter">';
$('#tagsug').innerHTML=sug.map(x=>`<button class="chip tag" data-action="addtag" data-v="${esc(x)}">+ #${esc(x)}</button>`).join('')}
function addTag(v){v=normTag(v);if(!v)return;if(reserved().has(v)){toast(`"${v}" is already a category, person or priority`);return}if(!S.ftags.includes(v))S.ftags.push(v);tagbox()}
function form(t){t=t||{};const r=t.rem||{type:'none'},quick=!t.id;S.ftags=[...(t.tags||[])];
$('#dlg').innerHTML=`<div class="dh"><h2>${quick?'New task':'Edit task'}</h2><button class="x" data-action="close" aria-label="Close">${ic('x')}</button></div>
<label>Title *</label><input id="f-title" value="${esc(t.title||'')}" placeholder="What do you need to do?">
<label>Priority</label><select id="f-pri">${opt(Object.entries(PRI),t.priority||setting('defPri','MIDDLE'))}</select>
<label>Category (optional)</label><select id="f-cat">${opt(allCats(),t.category,'None')}</select>
<button class="b sm" data-action="more" style="margin-top:14px">${quick?'More options '+ic('down'):'Less options '+ic('up')}</button><div id="more" class="${quick?'hide':''}">
<label>Status</label><select id="f-st">${opt(Object.entries(ST),t.status||'PENDING')}</select>
<label>Description</label><textarea id="f-desc" rows="3">${esc(t.description||'')}</textarea>
<label>Due date (optional)</label><input type="date" id="f-due" value="${t.due||''}">
<label>Tags</label><div class="tagbox" id="tagbox"></div><div class="chips" id="tagsug" style="margin-top:6px"></div>
<label>Reminder</label><select id="f-rt">${opt(Object.entries(REM),r.type)}</select><div id="rf"></div></div>
<div class="row"><button class="b pri" data-action="save" data-id="${t.id||''}">Save task</button><button class="b" data-action="close">Cancel</button></div>`;
$('#dlg').showModal();tagbox();remFields(r);$('#f-rt').onchange=()=>remFields({type:$('#f-rt').value})}
function remFields(r){const ty=r.type,t=r.time||setting('time','09:00');let h='';
if(['date','daily','range'].includes(ty))h+=`<label>${ty==='range'?'Start date':'Date'}${ty==='daily'?' (optional)':''}</label><input type="date" id="r-start" value="${r.start||''}">`;
if(ty==='range')h+=`<label>End date</label><input type="date" id="r-end" value="${r.end||''}">`;
if(ty==='weekly')h+=`<div class="chips" style="margin-top:8px">${DAYS.map((d,i)=>`<label class="chip" style="margin:0"><input type="checkbox" class="r-day" style="width:auto;min-height:0" value="${i}" ${(r.days||[]).includes(i)?'checked':''}> ${d}</label>`).join('')}</div>`;
if(ty==='monthly')h+=`<label>Day of month</label><input type="number" min="1" max="31" id="r-dom" value="${r.dom||1}">`;
if(ty==='custom')h+=`<label>Dates (YYYY-MM-DD, comma separated)</label><input id="r-dates" value="${(r.dates||[]).join(', ')}">`;
if(ty!=='none')h+=`<label>Time</label><select id="r-tp"><option value="09:00">Morning (9:00)</option><option value="13:00">Afternoon (1:00 PM)</option><option value="18:00">Evening (6:00 PM)</option></select><input type="time" id="r-time" value="${t}" style="margin-top:6px">`;
$('#rf').innerHTML=h;const tp=$('#r-tp');if(tp)tp.onchange=()=>$('#r-time').value=tp.value}
async function saveTask(id){const title=$('#f-title').value.trim();if(!title){toast('Enter a title');return}
const pend=$('#tagin')?.value;if(pend)addTag(pend);
const old=S.tasks.find(x=>x.id===id),now=new Date().toISOString(),ty=$('#f-rt').value;let rem={type:ty};
if(ty!=='none'){rem={type:ty,time:$('#r-time')?.value||'09:00'};if($('#r-start'))rem.start=$('#r-start').value;if($('#r-end'))rem.end=$('#r-end').value;
if(ty==='weekly')rem.days=[...document.querySelectorAll('.r-day:checked')].map(x=>+x.value);if(ty==='monthly')rem.dom=+$('#r-dom').value;
if(ty==='custom')rem.dates=$('#r-dates').value.split(/[,\s]+/).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));
if(((ty==='date'||ty==='range')&&!rem.start)||(ty==='range'&&(!rem.end||rem.end<rem.start))){toast('Check the reminder dates');return}
if(ty==='weekly'&&!rem.days.length){toast('Pick at least one weekday');return}}
const st=$('#f-st').value,t={...(old||{id:DB.uid(),created:now}),title,priority:$('#f-pri').value,status:st,category:$('#f-cat').value,description:$('#f-desc').value.trim(),due:$('#f-due').value,tags:[...S.ftags],rem,updated:now};
if(st==='COMPLETED'&&!t.completedAt)t.completedAt=now;if(st!=='COMPLETED')t.completedAt=null;
await DB.put('tasks',t);
if(!old)await log(t.id,'Task created');else{await log(t.id,'Task updated');if(old.priority!==t.priority)await log(t.id,`Priority changed to ${PRI[t.priority]}`);
if(old.status!==t.status)await log(t.id,`Status changed to ${ST[t.status]}`);if(JSON.stringify(old.rem)!==JSON.stringify(t.rem))await log(t.id,'Reminder changed')}
$('#dlg').close();await refresh();toast('Saved')}
async function setStatus(id,st){const t=S.tasks.find(x=>x.id===id),was=t.status;t.status=st;t.updated=new Date().toISOString();t.completedAt=st==='COMPLETED'?t.updated:null;await DB.put('tasks',t);
await log(id,st==='COMPLETED'?'Task completed':st==='PENDING'?(was==='COMPLETED'?'Task reopened':'Marked as pending'):'Task started');await refresh();toast(st==='COMPLETED'?'Done! Reminders stopped':'Updated')}
async function patch(id,o,msg){const t=S.tasks.find(x=>x.id===id);Object.assign(t,o,{updated:new Date().toISOString()});await DB.put('tasks',t);if(msg)await log(id,msg);await refresh()}
// ---------- detail ----------
function detail(id){const t=S.tasks.find(x=>x.id===id);if(!t)return;
const ns=S.notes.filter(n=>n.taskId===id).sort((a,b)=>a.at.localeCompare(b.at)),hs=S.act.filter(a=>a.taskId===id).sort((a,b)=>b.at.localeCompare(a.at));
const B=(a,l,i,c='')=>`<button class="b ${c}" data-action="${a}" data-id="${id}">${ic(i)}${l}</button>`;
const state=t.deleted?'<div class="warn">This task is in Deleted.</div>':t.archived?'<div class="warn">This task is archived.</div>':
`<label>Status</label><div class="seg3">${Object.entries(ST).map(([k,l])=>`<button class="${t.status===k?'on '+k:''}" data-action="setst" data-v="${k}" data-id="${id}">${l}</button>`).join('')}</div>`;
const snz=t.rem&&t.rem.snoozeAt&&new Date(t.rem.snoozeAt)>new Date()?`<div class="warn">Snoozed until ${when(t.rem.snoozeAt)} · <a href="#" data-action="unsnz" data-id="${id}">Clear</a></div>`:'';
const acts=t.deleted?B('restore','Restore','undo')+B('purge','Delete forever','trash','dng'):t.archived?B('restore','Unarchive','undo')+B('del','Delete','trash','dng'):
B('edit','Edit','edit')+(R.isOn(t,R.today())?B('snooze','Snooze','clock'):'')+B('archive','Archive','archive')+B('del','Delete','trash','dng');
$('#dlg').innerHTML=`<div class="dh"><h2>${esc(t.title)}</h2><button class="x" data-action="close" aria-label="Close">${ic('x')}</button></div>
${card(t).replace(/data-action="\w+"( data-id="[^"]*")?/g,'').replace('class="card','class="card flat')}
${snz}${state}<div class="row">${acts}</div>
${t.description?`<p>${esc(t.description)}</p>`:''}<h2 style="margin-top:16px">Notes</h2>
${ns.map(n=>`<div class="note">${esc(n.text)}<small>${when(n.at)} · <a href="#" data-action="editnote" data-nid="${n.id}">Edit</a> · <a href="#" data-action="delnote" data-nid="${n.id}">Delete</a></small></div>`).join('')||'<p style="color:var(--mu)">No notes yet.</p>'}
<textarea id="newnote" rows="2" placeholder="Write a note"></textarea><div class="row"><button class="b pri sm" data-action="addnote" data-id="${id}">Add note</button></div>
<h2 style="margin-top:16px">Activity</h2>${hs.map(a=>`<div class="note">${esc(a.text)}<small>${when(a.at)}</small></div>`).join('')}`;if(!$('#dlg').open)$('#dlg').showModal()}
// ---------- backup ----------
async function exportData(){await saveSet('lastBackup',Date.now());const d={app:'mylife-manager',v:1,at:new Date().toISOString(),tasks:await DB.all('tasks'),notes:await DB.all('notes'),activity:await DB.all('activity'),reminderLog:await DB.all('reminderLog'),settings:await DB.all('settings')};
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));a.download=`mylife-manager-backup-${R.today().split('-').reverse().join('-')}.json`;a.click();toast('Backup downloaded')}
async function importData(file){let d;try{d=JSON.parse(await file.text())}catch{toast('Not a valid JSON file');return}
if(d.app!=='mylife-manager'||!Array.isArray(d.tasks)||!Array.isArray(d.notes)||d.tasks.some(t=>!t.id||!t.title)){toast('Not a MyLife Manager backup');return}
const rep=confirm(`Found ${d.tasks.length} tasks and ${d.notes.length} notes.\n\nOK = Replace all current data\nCancel = Merge with current data`);
if(!confirm(rep?'All current data will be erased. Continue?':'New items will be added; duplicates skipped. Continue?')){toast('Cancelled');return}
if(rep)for(const s of['tasks','notes','activity','reminderLog'])await DB.clear(s);
for(const [st,arr,k] of [['tasks',d.tasks,'id'],['notes',d.notes,'id'],['activity',d.activity||[],'id']]){const ex=new Set((await DB.all(st)).map(x=>x[k]));for(const x of arr)if(!ex.has(x[k]))await DB.put(st,x)}
for(const r of d.reminderLog||[])await DB.put('reminderLog',r);if(rep)for(const s of d.settings||[])await DB.put('settings',s);
await refresh();toast('Import complete')}
// ---------- notifications ----------
async function notify(t){toast('Reminder: '+t.title);if('Notification'in window&&Notification.permission==='granted'){const reg=await navigator.serviceWorker?.getRegistration();
const o={body:`${PRI[t.priority]} priority${t.category?' · '+t.category:''}`,tag:t.id,icon:'assets/icon.svg'};reg?reg.showNotification(t.title,o):new Notification(t.title,o)}}
const check=()=>R.check(S.tasks,notify);
async function refresh(){await load();if($('#dlg').open&&S.openId)detail(S.openId);await render()}
const goTasks=(k,v)=>{S.tv='list';S.selMode=false;S.f=F0();S.f[k]=v;S.tab='all';S.open=true;S.view='tasks';if($('#dlg').open)$('#dlg').close();render();scrollTo(0,0)};
// ---------- events ----------
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action,id=el.dataset.id,v=el.dataset.v;if(el.tagName==='A')e.preventDefault();
const A={nav:()=>{S.selMode=false;S.sel=new Set();S.view=v;if(v==='tasks'){S.tab='all'}render();scrollTo(0,0)},new:()=>form(),close:()=>{S.openId=null;$('#dlg').close()},save:()=>saveTask(id||undefined),
open:()=>{S.openId=id;detail(id)},edit:()=>form(S.tasks.find(x=>x.id===id)),setst:()=>setStatus(id,v),
snooze:()=>snoozeMenu(id),
snz:()=>{const dt=v==='1h'?new Date(Date.now()+36e5):v==='3h'?new Date(Date.now()+108e5):new Date(`${R.addDays(v==='tom'?1:7)}T${setting('time','09:00')}`);snoozeTo(id,dt)},
snzc:()=>snoozeTo(id,$('#snzc').value),
unsnz:async()=>{const t=S.tasks.find(x=>x.id===id),r={...t.rem};delete r.snoozeAt;await patch(id,{rem:r},'Snooze cleared')},
tv:()=>{S.tv=v;S.selMode=false;S.sel=new Set();render()},selmode:()=>{S.selMode=true;S.sel=new Set();render()},selx:()=>{S.selMode=false;S.sel=new Set();render()},
tsel:()=>{S.sel.has(id)?S.sel.delete(id):S.sel.add(id);render()},selall:()=>{filtered().forEach(t=>S.sel.add(t.id));render()},bulk:()=>bulk(v),
cday:()=>{S.cal.sel=v;render()},cmode:()=>{S.cal.mode=v;render()},
cnav:()=>{const n=+v,c=S.cal;if(!n){c.ref=c.sel=R.today()}else{const d=pd(c.ref);if(c.mode==='month'){d.setDate(1);d.setMonth(d.getMonth()+n)}else d.setDate(d.getDate()+7*n);c.ref=ds(d)}render()},
fold:()=>{S.collapsed[el.dataset.key]=!S.collapsed[el.dataset.key];render()},all:()=>{S.collapsed['all'+el.dataset.key]=!S.collapsed['all'+el.dataset.key];render()},
fcat:()=>goTasks('cat',v),ftag:()=>goTasks('tag',v),ftoggle:()=>{S.open=!S.open;render()},
fset:()=>{const k=el.dataset.k;S.f[k]=S.f[k]===v?'':v;render()},reset:()=>{S.f=F0();render()},tab:()=>{S.selMode=false;S.sel=new Set();S.tv='list';S.tab=v;S.view='tasks';S.f=F0();render();scrollTo(0,0)},
more:()=>{const m=$('#more'),h=m.classList.toggle('hide');el.innerHTML=h?'More options '+ic('down'):'Less options '+ic('up')},
addtag:()=>addTag(v),rmtag:()=>{S.ftags=S.ftags.filter(x=>x!==v);tagbox()},
archive:()=>{patch(id,{archived:true},'Task archived');$('#dlg').close()},restore:()=>{patch(id,{archived:false,deleted:false},'Task restored');$('#dlg').close()},
del:async()=>{if(confirm('Move this task to Deleted?')){await patch(id,{deleted:true,deletedAt:new Date().toISOString()});$('#dlg').close()}},
purge:async()=>{if(confirm('Delete forever, including its notes?')){for(const n of S.notes.filter(n=>n.taskId===id))await DB.del('notes',n.id);await DB.del('tasks',id);await refresh()}},
addnote:async()=>{const x=$('#newnote').value.trim();if(!x)return;await DB.put('notes',{id:DB.uid(),taskId:id,text:x,at:new Date().toISOString()});await log(id,'Note added');await refresh()},
editnote:async()=>{const n=S.notes.find(x=>x.id===el.dataset.nid),x=prompt('Edit note',n.text);if(x?.trim()){n.text=x.trim();await DB.put('notes',n);await refresh()}},
delnote:async()=>{if(confirm('Delete this note?')){await DB.del('notes',el.dataset.nid);await refresh()}},
export:exportData,perm:async()=>{if(!('Notification'in window))return toast('Not supported');await Notification.requestPermission();render()},
testn:()=>notify({id:'test',title:'Test notification',priority:'MIDDLE',category:'MyLife'}),
addcat:async()=>{const x=$('#newcat').value.trim();if(x&&!allCats().includes(x)){await saveSet('cats',[...allCats(),x]);render()}},
delcat:async()=>{if(confirm(`Delete category "${v}"? Tasks keep their current label.`)){await saveSet('cats',allCats().filter(c=>c!==v));render()}},
wipe:async()=>{if(confirm('Erase ALL data permanently?')&&confirm('Are you sure? Have you exported a backup?')){for(const s of['tasks','notes','activity','reminderLog','settings'])await DB.clear(s);await refresh()}}};
A[a]?.()});
document.addEventListener('change',async e=>{const el=e.target;if(el.dataset.set){await saveSet(el.dataset.set,el.type==='checkbox'?el.checked:el.value);applyTheme();render()}if(el.id==='imp'&&el.files[0])importData(el.files[0])});
$('#dlg').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close()});
$('#dlg').addEventListener('close',()=>{S.openId=null});
document.addEventListener('keydown',e=>{if(e.target.id==='tagin'&&(e.key==='Enter'||e.key===',')){e.preventDefault();addTag(e.target.value);$('#tagin').focus()}});
const typed=(id,key)=>e=>{if(e.target.id===id){const p=e.target.selectionStart;key(e.target.value);render().then(()=>{const q=$('#'+id);q.focus();q.setSelectionRange(p,p)})}};
document.addEventListener('input',e=>{typed('q',x=>S.f.q=x)(e);typed('nq',x=>S.nq=x)(e)});
let DAY=R.today();setInterval(()=>{const c=$('#clk');if(c)c.textContent=clock();if(R.today()!==DAY){DAY=R.today();render()}},1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load().then(()=>{render();check()})});
(async()=>{try{await DB.open();await load();await purgeOld();navigator.storage?.persist?.();await render();check();setInterval(async()=>{await load();check()},60000);
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{})}catch(err){console.error('MyLife Manager startup failed:',err);const detail=esc((err&&err.name?err.name+': ':'')+(err&&err.message?err.message:String(err)));$('#view').innerHTML='<div class="empty"><b>MyLife Manager could not start</b><p>Startup error: '+detail+'</p><p>Your saved data has not been intentionally deleted. Please reload after fixing the issue.</p></div>'}})();
