/** Copyable template helpers, not a router, renderer or persistence framework. */
const templateClone=value=>JSON.parse(JSON.stringify(value));
const templateMoney=value=>'¥ '+Number(value||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const templateDate=value=>new Date(value).toLocaleString('zh-CN',{hour12:false});
const templateId=prefix=>prefix+'-'+UUID.make().slice(0,8);
function templateAppearance(){return (['sm','lg'].includes(LocalStorage.templateDensity)?'ui-'+LocalStorage.templateDensity:'')+(LocalStorage.templateLink?' ui-link':'')}
function templateLayout(id,layouts){return layouts.includes(Hash[id+'Layout'])?Hash[id+'Layout']:layouts[0]}
async function templateDiscard(key){if(!State.changes[key])return true;if(!await Dialog.confirm('{#放弃未保存的修改？#}'))return false;State.changes[key]=false;return true}
async function templateExit(){if(State._exitBlocks&& !await Dialog.confirm('{#离开模板并放弃未保存的修改？#}'))return;for(const key of Object.keys(State.changes))if(State.changes[key]===true)State.changes[key]=false;location.href=new URL('../../index.html',location.href.split('#')[0]).href}
function templateDownload(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function templateQuery(key,size=10){const q=Hash[key]&&typeof Hash[key]==='object'?Hash[key]:{};return {page:Number.isSafeInteger(q.page)&&q.page>0?q.page:1,pagesize:Number.isSafeInteger(q.pagesize)&&q.pagesize>0?q.pagesize:size,search:typeof q.search==='string'?q.search:'',sort:typeof q.sort==='string'?q.sort:'',filters:q.filters&&typeof q.filters==='object'?q.filters:{}}}
function templateList(items,key,options={}){const source=ListDataSource.create({items,...templateQuery(key),...options});const stop=Hash.__watch(key,()=>{const q=templateQuery(key);if(JSON.stringify(q)!==JSON.stringify(source.query())){source.setQuery(q);source.setPageSize(q.pagesize);source.setPage(q.page)}});source.addEventListener('querychange',event=>{const q=event.detail;const value=q.page===1&&q.pagesize===(options.pagesize||10)&&!q.search&&!q.sort&&!Object.keys(q.filters||{}).length?null:q;if(JSON.stringify(Hash[key]??null)!==JSON.stringify(value))Hash.go({[key]:value})});addEventListener('pagehide',event=>{if(!event.persisted){stop();source.dispose()}},{once:true});return source}
function templateViewFailure(event){if(!event.currentTarget.isConnected)return;templateApp.state.failedView=event.currentTarget;templateApp.state.viewError='{#页面加载失败，请重试。#}'}
async function templateRetryView(){try{await templateApp.state.failedView?.load();templateApp.state.viewError=''}catch{}}
Bootstrap.config({bindDarkMode:[LocalStorage,'templateDark']});

function templateDraftElsewhere(){const s=templateApp.state;return !!State.changes[templateApp.changeKey]&&!!s.editingPage&&(s.editingPage!==templateApp.page()||(s.editingId||null)!==(Hash[templateApp.id+'Id']||null))}
function templateDraftConflict(){return templateDraftElsewhere()&&templateApp.state.editingPage===templateApp.page()}
