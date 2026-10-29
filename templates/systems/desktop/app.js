/** Migrated note-studio example: one saved workspace and retained per-resource drafts. */
const desktopNotes=[{id:'brief',label:'{#项目简报#}',summary:'{#目标与方向#}'},{id:'ideas',label:'{#灵感收集#}',summary:'{#记录每个好想法#}'},{id:'review',label:'{#每周回顾#}',summary:'{#把进展变成经验#}'}]
const desktopDefaults={version:1,notes:{brief:'# 项目简报\n\n## 目标\n\n让信息清晰，让下一步容易执行。\n\n## 本周计划\n\n- 明确需求\n- 完成原型\n- 收集反馈',ideas:'# 灵感收集\n\n记录你的想法。',review:'# 每周回顾\n\n## 做得好的事\n\n## 下一步'},tasks:[{id:'t1',title:'整理需求与关键场景',done:false},{id:'t2',title:'完成第一轮原型评审',done:false},{id:'t3',title:'建立项目简报',done:true}],revisions:[]}
function desktopInitial(){const saved=LocalStorage.desktopTemplateData;return saved?.version===1&&saved.notes&&Array.isArray(saved.tasks)&&Array.isArray(saved.revisions)?saved:desktopDefaults}
const desktop_state=NewState({notes:NewState({...desktopDefaults.notes,...desktopInitial().notes}),tasks:desktopInitial().tasks.map(task=>NewState({...task})),revisions:desktopInitial().revisions,taskTitle:'',error:'',notice:'',viewError:'',saving:false,failNextSave:false})
Bootstrap.config({bindDarkMode:[LocalStorage,'desktopDark']})
if(!['default','sm','lg'].includes(LocalStorage.desktopDensity))LocalStorage.desktopDensity='default'
State.changes.DesktopWorkspace=false
function desktopPage(){return ['editor','tasks','history','guide'].includes(Hash.desktopPage)?Hash.desktopPage:Hash.desktopPage?'missing':'editor'}
function desktopNote(){return desktopNotes.find(note=>note.id===Hash.desktopNote)}
function desktopMode(){return ['source','split','preview'].includes(Hash.desktopMode)?Hash.desktopMode:'source'}
function desktopPane(){return ['sidebar','main'].includes(Hash.desktopPane)?Hash.desktopPane:Hash.desktopNote?'main':'sidebar'}
function desktopVisibleNotes(){const search=typeof Hash.desktopSearch==='string'?Hash.desktopSearch:'';return desktopNotes.filter(note=>(note.label+note.summary).includes(search))}
if(!Hash.desktopNote||!Hash.desktopPage)Hash.go({desktopNote:Hash.desktopNote||'brief',desktopPage:Hash.desktopPage||'editor'})
function desktopChanged(){State.changes.DesktopWorkspace=true;desktop_state.error='';desktop_state.notice=''}
async function desktopSave(){if(desktop_state.saving)return;desktop_state.saving=true;desktop_state.error='';desktop_state.notice='';try{
 if(desktop_state.failNextSave){desktop_state.failNextSave=false;throw Error('demo')}
 const revision={id:UUID.make(),time:new Date().toISOString(),notes:{...desktop_state.notes},tasks:desktop_state.tasks.map(task=>({...task}))}
 const next={version:1,notes:{...desktop_state.notes},tasks:revision.tasks,revisions:[revision,...desktop_state.revisions].slice(0,10)}
 LocalStorage.desktopTemplateData=next;desktop_state.revisions=next.revisions;State.changes.DesktopWorkspace=false;desktop_state.notice='{#工作区已保存到当前浏览器。#}'
 }catch{desktop_state.error='{#保存失败，全部草稿仍在，请重试。#}'}finally{desktop_state.saving=false}}
function desktopAddTask(){const title=desktop_state.taskTitle.trim();if(!title)return;desktop_state.tasks=[NewState({id:UUID.make(),title,done:false}),...desktop_state.tasks];desktop_state.taskTitle='';desktopChanged()}
async function desktopRestore(){const revision=desktop_state.revisions.find(item=>item.id===Hash.desktopRevision);if(!revision||!await Dialog.confirm('{#将这次快照载入草稿？当前未保存内容会被替换，保存后才会覆盖本机工作区。#}'))return;desktop_state.notes=NewState({...revision.notes});desktop_state.tasks=revision.tasks.map(task=>NewState({...task}));desktopChanged();Hash.go({desktopPage:'editor'})}
async function desktopDiscard(){if(!State.changes.DesktopWorkspace)return;if(!await Dialog.confirm('{#放弃全部未保存的笔记与待办修改？#}'))return;const saved=desktopInitial();desktop_state.notes=NewState({...saved.notes});desktop_state.tasks=saved.tasks.map(task=>NewState({...task}));State.changes.DesktopWorkspace=false;desktop_state.error='';desktop_state.notice='{#已恢复最近保存的工作区。#}'}
async function desktopExit(){if(State.changes.DesktopWorkspace&&!await Dialog.confirm('{#离开模板并放弃全部未保存的工作区修改？#}'))return;State.changes.DesktopWorkspace=false;location.href='../../../templates/index.html'}
let desktopFailedView=null
function desktopViewError(event){if(!event.currentTarget.isConnected)return;desktopFailedView=event.currentTarget;desktop_state.viewError='{#页面片段加载失败，草稿仍保留。请重试。#}'}
function desktopViewReady(event){if(event.currentTarget===desktopFailedView){desktopFailedView=null;desktop_state.viewError=''}}
async function desktopRetryView(){if(desktop_state.viewRetrying||!desktopFailedView?.isConnected)return;desktop_state.viewRetrying=true;try{await desktopFailedView.load()}catch{}finally{desktop_state.viewRetrying=false}}
for(const key of ['desktopLayout','desktopPage'])Hash.__watch(key,()=>{desktopFailedView=null;desktop_state.viewError=''})
// One local keyboard shortcut; public save boundary shared with the visible button.
addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='s'){event.preventDefault();if(State.changes.DesktopWorkspace)desktopSave()}})
