/** Fictional, browser-local demo records. No server or authorization is simulated. */
const adminSeed = () => ({
  version:1,
  customers:Array.from({length:137},(_,index)=>({
    id:'C-'+String(index+1).padStart(4,'0'),
    name:['北辰设计事务所','青禾商贸','远山科技','云帆咨询'][index%4]+' '+(index+1),
    contact:['周宁','林悦','许舟','陈安'][index%4],
    email:'contact'+(index+1)+'@example.test',
    phone:index%5?'021-5550-'+String(index+1).padStart(4,'0'):'',
    city:['上海','杭州','深圳'][index%3],
    status:index%3?'合作中':'待跟进',
    notes:index%2?'优先通过邮件联系。':'下次沟通时确认需求与预算。',
    favorite:false
  })),
  orders:Array.from({length:36},(_,index)=>({
    id:'O-'+String(index+1).padStart(4,'0'),customerId:'C-'+String(index%18+1).padStart(4,'0'),
    title:['品牌设计服务','系统实施服务','年度支持服务'][index%3],
    amount:(index+1)*1250,status:['待确认','进行中','已完成'][index%3],
    date:'2026-10-'+String(index%28+1).padStart(2,'0'),notes:'示例合同内容，仅供界面与本地交互演示。'
  })),
  profile:{name:'林悦',email:'lin.yue@example.test',team:'客户运营',signature:'保持信息清晰，让协作更轻松。'},
  preferences:{density:'default',link:false,pageSize:20,notifications:true},
  activity:[{id:'seed',time:'2026-10-29T09:00:00+08:00',label:'初始化示例数据',detail:'137 位客户、36 笔订单；数据仅在当前浏览器中演示。'}]
})
