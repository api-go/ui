/** Actions and confirmation in one Drawer; persistence stays in the host callback. */
Component.register('ActionSheet',container=>{
  const initial=container.actions||[]
  if(!container.hasAttribute('placement'))container.setAttribute('placement','bottom')
  Component.getSetupFunction('Drawer')(container)
  container.state.actions=[];container.state.busy=false;container.state.error='';container.state.confirming=''
  let generation=0,controller,focusFrame
  const focusAfterUpdate=find=>{cancelAnimationFrame(focusFrame);focusFrame=requestAnimationFrame(()=>{const control=find();if(container.value&&control?.isConnected&&!control.closest('[inert]'))control.focus({preventScroll:true})})}
  const invalidate=()=>{generation++;controller?.abort();cancelAnimationFrame(focusFrame);container.state.busy=false}
  Object.defineProperty(container,'actions',{configurable:true,get:()=>container.state.actions,set:value=>{
    const actions=(Array.isArray(value)?value:[]).map(action=>({...action,id:String(action.id??''),label:String(action.label??action.id??'')}))
    if(actions.some(action=>!action.id)||new Set(actions.map(action=>action.id)).size!==actions.length)throw Error('ActionSheet requires unique nonempty action ids')
    invalidate();container.state.actions=actions;container.state.error='';container.state.confirming=''
  }})
  container.actions=initial
  const cancelWork=container.oncancelwork
  container.oncancelwork=()=>{invalidate();cancelWork?.()}
  const showDrawer=container.show
  container.show=(...args)=>{if(!container.value){container.state.error='';container.state.confirming=''}return showDrawer(...args)}
  const panel=container.querySelector('[data-drawer-surface]')
  container.back=()=>{if(container.state.busy)return;const id=container.state.confirming;container.state.confirming='';container.state.error='';focusAfterUpdate(()=>[...panel.querySelectorAll('[data-sheet-action]')].find(button=>button.value===id))}
  container.currentAction=()=>container.actions.find(action=>action.id===container.state.confirming)
  container.choose=async(id,confirmed=false)=>{
    const action=container.actions.find(action=>action.id===String(id))
    if(!container.value||!action||action.disabled||container.state.busy)return false
    container.state.error=''
    if(action.confirm&&!confirmed){container.state.confirming=action.id;focusAfterUpdate(()=>panel.querySelector('[data-sheet-back]'));return false}
    if(!container.dispatchEvent(new CustomEvent('beforeselect',{cancelable:true,detail:{...action}})))return false
    const current=++generation;controller=new AbortController();const signal=controller.signal
    container.state.busy=true
    try{
      const response=typeof container.execute==='function'?await container.execute({...action},{signal}):{value:action.id}
      if(signal.aborted||current!==generation||!container.value)return false
      if(response===false)return false
      if(response?.error){container.state.error=String(response.error);return false}
      const result={id:action.id,value:response&&typeof response==='object'&&Object.hasOwn(response,'value')?response.value:action.id}
      if(!container.close(result))return false
      container.dispatchEvent(new CustomEvent('select',{detail:result}));return true
    }catch{
      if(current===generation&&!signal.aborted)container.state.error='{#Action failed. Please try again.#}'
      return false
    }finally{if(current===generation)container.state.busy=false}
  }
  DOMDisposer.add(container,invalidate)
},DrawerFrame(`
 <p class="text-body-secondary mb-3" $if="this.getAttribute('description')&&!this.state.confirming" $text="this.getAttribute('description')"></p>
 <div class="list-group list-group-flush" $if="!this.state.confirming">
  <button data-sheet-action class="list-group-item list-group-item-action btn d-flex align-items-center gap-3 text-start py-3" type="button" $value="action.id" $each="this.state.actions" as="action" key="id" $class="action.danger?'text-danger-emphasis':''" $disabled="action.disabled||this.state.busy" $onclick="this.choose(action.id)">
   <i class="bi flex-shrink-0" $if="action.icon" $class="'bi-'+action.icon" aria-hidden="true"></i><span class="flex-fill text-break" slot-id="action"><strong class="d-block" $text="action.label"></strong><span class="small text-body-secondary d-block" $if="action.description" $text="action.description"></span></span>
  </button>
 </div>
 <div $if="this.state.confirming"><h3 class="h6" $text="this.currentAction()?.label"></h3><p class="mb-0 text-break" $text="this.currentAction()?.confirm"></p></div>
 <p class="small text-body-secondary mt-3 mb-0" role="status" $if="this.state.busy">{#Working#}…</p>
 <p class="text-danger-emphasis mt-3 mb-0" role="alert" $if="this.state.error" $text="this.state.error"></p>
`, `
 <button type="button" class="btn btn-link text-body-secondary" $if="!this.state.confirming" $onclick="this.cancel()">{#Cancel#}</button><div class="flex-fill"></div>
 <template $if="this.state.confirming"><button data-sheet-back type="button" class="btn btn-outline-secondary" $disabled="this.state.busy" $onclick="this.back()">{#Go back#}</button><button type="button" class="btn" $class="this.currentAction()?.danger?'btn-danger':'btn-primary'" $disabled="this.state.busy" $onclick="this.choose(this.state.confirming,true)">{#Confirm#}</button></template>
`))
