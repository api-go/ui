const adminMobileTabs=[{id:'home',label:'{#首页#}',icon:'house'},{id:'customers',label:'{#客户#}',icon:'people'},{id:'tasks',label:'{#任务#}',icon:'check2-square'},{id:'mobile-more',label:'{#更多#}',icon:'grid'}]
adminRoutes.push({id:'mobile-more',title:'{#更多#}',description:'',group:'settings',file:'../../../templates/systems/mobile/views/more.html'})
function adminMobileTab(){const page=adminPage();return ['customer-detail','customer-create','customer-edit','customer-workspace','customer-import','customer-export'].includes(page)?'customers':page==='task-detail'?'tasks':adminMobileTabs.some(tab=>tab.id===page)?page:'mobile-more'}
function adminMobileMore(){return adminRoutes.filter(route=>['orders','customer-workspace','history','profile','preferences','states','guide'].includes(route.id))}
function adminMobileBack(){const page=adminPage();const parent=page==='customer-edit'?(Hash.adminReturn==='customer-workspace'?'customer-workspace':Hash.adminId?'customer-detail':'customers'):page==='task-detail'?'tasks':page.startsWith('customer-')?'customers':page==='order-detail'?'orders':'mobile-more';return adminGo({adminPage:parent,...(parent==='customer-detail'?{adminId:Hash.adminId}:{})})}

function adminMobileRoot(){return ['home','customers','tasks','mobile-more'].includes(adminPage())}
