'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'lucrokm_state';
const FONT_SCALES=[100,112,125,140];
const normalizeFontScale = value => FONT_SCALES.includes(Number(value)) ? Number(value) : 100;
const dateKey = (value = Date.now()) => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dateOf = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d); };
const validDate = key => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(dateOf(key).getTime()) && dateKey(dateOf(key)) === key;
const brl = value => (Number(value)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const numberFormat = value => (Number(value)||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
const inputNumber = raw => { let s=String(raw||'').trim().replace(/\s/g,'').replace(/[R$]/g,''); if (!s) return 0; if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.'); else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,''); const n=Number(s); return Number.isFinite(n)?n:NaN; };
const id = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const defaultState = () => ({schemaVersion:3, fontScale:100, goal:350, maintenanceRate:5, costPerKm:0, vehicle:{name:'',plate:''}, journey:{active:false,startedAt:null,elapsed:0,km:0,date:dateKey()}, journeys:[], entries:[]});
const safeMoney = n => Number.isFinite(Number(n)) ? Math.max(0,Math.min(1e9,Number(n))) : 0;
const safeText = (s,max=140) => String(s??'').slice(0,max);
const safePercent = n => Math.min(50,Math.max(0,Number(n)||0));
function normalize(raw){
  const base=defaultState();
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) return base;
  base.fontScale=normalizeFontScale(raw.fontScale);
  base.goal=Math.max(1,safeMoney(raw.goal)||350);
  base.maintenanceRate=raw.maintenanceRate === undefined ? 5 : safePercent(raw.maintenanceRate);
  base.costPerKm=Math.min(100,safeMoney(raw.costPerKm));
  base.vehicle={name:safeText(raw.vehicle?.name,70),plate:safeText(raw.vehicle?.plate,10)};
  if(Array.isArray(raw.entries)) base.entries=raw.entries.slice(0,20000).filter(e=>e && ['income','fuel','expense'].includes(e.type) && validDate(e.date) && Number(e.value)>0).map(e=>({id:safeText(e.id||id(),100),type:e.type,category:safeText(e.category,50),note:safeText(e.note),value:safeMoney(e.value),liters:safeMoney(e.liters),price:safeMoney(e.price),date:e.date,ts:Number(e.ts)||Date.now()}));
  if(Array.isArray(raw.journeys)) base.journeys=raw.journeys.slice(0,5000).filter(j=>j&&Number.isFinite(Number(j.startedAt))&&Number.isFinite(Number(j.endedAt))&&Number(j.endedAt)>=Number(j.startedAt)).map(j=>({id:safeText(j.id||id(),100),startedAt:Number(j.startedAt),endedAt:Number(j.endedAt),seconds:Math.max(0,Number(j.seconds)||0),elapsed:Math.max(0,Number(j.elapsed)||0),km:safeMoney(j.km),date:validDate(j.date)?j.date:dateKey(Number(j.startedAt))}));
  if(raw.journey && typeof raw.journey==='object'){
    const j=raw.journey;
    base.journey={active:Boolean(j.active)&&Number(j.startedAt)>0,startedAt:Number(j.startedAt)>0?Number(j.startedAt):null,elapsed:Math.max(0,Number(j.elapsed)||0),km:safeMoney(j.km),date:validDate(j.date)?j.date:dateKey(Number(j.startedAt)||Date.now())};
  }
  return base;
}
let state;
try {state=normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));} catch {state=defaultState();}
let currentView='home', deferredInstallPrompt=null, toastTimer=null;
function applyFontScale(){
  const size=normalizeFontScale(state.fontScale);
  document.documentElement.style.setProperty('--font-scale',String(size/100));
  document.documentElement.dataset.fontSize=String(size);
  const label=$('#fontScaleLabel');
  const names={100:'Padrão',112:'Confortável',125:'Grande',140:'Extra grande'};
  if(label) label.textContent=`${size}% · ${names[size]}`;
  if($('#fontDownBtn')) $('#fontDownBtn').disabled=size===FONT_SCALES[0];
  if($('#fontUpBtn')) $('#fontUpBtn').disabled=size===FONT_SCALES[FONT_SCALES.length-1];
  if($('#fontResetBtn')) $('#fontResetBtn').disabled=size===100;
}
function changeFontSize(direction){
  const index=FONT_SCALES.indexOf(normalizeFontScale(state.fontScale));
  state.fontScale=FONT_SCALES[Math.max(0,Math.min(FONT_SCALES.length-1,index+direction))];
  applyFontScale();persist();
}
function openSettings(focusGoal=false,focusFont=false){
  $('#goalInput').value=String(state.goal).replace('.',',');
  $('#maintenanceInput').value=String(state.maintenanceRate).replace('.',',');
  applyFontScale();
  $('#settingsDialog').showModal();
  if(focusGoal) $('#goalInput').focus({preventScroll:true});
  else if(focusFont) $('#fontSettingsTitle').scrollIntoView({block:'center',behavior:'instant'});
}

function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('visible'),3500); }
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{toast('Armazenamento cheio ou bloqueado. Faça um backup.');}renderAll();}
function secondsBetweenDay(start,end,day){ const from=dateOf(day).getTime(); const next=new Date(dateOf(day)); next.setDate(next.getDate()+1); return Math.max(0,Math.min(end,next.getTime())-Math.max(start,from))/1000; }
function elapsedSeconds(){const j=state.journey; return Math.max(0,j.elapsed||0)+(j.active&&j.startedAt?Math.max(0,Date.now()-j.startedAt)/1000:0);}
function dailySeconds(day){
  let total=0;
  for(const j of state.journeys){ total+=secondsBetweenDay(j.startedAt,j.endedAt,day); if(j.date===day) total+=Math.max(0,j.elapsed||0); }
  const j=state.journey;
  if(j.active&&j.startedAt)total+=secondsBetweenDay(j.startedAt,Date.now(),day);
  if(j.date===day)total+=Math.max(0,j.elapsed||0);
  return total;
}
function summary(day){
  let revenue=0,costs=0,fuel=0,liters=0;
  for(const e of state.entries){if(e.date!==day)continue; if(e.type==='income')revenue+=e.value;else costs+=e.value; if(e.type==='fuel'){fuel+=e.value;liters+=e.liters||0;}}
  let km=0;
  for(const j of state.journeys){if(dateKey(j.endedAt)===day)km+=j.km||0;}
  if(state.journey.active&&day===dateKey())km+=state.journey.km||0;
  const reserve=revenue*state.maintenanceRate/100;
  const kmCost=km*state.costPerKm;
  const net=revenue-costs-reserve-kmCost;
  return {revenue,costs,fuel,liters,km,reserve,kmCost,net,hours:dailySeconds(day)/3600};
}
function timeFormat(seconds){const s=Math.max(0,Math.floor(seconds));return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function setGreeting(){const h=new Date().getHours();$('#greeting').textContent=h<12?'Bom dia, motorista':h<18?'Boa tarde, motorista':'Boa noite, motorista';}
function renderStats(){
  const t=summary(dateKey());
  $('#netToday').textContent=brl(t.net); $('#revenueToday').textContent=brl(t.revenue); $('#costToday').textContent=brl(t.costs+t.reserve+t.kmCost);
  $('#perHour').textContent=brl(t.hours>0?t.net/t.hours:0);
  $('#timer').textContent=timeFormat(elapsedSeconds());
  $('#kmToday').textContent=`${numberFormat(t.km)} km`; $('#perKm').textContent=brl(t.km?t.net/t.km:0);
  $('#fuelToday').textContent=brl(t.fuel); $('#fuelLiters').textContent=`${numberFormat(t.liters)} L registrados`;
  $('#reserveToday').textContent=brl(t.reserve); $('#reserveHint').textContent=`${numberFormat(state.maintenanceRate)}% do faturamento`;
  const rawPercent=t.net/state.goal*100;
  const percent=Math.max(0,Math.min(100,rawPercent));
  const remaining=Math.max(0,state.goal-t.net);
  const completed=t.net>=state.goal;
  $('#goalBar').style.width=`${percent}%`;
  $('#goalProgress').setAttribute('aria-valuenow',String(Math.round(percent)));
  $('#goalProgress').setAttribute('aria-valuetext',completed?'Meta alcançada':`${Math.max(0,Math.round(rawPercent))}% alcançado`);
  $('#goalEarned').textContent=brl(t.net);
  $('#goalTarget').textContent=brl(state.goal);
  $('#goalPercent').textContent=completed?'100% · Meta batida!':`${Math.max(0,Math.floor(rawPercent))}% alcançado`;
  $('#goalRemaining').textContent=completed?`Você superou a meta em ${brl(t.net-state.goal)}`:`Faltam ${brl(remaining)}`;
  $('#goalMessage').textContent=completed?'Excelente! Seu lucro já atingiu a meta de hoje.':t.net>0?'Continue registrando suas corridas para chegar ao objetivo.':'Registre seus ganhos e acompanhe seu progresso.';
  $('#dailyGoalCard').classList.toggle('goal-completed',completed);
  const active=state.journey.active;
  $('#journeyStatus').textContent=active?'Rodando':'Parado';$('#journeyStatus').classList.toggle('active',active);
  $('#journeyTitle').textContent=active?'Jornada em andamento':'Pronto para começar?';
  $('#journeySub').textContent=active?'Seu tempo continua registrado, mesmo se fechar esta tela.':'Inicie sua jornada e acompanhe seus resultados.';
  $('#journeyBtn .btn-label').textContent=active?'Encerrar jornada':'Iniciar jornada';$('#journeyBtn .btn-icon').src=active?'./assets/icons/flag-checkered.svg':'./assets/icons/play.svg';
  $('#kmBtn').disabled=!active;
}
function makeButton(text,cls,handler,label,iconName){
  const b=document.createElement('button');b.type='button';b.className=cls;b.setAttribute('aria-label',label);
  if(iconName){const img=document.createElement('img');img.src=`./assets/icons/${iconName}.svg`;img.alt='';img.className='tx-btn-icon';img.setAttribute('aria-hidden','true');b.append(img);}
  const span=document.createElement('span');span.textContent=text;b.append(span);b.addEventListener('click',handler);return b;
}
function renderTransactions(containerSelector,entries,empty){
  const list=$(containerSelector);list.replaceChildren();
  if(!entries.length){const d=document.createElement('div');d.className='empty';d.textContent=empty;list.append(d);return;}
  const icons={income:'arrow-trend-up',fuel:'gas-pump',expense:'receipt'};
  const categoryIcon={Alimentação:'utensils',Pedágio:'ticket',Estacionamento:'square-parking',Lavagem:'car',Manutenção:'wrench',Seguro:'shield',Aluguel:'car-side'};
  for(const e of entries){
    const item=document.createElement('article');item.className='tx';
    const left=document.createElement('div');left.className='tx-left';
    const dot=document.createElement('div');dot.className=`tx-dot tone-${e.type==='income'?'green':e.type==='fuel'?'yellow':'red'}`;const txIcon=document.createElement('img');txIcon.src=`./assets/icons/${categoryIcon[e.category]||icons[e.type]||'receipt'}.svg`;txIcon.alt='';txIcon.setAttribute('aria-hidden','true');dot.append(txIcon);
    const info=document.createElement('div');const title=document.createElement('b');title.textContent=e.category;
    const subtitle=document.createElement('small');subtitle.textContent=`${e.date.split('-').reverse().join('/')} · ${e.note||new Date(e.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`;
    info.append(title,subtitle);left.append(dot,info);
    const right=document.createElement('div');right.className='tx-right';
    const value=document.createElement('strong');value.className=`tx-value ${e.type==='income'?'plus':'minus'}`;value.textContent=`${e.type==='income'?'+':'−'} ${brl(e.value)}`;
    const actions=document.createElement('div');actions.className='tx-actions';
    actions.append(makeButton('Editar','tx-control',()=>openEntry(e.type,e),`Editar ${e.category}`,'pen'),makeButton('Excluir','tx-control danger',()=>deleteEntry(e.id),`Excluir ${e.category}`,'trash-can'));right.append(value,actions);item.append(left,right);list.append(item);
  }
}
const sortedEntries = arr => [...arr].sort((a,b)=>b.ts-a.ts);
function renderHomeTransactions(){renderTransactions('#transactions',sortedEntries(state.entries.filter(e=>e.date===dateKey())).slice(0,8),'Nenhum registro hoje. Adicione sua primeira receita ou despesa.');}
function showView(name){
  currentView=name;
  $$('.app-view').forEach(v=>v.classList.toggle('hidden',v.id!==`${name}View`));
  $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(name==='reports')renderReports();if(name==='vehicle')renderVehicle();
  window.scrollTo({top:0,behavior:'instant'});
}
function renderVehicle(){ $('#vehicleName').value=state.vehicle.name;$('#vehiclePlate').value=state.vehicle.plate;$('#costPerKm').value=state.costPerKm?String(state.costPerKm).replace('.',','):''; }
function dateArray(from,to,max=366){const arr=[];const now=dateOf(from);const last=dateOf(to);for(let i=0;now<=last&&i<max;i++,now.setDate(now.getDate()+1))arr.push(dateKey(now));return arr;}
function renderReports(){
  const from=$('#reportStart').value,to=$('#reportEnd').value;
  if(!validDate(from)||!validDate(to))return;
  if(from>to){$('#reportMetrics').textContent='A data inicial deve ser anterior à data final.';$('#reportChart').replaceChildren();$('#allTransactions').replaceChildren();return;}
  const days=dateArray(from,to,400);if(!days.length||dateOf(to)-dateOf(from)>366*86400000){$('#reportMetrics').textContent='Selecione um período de até 366 dias.';return;}
  const ss=days.map(d=>({day:d,...summary(d)}));const sum=ss.reduce((a,d)=>{for(const k of ['revenue','costs','net','km','hours','reserve','kmCost'])a[k]+=d[k];return a;},{revenue:0,costs:0,net:0,km:0,hours:0,reserve:0,kmCost:0});
  const metrics=[['Lucro estimado',brl(sum.net)],['Faturamento',brl(sum.revenue)],['Despesas + reservas',brl(sum.costs+sum.reserve+sum.kmCost)],['Km rodados',`${numberFormat(sum.km)} km`],['Lucro por hora',brl(sum.hours?sum.net/sum.hours:0)],['Lucro por km',brl(sum.km?sum.net/sum.km:0)]];
  const m=$('#reportMetrics');m.replaceChildren();const reportIcons=[['wallet','green'],['arrow-trend-up','green'],['receipt','red'],['road','blue'],['clock','orange'],['gauge-high','violet']];
  metrics.forEach(([label,val],index)=>{const card=document.createElement('article');card.className='report-metric';
    const s=document.createElement('span');s.className='report-label';const ico=document.createElement('span');ico.className=`report-icon tone-${reportIcons[index][1]}`;
    const img=document.createElement('img');img.src=`./assets/icons/${reportIcons[index][0]}.svg`;img.alt='';img.setAttribute('aria-hidden','true');ico.append(img);s.append(ico,document.createTextNode(label));
    const strong=document.createElement('strong');strong.textContent=val;card.append(s,strong);m.append(card);
  });
  const chart=$('#reportChart');chart.replaceChildren();const recent=ss.slice(-14);const max=Math.max(1,...recent.map(d=>Math.abs(d.net)));
  recent.forEach(d=>{const bar=document.createElement('div');bar.className='chart-col';const amount=document.createElement('span');amount.className='chart-val';amount.textContent=brl(d.net);const track=document.createElement('div');track.className='chart-track';const fill=document.createElement('div');fill.className=`chart-fill ${d.net<0?'negative':''}`;fill.style.height=`${Math.max(3,Math.abs(d.net)/max*100)}%`;fill.title=`${d.day}: ${brl(d.net)}`;track.append(fill);const label=document.createElement('small');label.textContent=d.day.slice(8,10)+'/'+d.day.slice(5,7);bar.append(amount,track,label);chart.append(bar);});
  if(!recent.some(d=>d.net!==0)){chart.replaceChildren();const d=document.createElement('div');d.className='empty';d.textContent='Sem lucro registrado neste período.';chart.append(d);}
  renderTransactions('#allTransactions',sortedEntries(state.entries.filter(e=>e.date>=from&&e.date<=to)),'Nenhuma movimentação neste período.');
}
function renderAll(){renderStats();renderHomeTransactions();if(currentView==='reports')renderReports();}
function entryOptions(type){return {income:['Uber','99','Particular','Outro'],fuel:['Gasolina','Etanol','GNV','Diesel','Outro'],expense:['Alimentação','Pedágio','Estacionamento','Lavagem','Manutenção','Seguro','Aluguel','Outro']}[type]||[];}
function openEntry(type,record=null){
  const meta={income:['Receita','Registrar ganho'],fuel:['Combustível','Registrar abastecimento'],expense:['Despesa','Registrar custo']}[type];
  if(!meta)return;
  $('#entryType').value=type;$('#entryId').value=record?.id||'';
  $('#modalEyebrow').textContent=meta[0];$('#modalTitle').textContent=record?'Editar registro':meta[1];$('#entrySubmit').textContent=record?'Salvar alterações':'Salvar registro';
  const select=$('#entryCategory');select.replaceChildren();const cats=entryOptions(type);if(record?.category&&!cats.includes(record.category))cats.push(record.category);
  cats.forEach(name=>{const op=document.createElement('option');op.textContent=name;op.value=name;select.append(op);});
  select.value=record?.category||cats[0];$('#fuelFields').classList.toggle('hidden',type!=='fuel');
  $('#entryValue').value=record?String(record.value).replace('.',','):'';$('#entryNote').value=record?.note||'';$('#fuelAmount').value=record?.liters?String(record.liters).replace('.',','):'';$('#fuelPrice').value=record?.price?String(record.price).replace('.',','):'';$('#entryDate').value=record?.date||dateKey();$('#entryError').classList.add('hidden');
  $('#entryDialog').showModal();$('#entryValue').focus();
}
function deleteEntry(entryId){const e=state.entries.find(e=>e.id===entryId);if(!e||!confirm(`Excluir ${e.category} (${brl(e.value)})?`))return;state.entries=state.entries.filter(e=>e.id!==entryId);persist();toast('Registro excluído.');}
function download(name,data,type){const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);}
function exportBackup(){download(`lucrokm-backup-${dateKey()}.json`,JSON.stringify({...state,schemaVersion:3,exportedAt:new Date().toISOString()},null,2),'application/json');toast('Backup gerado. Guarde em local seguro.');}
function csvCell(v){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return `"${s.replace(/"/g,'""')}"`;}
function exportCsv(){const from=$('#reportStart').value,to=$('#reportEnd').value;const rows=[['Data','Tipo','Categoria','Valor (R$)','Litros','Preço por litro','Observação'],...sortedEntries(state.entries.filter(e=>e.date>=from&&e.date<=to)).map(e=>[e.date,e.type,e.category,e.value.toFixed(2).replace('.',','),e.liters||'',e.price||'',e.note])];download(`lucrokm-registros-${from}-a-${to}.csv`,'\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');toast('CSV exportado com sucesso.');}
function reportDateInit(){const today=dateKey();const d=new Date();d.setDate(d.getDate()-6);$('#reportStart').value=dateKey(d);$('#reportEnd').value=today;}
function installHelp(){
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
  const android=/Android/.test(navigator.userAgent);
  $('#installInstructions').textContent=ios?'No iPhone, abra este site no Safari, toque no botão Compartilhar (quadrado com seta para cima) e escolha “Adicionar à Tela de Início”. Depois confirme em “Adicionar”.':android?'No Android, abra pelo Chrome ou Edge, toque no menu ⋮ e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”. Caso o botão Instalar apareça na página, use-o.':'No computador, abra o menu do navegador e procure “Instalar LucroKM” ou “Criar atalho”. No celular, use o navegador Chrome (Android) ou Safari (iPhone).';
  $('#installDialog').showModal();
}
async function installApp(){if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){toast('LucroKM já está instalado!');return;}if(deferredInstallPrompt){const prompt=deferredInstallPrompt;deferredInstallPrompt=null;try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted'){$('#installBanner').classList.add('hidden');toast('Instalação iniciada.');}else installHelp();}catch{installHelp();}}else installHelp();}
function updateInstallUI(){const installed=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;$('#installBanner').classList.toggle('hidden',Boolean(installed)||localStorage.getItem('lucrokm_install_dismissed')==='1');$('#installTopBtn').classList.toggle('hidden',Boolean(installed));}
function bindEvents(){
  $$('[data-action]').forEach(b=>b.addEventListener('click',()=>openEntry(b.dataset.action)));
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('#navJourney').addEventListener('click',()=>{showView('home');$('#journeySection').scrollIntoView({behavior:'smooth',block:'center'});});
  $('#navAdd').addEventListener('click',()=>openEntry('income'));
  $('#settingsBtn').addEventListener('click',()=>openSettings());
  $('#editGoalBtn').addEventListener('click',()=>openSettings(true));
  $('#fontTopBtn').addEventListener('click',()=>openSettings(false,true));
  $('#fontDownBtn').addEventListener('click',()=>changeFontSize(-1));
  $('#fontUpBtn').addEventListener('click',()=>changeFontSize(1));
  $('#fontResetBtn').addEventListener('click',()=>{state.fontScale=100;applyFontScale();persist();});
  $('#seeAllBtn').addEventListener('click',()=>showView('reports'));
  $('#journeyBtn').addEventListener('click',()=>{
    if(!state.journey.active){state.journey={active:true,startedAt:Date.now(),elapsed:0,km:0,date:dateKey()};persist();toast('Jornada iniciada. Boa viagem!');}
    else{$('#finishKm').value=state.journey.km?String(state.journey.km).replace('.',','):'';$('#finishDialog').showModal();}
  });
  $('#finishForm').addEventListener('submit',e=>{e.preventDefault();const km=inputNumber($('#finishKm').value);if(!Number.isFinite(km)||km<0||km>1000000){toast('Informe uma quilometragem válida.');return;}const j=state.journey;if(!j.active)return;const end=Date.now();const total=elapsedSeconds();state.journeys.push({id:id(),startedAt:j.startedAt,endedAt:end,seconds:total,elapsed:j.elapsed||0,km,date:j.date});state.journey={active:false,startedAt:null,elapsed:0,km:0,date:dateKey()};$('#finishDialog').close();persist();toast('Jornada finalizada e salva.');});
  $('#kmBtn').addEventListener('click',()=>{if(!state.journey.active)return;$('#currentKm').value=state.journey.km?String(state.journey.km).replace('.',','):'';$('#kmDialog').showModal();});
  $('#kmForm').addEventListener('submit',e=>{e.preventDefault();const km=inputNumber($('#currentKm').value);if(!Number.isFinite(km)||km<0||km>1000000){toast('Informe uma quilometragem válida.');return;}state.journey.km=km;$('#kmDialog').close();persist();toast('Quilometragem atualizada.');});
  $('#entryForm').addEventListener('submit',e=>{
    e.preventDefault();const type=$('#entryType').value;const value=inputNumber($('#entryValue').value);const date=$('#entryDate').value;
    const error=$('#entryError');if(!Number.isFinite(value)||value<=0||value>100000000||!validDate(date)){error.textContent='Informe um valor positivo e uma data válida.';error.classList.remove('hidden');return;}
    const liters=type==='fuel'?inputNumber($('#fuelAmount').value):0,price=type==='fuel'?inputNumber($('#fuelPrice').value):0;
    if(!Number.isFinite(liters)||liters<0||!Number.isFinite(price)||price<0){error.textContent='Confira os valores de litros e preço.';error.classList.remove('hidden');return;}
    const oldId=$('#entryId').value;const old=state.entries.find(e=>e.id===oldId);
    const record={id:old?.id||id(),type,value,category:$('#entryCategory').value,note:$('#entryNote').value.trim(),liters,price,date,ts:old?.ts||Date.now()};
    if(old)Object.assign(old,record);else state.entries.push(record);
    $('#entryDialog').close();persist();toast(old?'Registro atualizado.':'Registro adicionado.');
  });
  $('#settingsForm').addEventListener('submit',e=>{e.preventDefault();const goal=inputNumber($('#goalInput').value),maint=inputNumber($('#maintenanceInput').value);if(!Number.isFinite(goal)||goal<=0||goal>100000000||!Number.isFinite(maint)||maint<0||maint>50){toast('Informe meta válida e reserva entre 0% e 50%.');return;}state.goal=goal;state.maintenanceRate=maint;$('#settingsDialog').close();persist();toast('Configurações salvas.');});
  $('#vehicleForm').addEventListener('submit',e=>{e.preventDefault();const cost=inputNumber($('#costPerKm').value);if(!Number.isFinite(cost)||cost<0||cost>100){toast('Informe um custo por km válido.');return;}state.costPerKm=cost;state.vehicle={name:$('#vehicleName').value.trim(),plate:$('#vehiclePlate').value.trim().toUpperCase()};persist();toast('Dados do veículo salvos.');});
  $('#reportStart').addEventListener('change',renderReports);$('#reportEnd').addEventListener('change',renderReports);
  $('#exportCsvBtn').addEventListener('click',exportCsv);
  $('#printReportBtn').addEventListener('click',()=>window.print());
  $('#backupBtn').addEventListener('click',exportBackup);
  $('#restoreBtn').addEventListener('click',()=>$('#restoreFile').click());
  $('#restoreFile').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>5*1024*1024){toast('O backup excede o limite de 5 MB.');return;}
    try{const parsed=JSON.parse(await file.text());if(!parsed||!Array.isArray(parsed.entries)||!parsed.journey){throw new Error('Formato de backup inválido');}if(!confirm('Restaurar este backup? Isso substituirá os dados atuais do aplicativo.'))return;state=normalize(parsed);applyFontScale();persist();$('#settingsDialog').close();showView('home');toast('Backup restaurado com sucesso.');}catch{toast('Arquivo inválido. Selecione um backup LucroKM (.json).');}
  });
  $('#clearBtn').addEventListener('click',()=>{if(!confirm('Excluir permanentemente TODOS os registros financeiros de hoje? Faça backup antes de continuar.'))return;state.entries=state.entries.filter(e=>e.date!==dateKey());persist();toast('Registros de hoje excluídos.');});
  $('#seedBtn').addEventListener('click',()=>{if(!confirm('Adicionar registros fictícios para demonstração? Eles entram no cálculo de hoje.'))return;const now=Date.now(),today=dateKey();[['income',228.40,'Uber'],['fuel',100,'Gasolina'],['income',141.80,'99'],['expense',24.50,'Alimentação'],['income',72,'Particular']].forEach(([type,value,category],i)=>state.entries.push({id:id(),type,value,category,note:'Exemplo (pode excluir)',liters:type==='fuel'?16.18:0,price:type==='fuel'?6.18:0,date:today,ts:now-(i+1)*500000}));persist();$('#settingsDialog').close();toast('Dados de exemplo inseridos.');});
  $('#installBtn').addEventListener('click',installApp);$('#installTopBtn').addEventListener('click',installApp);$('#settingsInstall').addEventListener('click',installApp);
  $('#dismissInstall').addEventListener('click',()=>{localStorage.setItem('lucrokm_install_dismissed','1');updateInstallUI();});
  $('#installConfirm').addEventListener('click',()=>$('#installDialog').close());
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;updateInstallUI();});
  window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;updateInstallUI();toast('LucroKM instalado no dispositivo!');});
}
function setupServiceWorker(){if(!('serviceWorker' in navigator)||!window.isSecureContext)return;navigator.serviceWorker.register('./sw.js').catch(()=>{});}
applyFontScale();setGreeting();reportDateInit();bindEvents();updateInstallUI();renderAll();setupServiceWorker();
setInterval(()=>{renderStats();const h=new Date().getHours();if(h===0||h===12) setGreeting();},1000);
// Recalcular o painel quando o app retorna ao primeiro plano ou muda o dia.
let lastDate=dateKey();document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderAll();setGreeting();}});
setInterval(()=>{if(lastDate!==dateKey()){lastDate=dateKey();renderAll();}},15000);
