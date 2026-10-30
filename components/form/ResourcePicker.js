/** Confirmed resource selection, composed from the existing Modal and PagedList. */
Component.register('ResourcePicker',container=>{
  const multiple=container.hasAttribute('multiple'),idfield=container.getAttribute('idfield')||'id',labelfield=container.getAttribute('labelfield')||'name'
  const initialSource=container.source;let initialItems=container.items||[]
  const owned=initialSource?null:ListDataSource.create({items:initialItems,searchFields:[labelfield,'summary']})
  container.state=NewState({value:multiple?[]:'',pending:[],selected:[],open:false,error:'',resolveError:false,busy:false,source:initialSource||owned,title:container.getAttribute('title')||'{#Choose resources#}'})
  const modal=container.querySelector('Modal'),cache=new Map()
  let version=0,controller,disposed=false,committed=false,closing=false,reopen=false
  const ids=value=>[...new Set((Array.isArray(value)?value:value==null||value===''?[]:[value]).map(String))]
  const normalize=value=>multiple?ids(value):ids(value)[0]||''
  const refresh=()=>{container.state.selected=ids(container.state.value).map(id=>({id,label:cache.get(id)||id}))}
  container.keyOf=item=>String(item?.[idfield]??'')
  container.labelOf=item=>String(item?.[labelfield]??container.keyOf(item))
  const remember=list=>{for(const item of list||[])cache.set(container.keyOf(item),container.labelOf(item));refresh()}
  Object.defineProperty(container,'source',{get:()=>container.state.source,set:value=>{container.state.source=value||owned},configurable:true})
  Object.defineProperty(container,'items',{get:()=>initialItems,set:value=>{initialItems=Array.isArray(value)?value:[];remember(initialItems);owned?.setItems(initialItems)},configurable:true})
  container.inputType=multiple?'checkbox':'radio'
  globalThis.ResourcePickerSequence=(globalThis.ResourcePickerSequence||0)+1
  container.selectionName='resource-picker-'+globalThis.ResourcePickerSequence
  const setValue=value=>{const next=normalize(value);if(container.state.open&&JSON.stringify(next)!==JSON.stringify(container.state.value))container.cancel();container.state.value=next;refresh()}
  Object.defineProperty(container,'value',{get:()=>container.state.value,set:setValue,configurable:true})
  Object.defineProperty(container,'pending',{get:()=>container.state.pending,configurable:true})
  container.addEventListener('bind',event=>setValue(event.detail))
  container.isSelected=item=>container.state.pending.includes(container.keyOf(item))
  container.toggle=item=>{
    if(!container.state.open||container.state.busy||container.source.state.loading||item?.disabled)return
    const id=container.keyOf(item);if(!id)return;remember([item])
    container.state.pending=multiple?(container.isSelected(item)?container.state.pending.filter(value=>value!==id):[...container.state.pending,id]):[id]
  }
  container.remove=id=>{if(!container.state.busy)container.state.pending=container.state.pending.filter(value=>value!==String(id))}
  container.pendingLabel=id=>cache.get(id)||id
  container.show=async()=>{
    if(closing){reopen=true;return}
    if(container.disabled||container.hasAttribute('disabled')||container.state.open)return
    version++;controller?.abort();controller=new AbortController();const signal=controller.signal,current=version
    committed=false;container.state.pending=ids(container.value);container.state.open=true;container.state.error='';remember(container.source.state.rows);modal.show()
    await container.retryResolve()
  }
  container.retryResolve=async()=>{
    if(typeof container.resolve==='function'&&container.state.pending.length&&container.state.open){
      const current=version,signal=controller.signal
      container.state.resolveError=false;container.state.error=''
      container.state.busy=true
      try{const list=await container.resolve([...container.state.pending],signal);if(disposed||current!==version)return;if(!Array.isArray(list))throw Error('resolve');remember(list)}
      catch{if(!signal.aborted&&current===version){container.state.resolveError=true;container.state.error='{#Unable to load selected resources.#}'}}
      finally{if(!disposed&&current===version)container.state.busy=false}
    }
  }
  const stop=()=>{version++;controller?.abort();container.state.busy=false}
  container.cancel=()=>{if(!container.state.open)return;stop();container.state.open=false;closing=true;modal.hide(true)}
  container.confirm=async()=>{
    if(!container.state.open||container.state.busy||container.source.state.loading||container.source.state.error)return false
    const next=[...container.state.pending]
    if((container.required||container.hasAttribute('required'))&&!next.length){container.state.error='{#Select at least one resource.#}';return false}
    const current=version;container.state.busy=true;container.state.error=''
    try{
      const message=typeof container.validate==='function'?await container.validate(next,controller.signal):''
      if(disposed||!container.state.open||current!==version)return false
      if(message){container.state.error=String(message);return false}
      const value=normalize(next)
      if(!container.dispatchEvent(new CustomEvent('beforeconfirm',{detail:value,cancelable:true})))return false
      if(!container.state.open||current!==version)return false
      committed=true;container.state.open=false;container.value=value;stop();closing=true;modal.hide(true)
      container.dispatchEvent(new CustomEvent('change',{detail:multiple?[...value]:value}));return true
    }catch{if(!disposed&&current===version)container.state.error='{#Unable to confirm selection. Retry.#}';return false}
    finally{if(!disposed&&current===version)container.state.busy=false}
  }
  modal.addEventListener('change',event=>{if(event.target!==modal||event.detail!==false)return;if(container.state.open){stop();container.state.open=false}closing=false;if(!committed)container.dispatchEvent(new CustomEvent('cancel'));container.state.pending=[];if(reopen&&!disposed){reopen=false;container.show()}})
  const onLoad=event=>remember(event.detail.rows)
  let release=()=>{}
  const attach=source=>{release();if(!source)return;remember(source.state.rows);source.addEventListener('load',onLoad);release=()=>source.removeEventListener('load',onLoad)}
  container.state.__watch('source',attach);attach(container.source)
  // This modal-local draft must not mark a host form dirty before confirmation.
  container.addEventListener('input',event=>{if(event.target!==container)event.stopImmediatePropagation()})
  container.addEventListener('change',event=>{if(event.target!==container)event.stopImmediatePropagation()})
  DOMDisposer.add(container,()=>{disposed=true;stop();release();owned?.dispose()})
},Util.makeDom(`
<div class="resource-picker d-block">
 <button type="button" class="btn btn-outline-secondary text-start w-100 d-flex align-items-center gap-2" $disabled="this.disabled||this.hasAttribute('disabled')" $onclick="this.show()"><i class="bi bi-search flex-shrink-0" aria-hidden="true"></i><span slot-id="selection" class="text-truncate flex-fill"><span $if="!this.state.selected.length" $text="this.state.title"></span><span $if="this.state.selected.length" $text="this.state.selected.map(item=>item.label).join(', ')"></span></span><i class="bi bi-chevron-down flex-shrink-0" aria-hidden="true"></i></button>
 <Modal data-no-changebind body-class="p-0" width="min(94vw,64rem)" max-width="64rem" body-height="min(65dvh,36rem)" $.state.title="this.state.title" $.state.type="''">
  <div slot="body" slot-id="content" class="h-100">
   <PagedList searchable height="100%" hideheader $.source="thisNode.closest('ResourcePicker').source">
<template slot="item"><label class="d-flex align-items-start gap-3 w-100"><input class="form-check-input flex-shrink-0 mt-1" $type="thisNode.closest('ResourcePicker').inputType" $name="thisNode.closest('ResourcePicker').selectionName" $.checked="thisNode.closest('ResourcePicker').isSelected(item)" $disabled="item.disabled||thisNode.closest('ResourcePicker').state.busy" $aria-label="thisNode.closest('ResourcePicker').labelOf(item)" $onchange="thisNode.closest('ResourcePicker').toggle(item)"><div slot-id="item" class="flex-fill"><strong class="d-block text-break" $text="thisNode.closest('ResourcePicker').labelOf(item)"></strong><span class="small text-body-secondary text-break" $text="item.summary||''"></span></div></label></template>
   </PagedList>
  </div>
  <div slot="footer" class="w-100">
<div class="w-100 small text-danger" role="alert" $if="thisNode.closest('ResourcePicker').state.error"><span $text="thisNode.closest('ResourcePicker').state.error"></span><button type="button" class="btn btn-link text-danger" $if="thisNode.closest('ResourcePicker').state.resolveError" $onclick="thisNode.closest('ResourcePicker').retryResolve()">{#Retry#}</button></div>
   <div class="d-flex flex-wrap gap-2 w-100 overflow-auto" style="max-height:6rem" $if="thisNode.closest('ResourcePicker').state.pending.length"><span class="d-inline-flex align-items-center border rounded px-2 gap-1" $each="thisNode.closest('ResourcePicker').state.pending" as="selectedId"><span class="text-break" $text="thisNode.closest('ResourcePicker').pendingLabel(selectedId)"></span><button type="button" class="btn btn-link text-body-secondary px-1 py-0" $disabled="thisNode.closest('ResourcePicker').state.busy" $aria-label="'{#Remove#} '+thisNode.closest('ResourcePicker').pendingLabel(selectedId)" $onclick="thisNode.closest('ResourcePicker').remove(selectedId)"><i class="bi bi-x" aria-hidden="true"></i></button></span></div>
   <span class="text-body-secondary me-auto"><span>{#Selected#}: </span><strong class="text-body" $text="thisNode.closest('ResourcePicker').state.pending.length"></strong></span>
   <button type="button" class="btn btn-outline-secondary" $onclick="thisNode.closest('ResourcePicker').cancel()">{#Cancel#}</button><button type="button" class="btn btn-primary" $disabled="thisNode.closest('ResourcePicker').state.busy||thisNode.closest('ResourcePicker').source.state.loading" $onclick="thisNode.closest('ResourcePicker').confirm()">{#Confirm#}</button>
  </div>
 </Modal>
</div>`))
