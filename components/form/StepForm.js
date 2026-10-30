/** Navigation and validation only: the host retains one draft and save boundary. */
Component.register('StepForm',container=>{
  container.state=NewState({steps:[],value:'',busy:false,error:''})
  let version=0,controller,disposed=false
  const stop=()=>{version++;controller?.abort();container.state.busy=false}
  Object.defineProperty(container,'steps',{get:()=>container.state.steps,set:steps=>{const next=(steps||[]).map(step=>({...step,id:String(step.id)}));if(!next.length||next.some(step=>!step.id)||new Set(next.map(step=>step.id)).size!==next.length)throw Error('StepForm requires unique steps');stop();container.state.steps=next;if(!next.some(step=>step.id===container.value))container.state.value=next[0].id},configurable:true})
  Object.defineProperty(container,'value',{get:()=>container.state.value,set:value=>{stop();const id=String(value??'');container.state.value=container.steps.some(step=>step.id===id)?id:container.steps[0]?.id||'';container.state.error=''},configurable:true})
  container.addEventListener('bind',event=>{container.value=event.detail})
  container.index=()=>Math.max(0,container.steps.findIndex(step=>step.id===container.value))
  container.active=()=>container.steps[container.index()]
  const publish=id=>{container.state.value=id;container.state.error='';container.dispatchEvent(new CustomEvent('change',{detail:id}));setTimeout(()=>container.querySelector('[data-step-panel]:not([hidden]) h2')?.focus(),0)}
  container.go=async id=>{
    const at=container.steps.findIndex(step=>step.id===String(id)),from=container.index()
    if(at<0||at===from||container.state.busy)return false
    if(at<from){stop();publish(container.steps[at].id);return true}
    if(at!==from+1||!await container.validate())return false
    publish(container.steps[at].id);return true
  }
  container.validate=async()=>{
    if(container.state.busy||disposed)return false
    const current=++version,step=container.active();if(!step)return false
    controller=new AbortController();const signal=controller.signal
    container.state.error='';container.state.busy=true
    try{
      const panel=[...container.querySelectorAll('[data-step-panel]')].find(panel=>panel.dataset.stepPanel===step.id)
      for(const form of panel?.querySelectorAll('AutoForm')||[])if(!await form.validate())return false
      for(const control of panel?.querySelectorAll('input,select,textarea')||[])if(!control.closest('AutoForm')&&!control.checkValidity()){control.reportValidity();return false}
      const error=typeof container.validator==='function'?await container.validator({...step},signal):''
      if(disposed||current!==version||signal.aborted)return false
      if(error){container.state.error=String(error);return false};return true
    }catch{if(current===version&&!disposed)container.state.error='{#Unable to validate this step. Please retry.#}';return false}
    finally{if(current===version)container.state.busy=false}
  }
  container.next=()=>container.go(container.steps[container.index()+1]?.id)
  container.previous=()=>container.go(container.steps[container.index()-1]?.id)
  container.finish=async()=>{if(container.index()!==container.steps.length-1||!await container.validate())return false;return container.dispatchEvent(new CustomEvent('finish',{cancelable:true,detail:{step:container.value}}))}
  container.cancel=()=>{stop();container.dispatchEvent(new CustomEvent('cancel'))}
  container.addEventListener('input',stop)
  container.addEventListener('change',event=>{if(event.target!==container)stop()})
  DOMDisposer.add(container,()=>{disposed=true;stop()})
},Util.makeDom(`
<div class="step-form d-flex flex-column gap-3">
 <ol class="list-unstyled d-flex gap-2 mb-0 overflow-auto" aria-label="{#Steps#}"><li class="flex-fill" $each="this.steps" as="step" index="stepIndex" key="id"><button type="button" class="btn w-100 text-nowrap" $class="step.id===this.value?'btn-primary':'btn-outline-secondary'" $aria-current="step.id===this.value?'step':null" $disabled="this.state.busy||stepIndex>this.index()+1" $onclick="this.go(step.id)"><span $text="stepIndex+1"></span><span class="d-none d-sm-inline ms-1" $text="step.label||step.id"></span></button></li></ol>
 <section $each="this.steps" as="step" key="id" $data-step-panel="step.id" $hidden="step.id!==this.value"><h2 class="h5" tabindex="-1" $text="step.label||step.id"></h2><div slot-id="step"></div></section>
 <p role="alert" class="text-danger mb-0" $if="this.state.error" $text="this.state.error"></p>
 <div class="ui-toolbar border-top px-0 d-flex flex-wrap align-items-center gap-2">
  <button class="btn btn-outline-secondary" type="button" $if="this.index()>0" $disabled="this.state.busy" $onclick="this.previous()">{#Previous#}</button>
  <button class="btn btn-link text-body-secondary" type="button" $onclick="this.cancel()">{#Cancel#}</button><div class="flex-fill"></div>
  <div slot-id="actions"></div>
  <button class="btn btn-primary" type="button" $if="this.index()<this.steps.length-1" $disabled="this.state.busy" $onclick="this.next()">{#Next#}</button>
  <button class="btn btn-primary" type="button" $if="this.steps.length&&this.index()===this.steps.length-1" $disabled="this.state.busy" $onclick="this.finish()">{#Finish#}</button>
 </div>
</div>`))
