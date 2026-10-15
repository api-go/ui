// Local deterministic transport fixtures. No application accounts or resources.
const sessions=new Map()
module.exports=async(pathname,request,response)=>{
 if(!pathname.startsWith('/admin/ui-check-'))return false
 const chunks=[];for await(const chunk of request)chunks.push(chunk)
 const args=request.method==='GET'?Object.fromEntries(new URL(request.url,'http://localhost').searchParams):JSON.parse(Buffer.concat(chunks).toString()||'{}')
 let result,status=200
 if(pathname==='/admin/ui-check-fixture')result={ok:true,method:'GET',args}
 else if(pathname==='/admin/ui-check-fixture-post')result={ok:true,method:'POST',args}
 else if(pathname==='/admin/ui-check-fixture-error')result={error:'application failed'}
 else if(pathname==='/admin/ui-check-editor-fixture'){
  const action=String(args.action||''),path=String(args.path||'')
  if(path.includes('error'))result={error:'fixture document error'}
  else if(action==='set'&&path.includes('conflict'))result={ok:false,conflict:true,baseVersion:args.baseVersion,currentVersion:Number(args.baseVersion||0)+2,current:{path,version:Number(args.baseVersion||0)+2},diff:'fixture diff',diffTruncated:true}
  else if(action==='set')result={succeeded:1,failed:0,baseVersion:args.baseVersion,meta:{path,version:Number(args.version||3)+1}}
  else if(action==='get'){
   let type='code',data='const loaded = true'
   if(path.endsWith('.kanban')){type='kanban';data={columns:[{id:'todo',title:'API Todo',items:[{id:'api-card',title:'Loaded card',content:'Ready'}]}]}}
   if(path.endsWith('.mindmap')){type='mindmap';data={nodes:[{id:'root',title:'API Root'}],edges:[],settings:{direction:'right'},view:{x:0,y:0,scale:1}}}
   if(path.endsWith('.graph')){type='graph';data={nodes:[{id:'root',title:'API Graph',x:0,y:0}],edges:[],view:{x:0,y:0,scale:1}}}
   result={data:{type,formatVersion:1,data},meta:{path,version:Number(args.version||3),type:'json'}}
  }else result={error:'unknown fixture action'}
 }else if(pathname==='/admin/ui-check-datagrid-fixture'){
  if(args.action==='fields')result={ok:true,fullAccess:true,fields:[{id:'f-name',tableID:'users',name:'name',type:'v100',settings:{type:'text'}},{id:'f-age',tableID:'users',name:'age',type:'i',settings:{type:'number'}}]}
  else if(args.action==='query'){
   const key=String(args.dataSession||''),previous=sessions.get(key),seen=key?(previous?.expires>Date.now()?previous.count:0)+1:1;if(key)sessions.set(key,{count:seen,expires:Date.now()+60000})
   if(sessions.size>1000)for(const [id,value]of sessions)if(value.expires<Date.now())sessions.delete(id)
   result={ok:true,data:[seen>1?{id:'api-1'}:{id:'api-1',name:'API Ada',age:36,updateTime:1000},{id:'api-legacy',name:'Legacy Lin',age:42}],count:2}
  }else result={ok:true,succeeded:1,failed:0}
 }else{status=404;result={error:'fixture not found'}}
 response.writeHead(status,{'Content-Type':'application/json'}).end(JSON.stringify(result));return true
}
