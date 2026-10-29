/** Editable workflow examples. File reading and Blob download are native integration boundaries.
 * No server upload, background worker or authorization is simulated here. */
const adminImportFields=[{name:'name',label:'{#客户名称#}',required:true},{name:'contact',label:'{#联系人#}',required:true},{name:'email',label:'{#邮箱#}',required:true},{name:'phone',label:'{#电话#}'},{name:'city',label:'{#城市#}',options:['上海','杭州','深圳']},{name:'status',label:'{#合作状态#}',options:['待跟进','合作中']}]
const adminImportSteps=['{#选择文件#}','{#字段映射#}','{#校验修正#}','{#确认导入#}']
function adminEmptyImport(){return NewState({filename:'',source:[],columns:[],mapping:NewState({}),rows:[],revision:0,busy:false,error:'',result:null})}
admin_state.importDraft=adminEmptyImport()
admin_state.exportDraft=NewState({scope:'page',fields:['name','contact','email','phone','city','status']})
admin_state.taskSearch=typeof Hash.adminTaskSearch==='string'?Hash.adminTaskSearch:''
function adminTasks(){const tasks=LocalStorage.adminTemplateTasks;return Array.isArray(tasks)?tasks:[]}
function adminStoreTask(task){LocalStorage.adminTemplateTasks=[task,...adminTasks()].slice(0,30)}
function adminTask(){return adminTasks().find(task=>task.id===Hash.adminTask)}
function adminVisibleTasks(){const query=typeof Hash.adminTaskSearch==='string'?Hash.adminTaskSearch:'';return adminTasks().filter(task=>(task.label+' '+task.filename).includes(query))}
Hash.__watch('adminTaskSearch',()=>{admin_state.taskSearch=typeof Hash.adminTaskSearch==='string'?Hash.adminTaskSearch:''})
function adminImportStep(){if(!admin_state.importDraft.source.length)return 0;const step=Number(Hash.adminImportStep);return Number.isInteger(step)&&step>=0&&step<4?(step>1&&!admin_state.importDraft.rows.length?1:step):1}
function adminImportColumnsValid(){const draft=admin_state.importDraft;const selected=adminImportFields.map(field=>draft.mapping[field.name]).filter(Boolean);return adminImportFields.filter(field=>field.required).every(field=>draft.columns.includes(draft.mapping[field.name]))&&new Set(selected).size===selected.length}
function adminImportIssues(row){
  const errors=adminValidateCustomer(row)
  if(!['上海','杭州','深圳'].includes(row.city))errors.city='{#请选择支持的城市。#}'
  if(!['待跟进','合作中'].includes(row.status))errors.status='{#请选择合作状态。#}'
  const email=(row.email||'').trim().toLowerCase()
  if(email&&admin_state.data.customers.some(item=>item.email?.trim().toLowerCase()===email))errors.email='{#该邮箱已存在，请修正或取消导入此行。#}'
  if(email&&admin_state.importDraft.rows.some(item=>item!==row&&item.include&&item.email.trim().toLowerCase()===email))errors.email='{#文件内邮箱重复，请修正或取消导入重复行。#}'
  return errors
}
function adminImportSelected(){return admin_state.importDraft.rows.filter(row=>row.include)}
function adminImportInvalid(){return adminImportSelected().filter(row=>Object.keys(adminImportIssues(row)).length)}
async function adminImportFile(file){
  if(!file||admin_state.importDraft.busy)return
  if(State.changes.AdminImport&&!await Dialog.confirm('{#替换当前导入草稿？已修正的内容将被替换。#}'))return
  admin_state.importDraft.busy=true;admin_state.importDraft.error=''
  try{
    if(file.size>1024*1024)throw Error('{#文件不能超过1MB。#}')
    let source;try{source=JSON.parse(await file.text())}catch{throw Error('{#无法解析 JSON，请选择 UTF-8 编码的对象数组文件。#}')}
    if(!Array.isArray(source)||!source.length||source.length>200||source.some(row=>!row||typeof row!=='object'||Array.isArray(row)))throw Error('{#文件须包含1至200行对象数组。#}')
    const columns=[...new Set(source.flatMap(row=>Object.keys(row)))].filter(key=>!['__proto__','constructor','prototype'].includes(key))
    if(columns.length>30||source.some(row=>Object.values(row).some(value=>value!==null&&!['string','number','boolean'].includes(typeof value))))throw Error('{#最多支持30列，字段值须为文本、数字、布尔值或空值。#}')
    const mapping=Object.fromEntries(adminImportFields.map(field=>[field.name,columns.includes(field.name)?field.name:columns.includes(field.label.replace(/\{#|#\}/g,''))?field.label.replace(/\{#|#\}/g,''):'']))
    admin_state.importDraft=NewState({filename:file.name,source,columns,mapping:NewState(mapping),rows:[],revision:0,busy:false,error:'',result:null})
    State.changes.AdminImport=true;Hash.go({adminImportStep:1,adminTask:null})
  }catch(error){admin_state.importDraft.error=error.message}finally{admin_state.importDraft.busy=false}
}
async function adminImportBuild(){
  if(!adminImportColumnsValid())return
  const draft=admin_state.importDraft
  const signature=JSON.stringify(adminImportFields.map(field=>draft.mapping[field.name]||''))
  if(draft.rows.length&&draft.mappingSignature===signature){Hash.go({adminImportStep:2});return}
  if(draft.rows.length&&!await Dialog.confirm('{#字段映射已改变，重新生成预览会替换行内修正。继续？#}'))return
  draft.rows=draft.source.map((source,index)=>NewState({line:index+1,include:true,...Object.fromEntries(adminImportFields.map(field=>[field.name,String(source[draft.mapping[field.name]]??(field.name==='city'?'上海':field.name==='status'?'待跟进':'')).trim()]))}))
  draft.mappingSignature=signature
  draft.revision++;draft.error='';Hash.go({adminImportStep:2})
}
async function adminImportMove(step){
  const current=adminImportStep();if(step===current)return
  if(step===2&&current===1){adminImportBuild();return}
  if(step===3&&(!adminImportSelected().length||adminImportInvalid().length))return
  Hash.go({adminImportStep:step})
}
function adminImportChanged(){admin_state.importDraft.revision++;State.changes.AdminImport=true;admin_state.importDraft.error=''}
function adminFocusImportError(){const row=adminImportInvalid()[0];if(row)document.getElementById('import-'+row.line+'-'+Object.keys(adminImportIssues(row))[0])?.focus()}
async function adminImportFinish(){
  if(admin_state.saving||!adminImportSelected().length||adminImportInvalid().length)return
  const draft=admin_state.importDraft,rows=adminImportSelected().map(row=>({...Object.fromEntries(adminImportFields.map(field=>[field.name,String(row[field.name]).trim()])),id:'C-'+UUID.make(),notes:'',favorite:false}))
  const task={id:UUID.make(),kind:'import',label:'{#客户导入#}',filename:draft.filename,time:new Date().toISOString(),status:'done',count:rows.length,skipped:draft.rows.length-rows.length,rows:rows.map(row=>({id:row.id,name:row.name}))}
  if(await adminCommit(data=>{data.customers.unshift(...rows)},'{#导入客户#}',rows.length+' {#位客户#}')){
    // Results are optional diagnostics: failure to retain a log must never repeat a successful write.
    State.changes.AdminImport=false;draft.result=task;draft.rows=[];draft.source=[]
    try{adminStoreTask(task)}catch{draft.error='{#客户已导入，但任务记录未保存。请勿重复导入。#}';return}
    Hash.go({adminPage:'task-detail',adminTask:task.id,adminImportStep:null})
  }
}
function adminDownload(value,name){const objectURL=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json;charset=utf-8'}));const link=document.createElement('a');link.href=objectURL;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(objectURL),1000)}
function adminDownloadImportSample(){adminDownload([{name:'示例新客户',contact:'林女士',email:'new-customer@example.test',phone:'13800000000',city:'上海',status:'待跟进'},{name:'待修正客户',contact:'陈先生',email:'请修正邮箱',city:'杭州',status:'待跟进'}],'customers-sample.json')}
const adminCreateSteps=['{#基本资料#}','{#合作信息#}','{#核对保存#}']
function adminCreateStep(){const step=Number(Hash.adminCreateStep);return [1,2].includes(step)?step:0}
function adminGuardCreateRoute(){if(adminPage()==='customer-create'&&Number(Hash.adminCreateStep)>0&&Object.keys(adminValidateCustomer(admin_state.customerDraft)).length)Hash.go({adminCreateStep:0})}
Hash.__watch('adminCreateStep',adminGuardCreateRoute);Hash.__watch('adminPage',adminGuardCreateRoute);adminGuardCreateRoute()
function adminCreateFields(){return adminCustomerFields.filter(field=>adminCreateStep()===0?['name','contact','email','phone'].includes(field.name):['city','status','notes'].includes(field.name))}
async function adminCreateFinish(){if(admin_state.saving||Object.keys(adminValidateCustomer(admin_state.customerDraft)).length)return;await adminPersistCustomer(admin_state.customerDraft)}
function adminExportRows(){return admin_state.exportDraft.scope==='all'?admin_state.data.customers:admin_state.customerSource.state.rows}
async function adminExport(){
  if(!admin_state.exportDraft.fields.length||admin_state.saving)return
  admin_state.error=''
  try{
    const fields=adminImportFields.map(field=>field.name).filter(name=>admin_state.exportDraft.fields.includes(name)),rows=adminExportRows().map(row=>Object.fromEntries(fields.map(name=>[name,row[name]])))
    const task={id:UUID.make(),kind:'export',label:'{#客户导出#}',filename:'customers-'+new Date().toISOString().slice(0,10)+'.json',time:new Date().toISOString(),status:'done',count:rows.length,rows}
    adminStoreTask(task);Hash.go({adminPage:'task-detail',adminTask:task.id});adminDownload(rows,task.filename)
  }catch{admin_state.error='{#无法创建导出文件或保存记录，请检查浏览器存储后重试。#}'}
}
async function adminBulkCustomersWithResult(ids){
  if(!ids.length||admin_state.saving)return
  const snapshot=[...new Set(ids)],results=snapshot.map(id=>{const row=admin_state.data.customers.find(item=>item.id===id);return {id,name:row?.name||id,status:!row?'failed':row.status==='合作中'?'skipped':'done',message:!row?'{#客户已不存在#}':row.status==='合作中'?'{#已是合作中，无需重复更新#}':'{#已完成跟进#}'}})
  const accepted=results.filter(row=>row.status==='done')
  if(accepted.length&&!await adminCommit(data=>{for(const row of data.customers)if(accepted.some(item=>item.id===row.id))row.status='合作中'},'{#完成批量跟进#}',accepted.length+' {#位客户#}'))return
  const task={id:UUID.make(),kind:'bulk',label:'{#批量跟进结果#}',filename:'',time:new Date().toISOString(),status:results.some(row=>row.status==='failed')?'partial':'done',count:accepted.length,rows:results}
  try{adminStoreTask(task);Hash.go({adminPage:'task-detail',adminTask:task.id})}catch{admin_state.error='{#操作已完成，但任务记录未保存。请刷新客户列表确认结果。#}'}
}
