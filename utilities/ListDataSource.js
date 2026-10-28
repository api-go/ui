/** Shared collection controller; State itself remains unchanged. */
globalThis.ListDataSource = {
  create(options = {}) {
    const positive=(value,fallback)=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):fallback
    const source=new EventTarget()
    source.filterfields=options.filterfields||[]
    const state=source.state=NewState({page:positive(options.page,1),pagesize:positive(options.pagesize,20),search:options.search||'',sort:options.sort||'',filters:NewState({...options.filters}),rows:[],total:0,loading:false,loaded:false,error:''})
    let items=options.items||[], request, version=0, queued=false, disposed=false
    const publish=(name,detail)=>source.dispatchEvent(new CustomEvent(name,{detail}))
    source.query=()=>({page:positive(state.page,1),pagesize:positive(state.pagesize,20),search:String(state.search||''),sort:String(state.sort||''),filters:{...state.filters}})
    source.pageCount=()=>Math.max(1,Math.ceil(state.total/positive(state.pagesize,20)))
    source.setPage=page=>{if(!Number.isSafeInteger(Number(page))||Number(page)<1||Number(page)>source.pageCount())return false;state.page=Number(page);return true}
    source.setPageSize=size=>{if(!Number.isSafeInteger(Number(size))||Number(size)<1)return false;state.pagesize=Number(size);return true}
    source.setQuery=query=>{
      for(const key of ['search','sort'])if(Object.hasOwn(query,key)&&state[key]!==String(query[key]||''))state[key]=String(query[key]||'')
      if(Object.hasOwn(query,'filters')){
        const filters=Object.fromEntries(Object.entries(query.filters||{}).filter(([,value])=>value!=null&&value!==''))
        if(JSON.stringify(filters)!==JSON.stringify(state.filters))state.filters=NewState(filters)
      }
    }
    source.setItems=next=>{if(!Array.isArray(next))throw new TypeError('ListDataSource items must be an array');items=next;return source.reload()}
    source.reload=async()=>{
      if(disposed)return false
      request?.abort();const controller=request=new AbortController(),current=++version,query=source.query()
      state.loading=true;state.error='';publish('querychange',query)
      try{
        let result
        if(options.load)result=await options.load(query,controller.signal)
        else{
          const fields=options.searchFields||['name','label','summary'],needle=query.search.toLocaleLowerCase()
          let rows=items.filter(item=>!needle||fields.some(field=>String(item[field]??'').toLocaleLowerCase().includes(needle)))
          for(const field of source.filterfields){
            const value=query.filters[field.name]
            if(value==null||value==='')continue
            const operator=field.operator||(!field.type||field.type==='text'?'contains':'eq'),name=field.field||field.name
            rows=rows.filter(item=>{
              const actual=item[name]
              if(operator==='eq')return field.type==='number'?actual!=null&&actual!==''&&Number(actual)===Number(value):String(actual??'')===String(value)
              if(operator==='gte'||operator==='lte'){
                if(actual==null||actual==='')return false
                const left=field.type==='number'?Number(actual):String(actual),right=field.type==='number'?Number(value):String(value)
                return operator==='gte'?left>=right:left<=right
              }
              return String(actual??'').toLocaleLowerCase().includes(String(value).toLocaleLowerCase())
            })
          }
          if(query.sort){const descending=query.sort.startsWith('-'),field=descending?query.sort.slice(1):query.sort;rows=rows.toSorted((a,b)=>String(a[field]??'').localeCompare(String(b[field]??''),undefined,{numeric:true})*(descending?-1:1))}
          result={rows:rows.slice((query.page-1)*query.pagesize,query.page*query.pagesize),total:rows.length}
        }
        if(disposed||current!==version||controller.signal.aborted)return false
        if(!Array.isArray(result?.rows)||!Number.isSafeInteger(result.total)||result.total<0)throw new TypeError('Invalid paged result')
        const last=Math.max(1,Math.ceil(result.total/query.pagesize))
        if(query.page>last){state.page=last;return false}
        state.rows=result.rows;state.total=result.total;state.loaded=true;publish('load',{rows:state.rows,total:state.total});return true
      }catch(error){
        if(!disposed&&current===version&&!controller.signal.aborted){state.error=options.errorMessage||'{#Unable to load data#}';publish('loaderror',{error})}
        return false
      }finally{if(!disposed&&current===version)state.loading=false}
    }
    const watchers=[]
    for(const key of ['page','pagesize','search','sort','filters']){
      const watch=()=>{if(disposed)return;if(key!=='page'&&state.page!==1)state.page=1;if(!queued){queued=true;queueMicrotask(()=>{queued=false;if(!disposed)source.reload()})}}
      state.__watch(key,watch);watchers.push([key,watch])
    }
    source.dispose=()=>{disposed=true;version++;request?.abort();for(const [key,watch]of watchers)state.__unwatch(key,watch)}
    source.ready=options.auto===false?Promise.resolve(false):source.reload()
    return source
  }
}
