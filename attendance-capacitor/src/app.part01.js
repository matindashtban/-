import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';

const nativeApp = Capacitor.isNativePlatform();
const pendingNativeSaves = new Map();
function queueNativeSave(key, value) {
  const previous = pendingNativeSaves.get(key) || Promise.resolve();
  const next = previous.catch(() => {}).then(() => Preferences.set({ key, value }));
  pendingNativeSaves.set(key, next);
  next.catch(error => { console.error('Native persistence failed', error); const badge=document.getElementById('sv'); if(badge)badge.textContent='⚠️ خطا در ذخیره‌سازی بومی'; });
  return next;
}
async function hydrateNativeStorage() {
  if (!nativeApp) return;
  try {
    const { keys } = await Preferences.keys();
    const nativeKeys = new Set(keys);
    for (const key of keys) if (key === 'att_classes' || key.startsWith('attendance_v2')) {
      const { value } = await Preferences.get({ key });
      if (value !== null) localStorage.setItem(key, value);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === 'att_classes' || key.startsWith('attendance_v2')) && !nativeKeys.has(key)) {
        const value = localStorage.getItem(key);
        if (value !== null) await Preferences.set({ key, value });
      }
    }
  } catch (error) { console.warn('Native storage hydration failed; using WebView storage.', error); }
}
async function blobToBase64(blob) {
  const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
  return String(dataUrl).split(',')[1];
}
async function nativeWrite(blob, name, directory = Directory.Cache) {
  const data = await blobToBase64(blob);
  await Filesystem.writeFile({ path: name, data, directory, recursive: true });
  return Filesystem.getUri({ path: name, directory });
}
async function shareBlob(blob, name) {
  if (!nativeApp) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000); return true;
  }
  const { uri } = await nativeWrite(blob, name, Directory.Cache);
  await Share.share({ title: name, text: `فایل ${name}`, files: [uri], dialogTitle: 'ذخیره یا اشتراک‌گذاری فایل' });
  return true;
}
async function printCurrent(name) {
  if (nativeApp) await Printer.printWebView({ name: name || document.title });
  else window.print();
}
async function bootAttendanceApp() {
  await hydrateNativeStorage();


const MAX=50,keyOf=id=>id==='c1'?'attendance_v2':'attendance_v2_'+id;
let REG={list:[{id:'c1',name:''}],cur:'c1'};
try{const r=JSON.parse(localStorage.getItem('att_classes')||'null');if(r&&Array.isArray(r.list)&&r.list.length&&r.list.some(c=>c.id===r.cur))REG=r}catch(e){}
const KEY=keyOf(REG.cur);
const saveReg=()=>{const value=JSON.stringify(REG);try{localStorage.setItem('att_classes',value)}catch(e){}if(nativeApp)queueNativeSave('att_classes',value);};
const $=id=>document.getElementById(id);
const fa=n=>Number(n).toLocaleString('fa-IR');
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const LBL={'':'ثبت‌نشده',p:'حاضر',a:'غایب',l:'تأخیر'},EM={'':'⚪',p:'😊',a:'😢',l:'⏰'},COL={'':'#adb5bd',p:'#2ec4b6',a:'#ef476f',l:'#ff9f1c'};
const AV=['#4361ee','#f72585','#7209b7','#2ec4b6','#ff9f1c','#3a86ff','#fb5607','#06d6a0'];
const nid=()=>'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const norm=s=>String(s).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim();
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>iso(new Date());
const FIX=['1-1','1-2','1-3','1-4','1-12','1-13','3-14','3-15','11-22','12-29'];
const isHol=d=>{if(S.holidays[d]!==undefined)return S.holidays[d];const x=new Date(d+'T12:00:00'),q=jparts(x);return x.getDay()===5||FIX.includes(q.month+'-'+q.day)};
const jp=d=>{const o={};new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{year:'numeric',month:'numeric'}).formatToParts(new Date(d+'T12:00:00')).forEach(p=>o[p.type]=p.value);return o.year+'-'+String(o.month).padStart(2,'0')};
const MN=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const jmn=k=>k==='all'?'کل سال':MN[+k.slice(5)-1]+' '+Number(k.slice(0,4)).toLocaleString('fa-IR',{useGrouping:false});
const jal=(d,full)=>new Date(d+'T12:00:00').toLocaleDateString('fa-IR-u-ca-persian',full?{weekday:'long',year:'numeric',month:'long',day:'numeric'}:{weekday:'short',year:'numeric',month:'numeric',day:'numeric'});
let S={v:2,cls:'',students:[],data:{},lastBackup:'',holidays:{},notes:{},thr:3},warned=false;
try{
  const r=localStorage.getItem(KEY);
  if(r)S=Object.assign(S,JSON.parse(r));
  else{
    const o=KEY==='attendance_v2'?JSON.parse(localStorage.getItem('attendance_v1')||'null'):null;
    if(o){
      S.cls=o.cls||'';
      S.students=(o.names||[]).map((n,i)=>({id:'m'+i,name:n,active:true}));
      for(const d in o.data||{}){
        S.data[d]={};
        for(const k in o.data[d])S.data[d]['m'+k]=Object.assign({r:''},o.data[d][k]);
        S.students.forEach(s=>{if(!S.data[d][s.id])S.data[d][s.id]={s:'p',m:'',r:''}});
      }
    }
  }
}catch(e){}
const save=()=>{const value=JSON.stringify(S);try{localStorage.setItem(KEY,value)}catch(e){$('sv').textContent='⚠️ ذخیره محلی انجام نشد';if(!warned){warned=true;alert('ذخیره‌سازی در مرورگر ممکن نیست. حتماً نسخه پشتیبان بگیرید.')}}if(nativeApp)queueNativeSave(KEY,value);$('sv').textContent='💾 ذخیره شد '+new Date().toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});};
if(!S.final){S.final={};Object.keys(S.data).forEach(d=>{S.final[d]=true})}
const rc0=REG.list.find(c=>c.id===REG.cur);if(!S.cls&&rc0.name)S.cls=rc0.name;if(S.cls&&!rc0.name){rc0.name=S.cls;saveReg()}
$('date').value=today();$('cls').value=S.cls;

const D=()=>$('date').value;
const active=()=>S.students.filter(s=>s.active);
const listFor=d=>{const r=S.students.filter(s=>s.active||(S.data[d]&&S.data[d][s.id]&&(d<(s.end||'9999-12-31')||S.data[d][s.id].s)));return S.sortAZ?r.slice().sort((a,b)=>a.name.localeCompare(b.name,'fa')):r};
const get=id=>(S.data[D()]||{})[id]||{s:'',m:'',r:''};
function ensure(d){
  if(!S.data[d])S.data[d]={};
  active().forEach(s=>{if(!S.data[d][s.id])S.data[d][s.id]={s:'',m:'',r:''}});
  return S.data[d];
}
function upd(id,patch){const o=ensure(D());o[id]=Object.assign({s:'',m:'',r:''},o[id],patch);save()}

function counts(){
  const c={p:0,a:0,l:0,u:0};
  if(!isHol(D()))listFor(D()).forEach(s=>c[get(s.id).s||'u']++);
  $('cp').textContent=fa(c.p);$('ca').textContent=fa(c.a);$('cl').textContent=fa(c.l);
  $('saved').textContent=isHol(D())?'':S.final[D()]?'✅ ثبت نهایی':'⏳ نهایی نشده'+(c.u?' ('+fa(c.u)+' نفر ثبت‌نشده)':'');
  $('fin').textContent=S.final[D()]?'✏️ بازکردن برای ویرایش':'✅ تأیید نهایی روز';
  return c;
}
function render(){
  $('jdate').textContent=jal(D(),1);jlab();
  $('saved').textContent=S.data[D()]?'✅ ثبت شده':'';
  $('cap').textContent=fa(active().length)+' از '+fa(MAX)+' دانش‌آموز';
  const L=$('list');L.innerHTML='';
  const dq=norm($('dq').value),hol=isHol(D()),rows=hol?[]:listFor(D()).filter(s=>!dq||norm(s.name).includes(dq));
  if(!rows.length)L.appendChild(el('p','hint',hol?'🏖️ این روز تعطیل است و حضور و غیاب ثبت نمی‌شود.':'هنوز دانش‌آموزی اضافه نشده. نام را بنویسید و «افزودن» را بزنید.'));
  rows.forEach((s,i)=>{
    const g=get(s.id),r=el('div','st '+(g.s||'u')),top=el('div','top');
    const av=avatar(s,i);
    const nm=el('div','name',s.name);
    if(!s.active)nm.appendChild(el('small',null,'(کنار گذاشته شده)'));
    const seg=el('div','seg');
    ['p','a','l'].forEach(k=>{
      const b=el('button',k+(g.s===k?' on':''),EM[k]+' '+LBL[k]);
      b.onclick=()=>{upd(s.id,{s:k,m:k==='l'?g.m:'',r:k==='p'?'':g.r});render()};
      seg.appendChild(b);
    });
    if(s.active){const e=el('button','del','✏️');e.title='ویرایش نام';e.setAttribute('aria-label','ویرایش نام');e.onclick=()=>rename(s.id);seg.appendChild(e);const d=el('button','del','✕');d.title='کنار گذاشتن از لیست';d.setAttribute('aria-label','کنار گذاشتن');d.onclick=()=>archive(s.id);seg.appendChild(d)}
    top.append(av,nm,seg);r.appendChild(top);
    if(g.s==='a'||g.s==='l'){
      const ex=el('div','extra');
      if(g.s==='l'){
        const m=el('input','min');m.type='number';m.min=0;m.placeholder='دقیقه';m.value=g.m;m.setAttribute('aria-label','دقیقه تأخیر');
        m.oninput=()=>upd(s.id,{m:m.value});ex.appendChild(m);
      }
      const w=el('input','why');w.type='text';w.placeholder=g.s==='a'?'دلیل غیبت…':'دلیل تأخیر…';w.value=g.r||'';w.setAttribute('aria-label',w.placeholder);
      w.oninput=()=>upd(s.id,{r:w.value});ex.appendChild(w);
      r.appendChild(ex);r.appendChild(chipsFor(s.id));
    }
    L.appendChild(r);
  });
  counts();
  const A=$('arch');A.innerHTML='';
  S.students.filter(s=>!s.active).forEach(s=>{
    const b=el('button',null,'↩ '+s.name);b.title='بازگرداندن به لیست';
    b.onclick=()=>{if(active().length>=MAX)return alert('ظرفیت لیست پر است.');s.active=true;delete s.end;save();render()};
    A.appendChild(b);
  });
  if(!A.children.length)A.appendChild(el('span','hint','کسی کنار گذاشته نشده.'));
  $('lastbk').textContent=REG.lastOk?'آخرین بکاپ موفق: '+new Date(REG.lastOk).toLocaleString('fa-IR-u-ca-persian',{dateStyle:'medium',timeStyle:'short'}):'هنوز بکاپ موفقی ثبت نشده';
  const stale=!REG.lastOk||Date.now()-new Date(REG.lastOk)>7*864e5;
  $('warn').style.display=(stale&&Object.keys(S.data).length)?'block':'none';
  $('hol').textContent=isHol(D())?'↩ روز کاری شود':'🏖️ روز تعطیل';
  alertBar();
}
function archive(id){
  const s=S.students.find(x=>x.id===id);
  if(!confirm('«'+s.name+'» از لیست روزانه کنار گذاشته شود؟\nسابقه حضور و غیابش حفظ می‌شود.'))return;
  s.active=false;s.end=D();save();render();
}
function addName(v){
  v=norm(v);
  if(!v||S.students.some(s=>norm(s.name)===v))return false;
  if(active().length>=MAX)return null;
  S.students.push({id:nid(),name:v,active:true});return true;
}
$('add').onclick=()=>{
  const r=addName($('newname').value);
  if(r===null)return alert('حداکثر '+fa(MAX)+' دانش‌آموز.');
  if(r===false)return alert('نام خالی است یا قبلاً در فهرست هست.');
  $('newname').value='';save();render();$('newname').focus();
};
$('newname').onkeydown=e=>{if(e.key==='Enter')$('add').click()};
$('addmany').onclick=()=>{
  $('names').value.split('\n').forEach(l=>addName(l));
  $('names').value='';save();render();
};
$('allp').onclick=()=>{
  if(isHol(D()))return alert('این روز تعطیل است.');
  const rows=listFor(D());
  if(rows.some(s=>'al'.includes(get(s.id).s||'x'))&&!confirm('بعضی دانش‌آموزان غایب یا متأخر ثبت شده‌اند. همه حاضر ثبت شوند؟'))return;
  rows.forEach(s=>upd(s.id,{s:'p',m:'',r:''}));render();
};
$('fin').onclick=()=>{
  const d=D();
  if(isHol(d))return alert('این روز تعطیل است.');
  if(S.final[d]){delete S.final[d];save();render();return}
  const un=listFor(d).filter(s=>!get(s.id).s);
  if(un.length){if(!confirm(fa(un.length)+' نفر هنوز ثبت نشده‌اند. همه آنها حاضر ثبت شوند و روز نهایی شود؟'))return;un.forEach(s=>upd(s.id,{s:'p'}))}
  S.final[d]=true;save();render();autoBackup();
};
$('dq').oninput=render;
const sUi=()=>{$('sort').style.outline=S.sortAZ?'3px solid var(--b)':''};
$('sort').onclick=()=>{S.sortAZ=S.sortAZ?0:1;save();sUi();render()};
$('dk').onclick=()=>{S.dark=S.dark?0:1;save();document.documentElement.classList.toggle('dk',!!S.dark);$('dk').textContent=S.dark?'☀️':'🌙'};
$('plist').onclick=()=>{
  const P=$('pr');P.innerHTML='';P.appendChild(el('h2',null,'لیست کلاس'+(S.cls?' – '+S.cls:'')));
  const tb=el('table');tb.style.cssText='width:100%;border-collapse:collapse';
  [['ردیف','نام','نام پدر','تلفن پدر','نام مادر','تلفن مادر']].concat(active().map((s,i)=>{const f=s.f||{};return [fa(i+1),s.name,f.fn||'',f.fp||'',f.mn||'',f.mp||'']})).forEach((a,i)=>{const r=el('tr');a.forEach(x=>{const c=el(i?'td':'th',null,x);c.style.cssText='border:1px solid #888;padding:4px 8px;text-align:center';r.appendChild(c)});tb.appendChild(r)});
  P.appendChild(tb);printCurrent('لیست کلاس').catch(e=>alert('چاپ انجام نشد: '+e.message));
};
$('csv').onclick=()=>{
  const ds=Object.keys(S.data).filter(d=>S.final[d]&&!isHol(d)).sort();
  if(!ds.length)return alert('داده‌ای برای خروجی نیست.');
  const q=x=>'"'+String(x).replace(/"/g,'""')+'"',C={p:'ح',a:'غ',l:'ت'},rows=[['نام'].concat(ds.map(d=>jal(d)),['حاضر','غایب','تأخیر']).map(q).join(',')];
  S.students.forEach(s=>{
    let p=0,a=0,l=0;
    const c=ds.map(d=>{const g=S.data[d][s.id];if(!g||!g.s)return '';if(g.s==='p')p++;else if(g.s==='a')a++;else l++;return C[g.s]});
    rows.push([s.name].concat(c,[p,a,l]).map(q).join(','));
  });
  download(new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'}),'حضور و غیاب '+bname().slice(17,-5)+'.csv');
};
$('date').onchange=render;
const go=n=>{const d=new Date(D()+'T12:00:00');d.setDate(d.getDate()+n);$('date').value=iso(d);render()};
$('prev').onclick=()=>go(-1);$('next').onclick=()=>go(1);
$('hol').onclick=()=>{S.holidays[D()]=!isHol(D());save();render()};
$('thr').oninput=()=>{S.thr=Math.max(1,+$('thr').value||3);save();alertBar()};
$('cls').oninput=()=>{S.cls=$('cls').value;save();const c=REG.list.find(x=>x.id===REG.cur);c.name=S.cls;saveReg();clsUi()};
function clsUi(){
  const q=$('csel');q.innerHTML='';
  REG.list.forEach((c,i)=>{const o=el('option',null,c.name||'کلاس '+fa(i+1));o.value=c.id;q.appendChild(o)});
  q.value=REG.cur;
}
$('csel').onchange=()=>{REG.cur=$('csel').value;saveReg();location.reload()};
$('cnew').onclick=()=>{
  const n=prompt('نام کلاس جدید (مثلاً اول ب):');if(n===null||!n.trim())return;
  const id='c'+Date.now().toString(36);
  REG.list.push({id,name:n.trim()});REG.cur=id;saveReg();location.reload();
};

function show(n){
  for(let i=1;i<=6;i++){$('v'+i).hidden=n!==i;$('t'+i).className=n===i?'on':''}
  if(n===2)$('q').focus();if(n===3)famRender();if(n===4)repRender();if(n===5){rc=0;rcRender()}if(n===6)dashRender();
}
[1,2,3,4,5,6].forEach(i=>$('t'+i).onclick=()=>show(i));
const RS=['بیماری','مسافرت','مشکل خانوادگی','ترافیک'];
function chipsFor(id,cb){
  const d=el('div','chips');
  RS.forEach(t=>{const b=el('button',null,t);b.onclick=()=>{upd(id,{r:t});(cb||render)()};d.appendChild(b)});
  return d;
}
function avatar(s,i){
  if(s.ph){const m=el('img','av');m.src=s.ph;m.alt=s.name;return m}
  const a=el('div','av',s.name.trim().charAt(0));a.style.background=AV[(i+s.name.length)%AV.length];return a;
}
function mstats(key){
  const t=today(),R={};
  S.students.forEach(s=>R[s.id]={p:0,a:0,l:0,m:0});
  Object.keys(S.data).forEach(d=>{
    if(d>t||isHol(d)||!S.final[d]||(key!=='all'&&jp(d)!==key))return;
    for(const id in S.data[d]){const g=S.data[d][id],r=R[id];if(!r||!g.s)continue;r[g.s]++;if(g.s==='l')r.m+=+g.m||0}
  });
  return R;
}
const lvl=n=>n>=S.thr+4?3:n>=S.thr+2?2:n>=S.thr?1:0,DOT=['','🟡','🟠','🔴'];
function runs(){
  const t=today(),ds=Object.keys(S.data).filter(d=>d<=t&&S.final[d]&&!isHol(d)).sort(),M={};
  S.students.forEach(s=>{let r=0;for(const d of ds){const g=S.data[d][s.id];if(!g||!g.s)continue;r=g.s==='a'?r+1:0}M[s.id]=r});
  return M;
}
function alertBar(){
  const k=jp(D()),R=mstats(k),RN=runs(),A=$('alert'),L=[];A.innerHTML='';
  S.students.forEach(s=>{
    const r=R[s.id],v=lvl(r.a),p=[];
    if(v)p.push(DOT[v]+' '+fa(r.a)+' غیبت');
    if(RN[s.id]>=3)p.push('🚨 '+fa(RN[s.id])+' روز غیبت متوالی');
    if(r.l>=S.thr)p.push('⏰ '+fa(r.l)+' تأخیر');
    if(p.length)L.push(s.name+': '+p.join('، '));
  });
  A.style.display=L.length?'block':'none';
  if(L.length){A.appendChild(el('b',null,'⚠️ نیازمند پیگیری – '+jmn(k)));L.forEach(x=>A.appendChild(el('div',null,x)))}
}

function notesBox(H,s){
  H.appendChild(el('h4',null,'📝 یادداشت‌ها'));
  const r=el('div','row'),i=el('input');i.type='text';i.placeholder='یادداشت جدید…';i.setAttribute('aria-label','یادداشت جدید');i.style.flex='1';
  const b=el('button','btn main','افزودن');
  b.onclick=()=>{const t=i.value.trim();if(!t)return;(S.notes[s.id]=S.notes[s.id]||[]).push({d:today(),t});save();hist(s.id)};
  r.append(i,b);H.appendChild(r);
  (S.notes[s.id]||[]).slice().reverse().forEach(n=>{const h=el('div','h');h.append(el('span','d',jal(n.d)),el('span',null,n.t));H.appendChild(h)});
}
function setPhoto(s,file){
  const im=new Image(),u=URL.createObjectURL(file);
  im.onload=()=>{
    const c=document.createElement('canvas');c.width=c.height=96;
    const q=Math.min(im.width,im.height);
    c.getContext('2d').drawImage(im,(im.width-q)/2,(im.height-q)/2,q,q,0,0,96,96);
    s.ph=c.toDataURL('image/jpeg',.7);URL.revokeObjectURL(u);save();famRender();render();
  };
  im.src=u;
}
function famRender(){
  const F=$('fam');F.innerHTML='';
  S.students.forEach((s,i)=>{
    const c=el('div','card'),top=el('div','top'),lb=el('label');lb.style.cursor='pointer';lb.title='انتخاب عکس';
    const f=el('input');f.type='file';f.accept='image/*';f.hidden=true;f.onchange=()=>f.files[0]&&setPhoto(s,f.files[0]);
    lb.append(avatar(s,i),f);
    top.append(lb,el('div','name',s.name+(s.active?'':' (کنار گذاشته شده)')));c.appendChild(top);
    const g=el('div','fg');
    [['fn','نام پدر'],['fp','تلفن پدر'],['mn','نام مادر'],['mp','تلفن مادر'],['bd','تاریخ تولد (مثلاً ۱۳۹۸/۰۵/۱۲)'],['ed','اطلاعات آموزشی ضروری']].forEach(([k,ph])=>{
      const e=el('input');e.type='text';if(k[1]==='p')e.inputMode='tel';e.placeholder=ph;e.setAttribute('aria-label',ph);e.value=(s.f||{})[k]||'';
      e.oninput=()=>{s.f=s.f||{};s.f[k]=e.value;save()};g.appendChild(e);
    });
    c.appendChild(g);F.appendChild(c);
  });
  if(!S.students.length)F.appendChild(el('p','hint','ابتدا دانش‌آموزان را اضافه کنید.'));
}
function repRows(R){return S.students.filter(s=>s.active||R[s.id].p+R[s.id].a+R[s.id].l)}
function repRender(){
  const sel=$('rm');fillMonths(sel);
  const R=mstats(sel.value),T=$('rt');T.innerHTML='';
  const row=(a,cls)=>{const r=el('div','rr'+(cls||''));a.forEach(x=>r.appendChild(el('span',null,x)));T.appendChild(r)};
  row(['#','نام','حاضر','غایب','تأخیر','دقیقه'],' hd');
  repRows(R).forEach((s,i)=>{const r=R[s.id];row([fa(i+1),s.name,fa(r.p),fa(r.a),fa(r.l),fa(r.m)],r.a>=S.thr?' bad':'')});
}
$('rm').onchange=repRender;
$('repimg').onclick=()=>{
  const k=$('rm').value,R=mstats(k),rows=repRows(R);
  if(!rows.length)return alert('داده‌ای برای گزارش نیست.');
  const W=900,rh=44,H=110+(rows.length+1)*rh+20,c=document.createElement('canvas');c.width=W*2;c.height=H*2;
  const x=c.getContext('2d'),F='Vazirmatn,Tahoma,"Segoe UI",sans-serif';x.scale(2,2);x.direction='rtl';x.textBaseline='middle';
  x.fillStyle='#fff';x.fillRect(0,0,W,H);x.fillStyle='#4361ee';x.fillRect(0,0,W,80);
  x.fillStyle='#fff';x.textAlign='right';x.font='bold 28px '+F;x.fillText('گزارش حضور و غیاب – '+jmn(k)+(S.cls?' – '+S.cls:''),W-30,40);
  const line=(y,a,bg)=>{
    if(bg){x.fillStyle=bg;x.fillRect(30,y,W-60,rh)}
    x.fillStyle='#2b2d42';x.textAlign='center';x.fillText(a[0],W-55,y+22);
    x.textAlign='right';x.fillText(a[1],W-100,y+22,330);
    x.textAlign='center';[420,340,260,160].forEach((px,j)=>x.fillText(a[2+j],px,y+22));
  };
  x.font='bold 18px '+F;line(100,['ردیف','نام','حاضر','غایب','تأخیر','دقیقه'].slice(0,2).concat(['حاضر','غایب','تأخیر','دقیقه'].slice(0,4)),'#e9eefb');
  x.font='18px '+F;
  rows.forEach((s,i)=>{const r=R[s.id];line(100+(i+1)*rh,[fa(i+1),s.name,fa(r.p),fa(r.a),fa(r.l),fa(r.m)],r.a>=S.thr?'#ffe3e3':(i%2?'#f6f8fc':null))});
  c.toBlob(b=>download(b,'report-'+k+'.png'),'image/png');
};

function hist(id){
  const s=S.students.find(x=>x.id===id),t=today(),H=$('hist');H.innerHTML='';
  const c={p:0,a:0,l:0},rows=[];
  Object.keys(S.data).sort().reverse().forEach(d=>{const g=S.data[d][id];if(g&&g.s&&S.final[d]&&d<=t&&!isHol(d)){rows.push([d,g]);c[g.s]++}});
  const hd=el('div','row');hd.append(avatar(s,0),el('h3',null,s.name+(s.active?'':' (کنار گذاشته شده)')));H.appendChild(hd);const pb=el('button','btn','🖨️ کارنامه حضور (چاپ / PDF)');pb.onclick=()=>card(id);H.appendChild(pb);
  const sm=el('div','sum');
  [['p','حاضر'],['a','غایب'],['l','تأخیر']].forEach(k=>{const d=el('div',k[0],EM[k[0]]+' '+k[1]);d.appendChild(el('b',null,fa(c[k[0]])));sm.appendChild(d)});
  H.appendChild(sm);
  H.appendChild(el('p','hint','تعداد روزهای ثبت‌شده تا امروز: '+fa(rows.length)));H.appendChild(el('h4',null,'📈 روند حضور ماهانه'));monthBars(H,id);
  rows.forEach(([d,g])=>{
    const r=el('div','h');
    r.appendChild(el('span','d',jal(d)));
    const p=el('span','pill',EM[g.s]+' '+LBL[g.s]);p.style.background=COL[g.s];r.appendChild(p);
    const note=[g.s==='l'&&g.m!==''?fa(g.m)+' دقیقه':'',g.r||''].filter(Boolean).join(' – ');
    if(note)r.appendChild(el('span',null,note));
    H.appendChild(r);
  });
  notesBox(H,s);
}
$('q').oninput=()=>{
  const q=norm($('q').value),C=$('chips');C.innerHTML='';$('hist').innerHTML='';
  if(!q)return;
  const m=S.students.filter(s=>norm(s.name).includes(q));
  if(!m.length){C.appendChild(el('span','hint','نامی پیدا نشد.'));return}
  if(m.length===1)return hist(m[0].id);
  m.forEach(s=>{const b=el('button',null,s.name);b.onclick=()=>hist(s.id);C.appendChild(b)});
};

function draw(type){
  const rows=listFor(D());
  if(isHol(D()))return alert('این روز تعطیل است؛ تصویری ساخته نمی‌شود.');
  if(!rows.length)return alert('ابتدا دانش‌آموزان را اضافه کنید.');
  const W=900,rh=46,head=180,H=head+(rows.length+1)*rh+24,k=2;
  const c=document.createElement('canvas');c.width=W*k;c.height=H*k;
  const x=c.getContext('2d');x.scale(k,k);
  const F='Vazirmatn,Tahoma,"Segoe UI",sans-serif';
  const rr=(a,b,w,h,r)=>{x.beginPath();x.roundRect?x.roundRect(a,b,w,h,r):x.rect(a,b,w,h);x.fill()};
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  const gr=x.createLinearGradient(0,0,W,100);gr.addColorStop(0,'#ffb703');gr.addColorStop(1,'#ff6b9d');
  x.fillStyle=gr;x.fillRect(0,0,W,100);
  x.direction='rtl';x.textBaseline='middle';x.fillStyle='#fff';x.textAlign='right';
  x.font='bold 30px '+F;x.fillText('حضور و غیاب'+(S.cls?' – '+S.cls:''),W-30,36);
  x.font='20px '+F;x.fillText(jal(D(),1),W-30,74);
  const cn=counts(),bw=(W-60-24)/3;
  [['p','حاضر'],['a','غایب'],['l','تأخیر']].forEach((t,i)=>{
    const bx=W-30-bw-i*(bw+12);
    x.fillStyle=COL[t[0]];rr(bx,114,bw,46,16);
    x.fillStyle='#fff';x.textAlign='center';x.font='bold 20px '+F;x.fillText(t[1]+': '+fa(cn[t[0]]),bx+bw/2,137);
  });
  let y=head;
  x.fillStyle='#e9eefb';rr(30,y,W-60,rh,12);
  x.fillStyle='#2b2d42';x.font='bold 18px '+F;
  x.textAlign='center';x.fillText('ردیف',W-55,y+23);x.fillText('وضعیت',360,y+23);
  x.textAlign='right';x.fillText('نام دانش‌آموز',W-100,y+23);x.fillText('دقیقه / دلیل',300,y+23);
  rows.forEach((s,i)=>{
    y+=rh;const g=get(s.id);
    if(i%2){x.fillStyle='#f6f8fc';x.fillRect(30,y,W-60,rh)}
    x.fillStyle='#6c757d';x.font='17px '+F;x.textAlign='center';x.fillText(fa(i+1),W-55,y+23);
    x.fillStyle='#2b2d42';x.font='19px '+F;x.textAlign='right';x.fillText(s.name,W-100,y+23,370);
    x.fillStyle=COL[g.s];rr(315,y+7,90,32,14);
    x.fillStyle='#fff';x.font='bold 17px '+F;x.textAlign='center';x.fillText(LBL[g.s],360,y+23);
    const note=[g.s==='l'&&g.m!==''?fa(g.m)+' دقیقه':'',g.r||''].filter(Boolean).join(' – ');
    if(note){x.fillStyle='#2b2d42';x.font='17px '+F;x.textAlign='right';x.fillText(note,300,y+23,260)}
  });
  c.toBlob(b=>download(b,'attendance-'+D()+'.'+type),type==='jpg'?'image/jpeg':'image/png',.92);
}
function download(b,name){
  shareBlob(b,name).catch(e=>alert('ساخت یا اشتراک فایل انجام نشد: '+(e.message||e)));
}
$('png').onclick=()=>draw('png');$('jpg').onclick=()=>draw('jpg');

function validate(o){
  if(!o||!Array.isArray(o.students)||typeof o.data!=='object'||!o.data)throw 0;
  const ids=new Set();
  o.students=o.students.filter(s=>s&&typeof s.id==='string'&&typeof s.name==='string'&&!ids.has(s.id)&&ids.add(s.id)).map(s=>Object.assign({},s,{active:s.active!==false}));
  const data={};
  for(const d in o.data){
    if(!/^\d{4}-\d\d-\d\d$/.test(d)||typeof o.data[d]!=='object'||!o.data[d])continue;
    data[d]={};
    for(const id in o.data[d]){const g=o.data[d][id];if(ids.has(id)&&g&&['','p','a','l'].includes(g.s))data[d][id]={s:g.s,m:g.m==null?'':String(g.m),r:String(g.r||'')}}
  }
  o.data=data;
  if(!o.final||typeof o.final!=='object'){o.final={};for(const d in data)o.final[d]=true}
  if(!o.holidays||typeof o.holidays!=='object')o.holidays={};
  if(!o.notes||typeof o.notes!=='object')o.notes={};
  o.thr=Math.max(1,+o.thr||3);
  return o;
}
function snapshot(){
  const C={};
  REG.list.forEach(c=>{
    if(c.id===REG.cur){C[c.id]=S;return}
    try{const r=localStorage.getItem(keyOf(c.id));if(r)C[c.id]=JSON.parse(r)}catch(e){}
  });
  return {v:3,reg:REG,classes:C,savedAt:new Date().toISOString()};
}
function preview(inc){
  let t='پیش‌نمایش نسخه پشتیبان:\n';
  for(const id in inc){
    const o=inc[id].st,nd=Object.keys(o.data).sort();
    t+='• '+(inc[id].name||'کلاس بدون نام')+': '+fa(o.students.length)+' دانش‌آموز، '+fa(nd.length)+' روز'+(nd.length?' (از '+jal(nd[0])+' تا '+jal(nd[nd.length-1])+')':'')+'\n';
  }
  return t+'\nاین اطلاعات با اطلاعات فعلی ادغام می‌شود و چیزی از اطلاعات فعلی حذف نمی‌شود. ادامه می‌دهید؟';
}
function monthBars(P,id){
  [...new Set(Object.keys(S.data).filter(d=>S.final[d]&&!isHol(d)).map(jp))].sort().forEach(k=>{
    const R=mstats(k);let p=0,a=0,l=0;
    if(id){const r=R[id];if(r){p=r.p;a=r.a;l=r.l}}else S.students.forEach(s=>{p+=R[s.id].p;a+=R[s.id].a;l+=R[s.id].l});
    const t=p+a+l;if(!t)return;
    const pc=Math.round((p+l)/t*100),row=el('div','h'),b=el('div','bar2'),w=el('div');
    b.style.cssText='width:'+pc+'%;background:var(--p)';w.style.flex='1';w.appendChild(b);
    row.append(el('span','d',jmn(k)),w,el('b',null,fa(pc)+'٪'));P.appendChild(row);
  });
}
function rename(id){
  const s=S.students.find(x=>x.id===id),v=prompt('نام جدید دانش‌آموز:',s.name);
  if(v===null)return;const n=norm(v);
  if(!n||S.students.some(x=>x.id!==id&&norm(x.name)===n))return alert('نام خالی است یا تکراری است.');
  s.name=n;save();render();
}
const bname=()=>'بکاپ حضور و غیاب '+new Date().toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).replace(/[^\d۰-۹]+/g,'-').replace(/^-|-$/g,'')+'.json';
function fillMonths(sel){
  const cur=sel.value||jp(today());
  const ks=[...new Set([...Object.keys(S.data).map(jp),jp(today())])].sort().reverse();
  sel.innerHTML='';
  ks.concat('all').forEach(k=>{const o=el('option',null,jmn(k));o.value=k;sel.appendChild(o)});
  sel.value=ks.includes(cur)||cur==='all'?cur:ks[0];
}
let rc=0;
function rcRender(){
  const R=$('rc');R.innerHTML='';
  const rows=isHol(D())?[]:listFor(D());
  if(!rows.length)return R.appendChild(el('p','hint','برای این روز دانش‌آموزی نیست یا روز تعطیل است.'));
  if(rc>=rows.length){
    ensure(D());save();render();const k=counts(),c=el('div','card');c.style.textAlign='center';
    c.appendChild(el('h2',null,'🎉 نام‌خوانی تمام شد'));
    c.appendChild(el('p',null,'حاضر '+fa(k.p)+' | غایب '+fa(k.a)+' | تأخیر '+fa(k.l)));
    const b=el('button','btn main','↩ شروع دوباره');b.onclick=()=>{rc=0;rcRender()};c.appendChild(b);const f=el('button','btn main','✅ تأیید نهایی روز');f.onclick=()=>{$('fin').click();rcRender()};c.appendChild(f);
    return R.appendChild(c);
  }
  const s=rows[rc],g=get(s.id),c=el('div','card');c.style.textAlign='center';
  c.appendChild(el('p','hint','نفر '+fa(rc+1)+' از '+fa(rows.length)));
  const a=avatar(s,rc);a.style.cssText='width:120px;height:120px;font-size:56px;margin:0 auto';c.appendChild(a);
  c.appendChild(el('h2',null,s.name));
  const row=el('div','row');row.style.justifyContent='center';
  ['p','a','l'].forEach(k=>{
    const b=el('button','btn big',EM[k]+' '+LBL[k]);b.style.background=COL[k];
    if(g.s===k&&S.data[D()]&&S.data[D()][s.id])b.style.outline='4px solid var(--ink)';
    b.onclick=()=>{upd(s.id,{s:k,m:k==='l'?g.m:'',r:k==='p'?'':g.r});if(k==='p')rc++;rcRender()};
    row.appendChild(b);
  });
  c.appendChild(row);
  if(g.s==='a'||g.s==='l'){
    const ex=el('div','extra');
    if(g.s==='l'){const m=el('input','min');m.type='number';m.min=0;m.placeholder='دقیقه';m.value=g.m;m.oninput=()=>upd(s.id,{m:m.value});ex.appendChild(m)}
    const w=el('input','why');w.type='text';w.placeholder=g.s==='a'?'دلیل غیبت…':'دلیل تأخیر…';w.value=g.r||'';w.oninput=()=>upd(s.id,{r:w.value});ex.appendChild(w);
    c.append(ex,chipsFor(s.id,rcRender));
  }
  const nav=el('div','row');nav.style.cssText='justify-content:center;margin-top:12px';
  if(rc>0){const b=el('button','btn','➡ قبلی');b.onclick=()=>{rc--;rcRender()};nav.appendChild(b)}
  const nx=el('button','btn main','بعدی ⬅');nx.onclick=()=>{rc++;rcRender()};nav.appendChild(nx);
  c.appendChild(nav);R.appendChild(c);
}
const WD=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
function dashRender(){
  const sel=$('dm');fillMonths(sel);
  const k=sel.value,t=today(),wd=[0,0,0,0,0,0,0],days=[],sa={};let P=0,A=0,L=0;
  Object.keys(S.data).forEach(d=>{
    if(d>t||isHol(d)||!S.final[d]||(k!=='all'&&jp(d)!==k))return;
    let a=0;
    for(const id in S.data[d]){const x=S.data[d][id].s;if(!x)continue;if(x==='p')P++;else if(x==='a'){A++;a++;sa[id]=(sa[id]||0)+1}else L++}
    wd[(new Date(d+'T12:00:00').getDay()+1)%7]+=a;if(a)days.push([d,a]);
  });
  const B=$('dash');B.innerHTML='';
  const tot=P+A+L;
  if(!tot)return B.appendChild(el('p','hint','برای این دوره داده‌ای ثبت نشده است.'));
  const big=el('div','sum');big.style.marginTop='12px';
  [['p','درصد حضور',fa(Math.round((P+L)/tot*100))+'٪'],['a','جمع غیبت',fa(A)],['l','جمع تأخیر',fa(L)]].forEach(([c,l,v])=>{const d=el('div',c,l);d.appendChild(el('b',null,v));big.appendChild(d)});
  B.appendChild(big);
  if(k==='all'){B.appendChild(el('h4',null,'📈 روند حضور کلاس در طول سال'));monthBars(B,null)}
  B.appendChild(el('h4',null,'درصد حضور هر دانش‌آموز (برای نمودار، روی نام بزنید)'));
  const R2=mstats(k);
  S.students.forEach(s=>{
    const r=R2[s.id],t2=r.p+r.a+r.l;if(!t2)return;
    const b=el('button','btn',s.name+' – '+fa(Math.round((r.p+r.l)/t2*100))+'٪');
    b.style.cssText='display:block;width:100%;text-align:right;margin-bottom:6px';
    b.onclick=()=>{show(2);$('chips').innerHTML='';$('q').value=s.name;hist(s.id)};B.appendChild(b);
  });
  B.appendChild(el('h4',null,'غیبت بر اساس روز هفته'));
  const mx=Math.max(1,...wd);
  wd.forEach((n,i)=>{const r=el('div','h'),b=el('div','bar2'),w=el('div');b.style.width=(n/mx*100)+'%';w.style.flex='1';w.appendChild(b);r.append(el('span','d',WD[i]),w,el('b',null,fa(n)));B.appendChild(r)});
  B.appendChild(el('h4',null,'پرغیبت‌ترین روزها'));
  days.sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([d,n])=>{const r=el('div','h');r.append(el('span','d',jal(d)),el('b',null,fa(n)+' غایب'));B.appendChild(r)});
  B.appendChild(el('h4',null,'پرغیبت‌ترین دانش‌آموزان'));
  Object.entries(sa).sort((a,b)=>b[1]-a[1]).slice(0,5).forEach(([id,n])=>{const s=S.students.find(x=>x.id===id);if(!s)return;const r=el('div','h');r.append(el('span','d',s.name),el('b',null,fa(n)+' غیبت'));B.appendChild(r)});
}
$('dm').onchange=dashRender;
function card(id){
  const s=S.students.find(x=>x.id===id),t=today(),P=$('pr');P.innerHTML='';
  const M={},days=[];
  Object.keys(S.data).sort().forEach(d=>{
    const g=S.data[d][id];if(!g||!g.s||!S.final[d]||d>t||isHol(d))return;
    const k=jp(d),m=M[k]=M[k]||{p:0,a:0,l:0,m:0};m[g.s]++;if(g.s==='l')m.m+=+g.m||0;
    if(g.s!=='p')days.push([d,g]);
  });
  const hd=el('div','row');hd.append(avatar(s,0),el('h2',null,'کارنامه حضور و غیاب – '+s.name));P.appendChild(hd);
  P.appendChild(el('p',null,(S.cls?'کلاس: '+S.cls+' | ':'')+'تاریخ چاپ: '+jal(t,1)));
  const f=s.f||{};if(f.bd)P.appendChild(el('p',null,'تاریخ تولد: '+f.bd));if(f.ed)P.appendChild(el('p',null,'اطلاعات آموزشی ضروری: '+f.ed));
  if(f.fn||f.fp||f.mn||f.mp)P.appendChild(el('p',null,'پدر: '+(f.fn||'-')+' '+(f.fp||'')+' | مادر: '+(f.mn||'-')+' '+(f.mp||'')));
  const tbl=(head,rows)=>{
    const tb=el('table');tb.style.cssText='width:100%;border-collapse:collapse;margin:10px 0';
    [head].concat(rows).forEach((a,i)=>{const r=el('tr');a.forEach(x=>{const c=el(i?'td':'th',null,x);c.style.cssText='border:1px solid #888;padding:4px 8px;text-align:center';r.appendChild(c)});tb.appendChild(r)});
    P.appendChild(tb);
  };
  const T={p:0,a:0,l:0,m:0};
  const mr=Object.keys(M).sort().map(k=>{const m=M[k];for(const q in T)T[q]+=m[q];return [jmn(k),fa(m.p),fa(m.a),fa(m.l),fa(m.m)]});
  tbl(['ماه','حاضر','غایب','تأخیر','دقیقه تأخیر'],mr.concat([['جمع',fa(T.p),fa(T.a),fa(T.l),fa(T.m)]]));
  if(days.length){
    P.appendChild(el('h3',null,'روزهای غیبت و تأخیر'));
    tbl(['تاریخ','وضعیت','توضیح'],days.map(([d,g])=>[jal(d),LBL[g.s],[g.s==='l'&&g.m!==''?fa(g.m)+' دقیقه':'',g.r||''].filter(Boolean).join(' – ')]));
  }
  const nt=S.notes[id]||[];
  if(nt.length){P.appendChild(el('h3',null,'یادداشت‌ها'));nt.forEach(n=>P.appendChild(el('p',null,jal(n.d)+': '+n.t)))}
  printCurrent('کارنامه حضور و غیاب').catch(e=>alert('چاپ انجام نشد: '+e.message));
}
$('fgo').onclick=()=>{
  const a=$('f1').value,b=$('f2').value,st=$('fs').value,q=norm($('fr').value),R=$('fres'),rows=[];R.innerHTML='';
  Object.keys(S.data).sort().reverse().forEach(d=>{
    if((a&&d<a)||(b&&d>b)||d>today()||isHol(d)||!S.final[d])return;
    S.students.forEach(s=>{const g=S.data[d][s.id];if(!g||!g.s||(st&&g.s!==st)||(q&&!norm(g.r||'').includes(q)))return;rows.push([d,s,g])});
  });
  R.appendChild(el('p','hint','تعداد نتایج: '+fa(rows.length)+(rows.length>300?' (۳۰۰ مورد اول نمایش داده می‌شود)':'')));
  rows.slice(0,300).forEach(([d,s,g])=>{
    const r=el('div','h'),p=el('span','pill',EM[g.s]+' '+LBL[g.s]);p.style.background=COL[g.s];
    r.append(el('span','d',jal(d)),el('b',null,s.name),p);
    const n=[g.s==='l'&&g.m!==''?fa(g.m)+' دقیقه':'',g.r||''].filter(Boolean).join(' – ');
    if(n)r.appendChild(el('span',null,n));
    R.appendChild(r);
  });
};
const dirUi=()=>{$('dirname').textContent=nativeApp?'نسخه پشتیبان خودکار در حافظه داخلی برنامه نگهداری می‌شود؛ برای انتقال، دکمه ذخیره نسخه پشتیبان را بزنید.':'نسخه پشتیبان از طریق دانلود مرورگر ذخیره می‌شود.'};
$('pick').textContent='📤 انتقال نسخه پشتیبان';
async function writeBackup(silent){
  const txt=JSON.stringify(snapshot()),name=bname();
  try{
    if(silent && nativeApp){
      await Filesystem.writeFile({path:'backups/'+name,data:txt,directory:Directory.Data,recursive:true,encoding:'utf8'});
      const {files=[]}=await Filesystem.readdir({path:'backups',directory:Directory.Data}).catch(()=>({files:[]}));
      const backups=files.map(f=>f.name).filter(n=>n.startsWith('بکاپ حضور و غیاب ')&&n.endsWith('.json')).sort().reverse();
      for(const old of backups.slice(5))await Filesystem.deleteFile({path:'backups/'+old,directory:Directory.Data}).catch(()=>{});
      REG.lastOk=new Date().toISOString();saveReg();return true;
    }
    await shareBlob(new Blob([txt],{type:'application/json;charset=utf-8'}),name);
    REG.lastOk=new Date().toISOString();saveReg();render();
    if(!silent)alert(nativeApp?'نسخه پشتیبان آماده شد؛ از پنجره بازشده محل ذخیره را انتخاب کنید.':'نسخه پشتیبان دانلود شد.');
    return true;
  }catch(e){if(!silent)alert('ذخیره نسخه پشتیبان انجام نشد: '+(e.message||e));return false;}
}
const backup=()=>writeBackup(false);
async function autoBackup(){if(nativeApp&&!(REG.lastOk&&Date.now()-new Date(REG.lastOk)<864e5))await writeBackup(true)}
$('pick').onclick=backup;
$('bk').onclick=backup;$('bk0').onclick=backup;
function loadCls(id){
  if(id===REG.cur)return S;
  try{const r=localStorage.getItem(keyOf(id));return r?JSON.parse(r):null}catch(e){return null}
}
function mergeInto(E,o){
  o.students.forEach(s=>{
    const e=E.students.find(x=>x.id===s.id);
    if(!e)E.students.push(s);else{if(!e.ph&&s.ph)e.ph=s.ph;if(!e.f&&s.f)e.f=s.f}
  });
  E.data=E.data||{};E.final=E.final||{};
  for(const d in o.data){
    E.data[d]=E.data[d]||{};
    for(const id in o.data[d]){const c=E.data[d][id];if(!c||(!c.s&&o.data[d][id].s))E.data[d][id]=o.data[d][id]}
    if(o.final[d])E.final[d]=true;
  }
  E.holidays=Object.assign({},o.holidays,E.holidays||{});
  E.notes=E.notes||{};
  for(const id in o.notes){const a=E.notes[id]=E.notes[id]||[];o.notes[id].forEach(n=>{if(!a.some(x=>x.d===n.d&&x.t===n.t))a.push(n)})}
  if(!E.cls)E.cls=o.cls||'';
}
function mergeAll(inc){
  for(const id in inc){
    let E=loadCls(id);
    if(!E)E={v:2,cls:inc[id].name,students:[],data:{},lastBackup:'',holidays:{},notes:{},thr:3,final:{}};
    mergeInto(E,inc[id].st);
    if(id===REG.cur)S=E;
    try{const value=JSON.stringify(E);localStorage.setItem(keyOf(id),value);if(nativeApp)queueNativeSave(keyOf(id),value)}catch(x){}
    if(!REG.list.some(c=>c.id===id))REG.list.push({id,name:inc[id].name});
  }
  saveReg();
}
$('rs').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const j=JSON.parse(r.result),inc={};
      if(j&&j.classes&&j.reg&&Array.isArray(j.reg.list)){
        j.reg.list.forEach(c=>{if(typeof c.id==='string'&&j.classes[c.id])inc[c.id]={name:String(c.name||''),st:validate(j.classes[c.id])}});
      }else inc.c1={name:String(j&&j.cls||''),st:validate(j)};
      if(!Object.keys(inc).length)throw 0;
      if(!confirm(preview(inc)))return;
      mergeAll(inc);alert('اطلاعات ادغام شد. صفحه دوباره بارگذاری می‌شود.');location.reload();
    }catch(x){alert('این فایل نسخه پشتیبان معتبر نیست.')}
  };
  r.readAsText(f);e.target.value='';
};
const jparts=d=>{const o={};new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d).forEach(p=>o[p.type]=+p.value);return o};
function jstart(y,m){
  const e=new Date(y+621,2,21,12);e.setDate(e.getDate()+(m<=7?(m-1)*31:186+(m-7)*30));
  for(let i=-4;i<=4;i++){const d=new Date(e);d.setDate(e.getDate()+i);const q=jparts(d);if(q.year===y&&q.month===m&&q.day===1)return d}
  return e;
}
let cal={id:'',y:0,m:0};
function jlab(){['date','f1','f2'].forEach(id=>{const v=$(id).value;$('jb_'+id).textContent='📅 '+(v?jal(v):'انتخاب تاریخ')})}
function calOpen(id){
  const q=jparts(new Date(($(id).value||today())+'T12:00:00'));
  cal={id,y:q.year,m:q.month};calDraw();$('cal').hidden=false;
}
function pick(v){const i=$(cal.id);i.value=v;i.dispatchEvent(new Event('change'));jlab();$('cal').hidden=true}
function calDraw(){
  const B=$('calbody');B.innerHTML='';
  const mv=n=>{cal.m+=n;if(cal.m<1){cal.m=12;cal.y--}if(cal.m>12){cal.m=1;cal.y++}calDraw()};
  const hd=el('div','row');hd.style.cssText='justify-content:space-between;margin-bottom:8px';
  const pv=el('button','btn','›'),nx=el('button','btn','‹');pv.onclick=()=>mv(-1);nx.onclick=()=>mv(1);
  hd.append(pv,el('b',null,MN[cal.m-1]+' '+Number(cal.y).toLocaleString('fa-IR',{useGrouping:false})),nx);B.appendChild(hd);
  const g=el('div','cg');
  ['ش','ی','د','س','چ','پ','ج'].forEach(w=>g.appendChild(el('div','wd',w)));
  const st=jstart(cal.y,cal.m);
  for(let i=0;i<(st.getDay()+1)%7;i++)g.appendChild(el('span'));
  const cur=$(cal.id).value,t=today();
  for(let i=0;i<32;i++){
    const d=new Date(st);d.setDate(st.getDate()+i);
    if(jparts(d).month!==cal.m)break;
    const v=iso(d),b=el('button',(v===cur?'sel ':'')+(v===t?'td ':'')+(d.getDay()===5?'fr':''),fa(jparts(d).day));
    b.onclick=()=>pick(v);g.appendChild(b);
  }
  B.appendChild(g);
  const ft=el('div','row');ft.style.cssText='justify-content:center;margin-top:10px';
  const add=(t,f)=>{const b=el('button','btn',t);b.onclick=f;ft.appendChild(b)};
  add('امروز',()=>pick(today()));
  if(cal.id!=='date')add('پاک کردن',()=>pick(''));
  add('بستن',()=>$('cal').hidden=true);
  B.appendChild(ft);
}
$('cal').onclick=e=>{if(e.target.id==='cal')$('cal').hidden=true};
['date','f1','f2'].forEach(id=>{
  const i=$(id),b=el('button','btn');b.id='jb_'+id;b.type='button';b.onclick=()=>calOpen(id);
  i.style.display='none';i.parentNode.insertBefore(b,i);
});
clsUi();$('thr').value=S.thr;document.documentElement.classList.toggle('dk',!!S.dark);$('dk').textContent=S.dark?'☀️':'🌙';sUi();
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
dirUi();autoBackup();render();
}
bootAttendanceApp().catch(error => { console.error(error); alert("راه‌اندازی برنامه با خطا روبه‌رو شد: " + (error.message || error)); });
