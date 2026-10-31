/* Backup opcional sem login: a chave longa é gerada pelo responsável e nunca enviada aberta. */
(() => {
'use strict';
const c=window.LUCROKM_SUPABASE||{};
const endpoint=/^https:\/\/[a-z\d-]+\.supabase\.co\/?$/i.test(String(c.url||'')) ? c.url.replace(/\/$/,'')+'/functions/v1/lucrokm-backup' : '';
const KEY='lkm_recovery_v216', META='lkm_cloud_meta_v216';
const $=id=>document.getElementById(id);
const ui={status:$('cloudStatus'),detail:$('cloudDetail'),dot:$('cloudDot'),create:$('cloudCreateBtn'),connect:$('cloudConnectBtn'),backup:$('cloudBackupBtn'),restore:$('cloudRestoreBtn'),overwrite:$('cloudOverwriteBtn'),copy:$('cloudCopyBtn'),disconnect:$('cloudDisconnectBtn'),panel:$('cloudRecoveryPanel'),input:$('cloudRecoveryInput'),confirm:$('cloudRecoveryConfirm'),cancel:$('cloudRecoveryCancel')};
if(!ui.status || !window.LucroKMBackup) return;
const enc=new TextEncoder(),dec=new TextDecoder();
const get=k=>{try{return localStorage.getItem(k)||'';}catch{return ''}};
const set=(k,v)=>localStorage.setItem(k,v);
const remove=k=>localStorage.removeItem(k);
const norm=s=>{let k=String(s||'').toUpperCase().replace(/[\s-]/g,'');return /^LKM1[0-9A-F]{64}$/.test(k)?k:''};
const display=k=>`${k.slice(0,4)}-${k.slice(4).match(/.{8}/g).join('-')}`;
const note=s=>{if(typeof toast==='function')toast(s);else alert(s)};
const readable=s=>s?new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'ainda não feito';
let code=norm(get(KEY)), meta=null,remote=null,mode='ready',busy=false,timer=null,changes=0,setupCode='';
try{meta=JSON.parse(get(META)||'null')}catch{}
function saved(m){meta=m;set(META,JSON.stringify(m))}
function paint(){let has=!!code;ui.dot.className='cloud-dot'+(mode==='synced'?' online': ['offline','error','conflict','restore'].includes(mode)?' problem':'');
 ui.create.classList.toggle('hidden',has);ui.connect.classList.toggle('hidden',has);
 ui.backup.classList.toggle('hidden',!has||['conflict','restore'].includes(mode));ui.restore.classList.toggle('hidden',!has||!remote);
 ui.overwrite.classList.toggle('hidden',!has||!remote||mode!=='conflict');ui.copy.classList.toggle('hidden',!has);ui.disconnect.classList.toggle('hidden',!has);
 for(const b of [ui.create,ui.connect,ui.backup,ui.restore,ui.overwrite,ui.copy,ui.disconnect,ui.confirm])b.disabled=busy||(!endpoint && b!==ui.copy&&b!==ui.disconnect);
}
function status(m,title,detail){mode=m;ui.status.textContent=title;ui.detail.textContent=detail||'';paint()}
const sha=s=>crypto.subtle.digest('SHA-256',enc.encode(s));
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function secrets(){if(!code)throw Error('Backup não vinculado');let token=hex(await sha('LKM_AUTH_V1|'+code));let key=await crypto.subtle.importKey('raw',await sha('LKM_AES_V1|'+code),'AES-GCM',false,['encrypt','decrypt']);return {token,key}}
function b64(a){let s='';for(let i=0;i<a.length;i+=8000)s+=String.fromCharCode(...a.subarray(i,i+8000));return btoa(s)}
function unb64(s){let x=atob(s),a=new Uint8Array(x.length);for(let i=0;i<x.length;i++)a[i]=x.charCodeAt(i);return a}
async function seal(obj){let {key}=await secrets(),iv=crypto.getRandomValues(new Uint8Array(12)),raw=enc.encode(JSON.stringify(obj));if(raw.length>1500000)throw Error('Backup maior que 1,5 MB');let ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,raw));return {iv:b64(iv),encrypted_data:b64(ct)}}
async function open(row){let {key}=await secrets();let iv=unb64(row.iv);if(iv.length!==12)throw Error('Backup inválido');let p=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,unb64(row.encrypted_data));let data=JSON.parse(dec.decode(p));if(!data?.state?.journey||!Array.isArray(data.state.entries))throw Error('Backup remoto inválido');return data}
async function call(action,body={}){if(!endpoint)throw Error('Configure a URL do Supabase');if(!navigator.onLine)throw Error('Sem internet; salvo neste celular');let {token}=await secrets();let r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-LKM-Token':token},body:JSON.stringify({action,...body}),cache:'no-store'});let data={};try{data=await r.json()}catch{}if(r.status===409){let e=Error('Existe uma versão mais recente na nuvem');e.conflict=true;throw e}if(!r.ok)throw Error(String(data.error||`Erro ${r.status}`).slice(0,180));return data}
async function getRemote(){let r=await call('get');remote=r.record||null;return remote}
function schedule(){clearTimeout(timer);if(code && navigator.onLine)timer=setTimeout(()=>void sync(),1300)}
function changed(){changes++;if(!code)return;if(meta)saved({...meta,dirty:true});schedule()}
async function push(expected){let at=changes;let payload=await seal(window.LucroKMBackup.exportSnapshot());if(expected===0&&!setupCode)throw Error('Toque em Fazer backup agora e informe o código administrativo.');let r=await call('save',{expectedRevision:expected,...payload,...(expected===0?{setupCode}:{})});if(expected===0)setupCode='';remote={revision:r.revision,updated_at:r.updated_at};let dirty=changes!==at;saved({revision:r.revision,dirty,updated_at:r.updated_at});status(dirty?'pending':'synced',dirty?'Mais alterações aguardando backup':'Backup atualizado na nuvem',`Última cópia: ${readable(r.updated_at)}.`);if(dirty)schedule()}
async function sync(){if(busy||!code)return;if(!navigator.onLine){status('offline','Sem internet — dados salvos no celular','O backup continua quando a internet voltar.');return}
 busy=true;status('busy','Conferindo backup…','Seus dados continuam funcionando offline.');
 try{let r=await getRemote();if(!r){if(meta?.revision===0&&meta.dirty){await push(0);return}status('restore','Não há backup para esta chave','Verifique a chave, ou ative uma nova cópia no aparelho original.');return}
 if(meta?.revision==null){status('restore','Backup encontrado — pode restaurar',`Cópia de ${readable(r.updated_at)}. Toque em Restaurar da nuvem.`);return}
 if(meta.revision!==r.revision){status('conflict','Dados diferentes entre celulares','Nada foi substituído. Restaure ou escolha explicitamente usar os dados locais.');return}
 if(meta.dirty){await push(r.revision);return}status('synced','Backup atualizado na nuvem',`Última cópia: ${readable(r.updated_at)}.`)
 }catch(e){status(e.conflict?'conflict':'error','Backup pendente — dados locais preservados',e.message||String(e))}finally{busy=false;paint()}}
async function create(){if(!endpoint){note('Configure a URL do Supabase antes');return}if(!navigator.onLine){note('Ative o primeiro backup quando tiver internet');return}if(!crypto.subtle){note('Precisa de HTTPS');return}if(!confirm('Gerar chave de recuperação? Guarde-a fora do celular, pois sem ela não será possível recuperar os dados.'))return;
 const admin=prompt('RESPONSÁVEL: digite o código de ativação configurado no Supabase (mínimo 32 caracteres):','')||'';if(admin.length<32){note('Ativação cancelada: código administrativo ausente ou muito curto.');return}setupCode=admin;
 let arr=crypto.getRandomValues(new Uint8Array(32));code='LKM1'+hex(arr).toUpperCase();set(KEY,code);saved({revision:0,dirty:true});let k=display(code);
 // Exibir sempre a chave na ativação; copiar é adicional, não substitui a visualização.
 prompt('COPIE E GUARDE ESTA CHAVE FORA DO CELULAR:',k);
 try{await navigator.clipboard.writeText(k);note('Chave copiada: guarde em local seguro.')}catch{note('Guarde a chave exibida, sem ela não será possível recuperar.')}
 status('pending','Backup ativado — enviando primeira cópia','Você guardou a chave? O cliente não precisa fazer login.');schedule()}
async function connect(){let k=norm(ui.input.value);if(!k){note('Cole a chave LKM1 completa');return}code=k;set(KEY,k);saved({revision:null,dirty:false});ui.input.value='';ui.panel.classList.add('hidden');await sync()}
async function restore(){if(busy||!code)return;if(!confirm('Restaurar da nuvem? Isto SUBSTITUI os dados locais. Faça backup JSON antes.'))return;busy=true;paint();try{let r=await getRemote();if(!r)throw Error('Nenhum backup encontrado');let snap=await open(r);window.LucroKMBackup.importSnapshot(snap);saved({revision:r.revision,dirty:false,updated_at:r.updated_at});status('synced','Dados recuperados com sucesso',`Cópia de ${readable(r.updated_at)}. O cofre mantém a senha mestra.`);note('Histórico restaurado.')}catch(e){status('error','Falha ao restaurar',e.message||String(e))}finally{busy=false;paint()}}
async function overwrite(){if(busy||!code)return;if(!confirm('Sobrescrever a nuvem com os dados DESTE celular? Isso poderá descartar alterações de outro aparelho. Faça backup JSON antes.'))return;busy=true;paint();try{let r=await getRemote();if(!r)throw Error('Backup remoto não encontrado');await push(r.revision);note('Backup remoto substituído')}catch(e){status(e.conflict?'conflict':'error','Não foi possível substituir',e.message||String(e))}finally{busy=false;paint()}}
async function copy(){if(!code)return;if(!confirm('Copiar a chave de recuperação para guardar em local seguro?'))return;let k=display(code);try{await navigator.clipboard.writeText(k);note('Chave copiada')}catch{prompt('CHAVE DE RECUPERAÇÃO:',k)}}
function disconnect(){if(!confirm('Desvincular backup deste celular? Os dados locais e a cópia na nuvem continuam. Você precisará da chave para reconectar.'))return;code='';meta=null;remote=null;remove(KEY);remove(META);status('ready','Backup desvinculado','O LucroKM continua salvando no aparelho.')}
ui.create.onclick=()=>void create();ui.connect.onclick=()=>ui.panel.classList.remove('hidden');ui.confirm.onclick=()=>void connect();ui.cancel.onclick=()=>{ui.input.value='';ui.panel.classList.add('hidden')};
ui.backup.onclick=()=>{if(!meta)return;if(meta.revision===0){const admin=prompt('Código administrativo do Supabase para fazer o primeiro backup:','')||'';if(admin.length<32){note('Informe o código administrativo completo.');return}setupCode=admin;}saved({...meta,dirty:true});void sync()};ui.restore.onclick=()=>void restore();ui.overwrite.onclick=()=>void overwrite();ui.copy.onclick=()=>void copy();ui.disconnect.onclick=disconnect;
$('cloudTopBtn')?.addEventListener('click',()=>{$('settingsBtn')?.click();setTimeout(()=>$('cloudPanel')?.scrollIntoView({behavior:'smooth',block:'center'}),60)});
window.addEventListener('lucrokm:changed',changed);window.addEventListener('online',schedule);window.addEventListener('offline',()=>{if(code)status('offline','Offline — dados salvos no celular','O backup será retomado quando houver internet.')});document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
if(!endpoint)status('ready','Supabase ainda não configurado','O responsável precisa configurar uma única vez.');else if(!code)status('ready','Backup não ativado','Só o responsável precisa ativar e guardar a chave.');else{status('pending','Conferindo backup…','Nenhuma conta Google é necessária.');schedule()}
})();
