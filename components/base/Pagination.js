/** Independent Bootstrap pager; optionally linked to a shared ListDataSource. */
Component.register('Pagination',container=>{
  const initial=container.source
  Object.defineProperty(container,'source',{get:()=>container.state.source,set:value=>{container.state.source=value},configurable:true})
  container.source=initial||null
  container.state.page??=1;container.state.pagesize??=20;container.state.total??=0;container.state.busy??=false
  container.state.sizes??=[10,20,50]
  container.state._pageLimit=5
  let resizeFrame
  const measure=()=>{
    for(const node of container.querySelectorAll('.pagination-info,.pagination-actions,.pagination-navigation'))observer.observe(node)
    const info=container.querySelector('.pagination-info'),actions=container.querySelector('.pagination-actions'),link=container.querySelector('.page-link')
    if(!link)return
    const style=getComputedStyle(link),font=parseFloat(style.fontSize),gap=parseFloat(getComputedStyle(container.querySelector('.pagination-layout')).gap)||8
    const button=Math.max(font*2.5,String(container.pageCount()).length*font*.65+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+2)
    const available=container.clientWidth-(info?.getBoundingClientRect().width||0)-Math.min(actions?.scrollWidth||0,container.clientWidth*.35)-gap*3
    const limit=Math.max(2,Math.min(15,Math.floor(available/button)-2))
    if(container.state._pageLimit!==limit)container.state._pageLimit=limit
  }
  const observer=new ResizeObserver(()=>{
    cancelAnimationFrame(resizeFrame)
    resizeFrame=requestAnimationFrame(measure)
  })
  observer.observe(container)
  resizeFrame=requestAnimationFrame(measure)
  DOMDisposer.add(container,()=>{observer.disconnect();cancelAnimationFrame(resizeFrame)})
  container.model=()=>container.source?.state||container.state
  const positive=(value,fallback)=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):fallback
  container._size=()=>positive(container.model().pagesize,20)
  container.total=()=>Number.isSafeInteger(Number(container.model().total))&&Number(container.model().total)>0?Number(container.model().total):0
  container.pageCount=()=>Math.max(1,Math.ceil(container.total()/positive(container.model().pagesize,20)))
  container.currentPage=()=>Math.min(container.pageCount(),positive(container.model().page,1))
  container.busy=()=>!!(container.model().loading||container.model().busy)
  container.availableSizes=()=>[...new Set([positive(container.model().pagesize,20),...container.state.sizes.filter(size=>Number.isSafeInteger(Number(size))&&Number(size)>0).map(Number)])].sort((a,b)=>a-b)
  container.rangeStart=()=>container.total()?(container.currentPage()-1)*positive(container.model().pagesize,20)+1:0
  container.rangeEnd=()=>Math.min(container.total(),container.currentPage()*positive(container.model().pagesize,20))
  container.pages=()=>{
    const last=container.pageCount(),page=container.currentPage(),limit=container.state._pageLimit
    const number=value=>({page:value,label:String(value),key:String(value)})
    const gap=(direction,step)=>({page:0,label:'…',key:direction,direction,target:Math.max(1,Math.min(last,page+(direction==='backward'?-step:step)))})
    if(last<=limit)return Array.from({length:last},(_,index)=>number(index+1))
    if(limit<5){
      if(limit===2)return page>last/2?[gap('backward',3),number(page)]:[number(page),gap('forward',3)]
      let start=Math.max(1,Math.min(page-Math.floor((limit-2)/2),last-limit+2)),end=start+limit-2
      if(limit===4){start=Math.max(1,Math.min(page-1,last-2));end=start+2}
      const result=Array.from({length:end-start+1},(_,index)=>number(start+index))
      if(start>1&&(end===last||start-1>last-end))result.unshift(gap('backward',3))
      else if(end<last)result.push(gap('forward',3))
      return result
    }
    // Preserve the current page's siblings before spending space on boundaries.
    const render=(start,end,boundaries)=>{
      const numbers=Array.from({length:end-start+1},(_,index)=>start+index)
      if(boundaries){if(start>1)numbers.unshift(1);if(end<last)numbers.push(last)}
      const result=[],step=Math.max(3,end-start+1)
      if(!boundaries&&start>1)result.push(start===2?number(1):gap('backward',step))
      let previous=0
      for(const value of numbers){
        if(previous&&value===previous+2)result.push(number(previous+1))
        else if(previous&&value>previous+2)result.push(gap(value<page?'backward':'forward',step))
        result.push(number(value));previous=value
      }
      if(!boundaries&&end<last)result.push(end===last-1?number(last):gap('forward',step))
      return result
    }
    let start=Math.max(1,page-1),end=Math.min(last,page+1)
    const boundaries=render(start,end,true).length<=limit,fit=(start,end)=>render(start,end,boundaries)
    let result=fit(start,end)
    for(let step=0;step<limit;step++){
      const candidates=[]
      if(start>1)candidates.push({start:start-1,end})
      if(end<last)candidates.push({start,end:end+1})
      candidates.sort((a,b)=>Math.abs((page-a.start)-(a.end-page))-Math.abs((page-b.start)-(b.end-page)))
      const next=candidates.map(candidate=>({...candidate,entries:fit(candidate.start,candidate.end)})).find(candidate=>candidate.entries.length<=limit)
      if(!next)break
      start=next.start;end=next.end;result=next.entries
    }
    return result
  }
  const change=detail=>{
    if(!container.dispatchEvent(new CustomEvent('beforechange',{detail,cancelable:true})))return false
    if(container.source){if(detail.pagesize!==Number(container.model().pagesize))container.source.setPageSize(detail.pagesize);else container.source.setPage(detail.page)}
    container.dispatchEvent(new CustomEvent('change',{detail}));return true
  }
  container.go=page=>{page=Number(page);if(container.busy()||!Number.isSafeInteger(page)||page<1||page>container.pageCount()||page===container.currentPage())return false;return change({page,pagesize:positive(container.model().pagesize,20)})}
  let settingsToggle
  container.resize=size=>{
    size=Number(size);if(container.busy()||!Number.isSafeInteger(size)||size<1||size===Number(container.model().pagesize))return false
    settingsToggle=container.querySelector('[data-page-settings]')
    if(settingsToggle)bootstrap.Dropdown.getOrCreateInstance(settingsToggle).hide()
    return change({page:1,pagesize:size})
  }
  DOMDisposer.add(container,()=>{if(settingsToggle)bootstrap.Dropdown.getInstance(settingsToggle)?.dispose()})
},Util.makeDom(`
<div><div class="pagination-layout d-flex align-items-center gap-1">
  <div class="pagination-info d-flex align-items-center gap-1 flex-shrink-0">
    <div slot-id="summary" class="pagination-summary small text-body text-nowrap" role="status"><span class="pagination-caption text-body-tertiary">{#Current#} </span><span $text="this.rangeStart()+'~'+this.rangeEnd()"></span><span class="pagination-separator text-body-tertiary"> / </span><span class="pagination-caption text-body-tertiary">{#Total#} </span><span $text="this.total()"></span></div>
    <div slot-id="size" class="pagination-size dropdown flex-shrink-0 ui-sm">
      <button type="button" class="btn btn-link text-body-secondary p-1" data-bs-toggle="dropdown" data-bs-auto-close="outside" data-page-settings aria-label="{#Page settings#}" title="{#Page settings#}" $disabled="this.busy()"><i class="bi bi-gear" aria-hidden="true"></i></button>
      <div class="dropdown-menu p-3">
        <label class="d-block text-nowrap"><span class="small text-body-secondary">{#Per page#}</span><select class="form-select mt-1" aria-label="{#Per page#}" $disabled="this.busy()" $onchange="this.resize(event.target.value);event.target.value=this._size()"><option $each="this.availableSizes()" as="size" $value="size" $selected="Number(size)===this._size()" $text="size"></option></select></label>
        <div slot-id="settings"></div>
      </div>
    </div>
  </div>
  <div slot-id="actions" class="pagination-actions d-flex align-items-center gap-2 overflow-x-auto text-nowrap"></div>
  <div class="flex-fill" aria-hidden="true"></div>
  <div slot-id="controls" class="pagination-navigation ms-auto flex-shrink-0" role="navigation" aria-label="{#Pagination#}">
    <ul class="pagination mb-0" $style="'--pagination-digits:'+String(this.pageCount()).length">
      <li class="page-item" $class="this.busy()||this.currentPage()===1?'disabled':''"><button type="button" class="page-link" aria-label="{#Previous#}" $disabled="this.busy()||this.currentPage()===1" $onclick="this.go(this.currentPage()-1)"><span aria-hidden="true">‹</span></button></li>
      <li class="page-item" $each="this.pages()" as="entry" key="key" $class="(entry.page===this.currentPage()?'active ':'')+(this.busy()?'disabled':'')"><button type="button" class="page-link" $disabled="this.busy()" $aria-label="entry.direction==='backward'?'{#Jump backward#}':entry.direction==='forward'?'{#Jump forward#}':null" $title="entry.direction==='backward'?'{#Jump backward#}':entry.direction==='forward'?'{#Jump forward#}':null" $aria-current="entry.page===this.currentPage()?'page':null" $onclick="this.go(entry.page||entry.target)"><span class="pagination-label" $text="entry.label"></span></button></li>
      <li class="page-item" $class="this.busy()||this.currentPage()===this.pageCount()?'disabled':''"><button type="button" class="page-link" aria-label="{#Next#}" $disabled="this.busy()||this.currentPage()===this.pageCount()" $onclick="this.go(this.currentPage()+1)"><span aria-hidden="true">›</span></button></li>
    </ul>
  </div>
</div></div>`),Util.makeDom(`<style>
Pagination {display:block;min-width:0;width:100%;container-type:inline-size;}
Pagination .pagination-navigation, Pagination .pagination-actions {min-width:0;}
Pagination .pagination-label {display:inline-block;inline-size:calc(var(--pagination-digits,1)*1ch);font-variant-numeric:tabular-nums;text-align:center;}
Pagination .pagination:where(:not(.pagination-sm,.pagination-lg)) {--bs-pagination-font-size:var(--ui-button-font,1rem);--bs-pagination-padding-y:var(--ui-button-y,.375rem);--bs-pagination-padding-x:var(--ui-button-x,.75rem);}
@container(max-width:35.999rem) {Pagination .pagination-caption {display:none;}}
</style>`))
