/** System-owned composition and local demo actions. Views contain no scripts. */
const adminRoutes = [
  {id:'home',title:'{#工作概览#}',description:'{#从当前客户与订单出发，安排今天的工作。#}',icon:'grid',group:'business',file:'views/home.html'},
  {id:'customers',title:'{#客户管理#}',description:'{#筛选客户、查看档案或批量完成跟进。#}',icon:'people',group:'business',file:'views/customers/list.html'},
  {id:'customer-workspace',title:'{#客户工作台#}',description:'{#浏览客户、切换详情；桌面可拖动调整分栏。#}',icon:'layout-sidebar',group:'business',file:'views/customers/workspace.html'},
  {id:'customer-detail',title:'{#客户详情#}',description:'{#查看客户资料与关联订单，编辑联系方式或关注客户。#}',group:'business',file:'views/customers/detail.html'},
  {id:'customer-edit',title:'{#编辑客户#}',description:'{#同一份草稿跨布局保留；保存写入本机浏览器。#}',group:'business',file:'views/customers/edit.html'},
  {id:'customer-create',title:'{#分步创建客户#}',description:'{#填写资料、安排合作信息，核对后一次保存。#}',group:'business',file:'views/customers/create.html'},
  {id:'customer-import',title:'{#导入客户#}',description:'{#选择文件、映射字段并修正错误，确认后保存到当前浏览器。#}',group:'business',file:'views/customers/import.html'},
  {id:'customer-export',title:'{#导出客户#}',description:'{#选择范围与字段，生成可下载的 JSON 文件。#}',group:'business',file:'views/customers/export.html'},
  {id:'tasks',title:'{#任务与结果#}',description:'{#查看本机导入、导出和批量处理结果，不含服务端后台任务。#}',icon:'check2-square',group:'business',file:'views/tasks/list.html'},
  {id:'task-detail',title:'{#处理结果#}',description:'{#核对完成、跳过和失败的项目。#}',group:'business',file:'views/tasks/detail.html'},
  {id:'orders',title:'{#订单管理#}',description:'{#按状态与金额浏览订单，处理下一步。#}',icon:'receipt',group:'business',file:'views/orders/list.html'},
  {id:'order-detail',title:'{#订单详情#}',description:'{#检查订单内容并推进本地示例状态。#}',group:'business',file:'views/orders/detail.html'},
  {id:'history',title:'{#操作记录#}',description:'{#查看当前浏览器内完成的示例操作。#}',icon:'clock-history',group:'business',file:'views/history.html'},
  {id:'profile',title:'{#个人资料#}',description:'{#修改资料并明确保存，错误时保留草稿。#}',icon:'person-circle',group:'settings',file:'views/settings/profile.html'},
  {id:'preferences',title:'{#界面偏好#}',description:'{#密度、链接外观与列表页长，保存后生效。#}',icon:'sliders',group:'settings',file:'views/settings/preferences.html'},
  {id:'states',title:'{#状态与恢复#}',description:'{#体验加载、空结果、失败与重试，检查交互边界。#}',icon:'activity',group:'support',file:'views/states/examples.html'},
  {id:'guide',title:'{#模板使用说明#}',description:'{#先选布局，再复制业务 View，按需读取组件合同。#}',icon:'code-square',group:'support',file:'views/guide.html'}
]
const adminDefaultLayouts=[{id:'sidebar',label:'{#侧栏导航#}',file:'layouts/sidebar.html'},{id:'topnav',label:'{#顶部导航#}',file:'layouts/topnav.html'},{id:'mixed',label:'{#混合导航#}',file:'layouts/mixed.html'}]
const adminLayouts=globalThis.templateHost?.layouts||adminDefaultLayouts
const adminGroups=[{id:'business',label:'{#业务工作#}',icon:'briefcase'},{id:'settings',label:'{#设置#}',icon:'gear'},{id:'support',label:'{#示例与说明#}',icon:'book'}]
const adminCustomerFields=[{name:'name',label:'{#客户名称#}',type:'text',setting:{required:true}},{name:'contact',label:'{#联系人#}',type:'text',setting:{required:true}},{name:'email',label:'{#邮箱#}',type:'email',setting:{required:true}},{name:'phone',label:'{#电话#}',type:'text'},{name:'city',label:'{#城市#}',type:'select',options:['上海','杭州','深圳']},{name:'status',label:'{#合作状态#}',type:'select',options:['待跟进','合作中']},{name:'notes',label:'{#备注#}',type:'textarea',colspan:'full',setting:{rows:3}}]
const adminProfileFields=[{name:'name',label:'{#姓名#}',type:'text',setting:{required:true}},{name:'email',label:'{#邮箱#}',type:'email',setting:{required:true}},{name:'team',label:'{#所属团队#}',type:'text'},{name:'signature',label:'{#个人说明#}',type:'textarea',colspan:'full'}]
const adminPreferenceFields=[{name:'density',label:'{#界面密度#}',type:'select',options:[{value:'default',label:'{#默认#}'},{value:'sm',label:'{#紧凑#}'},{value:'lg',label:'{#宽松#}'}]},{name:'pageSize',label:'{#每页数量#}',type:'select',options:[{value:10,label:'10'},{value:20,label:'20'},{value:50,label:'50'}]},{name:'link',label:'{#链接外观#}',type:'switch'},{name:'notifications',label:'{#接收本地示例通知#}',type:'switch'}]
const adminClone=value=>JSON.parse(JSON.stringify(value))
function adminInitial(){try{const saved=LocalStorage.adminTemplateData;if(saved?.version===1&&Array.isArray(saved.customers)&&Array.isArray(saved.orders)&&saved.profile&&saved.preferences&&Array.isArray(saved.activity))return saved}catch{}return adminSeed()}
function adminQueryOptions(key,pagesize){const value=Hash[key];return {page:Number(value?.page)||1,pagesize:Number(value?.pagesize)||pagesize,search:typeof value?.search==='string'?value.search:'',sort:typeof value?.sort==='string'?value.sort:'',filters:value?.filters&&typeof value.filters==='object'&&!Array.isArray(value.filters)?value.filters:{}}}
const admin_state=NewState({
  data:NewState(adminClone(adminInitial())),customerDraft:NewState({}),customerDraftId:'',
  profileDraft:NewState({}),preferencesDraft:NewState({}),notice:'',error:'',viewError:'',viewRetrying:false,saving:false,
  historyDraft:typeof Hash.adminHistory==='string'?Hash.adminHistory:'',failNextSave:false,
  read:NewState({loading:false,error:'',empty:false,hasdata:false}),readResult:'',
  customerSource:null,orderSource:null
})
admin_state.profileDraft=NewState(adminClone(admin_state.data.profile))
admin_state.preferencesDraft=NewState(adminClone(admin_state.data.preferences))
admin_state.customerSource=ListDataSource.create({items:admin_state.data.customers,...adminQueryOptions('adminCustomers',Number(admin_state.data.preferences.pageSize)||20),filterfields:[{name:'status',label:'{#合作状态#}',type:'select',options:['待跟进','合作中']},{name:'city',label:'{#城市#}',type:'select',options:['上海','杭州','深圳']}]})
admin_state.orderSource=ListDataSource.create({items:admin_state.data.orders,...adminQueryOptions('adminOrders',20),searchFields:['id','title','customerId'],filterfields:[{name:'status',label:'{#订单状态#}',type:'select',options:['待确认','进行中','已完成','已取消']}]})
for(const [key,source] of [['adminCustomers',admin_state.customerSource],['adminOrders',admin_state.orderSource]]){
  source.addEventListener('querychange',event=>{if(JSON.stringify(Hash[key])!==JSON.stringify(event.detail))Hash.go({[key]:event.detail})})
  Hash.__watch(key,()=>{const query=adminQueryOptions(key,key==='adminCustomers'?Number(admin_state.data.preferences.pageSize)||20:20);if(JSON.stringify(query)===JSON.stringify(source.query()))return;source.setQuery(query);source.setPageSize(query.pagesize);source.setPage(query.page)})
}
Bootstrap.config({bindDarkMode:[LocalStorage,'adminTemplateDark']})
function adminPage(){return adminRoutes.some(route=>route.id===Hash.adminPage)?Hash.adminPage:Hash.adminPage?'missing':'home'}
function adminLayout(){return adminLayouts.some(layout=>layout.id===Hash.adminLayout)?Hash.adminLayout:adminLayouts[0].id}
function adminInfo(){return adminRoutes.find(route=>route.id===adminPage())||{title:'{#页面不存在#}',description:'{#该地址不在模板页面清单中，请返回工作概览。#}',group:'support'}}
function adminNavPage(){return {'customer-detail':'customers','customer-edit':'customers','customer-create':'customers','customer-import':'customers','customer-export':'customers','order-detail':'orders','task-detail':'tasks'}[adminPage()]||adminPage()}
function adminSourceURL(file){return new URL(file,location.origin+'../../../templates/systems/admin/').href}
function adminNavItems(group){return adminRoutes.filter(route=>route.icon&&(!group||route.group===group)).map(route=>({type:'button',name:route.id,label:route.title,icon:route.icon,class:'text-body'}))}
function adminCustomerKey(){return adminPage()==='customer-workspace'?Hash.adminWorkspaceCustomer:Hash.adminId}
function adminCustomer(){return admin_state.data.customers.find(item=>item.id===adminCustomerKey())}
function adminCustomerView(){return Hash.adminCustomerView==='cards'?'cards':'list'}
function adminCustomerPane(){return ['sidebar','main'].includes(Hash.adminCustomerPane)?Hash.adminCustomerPane:Hash.adminWorkspaceCustomer?'main':'sidebar'}
async function adminOpenCustomer(id){if(adminPage()==='customer-workspace'){if(!await adminDiscard())return;Hash.go({adminWorkspaceCustomer:id,adminCustomerPane:'main'})}else await adminGo({adminPage:'customer-detail',adminId:id})}
function adminOrder(){return admin_state.data.orders.find(item=>item.id===Hash.adminId)}
function adminMoney(value){return '¥ '+Number(value||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function adminDate(value){return new Date(value).toLocaleString('zh-CN',{hour12:false})}
const adminChangeKeys=['AdminCustomer','AdminProfile','AdminPreferences','AdminImport']
function adminDirty(){return adminChangeKeys.some(key=>State.changes[key]===true)}
let adminFailedView=null
function adminViewFailure(event){if(!event.currentTarget.isConnected)return;adminFailedView=event.currentTarget;admin_state.viewError='{#页面片段加载失败，请检查连接后重试。#}'}
function adminViewReady(event){if(event.currentTarget===adminFailedView){adminFailedView=null;admin_state.viewError=''}}
async function adminRetryView(){if(admin_state.viewRetrying)return;if(!adminFailedView?.isConnected){admin_state.viewError='';return}admin_state.viewRetrying=true;try{await adminFailedView.load()}catch{}finally{admin_state.viewRetrying=false}}
Hash.__watch('adminLayout',()=>{adminFailedView=null;admin_state.viewError=''})
Hash.__watch('adminPage',()=>{adminFailedView=null;admin_state.viewError='';admin_state.notice=''})
async function adminDiscard(){if(!adminDirty())return true;if(!await Dialog.confirm('{#放弃未保存的示例修改？#}'))return false;for(const key of adminChangeKeys)State.changes[key]=false;if(admin_state.importDraft)admin_state.importDraft=adminEmptyImport();admin_state.customerDraftId='';admin_state.profileDraft=NewState(adminClone(admin_state.data.profile));admin_state.preferencesDraft=NewState(adminClone(admin_state.data.preferences));return true}
async function adminGo(patch,guarded=false){if(!guarded&&!await adminDiscard())return false;if(guarded){if(!State.changes.AdminImport&&admin_state.importDraft?.source.length)admin_state.importDraft=adminEmptyImport();if(!State.changes.AdminCustomer)admin_state.customerDraftId='';if(!State.changes.AdminProfile)admin_state.profileDraft=NewState(adminClone(admin_state.data.profile));if(!State.changes.AdminPreferences)admin_state.preferencesDraft=NewState(adminClone(admin_state.data.preferences))}admin_state.error='';admin_state.notice='';Hash.go({adminId:null,adminReturn:patch.adminPage==='customer-edit'&&adminPage()==='customer-workspace'?'customer-workspace':null,...patch});if(globalThis.adminShell?.state)globalThis.adminShell.state.navOpen=false;return true}
function adminGroupGo(group){const route=adminRoutes.find(item=>item.group===group&&item.icon);return adminGo({adminPage:route.id})}
async function adminExit(){if(await adminDiscard())location.href='../../../templates/index.html'}
function adminPrepareCustomer(){
  if(!['customer-edit','customer-create'].includes(adminPage()))return
  const id=adminPage()==='customer-create'?'new':Hash.adminId||'new'
  if(admin_state.customerDraftId===id&&State.changes.AdminCustomer)return
  if(State.changes.AdminCustomer)return
  const record=id==='new'?null:adminCustomer();if(id!=='new'&&!record){admin_state.customerDraftId='';return}admin_state.customerDraftId=id;admin_state.customerDraftPage=adminPage()
  admin_state.customerDraft=NewState(record?adminClone(record):{name:'',contact:'',email:'',phone:'',city:'上海',status:'待跟进',notes:'',favorite:false})
  State.changes.AdminCustomer=false
}
Hash.__watch('adminPage',adminPrepareCustomer);Hash.__watch('adminId',adminPrepareCustomer);adminPrepareCustomer()
if(!Hash.adminPage||!adminLayouts.some(layout=>layout.id===Hash.adminLayout))Hash.go({adminPage:Hash.adminPage||'home',adminLayout:adminLayout()})
function adminResumeDraft(){if(State.changes.AdminCustomer)Hash.go({adminPage:admin_state.customerDraftPage||'customer-edit',adminId:admin_state.customerDraftId==='new'?null:admin_state.customerDraftId});else if(State.changes.AdminProfile)Hash.go({adminPage:'profile'});else if(State.changes.AdminPreferences)Hash.go({adminPage:'preferences'});else if(State.changes.AdminImport)Hash.go({adminPage:'customer-import'})}
async function adminCommit(change,label,detail){
  if(admin_state.saving)return false
  admin_state.saving=true;admin_state.error='';admin_state.notice=''
  try{
    const next=adminClone(admin_state.data);change(next)
    next.activity.unshift({id:UUID.make(),time:new Date().toISOString(),label,detail})
    if(admin_state.failNextSave){admin_state.failNextSave=false;throw Error('{#演示保存失败：修改已保留，请再次保存。#}')}
    LocalStorage.adminTemplateData=next
    admin_state.data=NewState(next)
    await admin_state.customerSource.setItems(next.customers);await admin_state.orderSource.setItems(next.orders)
    admin_state.notice=label+'{#，已保存到当前浏览器。#}';return true
  }catch(error){admin_state.error=error.message?.startsWith('{#演示保存失败')?error.message:'{#本地保存失败，请检查浏览器存储空间后重试。#}';return false}
  finally{admin_state.saving=false}
}
async function adminSaveCustomer(event){event.preventDefault();return adminPersistCustomer(event.detail)}
async function adminPersistCustomer(input){const value=adminClone(input),id=admin_state.customerDraftId==='new'?'C-'+UUID.make():admin_state.customerDraftId;value.id=id
  if(await adminCommit(data=>{const index=data.customers.findIndex(item=>item.id===id);if(index<0)data.customers.unshift(value);else data.customers[index]=value},'{#保存客户#}',value.name)){State.changes.AdminCustomer=false;admin_state.customerDraftId=id;Hash.go({adminPage:Hash.adminReturn==='customer-workspace'?'customer-workspace':'customer-detail',adminWorkspaceCustomer:Hash.adminReturn==='customer-workspace'?id:Hash.adminWorkspaceCustomer,adminCustomerPane:Hash.adminReturn==='customer-workspace'?'main':Hash.adminCustomerPane,adminReturn:null,adminId:id})}
}
function adminValidateCustomer(data){const errors={};if(!data.name?.trim())errors.name='{#请填写客户名称。#}';if(!data.contact?.trim())errors.contact='{#请填写联系人。#}';if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email||''))errors.email='{#请填写有效邮箱。#}';return errors}
async function adminFavorite(){const item=adminCustomer();if(item)await adminCommit(data=>{data.customers.find(row=>row.id===item.id).favorite=!item.favorite},item.favorite?'{#取消关注#}':'{#关注客户#}',item.name)}
async function adminBulkCustomers(ids){if(!ids.length)return;await adminCommit(data=>{for(const row of data.customers)if(ids.includes(row.id))row.status='合作中'},'{#完成批量跟进#}',ids.length+' {#位客户#}')}
async function adminOrderAdvance(){const item=adminOrder();if(!item)return;const next={'待确认':'进行中','进行中':'已完成'}[item.status];if(next)await adminCommit(data=>{data.orders.find(row=>row.id===item.id).status=next},'{#更新订单状态#}',item.id+' → '+next)}
async function adminOrderCancel(){const item=adminOrder();if(!item||['已完成','已取消'].includes(item.status)||!await Dialog.confirm('{#取消这笔本地示例订单？#}'))return;await adminCommit(data=>{data.orders.find(row=>row.id===item.id).status='已取消'},'{#取消订单#}',item.id)}
async function adminSaveProfile(event){event.preventDefault();const value=adminClone(event.detail);if(await adminCommit(data=>{data.profile=value},'{#保存个人资料#}',value.name))State.changes.AdminProfile=false}
async function adminSavePreferences(event){event.preventDefault();const value={...adminClone(event.detail),pageSize:Number(event.detail.pageSize)};if(await adminCommit(data=>{data.preferences=value},'{#保存界面偏好#}',value.density)){State.changes.AdminPreferences=false;admin_state.customerSource.setPageSize(value.pageSize)}}
async function adminResetDraft(type){const key=type==='profile'?'AdminProfile':'AdminPreferences';if(State.changes[key]&&!await Dialog.confirm('{#撤销这份草稿的修改？#}'))return;if(type==='profile')admin_state.profileDraft=NewState(adminClone(admin_state.data.profile));else admin_state.preferencesDraft=NewState(adminClone(admin_state.data.preferences));State.changes[key]=false;admin_state.error='';admin_state.notice='{#已恢复为最近保存的值。#}'}
Hash.__watch('adminHistory',()=>{admin_state.historyDraft=typeof Hash.adminHistory==='string'?Hash.adminHistory:''})
function adminHistory(){return admin_state.data.activity.filter(item=>(item.label+' '+item.detail).includes(typeof Hash.adminHistory==='string'?Hash.adminHistory:''))}
async function adminRead(fail=false,empty=false){if(admin_state.read.loading)return;Object.assign(admin_state.read,{loading:true,error:'',empty:false});await new Promise(resolve=>setTimeout(resolve,350));admin_state.read.loading=false;if(fail){admin_state.read.error='{#演示读取失败，已有结果保持可见。#}';return}Object.assign(admin_state.read,{empty,hasdata:!empty});admin_state.readResult=empty?'':'{#已读取当前浏览器中的#} '+admin_state.data.customers.length+' {#位客户。#}'}
async function adminResetDemo(){if(!await Dialog.confirm('{#重置当前浏览器的后台模板示例数据？所有示例修改将被初始数据替换。#}'))return;LocalStorage.adminTemplateData=adminSeed();for(const key of adminChangeKeys)State.changes[key]=false;location.reload()}
addEventListener('pagehide',event=>{if(!event.persisted){admin_state.customerSource.dispose();admin_state.orderSource.dispose()}})

function adminCompactMoney(value){return new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',notation:'compact',maximumFractionDigits:2}).format(value)}
