/** Bounded entity lookup; hosts own queries, authorization and saved values. */
globalThis.Component.register('RemoteSelect', container => {
  let multiple=container.hasAttribute('multiple')||container.multiple===true
  container.state=NewState({value:multiple?[]:'',query:'',options:[],selected:[],loading:false,resolving:false,open:false,error:'',active:-1})
  container.api=container.api||container.getAttribute('api')||''
  container.action=container.action||container.getAttribute('action')||'query'
  container.placeholder=container.placeholder||container.getAttribute('placeholder')||''
  container.label=container.label||container.getAttribute('label')||container.getAttribute('aria-label')||'{#Search#}'
  for(const key of ['disabled','required']){
    container.state[key]=!!container[key]||container.hasAttribute(key)
    Object.defineProperty(container,key,{get:()=>container.state[key],set:value=>{container.state[key]=!!value;queueMicrotask(()=>container.syncValidity?.())},configurable:true})
  }
  container.optionValue=option=>String(option?.value??option?.id??option??'')
  container.optionLabel=option=>String(option?.label??option?.name??container.optionValue(option))
  globalThis.RemoteSelectSequence=(globalThis.RemoteSelectSequence||0)+1
  const id='remote-select-'+globalThis.RemoteSelectSequence
  container.listId=id
  const labels=new Map()
  let timer,searchVersion=0,resolveVersion=0,searchController,resolveController,disposed=false,retryKind='search'
  const values=()=>multiple?container.state.value:[container.state.value].filter(Boolean)
  const normalize=value=>multiple?[...new Set((Array.isArray(value)?value:[]).map(String).filter(Boolean))]:String(value??'')
  container.isDisabled=()=>container.state.disabled
  container.isSelected=option=>values().includes(container.optionValue(option))
  const refreshSelected=()=>{container.state.selected=values().map(value=>({value,label:labels.get(value)||value}));if(!multiple&&container.state.value)container.state.query=labels.get(container.state.value)||container.state.value}
  container.syncValidity=()=>container.querySelector('input')?.setCustomValidity(container.required&&!values().length?'{#Select a result#}':'')
  const remember=list=>{for(const option of list)labels.set(container.optionValue(option),container.optionLabel(option))}
  const cancelSearch=()=>{clearTimeout(timer);searchVersion++;searchController?.abort();container.state.loading=false}
  container.paramsValue=()=>typeof container.params==='function'?container.params():(container.params||{})
  const request=async(query,ids,signal)=>{
    let list
    if(typeof container.load==='function')list=await container.load({query,values:ids,limit:30,signal})
    else if(container.api){
      const response=await HTTP.post({url:String(container.api),signal,data:{action:String(container.action||'query'),...container.paramsValue(),query,limit:30}})
      if(!response?.ok||!response.result?.ok)throw Error('lookup')
      list=response.result.list??response.result.data
    }else return []
    if(!Array.isArray(list))throw Error('lookup')
    return list.slice(0,30).filter(option=>container.optionValue(option)!=='')
  }
  const resolveSelected=async()=>{
    const version=++resolveVersion;resolveController?.abort();resolveController=new AbortController()
    const signal=resolveController.signal,missing=values().filter(value=>!labels.has(value))
    if(!missing.length){container.state.resolving=false;return}
    container.state.resolving=true;container.state.error=''
    try{
      // Existing APIs resolve selected IDs with their established query protocol.
      const list=typeof container.load==='function'?await request('',missing,signal):(await Promise.all(missing.map(value=>request(value,[value],signal)))).flat()
      if(disposed||version!==resolveVersion)return
      remember(list);refreshSelected()
      if(missing.some(value=>!labels.has(value))){retryKind='resolve';container.state.error='{#Some selected results are unavailable. Retry or remove them.#}'}
    }catch(error){if(!disposed&&version===resolveVersion&&!signal.aborted){retryKind='resolve';container.state.error='{#Unable to load selected results. Retry.#}'}}
    finally{if(!disposed&&version===resolveVersion)container.state.resolving=false}
  }
  const setValue=value=>{cancelSearch();container.state.value=normalize(value);container.state.error='';container.state.query='';refreshSelected();container.syncValidity();void resolveSelected()}
  // AutoForm supplies custom settings through properties after component setup.
  Object.defineProperty(container,'multiple',{get:()=>multiple,set:value=>{const next=!!value;if(next===multiple)return;const selected=values();multiple=next;setValue(multiple?selected:selected[0]||'')},configurable:true})
  Object.defineProperty(container,'value',{get:()=>container.state.value,set:setValue,configurable:true})
  container.addEventListener('bind',event=>setValue(event.detail))
  const emit=()=>{refreshSelected();container.syncValidity();container.dispatchEvent(new CustomEvent('change',{detail:multiple?[...container.state.value]:container.state.value}))}
  container.search=async(query=container.state.query)=>{
    if(disposed||container.isDisabled())return
    cancelSearch();const version=searchVersion;searchController=new AbortController();const signal=searchController.signal
    container.state.loading=true;container.state.error='';container.state.options=[];container.state.active=-1
    try{const list=await request(String(query??''),[],signal);if(disposed||version!==searchVersion)return;remember(list);container.state.options=list;container.state.active=list.findIndex(option=>!option?.disabled)}
    catch(error){if(!disposed&&version===searchVersion&&!signal.aborted){retryKind='search';container.state.error='{#Unable to load results. Retry.#}'}}
    finally{if(!disposed&&version===searchVersion)container.state.loading=false}
  }
  container.open=()=>{if(container.isDisabled())return;container.state.open=true;void container.search(container.state.query)}
  container.close=()=>{container.state.open=false;cancelSearch();if(!multiple)refreshSelected()}
  container.schedule=query=>{
    cancelSearch();container.state.query=query;container.state.options=[];container.state.active=-1;container.state.error='';container.state.open=true
    if(!multiple&&container.state.value){resolveVersion++;resolveController?.abort();container.state.value='';container.state.selected=[];emit()}
    timer=setTimeout(()=>container.search(query),220)
  }
  container.choose=option=>{
    if(container.isDisabled()||option?.disabled)return
    const value=container.optionValue(option);if(!value)return
    resolveVersion++;resolveController?.abort();container.state.resolving=false
    remember([option]);container.state.error=''
    if(multiple){if(values().includes(value))return;container.state.value=[...values(),value];container.state.query=''}else{container.state.value=value;container.close()}
    emit();if(multiple)void container.search('')
  }
  container.remove=value=>{if(container.isDisabled()||!values().includes(String(value)))return;container.state.value=multiple?values().filter(item=>item!==String(value)):'';container.state.query='';container.state.error='';resolveVersion++;resolveController?.abort();container.state.resolving=false;emit()}
  container.clear=()=>{if(container.isDisabled())return;cancelSearch();resolveVersion++;resolveController?.abort();container.state.value=multiple?[]:'';container.state.query='';container.state.options=[];container.state.error='';container.state.resolving=false;container.state.open=false;emit()}
  container.retry=()=>retryKind==='resolve'?resolveSelected():container.search()
  container.keydown=event=>{
    if(event.isComposing||container.isDisabled())return
    if(event.key==='Escape'){if(container.state.open){event.preventDefault();event.stopPropagation();container.close()}return}
    if(event.key==='Tab'){container.close();return}
    if(event.key==='Enter'&&container.state.open){event.preventDefault();const option=container.state.options[container.state.active];if(option)container.choose(option);return}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return
    if(['Home','End'].includes(event.key)&&!container.state.open)return
    event.preventDefault()
    if(!container.state.open){container.open();return}
    const indices=container.state.options.map((option,index)=>option?.disabled?-1:index).filter(index=>index>=0)
    if(!indices.length)return
    let at=indices.indexOf(container.state.active)
    at=event.key==='Home'?0:event.key==='End'?indices.length-1:(at+(event.key==='ArrowUp'?-1:1)+indices.length)%indices.length
    container.state.active=indices[at]
    requestAnimationFrame(()=>container.querySelector('#'+id+'-'+container.state.active)?.scrollIntoView({block:'nearest'}))
  }
  const outside=event=>{if(!container.contains(event.target))container.close()}
  document.addEventListener('pointerdown',outside)
  container.addEventListener('focusout',event=>{if(!container.contains(event.relatedTarget))container.close()})
  container.addEventListener('change',event=>{if(event.target!==container)event.stopPropagation()},true)
  DOMDisposer.add(container,()=>{disposed=true;cancelSearch();resolveVersion++;resolveController?.abort();document.removeEventListener('pointerdown',outside)})
  queueMicrotask(container.syncValidity)
},Util.makeDom(/*html*/`
<div class="remote-select-root position-relative">
 <div class="d-flex flex-wrap align-items-center gap-2 mb-2" $if="Array.isArray(this.state.value)&&this.state.selected.length">
  <span class="d-inline-flex align-items-center border rounded px-2 gap-1 bg-body" $each="this.state.selected" as="selected" key="value"><span $text="selected.label"></span><button class="btn btn-link text-body-secondary px-1 py-0" type="button" $disabled="this.isDisabled()" $aria-label="'{#Remove#} '+selected.label" $onclick="this.remove(selected.value)"><i class="bi bi-x" aria-hidden="true"></i></button></span>
 </div>
 <div class="input-group">
  <input class="form-control" role="combobox" autocomplete="off" data-no-changebind aria-autocomplete="list" $aria-label="this.label" $aria-expanded="this.state.open?'true':'false'" $aria-controls="this.listId" $aria-activedescendant="this.state.open&&this.state.active>=0?this.listId+'-'+this.state.active:''" $aria-busy="this.state.loading||this.state.resolving?'true':'false'" $disabled="this.isDisabled()" $bind="this.state.query" $placeholder="this.placeholder||'{#Search#}'" $onfocus="this.open()" $oninput="this.schedule(thisNode.value)" $onkeydown="this.keydown(event)">
  <button $if="this.state.selected.length||this.state.query" type="button" class="btn btn-outline-secondary" aria-label="{#Clear#}" $disabled="this.isDisabled()" $onclick="this.clear()"><i class="bi bi-x-lg" aria-hidden="true"></i></button>
 </div>
 <div $if="this.state.open&&!this.state.error" class="dropdown-menu show w-100 shadow">
  <div class="remote-select-options overflow-auto" role="listbox" $id="this.listId" $aria-label="this.label" $aria-multiselectable="Array.isArray(this.state.value)?'true':'false'">
   <div $if="this.state.loading" class="dropdown-item-text text-body-secondary" role="status">{#Loading#}…</div>
   <button $each="this.state.options" as="option" type="button" role="option" tabindex="-1" class="dropdown-item text-wrap" $id="this.listId+'-'+index" $class="this.state.active===index?'active':''" $aria-selected="this.isSelected(option)?'true':'false'" $disabled="option.disabled" $onmousedown="event.preventDefault()" $onclick="this.choose(option)"><span class="d-flex align-items-start gap-2"><i class="bi flex-shrink-0" $class="this.isSelected(option)?'bi-check2':'bi-circle'" aria-hidden="true"></i><span $text="this.optionLabel(option)"></span></span></button>
   <div $if="!this.state.loading&&!this.state.error&&!this.state.options.length" class="dropdown-item-text text-body-secondary" role="status">{#No results#}</div>
  </div>
 </div>
 <div $if="this.state.error" class="small text-danger mt-2" role="alert"><span $text="this.state.error"></span><button type="button" class="btn btn-link text-danger px-1" $onclick="this.retry()">{#Retry#}</button></div>
</div>
`),Util.makeDom('<style>RemoteSelect {display:block;min-width:0;} RemoteSelect .remote-select-options {max-height:min(18rem,45dvh);overflow-wrap:anywhere;}</style>'))
if(globalThis.AutoForm)globalThis.AutoForm.register('RemoteSelect')
